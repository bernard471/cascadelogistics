import assert from "node:assert/strict";
import test from "node:test";

import { PartnerApiError } from "../src/lib/partner-platform/errors.ts";
import { ensurePartnerCoreIndexes } from "../src/lib/partner-platform/core-indexes.ts";
import { partnerDomainEventTypes } from "../src/lib/partner-platform/domain-events.ts";
import { partnerShipmentCreateSchema } from "../src/lib/partner-platform/phase4-schemas.ts";
import {
  webhookEndpointCreateSchema,
  webhookEndpointUpdateSchema,
} from "../src/lib/partner-platform/phase7-schemas.ts";
import {
  createPartnerShipment,
  getPartnerShipment,
} from "../src/lib/partner-platform/partner-shipments.ts";
import { createApiClient, createOrganization } from "../src/lib/partner-platform/repositories.ts";
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  getWebhookEndpoint,
  listWebhookEndpoints,
  queueWebhookTestEvent,
  updateWebhookEndpoint,
} from "../src/lib/partner-platform/webhook-endpoints.ts";
import {
  WEBHOOK_MAX_ATTEMPTS,
  WEBHOOK_RETRY_DELAYS_MS,
  enqueuePendingWebhookEvents,
  listWebhookDeliveries,
  processPendingWebhookDeliveries,
  replayWebhookDelivery,
  runWebhookDeliveryWorker,
} from "../src/lib/partner-platform/webhook-delivery.ts";
import {
  isPublicWebhookAddress,
  validateWebhookDestination,
} from "../src/lib/partner-platform/webhook-destinations.ts";
import {
  decryptWebhookSecret,
  encryptWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from "../src/lib/partner-platform/webhook-secrets.ts";
import { setInternalShipmentInvoice, updateInternalShipment } from "../src/lib/shipments/service.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

const baseNow = new Date("2026-08-06T12:00:00.000Z");
const encryptionKey = "phase-7-webhook-encryption-key-material-for-tests";
const publicResolver = async () => [{ address: "93.184.216.34", family: 4 }];
const secret = "whsec_phase7_test_secret_material_1234567890";
const admin = { kind: "internal", userId: "phase7-admin", role: "admin" };

async function setup(db = new InMemoryMongoDatabase("cascade_phase7_test"), suffix = "owner") {
  const organization = await createOrganization(db, {
    name: `Phase 7 ${suffix}`,
    slug: `phase-7-${suffix}-${Math.random().toString(36).slice(2, 8)}`,
    status: "active",
    settings: {
      customerEmailMode: "partner",
      defaultWebhookVersion: "1",
      shipmentVisibility: "organization",
    },
    limits: {
      requestsPerMinute: 100,
      shipmentsPerDay: 100,
      uploadBytesPerDay: 1024 * 1024 * 1024,
    },
  }, baseNow);
  const apiClient = await createApiClient(db, organization._id, {
    name: `Phase 7 App ${suffix}`,
    environmentAccess: ["test"],
    scopes: [
      "shipments:create",
      "shipments:read",
      "shipments:update",
      "invoices:read",
      "webhooks:manage",
    ],
  }, baseNow);
  await ensurePartnerCoreIndexes(db);
  return {
    db,
    organization,
    apiClient,
    principal: {
      kind: "partner_api",
      organizationId: organization._id.toString(),
      apiClientId: apiClient._id.toString(),
      credentialId: `phase7-credential-${suffix}`,
      environment: "test",
      scopes: apiClient.scopes,
    },
  };
}

function endpointData(events = ["shipment.created"]) {
  return webhookEndpointCreateSchema.parse({
    url: "https://hooks.partner.example/webhooks/cascade",
    description: "Phase 7 receiver",
    subscribedEvents: events,
  });
}

async function endpoint(context, events = ["shipment.created"]) {
  return createWebhookEndpoint({
    ...context,
    data: endpointData(events),
    resolver: publicResolver,
    encryptionKey,
    generateSecret: () => secret,
    now: baseNow,
  });
}

async function expectPartnerError(promise, code, status) {
  await assert.rejects(
    promise,
    (error) => error instanceof PartnerApiError && error.code === code && error.status === status,
  );
}

function shipmentData(reference) {
  return partnerShipmentCreateSchema.parse({
    externalCustomerId: `customer-${reference}`,
    externalReference: reference,
    sender: {
      name: "Sender Name", email: "sender@example.com", phone: "+233200000001",
      address: "Sender address", city: "Accra", country: "Ghana",
    },
    receiver: {
      name: "Receiver Name", email: "receiver@example.com", phone: "+233200000002",
      address: "Receiver address", city: "Kumasi", country: "Ghana",
    },
    packageType: "parcel",
    weight: 3,
    quantity: 1,
    description: "Webhook lifecycle shipment",
    declaredValue: 200,
    declaredCurrency: "USD",
    goodsType: "normal",
    serviceType: "express",
    uploadIds: [],
  });
}

test("event catalogue is versionable and contains every Phase 4-7 lifecycle event", () => {
  assert.deepEqual(partnerDomainEventTypes, [
    "shipment.created", "shipment.updated", "shipment.cancelled",
    "shipment.document_removed", "shipment.deleted", "invoice.available",
    "invoice.updated", "payment_proof.received", "payment_proof.approved",
    "payment_proof.rejected", "webhook.test",
  ]);
});

test("webhook secrets encrypt at rest and signatures reject changes and stale timestamps", () => {
  const encrypted = encryptWebhookSecret(secret, encryptionKey, Buffer.alloc(12, 7));
  assert.equal(JSON.stringify(encrypted).includes(secret), false);
  assert.equal(decryptWebhookSecret(encrypted, encryptionKey), secret);
  const body = JSON.stringify({ id: "evt_test", ok: true });
  const timestamp = Math.floor(baseNow.getTime() / 1000);
  const signature = signWebhookPayload({ secret, timestamp, body });
  assert.equal(verifyWebhookSignature({ secret, timestamp, body, signature, now: baseNow }), true);
  assert.equal(verifyWebhookSignature({ secret, timestamp, body: `${body} `, signature, now: baseNow }), false);
  assert.equal(verifyWebhookSignature({ secret, timestamp, body, signature: signature.replace(/.$/, "0"), now: baseNow }), false);
  assert.equal(verifyWebhookSignature({ secret, timestamp, body, signature, now: new Date(baseNow.getTime() + 301_000) }), false);
});

test("destination validation rejects HTTP, credentials, localhost, private IPs and mixed DNS answers", async () => {
  assert.equal(isPublicWebhookAddress("93.184.216.34"), true);
  for (const address of ["127.0.0.1", "10.1.2.3", "169.254.1.1", "192.168.1.1", "::1", "fc00::1", "fe80::1"]) {
    assert.equal(isPublicWebhookAddress(address), false, address);
  }
  await expectPartnerError(validateWebhookDestination("http://hooks.example.com", publicResolver), "validation_failed", 422);
  await expectPartnerError(validateWebhookDestination("https://user:pass@hooks.example.com", publicResolver), "validation_failed", 422);
  await expectPartnerError(validateWebhookDestination("https://localhost/hook", publicResolver), "validation_failed", 422);
  await expectPartnerError(
    validateWebhookDestination("https://hooks.example.com", async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.7", family: 4 },
    ]),
    "validation_failed",
    422,
  );
  const valid = await validateWebhookDestination("https://hooks.example.com/cascade?source=api", publicResolver);
  assert.equal(valid.address, "93.184.216.34");
  assert.equal(valid.url, "https://hooks.example.com/cascade?source=api");
});

