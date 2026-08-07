import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { ObjectId, type Db, type Filter } from "mongodb";
import type { PartnerShipmentPrincipal } from "../shipments/principals.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import { partnerApiError } from "./errors.ts";
import { generatePublicId } from "./public-id.ts";
import { sanitizeLogText } from "./redaction.ts";
import type {
  DomainEventDocument,
  WebhookDeliveryDocument,
  WebhookEndpointDocument,
} from "./types.ts";
import {
  validateWebhookDestination,
  type ValidatedWebhookDestination,
  type WebhookHostnameResolver,
} from "./webhook-destinations.ts";
import {
  decryptWebhookSecret,
  signWebhookPayload,
} from "./webhook-secrets.ts";

export const WEBHOOK_RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
  24 * 60 * 60_000,
] as const;
export const WEBHOOK_MAX_ATTEMPTS = WEBHOOK_RETRY_DELAYS_MS.length + 1;
const DELIVERY_LEASE_MS = 5 * 60_000;
const DELIVERY_TIMEOUT_MS = 8_000;

export interface WebhookTransportResult {
  statusCode: number;
  durationMs: number;
}

export type WebhookTransport = (input: {
  destination: ValidatedWebhookDestination;
  body: string;
  headers: Record<string, string>;
  timeoutMs: number;
}) => Promise<WebhookTransportResult>;

export function buildWebhookEventBody(event: DomainEventDocument) {
  return JSON.stringify({
    id: event.publicId,
    type: event.type,
    apiVersion: event.schemaVersion || "1",
    environment: event.environment,
    occurredAt: new Date(event.occurredAt).toISOString(),
    data: event.payload,
  });
}

export const sendWebhookHttpRequest: WebhookTransport = async (input) => {
  const startedAt = Date.now();
  const lookup: LookupFunction = (_hostname, _options, callback) => {
    callback(
      null,
      _options.all
        ? [{ address: input.destination.address, family: input.destination.family }]
        : input.destination.address,
      _options.all ? undefined : input.destination.family,
    );
  };
  return new Promise<WebhookTransportResult>((resolve, reject) => {
    const request = httpsRequest(input.destination.url, {
      method: "POST",
      headers: input.headers,
      lookup,
      servername: input.destination.hostname,
    }, (response) => {
      response.resume();
      response.once("end", () => {
        resolve({
          statusCode: response.statusCode || 0,
          durationMs: Date.now() - startedAt,
        });
      });
    });
    request.setTimeout(input.timeoutMs, () => {
      const error = new Error("Webhook request timed out") as Error & { code?: string };
      error.code = "ETIMEDOUT";
      request.destroy(error);
    });
    request.once("error", reject);
    request.end(input.body);
  });
};

function owner(principal: PartnerShipmentPrincipal) {
  if (
    !ObjectId.isValid(principal.organizationId) ||
    !ObjectId.isValid(principal.apiClientId)
  ) {
    throw partnerApiError("invalid_api_key", "Invalid API key", 401);
  }
  return {
    organizationId: new ObjectId(principal.organizationId),
    apiClientId: new ObjectId(principal.apiClientId),
    environment: principal.environment,
  };
}

function retryableStatus(statusCode: number): boolean {
  return statusCode === 0 || statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

function safeErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return sanitizeLogText(String(error.code), 80);
  }
  return "network_error";
}

async function refreshEventStatus(db: Db, eventId: ObjectId, now: Date) {
  const deliveries = await db
    .collection<WebhookDeliveryDocument>("webhook_deliveries")
    .find({ eventId })
    .toArray();
  if (deliveries.some((delivery) => ["pending", "processing", "retrying"].includes(delivery.status))) {
    await db.collection<DomainEventDocument>("domain_events").updateOne(
      { _id: eventId },
      { $set: { status: "dispatched" } },
    );
    return;
  }
  const failed = deliveries.some((delivery) => delivery.status === "failed");
  await db.collection<DomainEventDocument>("domain_events").updateOne(
    { _id: eventId },
    {
      $set: {
        status: failed ? "completed_with_failures" : "completed",
        completedAt: now,
      },
    },
  );
}

