import { ObjectId, type Db, type Filter } from "mongodb";
import type { PartnerShipmentPrincipal } from "../shipments/principals.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import { partnerApiError } from "./errors.ts";
import type {
  WebhookEndpointCreateInput,
  WebhookEndpointUpdateInput,
} from "./phase7-schemas.ts";
import { generatePublicId } from "./public-id.ts";
import { redactSensitiveData } from "./redaction.ts";
import type {
  DomainEventDocument,
  WebhookEndpointDocument,
} from "./types.ts";
import {
  validateWebhookDestination,
  type WebhookHostnameResolver,
} from "./webhook-destinations.ts";
import {
  encryptWebhookSecret,
  generateWebhookSecret,
} from "./webhook-secrets.ts";

function tenant(principal: PartnerShipmentPrincipal) {
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

function endpointFilter(principal: PartnerShipmentPrincipal) {
  return { ...tenant(principal), status: { $ne: "deleted" } } as Filter<WebhookEndpointDocument>;
}

const MAX_WEBHOOK_ENDPOINTS_PER_APPLICATION = 10;

function iso(value: Date | string | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

function safeWebhookUrlForAudit(value: string) {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}

export function serializeWebhookEndpoint(endpoint: WebhookEndpointDocument) {
  return {
    id: endpoint.publicId,
    url: endpoint.url,
    description: endpoint.description,
    subscribedEvents: endpoint.subscribedEvents,
    status: endpoint.status,
    secretPrefix: endpoint.secretPrefix,
    createdAt: iso(endpoint.createdAt),
    updatedAt: iso(endpoint.updatedAt),
    rotatedAt: iso(endpoint.rotatedAt),
  };
}

export async function listWebhookEndpoints(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
}) {
  const endpoints = await input.db
    .collection<WebhookEndpointDocument>("webhook_endpoints")
    .find(endpointFilter(input.principal))
    .sort({ createdAt: -1 })
    .toArray();
  return { endpoints: endpoints.map(serializeWebhookEndpoint) };
}

export async function getWebhookEndpoint(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  endpointPublicId: string;
}) {
  const endpoint = await input.db.collection<WebhookEndpointDocument>("webhook_endpoints").findOne({
    ...endpointFilter(input.principal),
    publicId: input.endpointPublicId,
  } as Filter<WebhookEndpointDocument>);
  if (!endpoint) {
    throw partnerApiError("resource_not_found", "Webhook endpoint not found", 404);
  }
  return endpoint;
}

