import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";

import { appendPartnerAuditEntry } from "../src/lib/partner-platform/audit.ts";
import { PartnerApiError } from "../src/lib/partner-platform/errors.ts";
import { getPartnerOperationBlock } from "../src/lib/partner-platform/operation-controls.ts";
import { superAdminIntegrationActionSchema } from "../src/lib/partner-platform/phase8-schemas.ts";
import {
  executeSuperAdminIntegrationAction,
  getSuperAdminIntegrationConsole,
} from "../src/lib/partner-platform/super-admin-console.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

const baseNow = new Date("2026-08-06T12:00:00.000Z");
const pepper = "phase-8-test-pepper-with-at-least-thirty-two-characters";
const superAdmin = { kind: "internal", userId: "phase8-owner", role: "super_admin" };

function database(name = "phase8") {
  return new InMemoryMongoDatabase(`cascade_${name}_${Math.random().toString(36).slice(2)}`);
}

async function execute(db, action, now = baseNow) {
  return executeSuperAdminIntegrationAction({ db, principal: superAdmin, action, pepper, now });
}

async function readyPartner(db, suffix = "owner") {
  const created = await execute(db, {
    action: "organization.create",
    data: {
      name: `Phase 8 ${suffix}`,
      slug: `phase-8-${suffix}-${Math.random().toString(36).slice(2, 8)}`,
      technicalEmail: `${suffix}@partner.example`,
    },
  });
  const organizationId = created.organization.id;
  await execute(db, {
    action: "organization.update",
    organizationId,
    data: {
      status: "active",
      customerEmailMode: "partner",
      shipmentVisibility: "creating_client",
      requestsPerMinute: 180,
      shipmentsPerDay: 2500,
      uploadBytesPerDay: 2 * 1024 * 1024 * 1024,
    },
  });
  const applicationResult = await execute(db, {
    action: "application.create",
    organizationId,
    data: {
      name: `${suffix} application`,
      description: "Phase 8 integration",
      environmentAccess: ["test", "live"],
      scopes: ["shipments:create", "shipments:read", "tracking:read", "webhooks:manage"],
      requestsPerMinute: 75,
    },
  });
  return { organizationId, applicationId: applicationResult.application.id };
}

async function expectPartnerError(promise, code, status) {
  await assert.rejects(
    promise,
    (error) => error instanceof PartnerApiError && error.code === code && error.status === status,
  );
}

test("only super admins can read or mutate the integration console", async () => {
  const db = database("roles");
  const denied = [
    { kind: "internal", userId: "admin-1", role: "admin" },
    { kind: "internal", userId: "staff-1", role: "staff" },
    { kind: "customer", userId: "customer-1", role: "user" },
    { kind: "partner_api", organizationId: new ObjectId().toString(), apiClientId: new ObjectId().toString(), credentialId: "credential", environment: "test", scopes: ["shipments:read"] },
  ];
  for (const principal of denied) {
    await expectPartnerError(getSuperAdminIntegrationConsole({ db, principal }), "resource_not_found", 404);
    await expectPartnerError(executeSuperAdminIntegrationAction({
      db,
      principal,
      action: { action: "organization.create", data: { name: "Denied Partner", slug: "denied-partner" } },
      pepper,
    }), "resource_not_found", 404);
  }
  assert.equal(await db.collection("organizations").countDocuments({}), 0);
});

test("organization approval, policies, application scopes and quotas are manageable without database edits", async () => {
  const db = database("lifecycle");
  const context = await readyPartner(db, "lifecycle");
  const updated = await execute(db, {
    action: "application.update",
    organizationId: context.organizationId,
    applicationId: context.applicationId,
    data: {
      description: "Production partner application",
      environmentAccess: ["test"],
      scopes: ["shipments:create", "shipments:read"],
      requestsPerMinute: 40,
    },
  });
  assert.deepEqual(updated.application.environmentAccess, ["test"]);
  assert.deepEqual(updated.application.scopes, ["shipments:create", "shipments:read"]);
  assert.equal(updated.application.requestsPerMinute, 40);
  const consoleData = await getSuperAdminIntegrationConsole({ db, principal: superAdmin });
  assert.equal(consoleData.organizations[0].status, "active");
  assert.equal(consoleData.organizations[0].limits.shipmentsPerDay, 2500);
  assert.equal(consoleData.organizations[0].settings.shipmentVisibility, "creating_client");
  assert.equal(consoleData.applications[0].description, "Production partner application");
  assert.equal(consoleData.applications[0].organizationId, context.organizationId);
});