test("endpoint secrets are returned once, encrypted in storage, rotatable, and tenant isolated", async () => {
  const db = new InMemoryMongoDatabase("phase7_endpoints");
  const ownerContext = await setup(db, "endpoint-owner");
  const outsider = await setup(db, "endpoint-outsider");
  const created = await endpoint(ownerContext, ["shipment.created", "invoice.available"]);
  assert.equal(created.secret, secret);
  assert.equal("encryptedSecret" in created.endpoint, false);
  const stored = await getWebhookEndpoint({
    ...ownerContext,
    endpointPublicId: created.endpoint.id,
  });
  assert.equal(JSON.stringify(stored.encryptedSecret).includes(secret), false);
  assert.equal(decryptWebhookSecret(stored.encryptedSecret, encryptionKey), secret);
  const listed = await listWebhookEndpoints(ownerContext);
  assert.equal(JSON.stringify(listed).includes("ciphertext"), false);
  assert.equal(JSON.stringify(listed).includes(secret), false);

  const rotatedSecret = "whsec_rotated_phase7_secret_material_123456";
  const rotated = await updateWebhookEndpoint({
    ...ownerContext,
    endpointPublicId: created.endpoint.id,
    data: webhookEndpointUpdateSchema.parse({ rotateSecret: true, status: "disabled" }),
    encryptionKey,
    generateSecret: () => rotatedSecret,
    now: new Date(baseNow.getTime() + 1000),
  });
  assert.equal(rotated.secret, rotatedSecret);
  const rotatedStored = await getWebhookEndpoint({ ...ownerContext, endpointPublicId: created.endpoint.id });
  assert.equal(decryptWebhookSecret(rotatedStored.encryptedSecret, encryptionKey), rotatedSecret);
  await expectPartnerError(
    updateWebhookEndpoint({
      ...outsider,
      endpointPublicId: created.endpoint.id,
      data: webhookEndpointUpdateSchema.parse({ status: "active" }),
      encryptionKey,
    }),
    "resource_not_found",
    404,
  );
  await expectPartnerError(
    deleteWebhookEndpoint({ ...outsider, endpointPublicId: created.endpoint.id }),
    "resource_not_found",
    404,
  );
});