export async function enqueuePendingWebhookEvents(input: {
  db: Db;
  now?: Date;
  limit?: number;
}) {
  const now = input.now || new Date();
  const staleBefore = new Date(now.getTime() - DELIVERY_LEASE_MS);
  const candidates = await input.db
    .collection<DomainEventDocument>("domain_events")
    .find({
      $or: [
        { status: "pending", nextAttemptAt: { $lte: now } },
        { status: "dispatching", dispatchStartedAt: { $lte: staleBefore } },
      ],
    } as Filter<DomainEventDocument>)
    .sort({ createdAt: 1 })
    .limit(Math.min(input.limit || 100, 500))
    .toArray();
  let events = 0;
  let deliveries = 0;

  for (const event of candidates) {
    const claimed = await input.db.collection<DomainEventDocument>("domain_events").updateOne(
      { _id: event._id, status: event.status },
      { $set: { status: "dispatching", dispatchStartedAt: now } },
    );
    if (claimed.modifiedCount !== 1 || !event._id) continue;
    events += 1;
    const endpoints = await input.db
      .collection<WebhookEndpointDocument>("webhook_endpoints")
      .find({
        organizationId: event.organizationId,
        apiClientId: event.apiClientId,
        environment: event.environment,
        status: "active",
      })
      .toArray();
    const subscribed = endpoints.filter((endpoint) =>
      event.targetEndpointId
        ? endpoint._id?.toString() === event.targetEndpointId.toString()
        : endpoint.subscribedEvents.includes(event.type),
    );
    for (const endpoint of subscribed) {
      if (!endpoint._id) continue;
      const delivery: WebhookDeliveryDocument = {
        publicId: generatePublicId("webhookDelivery"),
        eventId: event._id,
        eventPublicId: event.publicId,
        endpointId: endpoint._id,
        endpointPublicId: endpoint.publicId,
        organizationId: event.organizationId,
        apiClientId: event.apiClientId,
        environment: event.environment,
        status: "pending",
        attemptCount: 0,
        nextAttemptAt: now,
        replayCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").insertOne(delivery);
        deliveries += 1;
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) {
          await input.db.collection<DomainEventDocument>("domain_events").updateOne(
            { _id: event._id },
            { $set: { status: "pending", nextAttemptAt: now } },
          );
          throw error;
        }
      }
    }
    await input.db.collection<DomainEventDocument>("domain_events").updateOne(
      { _id: event._id },
      {
        $set: {
          status: subscribed.length > 0 ? "dispatched" : "completed",
          dispatchedAt: now,
          ...(subscribed.length === 0 ? { completedAt: now } : {}),
        },
      },
    );
  }
  return { events, deliveries };
}