test("credential issuance enforces application environment and scope boundaries and reveals the key once", async () => {
  const db = database("credential");
  const context = await readyPartner(db, "credential");
  await execute(db, {
    action: "application.update",
    organizationId: context.organizationId,
    applicationId: context.applicationId,
    data: { environmentAccess: ["test"], scopes: ["shipments:read"] },
  });
  await expectPartnerError(execute(db, {
    action: "credential.issue", organizationId: context.organizationId,
    applicationId: context.applicationId, environment: "live", scopes: ["shipments:read"],
  }), "validation_failed", 422);
  await expectPartnerError(execute(db, {
    action: "credential.issue", organizationId: context.organizationId,
    applicationId: context.applicationId, environment: "test", scopes: ["shipments:create"],
  }), "validation_failed", 422);
  const issued = await execute(db, {
    action: "credential.issue", organizationId: context.organizationId,
    applicationId: context.applicationId, environment: "test", scopes: ["shipments:read"],
  });
  assert.match(issued.apiKey, /^csl_test_/);
  const secret = issued.apiKey.split(".")[1];
  const stored = await db.collection("api_credentials").findOne({ publicId: issued.credential.publicId });
  assert.match(stored.secretHash, /^v1:/);
  assert.equal(JSON.stringify(stored).includes(secret), false);
  const consoleData = await getSuperAdminIntegrationConsole({ db, principal: superAdmin });
  const serialized = JSON.stringify(consoleData);
  assert.equal(serialized.includes(issued.apiKey), false);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes("secretHash"), false);
  assert.equal(consoleData.credentials[0].keyPrefix, issued.credential.keyPrefix);
});

test("credential rotation returns a distinct replacement once, revokes the old key, and supports revocation", async () => {
  const db = database("rotation");
  const context = await readyPartner(db, "rotation");
  const issued = await execute(db, {
    action: "credential.issue", organizationId: context.organizationId,
    applicationId: context.applicationId, environment: "test", scopes: ["shipments:read"],
  });
  const rotated = await execute(db, {
    action: "credential.rotate", organizationId: context.organizationId,
    credentialId: issued.credential.publicId,
  }, new Date(baseNow.getTime() + 1000));
  assert.match(rotated.apiKey, /^csl_test_/);
  assert.notEqual(rotated.apiKey, issued.apiKey);
  const previous = await db.collection("api_credentials").findOne({ publicId: issued.credential.publicId });
  assert.equal(previous.status, "revoked");
  assert.match(previous.revokeReason, new RegExp(rotated.credential.publicId));
  await execute(db, {
    action: "credential.revoke", organizationId: context.organizationId,
    credentialId: rotated.credential.publicId, reason: "Partner offboarded",
  }, new Date(baseNow.getTime() + 2000));
  const replacement = await db.collection("api_credentials").findOne({ publicId: rotated.credential.publicId });
  assert.equal(replacement.status, "revoked");
  await expectPartnerError(execute(db, {
    action: "credential.rotate", organizationId: context.organizationId,
    credentialId: rotated.credential.publicId,
  }), "validation_failed", 409);
});

test("scoped pauses propagate immediately to partner API authorization and can be resumed", async () => {
  const db = database("controls");
  const context = await readyPartner(db, "controls");
  const organization = await db.collection("organizations").findOne({ publicId: context.organizationId });
  const application = await db.collection("api_clients").findOne({ publicId: context.applicationId });
  const principal = {
    kind: "partner_api", organizationId: organization._id.toString(), apiClientId: application._id.toString(),
    credentialId: "phase8-control-credential", environment: "live", scopes: ["shipments:create"],
  };
  const pausedUntil = new Date(baseNow.getTime() + 60 * 60 * 1000);
  await execute(db, {
    action: "control.set", operation: "shipments:create", scopeType: "application",
    organizationId: context.organizationId, applicationId: context.applicationId,
    environment: "live", pausedUntil: pausedUntil.toISOString(), reason: "Maintenance",
    publicMessage: "Shipment submission is briefly unavailable",
  });
  const block = await getPartnerOperationBlock({ db, principal, operation: "shipments:create", now: baseNow });
  assert.equal(block.scopeType, "application");
  assert.equal(block.message, "Shipment submission is briefly unavailable");
  assert.equal(await getPartnerOperationBlock({ db, principal: { ...principal, environment: "test" }, operation: "shipments:create", now: baseNow }), null);
  await execute(db, {
    action: "control.set", operation: "shipments:create", scopeType: "application",
    organizationId: context.organizationId, applicationId: context.applicationId,
    environment: "live", pausedUntil: null,
  }, new Date(baseNow.getTime() + 1000));
  assert.equal(await getPartnerOperationBlock({ db, principal, operation: "shipments:create", now: new Date(baseNow.getTime() + 2000) }), null);
});

test("public organization and application IDs remain tenant isolated for privileged mutations", async () => {
  const db = database("isolation");
  const first = await readyPartner(db, "first");
  const second = await readyPartner(db, "second");
  await expectPartnerError(execute(db, {
    action: "application.update", organizationId: first.organizationId,
    applicationId: second.applicationId, data: { status: "suspended" },
  }), "resource_not_found", 404);
  await expectPartnerError(execute(db, {
    action: "credential.issue", organizationId: first.organizationId,
    applicationId: second.applicationId, environment: "test", scopes: ["shipments:read"],
  }), "resource_not_found", 404);
  const secondApplication = await db.collection("api_clients").findOne({ publicId: second.applicationId });
  assert.equal(secondApplication.status, "active");
});