test("test event delivers end to end with verifiable headers and no response body logging", async () => {
  const context = await setup(undefined, "e2e");
  const created = await endpoint(context, ["shipment.created"]);
  const queued = await queueWebhookTestEvent({
    ...context,
    endpointPublicId: created.endpoint.id,
    now: baseNow,
  });
  const captured = [];
  const result = await runWebhookDeliveryWorker({
    db: context.db,
    resolver: publicResolver,
    encryptionKey,
    now: baseNow,
    transport: async (input) => {
      captured.push(input);
      return { statusCode: 204, durationMs: 12 };
    },
  });
  assert.deepEqual(result.queued, { events: 1, deliveries: 1 });
  assert.equal(result.delivered.succeeded, 1);
  assert.equal(captured.length, 1);
  const sent = captured[0];
  const parsed = JSON.parse(sent.body);
  assert.equal(parsed.id, queued.eventId);
  assert.equal(parsed.type, "webhook.test");
  assert.equal(sent.headers["X-Cascade-Event-Id"], queued.eventId);
  assert.equal(verifyWebhookSignature({
    secret,
    timestamp: sent.headers["X-Cascade-Webhook-Timestamp"],
    body: sent.body,
    signature: sent.headers["X-Cascade-Webhook-Signature"],
    now: baseNow,
  }), true);
  const attempt = await context.db.collection("webhook_delivery_attempts").findOne({ eventPublicId: queued.eventId });
  assert.equal(attempt.statusCode, 204);
  assert.equal(attempt.responseBodyStored, false);
  assert.equal("responseBody" in attempt, false);
  assert.equal(JSON.stringify(attempt).includes(secret), false);
});

test("500 and network failures retry on the bounded schedule, while 400 is terminal", async () => {
  const context = await setup(undefined, "retry");
  const created = await endpoint(context);
  await queueWebhookTestEvent({ ...context, endpointPublicId: created.endpoint.id, now: baseNow });
  await enqueuePendingWebhookEvents({ db: context.db, now: baseNow });
  await processPendingWebhookDeliveries({
    db: context.db,
    resolver: publicResolver,
    encryptionKey,
    now: baseNow,
    transport: async () => ({ statusCode: 500, durationMs: 5 }),
  });
  let delivery = await context.db.collection("webhook_deliveries").findOne({});
  assert.equal(delivery.status, "retrying");
  assert.equal(delivery.nextAttemptAt.getTime(), baseNow.getTime() + WEBHOOK_RETRY_DELAYS_MS[0]);
  await processPendingWebhookDeliveries({
    db: context.db,
    resolver: publicResolver,
    encryptionKey,
    now: delivery.nextAttemptAt,
    transport: async () => { throw Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }); },
  });
  delivery = await context.db.collection("webhook_deliveries").findOne({});
  assert.equal(delivery.status, "retrying");
  assert.equal(delivery.attemptCount, 2);

  const terminalContext = await setup(undefined, "terminal");
  const terminalEndpoint = await endpoint(terminalContext);
  await queueWebhookTestEvent({ ...terminalContext, endpointPublicId: terminalEndpoint.endpoint.id, now: baseNow });
  const terminal = await runWebhookDeliveryWorker({
    db: terminalContext.db,
    resolver: publicResolver,
    encryptionKey,
    now: baseNow,
    transport: async () => ({ statusCode: 400, durationMs: 4 }),
  });
  assert.equal(terminal.delivered.failed, 1);
  const failed = await terminalContext.db.collection("webhook_deliveries").findOne({});
  assert.equal(failed.status, "failed");
  assert.equal(failed.attemptCount, 1);
});