export async function createWebhookEndpoint(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  data: WebhookEndpointCreateInput;
  resolver?: WebhookHostnameResolver;
  encryptionKey?: string;
  generateSecret?: () => string;
  now?: Date;
}) {
  const now = input.now || new Date();
  const owner = tenant(input.principal);
  const endpointCount = await input.db
    .collection<WebhookEndpointDocument>("webhook_endpoints")
    .countDocuments({ ...endpointFilter(input.principal) });
  if (endpointCount >= MAX_WEBHOOK_ENDPOINTS_PER_APPLICATION) {
    throw partnerApiError(
      "rate_limit_exceeded",
      "Webhook endpoint limit reached for this application",
      429,
    );
  }
  const destination = await validateWebhookDestination(input.data.url, input.resolver);
  const secret = (input.generateSecret || generateWebhookSecret)();
  const endpoint: WebhookEndpointDocument = {
    publicId: generatePublicId("webhookEndpoint"),
    ...owner,
    url: destination.url,
    description: input.data.description,
    subscribedEvents: [...new Set(input.data.subscribedEvents)],
    status: "active",
    secretPrefix: secret.slice(0, 12),
    encryptedSecret: encryptWebhookSecret(secret, input.encryptionKey),
    createdByCredentialId: input.principal.credentialId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await input.db.collection<WebhookEndpointDocument>("webhook_endpoints").insertOne(endpoint);
  await appendPartnerAuditEntry(input.db, {
    actorType: "api_client",
    actorId: input.principal.credentialId,
    organizationId: owner.organizationId,
    apiClientId: owner.apiClientId,
    action: "webhook_endpoint.created",
    targetPublicId: endpoint.publicId,
    metadata: {
      url: safeWebhookUrlForAudit(endpoint.url),
      subscribedEvents: endpoint.subscribedEvents,
    },
    createdAt: now,
  });
  return {
    endpoint: serializeWebhookEndpoint({ ...endpoint, _id: result.insertedId }),
    secret,
  };
}

export async function updateWebhookEndpoint(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  endpointPublicId: string;
  data: WebhookEndpointUpdateInput;
  resolver?: WebhookHostnameResolver;
  encryptionKey?: string;
  generateSecret?: () => string;
  now?: Date;
}) {
  const now = input.now || new Date();
  const existing = await getWebhookEndpoint(input);
  const destination = input.data.url
    ? await validateWebhookDestination(input.data.url, input.resolver)
    : null;
  const secret = input.data.rotateSecret
    ? (input.generateSecret || generateWebhookSecret)()
    : undefined;
  const updates: Partial<WebhookEndpointDocument> = {
    ...(destination ? { url: destination.url } : {}),
    ...(input.data.description !== undefined && input.data.description !== null
      ? { description: input.data.description }
      : {}),
    ...(input.data.subscribedEvents
      ? { subscribedEvents: [...new Set(input.data.subscribedEvents)] }
      : {}),
    ...(input.data.status ? { status: input.data.status } : {}),
    ...(secret
      ? {
          secretPrefix: secret.slice(0, 12),
          encryptedSecret: encryptWebhookSecret(secret, input.encryptionKey),
          rotatedAt: now,
        }
      : {}),
    updatedAt: now,
  };
  const clearDescription = input.data.description === null;
  await input.db.collection<WebhookEndpointDocument>("webhook_endpoints").updateOne(
    { _id: existing._id, ...endpointFilter(input.principal) } as Filter<WebhookEndpointDocument>,
    {
      $set: updates,
      ...(clearDescription ? { $unset: { description: "" } } : {}),
    },
  );
  const updated = { ...existing, ...updates } as WebhookEndpointDocument;
  if (clearDescription) delete updated.description;
  const owner = tenant(input.principal);
  await appendPartnerAuditEntry(input.db, {
    actorType: "api_client",
    actorId: input.principal.credentialId,
    organizationId: owner.organizationId,
    apiClientId: owner.apiClientId,
    action: secret ? "webhook_endpoint.secret_rotated" : "webhook_endpoint.updated",
    targetPublicId: existing.publicId,
    metadata: { changedFields: Object.keys(input.data) },
    createdAt: now,
  });
  return {
    endpoint: serializeWebhookEndpoint(updated),
    ...(secret ? { secret } : {}),
  };
}

export async function deleteWebhookEndpoint(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  endpointPublicId: string;
  now?: Date;
}) {
  const now = input.now || new Date();
  const endpoint = await getWebhookEndpoint(input);
  await input.db.collection<WebhookEndpointDocument>("webhook_endpoints").updateOne(
    { _id: endpoint._id },
    { $set: { status: "deleted", deletedAt: now, updatedAt: now } },
  );
  const owner = tenant(input.principal);
  await appendPartnerAuditEntry(input.db, {
    actorType: "api_client",
    actorId: input.principal.credentialId,
    organizationId: owner.organizationId,
    apiClientId: owner.apiClientId,
    action: "webhook_endpoint.deleted",
    targetPublicId: endpoint.publicId,
    createdAt: now,
  });
  return { deleted: true, endpointId: endpoint.publicId };
}

export async function queueWebhookTestEvent(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  endpointPublicId: string;
  now?: Date;
}) {
  const now = input.now || new Date();
  const endpoint = await getWebhookEndpoint(input);
  if (endpoint.status !== "active") {
    throw partnerApiError("validation_failed", "Webhook endpoint is disabled", 409);
  }
  const owner = tenant(input.principal);
  const event: DomainEventDocument = {
    publicId: generatePublicId("event"),
    schemaVersion: "1",
    type: "webhook.test",
    aggregateType: "webhook_endpoint",
    aggregatePublicId: endpoint.publicId,
    ...owner,
    actor: { type: "api_client", id: input.principal.credentialId },
    payload: redactSensitiveData({
      endpointId: endpoint.publicId,
      message: "Cascade Logistics webhook test",
    }) as Record<string, unknown>,
    status: "pending",
    attemptCount: 0,
    occurredAt: now,
    createdAt: now,
    nextAttemptAt: now,
    targetEndpointId: endpoint._id,
  };
  await input.db.collection<DomainEventDocument>("domain_events").insertOne(event);
  await appendPartnerAuditEntry(input.db, {
    actorType: "api_client",
    actorId: input.principal.credentialId,
    organizationId: owner.organizationId,
    apiClientId: owner.apiClientId,
    action: "webhook_endpoint.test_queued",
    targetPublicId: endpoint.publicId,
    metadata: { eventId: event.publicId },
    createdAt: now,
  });
  return { queued: true, eventId: event.publicId, endpointId: endpoint.publicId };
}