test("console logs and audits are redacted, webhook attempts are visible, and manual replay is audited", async () => {
  const db = database("observability");
  const context = await readyPartner(db, "observability");
  const organization = await db.collection("organizations").findOne({ publicId: context.organizationId });
  const application = await db.collection("api_clients").findOne({ publicId: context.applicationId });
  const endpointId = new ObjectId();
  const deliveryId = new ObjectId();
  const deliveryPublicId = "whd_abcdefghijklmnop";
  await db.collection("webhook_endpoints").insertOne({
    _id: endpointId, publicId: "whe_abcdefghijklmnop", organizationId: organization._id,
    apiClientId: application._id, environment: "test", url: "https://hooks.partner.example/cascade",
    subscribedEvents: ["shipment.created"], status: "active", secretPrefix: "whsec_safe",
    encryptedSecret: { version: "1", iv: "hidden", tag: "hidden", ciphertext: "hidden" },
    createdByCredentialId: "internal-credential-id", createdAt: baseNow, updatedAt: baseNow,
  });
  await db.collection("webhook_deliveries").insertOne({
    _id: deliveryId, publicId: deliveryPublicId, eventId: new ObjectId(), eventPublicId: "evt_abcdefghijklmnop",
    endpointId, endpointPublicId: "whe_abcdefghijklmnop", organizationId: organization._id,
    apiClientId: application._id, environment: "test", status: "failed", attemptCount: 5,
    nextAttemptAt: baseNow, lastStatusCode: 500, lastErrorCode: "receiver_error", lastDurationMs: 120,
    replayCount: 0, createdAt: baseNow, updatedAt: baseNow, failedAt: baseNow,
  });
  await db.collection("webhook_delivery_attempts").insertOne({
    publicId: "wha_abcdefghijklmnop", deliveryPublicId, eventPublicId: "evt_abcdefghijklmnop",
    endpointPublicId: "whe_abcdefghijklmnop", attemptNumber: 5, replayNumber: 0,
    statusCode: 500, errorCode: "receiver_error", durationMs: 120, completedAt: baseNow,
  });
  await db.collection("api_request_logs").insertOne({
    requestId: "req_abcdefghijklmnop", organizationId: organization._id, apiClientId: application._id,
    credentialPrefix: "csl_test_safe", environment: "test", method: "POST", routeTemplate: "/api/v1/shipments",
    responseStatus: 422, errorCode: "validation_failed", durationMs: 18, sourceIp: "sha256:safe-fingerprint",
    correlationId: "correlation-safe", createdAt: baseNow,
  });
  const fakeKey = "csl_test_abcdefghijklmnop.qrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
  await appendPartnerAuditEntry(db, {
    actorType: "super_admin", actorId: superAdmin.userId, action: "redaction.probe",
    organizationId: organization._id, apiClientId: application._id,
    metadata: { password: "never-display", authorization: "Bearer private", note: fakeKey }, createdAt: baseNow,
  });
  const beforeReplay = await getSuperAdminIntegrationConsole({ db, principal: superAdmin });
  assert.equal(beforeReplay.deliveryAttempts[0].statusCode, 500);
  assert.equal(beforeReplay.requestLogs[0].sourceFingerprint, "sha256:safe-fingerprint");
  const serialized = JSON.stringify(beforeReplay);
  for (const forbidden of ["never-display", "Bearer private", fakeKey, "ciphertext", "encryptedSecret", "internal-credential-id"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  await execute(db, { action: "delivery.replay", deliveryId: deliveryPublicId }, new Date(baseNow.getTime() + 1000));
  const replayed = await db.collection("webhook_deliveries").findOne({ publicId: deliveryPublicId });
  assert.equal(replayed.status, "pending");
  assert.equal(replayed.attemptCount, 0);
  assert.equal(replayed.replayCount, 1);
  const auditActions = (await db.collection("partner_audit_logs").find({}).toArray()).map((entry) => entry.action);
  for (const required of [
    "organization.created", "organization.updated", "application.created",
    "redaction.probe", "webhook_delivery.replayed_by_super_admin",
  ]) assert.ok(auditActions.includes(required), required);
});

test("Phase 8 mutation schema rejects malformed scope, quota, environment and replay requests", () => {
  assert.equal(superAdminIntegrationActionSchema.safeParse({
    action: "application.create", organizationId: "org_abcdefghijklmnop",
    data: { name: "Bad scopes", environmentAccess: ["sandbox"], scopes: ["root:all"], requestsPerMinute: 0 },
  }).success, false);
  assert.equal(superAdminIntegrationActionSchema.safeParse({ action: "delivery.replay", deliveryId: "short" }).success, false);
  assert.equal(superAdminIntegrationActionSchema.safeParse({
    action: "organization.update", organizationId: "org_abcdefghijklmnop", data: {},
  }).success, false);
});