test("repeated receiver failures stop after the configured maximum attempts", async () => {
  const context = await setup(undefined, "max-attempts");
  const created = await endpoint(context);
  await queueWebhookTestEvent({ ...context, endpointPublicId: created.endpoint.id, now: baseNow });
  await enqueuePendingWebhookEvents({ db: context.db, now: baseNow });
  let attemptNow = baseNow;
  for (let attempt = 0; attempt < WEBHOOK_MAX_ATTEMPTS; attempt += 1) {
    await processPendingWebhookDeliveries({
      db: context.db,
      resolver: publicResolver,
      encryptionKey,
      now: attemptNow,
      transport: async () => ({ statusCode: 503, durationMs: 3 }),
    });
    const current = await context.db.collection("webhook_deliveries").findOne({});
    if (current.status === "retrying") attemptNow = current.nextAttemptAt;
  }
  const delivery = await context.db.collection("webhook_deliveries").findOne({});
  assert.equal(delivery.status, "failed");
  assert.equal(delivery.attemptCount, WEBHOOK_MAX_ATTEMPTS);
  assert.equal(await context.db.collection("webhook_delivery_attempts").countDocuments({}), WEBHOOK_MAX_ATTEMPTS);
});

test("event enqueue is idempotent and an expired processing lease recovers after interruption", async () => {
  const context = await setup(undefined, "recovery");
  const created = await endpoint(context);
  await queueWebhookTestEvent({ ...context, endpointPublicId: created.endpoint.id, now: baseNow });
  await enqueuePendingWebhookEvents({ db: context.db, now: baseNow });
  await enqueuePendingWebhookEvents({ db: context.db, now: baseNow });
  assert.equal(await context.db.collection("webhook_deliveries").countDocuments({}), 1);
  const delivery = await context.db.collection("webhook_deliveries").findOne({});
  await context.db.collection("webhook_deliveries").updateOne(
    { _id: delivery._id },
    { $set: { status: "processing", leaseExpiresAt: new Date(baseNow.getTime() - 1) } },
  );
  await context.db.collection("webhook_delivery_attempts").insertOne({
    publicId: "wha_interrupted_attempt_0001",
    deliveryId: delivery._id,
    deliveryPublicId: delivery.publicId,
    eventPublicId: delivery.eventPublicId,
    endpointPublicId: delivery.endpointPublicId,
    organizationId: delivery.organizationId,
    apiClientId: delivery.apiClientId,
    environment: delivery.environment,
    attemptNumber: 1,
    replayNumber: 0,
    statusCode: 200,
    durationMs: 2,
    responseBodyStored: false,
    startedAt: baseNow,
    completedAt: baseNow,
  });
  const result = await processPendingWebhookDeliveries({
    db: context.db,
    resolver: publicResolver,
    encryptionKey,
    now: baseNow,
    transport: async () => ({ statusCode: 200, durationMs: 2 }),
  });
  assert.equal(result.succeeded, 1);
  const recovered = await context.db.collection("webhook_deliveries").findOne({});
  assert.equal(recovered.status, "succeeded");
  assert.equal(await context.db.collection("webhook_delivery_attempts").countDocuments({ deliveryId: delivery._id }), 1);
});

test("manual replay preserves event identity, increments replay generation, and is tenant scoped", async () => {
  const db = new InMemoryMongoDatabase("phase7_replay");
  const context = await setup(db, "replay-owner");
  const outsider = await setup(db, "replay-outsider");
  const created = await endpoint(context);
  await queueWebhookTestEvent({ ...context, endpointPublicId: created.endpoint.id, now: baseNow });
  await runWebhookDeliveryWorker({
    db,
    resolver: publicResolver,
    encryptionKey,
    now: baseNow,
    transport: async () => ({ statusCode: 204, durationMs: 1 }),
  });
  const delivery = await db.collection("webhook_deliveries").findOne({});
  await expectPartnerError(
    replayWebhookDelivery({ ...outsider, deliveryPublicId: delivery.publicId, now: baseNow }),
    "resource_not_found",
    404,
  );
  const replay = await replayWebhookDelivery({
    ...context,
    deliveryPublicId: delivery.publicId,
    now: new Date(baseNow.getTime() + 1000),
  });
  assert.equal(replay.queued, true);
  const result = await processPendingWebhookDeliveries({
    db,
    resolver: publicResolver,
    encryptionKey,
    now: new Date(baseNow.getTime() + 1000),
    transport: async () => ({ statusCode: 204, durationMs: 1 }),
  });
  assert.equal(result.succeeded, 1);
  const replayed = await db.collection("webhook_deliveries").findOne({});
  assert.equal(replayed.replayCount, 1);
  assert.equal(replayed.eventPublicId, delivery.eventPublicId);
  assert.equal(await db.collection("webhook_delivery_attempts").countDocuments({ deliveryId: delivery._id }), 2);
});