async function recordAttempt(input: {
  db: Db;
  delivery: WebhookDeliveryDocument;
  attemptNumber: number;
  startedAt: Date;
  completedAt: Date;
  statusCode?: number;
  errorCode?: string;
  durationMs: number;
}) {
  try {
    await input.db.collection("webhook_delivery_attempts").insertOne({
      publicId: generatePublicId("webhookAttempt"),
      deliveryId: input.delivery._id,
      deliveryPublicId: input.delivery.publicId,
      eventPublicId: input.delivery.eventPublicId,
      endpointPublicId: input.delivery.endpointPublicId,
      organizationId: input.delivery.organizationId,
      apiClientId: input.delivery.apiClientId,
      environment: input.delivery.environment,
      attemptNumber: input.attemptNumber,
      replayNumber: input.delivery.replayCount,
      statusCode: input.statusCode,
      errorCode: input.errorCode,
      durationMs: input.durationMs,
      responseBodyStored: false,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) {
      throw error;
    }
  }
}

export async function reconcileWebhookEventStatuses(input: {
  db: Db;
  now?: Date;
  limit?: number;
}) {
  const now = input.now || new Date();
  const events = await input.db
    .collection<DomainEventDocument>("domain_events")
    .find({ status: "dispatched" })
    .sort({ dispatchedAt: 1 })
    .limit(Math.min(input.limit || 100, 500))
    .toArray();
  for (const event of events) {
    if (event._id) await refreshEventStatus(input.db, event._id, now);
  }
  return { reconciled: events.length };
}

export async function processPendingWebhookDeliveries(input: {
  db: Db;
  resolver?: WebhookHostnameResolver;
  transport?: WebhookTransport;
  encryptionKey?: string;
  now?: Date;
  limit?: number;
}) {
  const now = input.now || new Date();
  const candidates = await input.db
    .collection<WebhookDeliveryDocument>("webhook_deliveries")
    .find({
      $or: [
        { status: { $in: ["pending", "retrying"] }, nextAttemptAt: { $lte: now } },
        { status: "processing", leaseExpiresAt: { $lte: now } },
      ],
    } as Filter<WebhookDeliveryDocument>)
    .sort({ nextAttemptAt: 1 })
    .limit(Math.min(input.limit || 100, 500))
    .toArray();
  const result = { processed: 0, succeeded: 0, retried: 0, failed: 0 };

  for (const delivery of candidates) {
    if (!delivery._id) continue;
    const claim = await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").updateOne(
      { _id: delivery._id, status: delivery.status },
      {
        $set: {
          status: "processing",
          leaseExpiresAt: new Date(now.getTime() + DELIVERY_LEASE_MS),
          updatedAt: now,
        },
      },
    );
    if (claim.modifiedCount !== 1) continue;
    result.processed += 1;
    const startedAt = new Date();
    const [event, endpoint] = await Promise.all([
      input.db.collection<DomainEventDocument>("domain_events").findOne({ _id: delivery.eventId }),
      input.db.collection<WebhookEndpointDocument>("webhook_endpoints").findOne({ _id: delivery.endpointId }),
    ]);
    const attemptNumber = delivery.attemptCount + 1;
    let statusCode: number | undefined;
    let errorCode: string | undefined;
    let durationMs = 0;
    let retryable = false;

    try {
      if (!event || !endpoint || endpoint.status !== "active") {
        throw Object.assign(new Error("Webhook resource unavailable"), { code: "endpoint_unavailable", terminal: true });
      }
      const destination = await validateWebhookDestination(endpoint.url, input.resolver);
      const body = buildWebhookEventBody(event);
      const timestamp = Math.floor(now.getTime() / 1000);
      const secret = decryptWebhookSecret(endpoint.encryptedSecret, input.encryptionKey);
      const response = await (input.transport || sendWebhookHttpRequest)({
        destination,
        body,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(Buffer.byteLength(body)),
          "User-Agent": "Cascade-Logistics-Webhooks/1.0",
          "X-Cascade-Event-Id": event.publicId,
          "X-Cascade-Event-Type": event.type,
          "X-Cascade-Webhook-Timestamp": String(timestamp),
          "X-Cascade-Webhook-Signature": signWebhookPayload({ secret, timestamp, body }),
        },
        timeoutMs: DELIVERY_TIMEOUT_MS,
      });
      statusCode = response.statusCode;
      durationMs = response.durationMs;
      if (statusCode < 200 || statusCode >= 300) {
        errorCode = `http_${statusCode}`;
        retryable = retryableStatus(statusCode);
      }
    } catch (error) {
      errorCode = safeErrorCode(error);
      retryable = !(error && typeof error === "object" && "terminal" in error && error.terminal === true);
      durationMs = Date.now() - startedAt.getTime();
    }
    const completedAt = new Date();
    await recordAttempt({
      db: input.db,
      delivery,
      attemptNumber,
      startedAt,
      completedAt,
      statusCode,
      errorCode,
      durationMs,
    });

    if (!errorCode && statusCode && statusCode >= 200 && statusCode < 300) {
      await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").updateOne(
        { _id: delivery._id },
        {
          $set: {
            status: "succeeded",
            attemptCount: attemptNumber,
            lastStatusCode: statusCode,
            lastDurationMs: durationMs,
            deliveredAt: completedAt,
            updatedAt: completedAt,
          },
          $unset: { leaseExpiresAt: "", lastErrorCode: "" },
        },
      );
      result.succeeded += 1;
    } else if (retryable && attemptNumber < WEBHOOK_MAX_ATTEMPTS) {
      const delay = WEBHOOK_RETRY_DELAYS_MS[attemptNumber - 1];
      await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").updateOne(
        { _id: delivery._id },
        {
          $set: {
            status: "retrying",
            attemptCount: attemptNumber,
            nextAttemptAt: new Date(now.getTime() + delay),
            ...(statusCode ? { lastStatusCode: statusCode } : {}),
            lastErrorCode: errorCode || "delivery_failed",
            lastDurationMs: durationMs,
            updatedAt: completedAt,
          },
          $unset: {
            leaseExpiresAt: "",
            ...(!statusCode ? { lastStatusCode: "" } : {}),
          },
        },
      );
      result.retried += 1;
    } else {
      await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").updateOne(
        { _id: delivery._id },
        {
          $set: {
            status: "failed",
            attemptCount: attemptNumber,
            ...(statusCode ? { lastStatusCode: statusCode } : {}),
            lastErrorCode: errorCode || "delivery_failed",
            lastDurationMs: durationMs,
            failedAt: completedAt,
            updatedAt: completedAt,
          },
          $unset: {
            leaseExpiresAt: "",
            ...(!statusCode ? { lastStatusCode: "" } : {}),
          },
        },
      );
      result.failed += 1;
    }
    await refreshEventStatus(input.db, delivery.eventId, completedAt);
  }
  return result;
}

export async function runWebhookDeliveryWorker(input: {
  db: Db;
  resolver?: WebhookHostnameResolver;
  transport?: WebhookTransport;
  encryptionKey?: string;
  now?: Date;
  limit?: number;
}) {
  const queued = await enqueuePendingWebhookEvents(input);
  const delivered = await processPendingWebhookDeliveries(input);
  const reconciled = await reconcileWebhookEventStatuses(input);
  return { queued, delivered, reconciled };
}

export function serializeWebhookDelivery(delivery: WebhookDeliveryDocument) {
  const iso = (value: Date | string | undefined) =>
    value ? new Date(value).toISOString() : undefined;
  return {
    id: delivery.publicId,
    eventId: delivery.eventPublicId,
    endpointId: delivery.endpointPublicId,
    status: delivery.status,
    attemptCount: delivery.attemptCount,
    nextAttemptAt: iso(delivery.nextAttemptAt),
    lastStatusCode: delivery.lastStatusCode,
    lastErrorCode: delivery.lastErrorCode,
    lastDurationMs: delivery.lastDurationMs,
    replayCount: delivery.replayCount,
    createdAt: iso(delivery.createdAt),
    updatedAt: iso(delivery.updatedAt),
    deliveredAt: iso(delivery.deliveredAt),
    failedAt: iso(delivery.failedAt),
  };
}

export async function listWebhookDeliveries(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  endpointPublicId?: string;
  status?: WebhookDeliveryDocument["status"];
  limit: number;
}) {
  const deliveries = await input.db
    .collection<WebhookDeliveryDocument>("webhook_deliveries")
    .find({
      ...owner(input.principal),
      ...(input.endpointPublicId ? { endpointPublicId: input.endpointPublicId } : {}),
      ...(input.status ? { status: input.status } : {}),
    } as Filter<WebhookDeliveryDocument>)
    .sort({ createdAt: -1 })
    .limit(input.limit)
    .toArray();
  return { deliveries: deliveries.map(serializeWebhookDelivery) };
}

export async function replayWebhookDelivery(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  deliveryPublicId: string;
  now?: Date;
}) {
  const now = input.now || new Date();
  const delivery = await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").findOne({
    ...owner(input.principal),
    publicId: input.deliveryPublicId,
  } as Filter<WebhookDeliveryDocument>);
  if (!delivery || delivery.status === "processing") {
    throw partnerApiError("resource_not_found", "Webhook delivery not found", 404);
  }
  const reset = await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").updateOne(
    { _id: delivery._id, status: delivery.status },
    {
      $set: {
        status: "pending",
        attemptCount: 0,
        nextAttemptAt: now,
        replayCount: delivery.replayCount + 1,
        updatedAt: now,
      },
      $unset: {
        leaseExpiresAt: "",
        deliveredAt: "",
        failedAt: "",
        lastStatusCode: "",
        lastErrorCode: "",
        lastDurationMs: "",
      },
    },
  );
  if (reset.modifiedCount !== 1) {
    throw partnerApiError("request_in_progress", "Webhook delivery is being processed", 409);
  }
  const scoped = owner(input.principal);
  await appendPartnerAuditEntry(input.db, {
    actorType: "api_client",
    actorId: input.principal.credentialId,
    organizationId: scoped.organizationId,
    apiClientId: scoped.apiClientId,
    action: "webhook_delivery.replayed",
    targetPublicId: delivery.publicId,
    metadata: { eventId: delivery.eventPublicId, endpointId: delivery.endpointPublicId },
    createdAt: now,
  });
  return { queued: true, deliveryId: delivery.publicId };
}