test("subscriptions and application ownership prevent unrelated event delivery", async () => {
  const db = new InMemoryMongoDatabase("phase7_subscription");
  const first = await setup(db, "subscription-first");
  const secondClient = await createApiClient(db, first.organization._id, {
    name: "Second application in the same organization",
    environmentAccess: ["test"],
    scopes: ["webhooks:manage"],
  }, baseNow);
  const second = {
    db,
    organization: first.organization,
    apiClient: secondClient,
    principal: {
      kind: "partner_api",
      organizationId: first.organization._id.toString(),
      apiClientId: secondClient._id.toString(),
      credentialId: "phase7-credential-second-app",
      environment: "test",
      scopes: secondClient.scopes,
    },
  };
  await endpoint(first, ["invoice.available"]);
  await endpoint(second, ["shipment.created"]);
  await createPartnerShipment({
    ...first,
    data: shipmentData("subscription-1"),
    idempotencyKey: "phase7-subscription-shipment",
    now: baseNow,
  });
  const queued = await enqueuePendingWebhookEvents({ db, now: baseNow });
  assert.equal(queued.deliveries, 0);
  assert.equal(await db.collection("webhook_deliveries").countDocuments({}), 0);
});

test("admin shipment and invoice changes are delivered as independent durable events", async () => {
  const context = await setup(undefined, "admin-events");
  await endpoint(context, ["shipment.updated", "invoice.available"]);
  const created = await createPartnerShipment({
    ...context,
    data: shipmentData("admin-events-1"),
    idempotencyKey: "phase7-admin-events-shipment",
    now: baseNow,
  });
  const stored = await getPartnerShipment({
    ...context,
    shipmentPublicId: created.body.shipment.id,
  });
  await updateInternalShipment({
    db: context.db,
    id: stored._id.toString(),
    principal: admin,
    body: { status: "in-transit", currentLocation: "Tema Port" },
    now: new Date(baseNow.getTime() + 1000),
  });
  await setInternalShipmentInvoice({
    db: context.db,
    id: stored._id.toString(),
    principal: admin,
    invoice: {
      url: "https://phase7.private.blob.vercel-storage.com/invoice.pdf",
      pathname: "invoice.pdf",
      fileName: "invoice.pdf",
      uploadedAt: new Date(baseNow.getTime() + 2000),
      uploadedBy: admin.userId,
    },
    now: new Date(baseNow.getTime() + 2000),
  });
  const received = [];
  await runWebhookDeliveryWorker({
    db: context.db,
    resolver: publicResolver,
    encryptionKey,
    now: new Date(baseNow.getTime() + 3000),
    transport: async (input) => {
      received.push(JSON.parse(input.body));
      return { statusCode: 200, durationMs: 2 };
    },
  });
  assert.deepEqual(received.map((event) => event.type).sort(), ["invoice.available", "shipment.updated"]);
  assert.equal(new Set(received.map((event) => event.id)).size, 2);
  assert.ok(received.every((event) => event.occurredAt && event.apiVersion === "1"));
});

test("delivery listing is tenant scoped and exposes sanitized operational fields only", async () => {
  const context = await setup(undefined, "listing");
  const created = await endpoint(context);
  await queueWebhookTestEvent({ ...context, endpointPublicId: created.endpoint.id, now: baseNow });
  await runWebhookDeliveryWorker({
    db: context.db,
    resolver: publicResolver,
    encryptionKey,
    now: baseNow,
    transport: async () => ({ statusCode: 204, durationMs: 8 }),
  });
  const listed = await listWebhookDeliveries({ ...context, limit: 20 });
  assert.equal(listed.deliveries.length, 1);
  const json = JSON.stringify(listed);
  assert.equal(json.includes("organizationId"), false);
  assert.equal(json.includes("apiClientId"), false);
  assert.equal(json.includes("encryptedSecret"), false);
  assert.equal(json.includes(secret), false);
});
