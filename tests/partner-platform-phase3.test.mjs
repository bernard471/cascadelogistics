import assert from "node:assert/strict";
import test from "node:test";

import {
  parseBearerPartnerApiKey,
  parsePartnerApiKey,
} from "../src/lib/partner-platform/api-keys.ts";
import { updatePartnerApplicationAccess, setPartnerOrganizationStatus } from "../src/lib/partner-platform/access-control.ts";
import { authenticatePartnerApiRequest } from "../src/lib/partner-platform/authentication.ts";
import {
  issuePartnerApiCredential,
  revokePartnerApiCredential,
} from "../src/lib/partner-platform/credentials.ts";
import { PartnerApiError } from "../src/lib/partner-platform/errors.ts";
import {
  generateRequestId,
  writePartnerRequestLog,
} from "../src/lib/partner-platform/logging.ts";
import { buildPartnerIdentityResponse } from "../src/lib/partner-platform/identity.ts";
import {
  getPartnerOperationBlock,
  setPartnerOperationControl,
} from "../src/lib/partner-platform/operation-controls.ts";
import {
  consumePartnerAuthenticationFailureLimit,
  consumePartnerRequestLimits,
} from "../src/lib/partner-platform/rate-limit.ts";
import {
  redactSensitiveData,
  sanitizeLogText,
} from "../src/lib/partner-platform/redaction.ts";
import {
  createApiClient,
  createOrganization,
} from "../src/lib/partner-platform/repositories.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

const pepper = "phase-3-test-pepper-which-is-longer-than-thirty-two-characters";
const baseNow = new Date("2026-08-06T12:00:00.000Z");
const superAdmin = {
  kind: "internal",
  userId: "super-admin-1",
  role: "super_admin",
};

class MemoryRateLimitStore {
  constructor() {
    this.counts = new Map();
  }

  async consume({ key, limit, windowMs, now }) {
    const bucket = Math.floor(now.getTime() / windowMs);
    const id = `${key}:${bucket}`;
    const count = (this.counts.get(id) || 0) + 1;
    this.counts.set(id, count);
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: new Date((bucket + 1) * windowMs),
    };
  }
}

async function setup(options = {}) {
  const db = new InMemoryMongoDatabase("cascade_phase3_test");
  const organization = await createOrganization(
    db,
    {
      name: "Phase 3 Partner",
      slug: `phase-3-${Math.random().toString(36).slice(2, 10)}`,
      status: options.organizationStatus || "active",
      limits: {
        requestsPerMinute: options.organizationLimit || 60,
        shipmentsPerDay: 1000,
        uploadBytesPerDay: 1024 * 1024 * 1024,
      },
    },
    baseNow,
  );
  const apiClient = await createApiClient(
    db,
    organization._id,
    {
      name: "Phase 3 Application",
      status: options.applicationStatus || "active",
      environmentAccess: options.environmentAccess || ["test", "live"],
      scopes: options.scopes || ["shipments:read", "tracking:read"],
      requestsPerMinute: options.applicationLimit,
    },
    baseNow,
  );
  return { db, organization, apiClient };
}

async function issue(context, options = {}) {
  return issuePartnerApiCredential({
    db: context.db,
    principal: superAdmin,
    organizationId: context.organization._id.toString(),
    apiClientId: context.apiClient._id.toString(),
    environment: options.environment || "test",
    scopes: options.scopes || ["shipments:read"],
    expiresAt: options.expiresAt,
    pepper,
    now: baseNow,
  });
}

async function expectPartnerError(promise, code, status) {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof PartnerApiError &&
      error.code === code &&
      error.status === status,
  );
}

test("test and live keys are distinct, parseable, and returned only once", async () => {
  const context = await setup();
  const testCredential = await issue(context, { environment: "test" });
  const liveCredential = await issue(context, { environment: "live" });

  assert.match(testCredential.apiKey, /^csl_test_/);
  assert.match(liveCredential.apiKey, /^csl_live_/);
  assert.equal(parsePartnerApiKey(testCredential.apiKey)?.environment, "test");
  assert.equal(
    parseBearerPartnerApiKey(`Bearer ${liveCredential.apiKey}`)?.environment,
    "live",
  );

  const secret = testCredential.apiKey.split(".")[1];
  const stored = await context.db.collection("api_credentials").findOne({
    keyPrefix: testCredential.credential.keyPrefix,
  });
  assert.ok(stored?.secretHash.startsWith("v1:"));
  assert.equal(JSON.stringify(stored).includes(secret), false);
  assert.equal(JSON.stringify(await context.db.collection("partner_audit_logs").find({}).toArray()).includes(secret), false);
});

test("valid credentials resolve an isolated partner principal", async () => {
  const context = await setup();
  const issued = await issue(context);
  const authenticated = await authenticatePartnerApiRequest({
    db: context.db,
    authorization: `Bearer ${issued.apiKey}`,
    requiredScopes: ["shipments:read"],
    sourceIp: "203.0.113.9",
    pepper,
    now: baseNow,
  });

  assert.equal(authenticated.principal.kind, "partner_api");
  assert.equal(
    authenticated.principal.organizationId,
    context.organization._id.toString(),
  );
  assert.equal(authenticated.principal.environment, "test");
  assert.deepEqual(authenticated.principal.scopes, ["shipments:read"]);
  const stored = await context.db.collection("api_credentials").findOne({
    keyPrefix: issued.credential.keyPrefix,
  });
  assert.equal(stored.lastUsedAt.toISOString(), baseNow.toISOString());
  assert.match(stored.lastUsedIp, /^sha256:/);
  assert.deepEqual(buildPartnerIdentityResponse(authenticated), {
    organization: {
      id: context.organization.publicId,
      name: context.organization.name,
    },
    application: {
      id: context.apiClient.publicId,
      name: context.apiClient.name,
    },
    environment: "test",
    scopes: ["shipments:read"],
  });
});

test("missing, malformed, and wrong-secret credentials fail safely", async () => {
  const context = await setup();
  const issued = await issue(context);
  await expectPartnerError(
    authenticatePartnerApiRequest({ db: context.db, authorization: null, pepper }),
    "authentication_required",
    401,
  );
  await expectPartnerError(
    authenticatePartnerApiRequest({
      db: context.db,
      authorization: "Basic malformed",
      pepper,
    }),
    "invalid_api_key",
    401,
  );
  const wrongKey = `${issued.apiKey.slice(0, -1)}${issued.apiKey.endsWith("A") ? "B" : "A"}`;
  await expectPartnerError(
    authenticatePartnerApiRequest({
      db: context.db,
      authorization: `Bearer ${wrongKey}`,
      pepper,
    }),
    "invalid_api_key",
    401,
  );
});

test("revoked and expired credentials return stable authentication errors", async () => {
  const revokedContext = await setup();
  const revoked = await issue(revokedContext);
  await revokePartnerApiCredential({
    db: revokedContext.db,
    principal: superAdmin,
    organizationId: revokedContext.organization._id.toString(),
    credentialPublicId: revoked.credential.publicId,
    reason: "Rotation test",
    now: baseNow,
  });
  await expectPartnerError(
    authenticatePartnerApiRequest({
      db: revokedContext.db,
      authorization: `Bearer ${revoked.apiKey}`,
      pepper,
      now: baseNow,
    }),
    "api_key_revoked",
    401,
  );

  const expiredContext = await setup();
  const expired = await issue(expiredContext, {
    expiresAt: new Date(baseNow.getTime() + 60_000),
  });
  await expectPartnerError(
    authenticatePartnerApiRequest({
      db: expiredContext.db,
      authorization: `Bearer ${expired.apiKey}`,
      pepper,
      now: new Date(baseNow.getTime() + 120_000),
    }),
    "api_key_expired",
    401,
  );
});

test("suspended organizations and applications are denied and audited", async () => {
  const organizationContext = await setup();
  const organizationKey = await issue(organizationContext);
  await setPartnerOrganizationStatus({
    db: organizationContext.db,
    principal: superAdmin,
    organizationId: organizationContext.organization._id.toString(),
    status: "suspended",
    now: baseNow,
  });
  await expectPartnerError(
    authenticatePartnerApiRequest({
      db: organizationContext.db,
      authorization: `Bearer ${organizationKey.apiKey}`,
      pepper,
    }),
    "integration_suspended",
    403,
  );

  const applicationContext = await setup();
  const applicationKey = await issue(applicationContext);
  await updatePartnerApplicationAccess({
    db: applicationContext.db,
    principal: superAdmin,
    organizationId: applicationContext.organization._id.toString(),
    apiClientId: applicationContext.apiClient._id.toString(),
    status: "suspended",
    now: baseNow,
  });
  await expectPartnerError(
    authenticatePartnerApiRequest({
      db: applicationContext.db,
      authorization: `Bearer ${applicationKey.apiKey}`,
      pepper,
    }),
    "integration_suspended",
    403,
  );
  assert.equal(
    await applicationContext.db.collection("partner_audit_logs").countDocuments({
      action: "partner_application_access_changed",
    }),
    1,
  );
});

test("scope and environment checks are deny-by-default", async () => {
  const context = await setup({ environmentAccess: ["test"] });
  const issued = await issue(context, { scopes: ["shipments:read"] });
  await expectPartnerError(
    authenticatePartnerApiRequest({
      db: context.db,
      authorization: `Bearer ${issued.apiKey}`,
      requiredScopes: ["shipments:update"],
      pepper,
    }),
    "insufficient_scope",
    403,
  );
  await expectPartnerError(
    issue(context, { environment: "live" }),
    "validation_failed",
    422,
  );
});

test("application, organization, and authentication-failure limits return 429", async () => {
  const context = await setup({ organizationLimit: 2, applicationLimit: 1 });
  const store = new MemoryRateLimitStore();
  const first = await consumePartnerRequestLimits({
    store,
    organization: context.organization,
    apiClient: context.apiClient,
    environment: "test",
    now: baseNow,
  });
  assert.equal(first.allowed, true);
  await expectPartnerError(
    consumePartnerRequestLimits({
      store,
      organization: context.organization,
      apiClient: context.apiClient,
      environment: "test",
      now: baseNow,
    }),
    "rate_limit_exceeded",
    429,
  );

  const failureStore = new MemoryRateLimitStore();
  for (let index = 0; index < 20; index += 1) {
    await consumePartnerAuthenticationFailureLimit({
      store: failureStore,
      sourceFingerprint: "sha256:test-source",
      now: baseNow,
    });
  }
  await expectPartnerError(
    consumePartnerAuthenticationFailureLimit({
      store: failureStore,
      sourceFingerprint: "sha256:test-source",
      now: baseNow,
    }),
    "rate_limit_exceeded",
    429,
  );
});

test("operation controls resolve application scope before organization and global", async () => {
  const context = await setup();
  const issued = await issue(context);
  const authenticated = await authenticatePartnerApiRequest({
    db: context.db,
    authorization: `Bearer ${issued.apiKey}`,
    pepper,
  });
  await setPartnerOperationControl({
    db: context.db,
    principal: superAdmin,
    operation: "api_access",
    scopeType: "global",
    pausedUntil: new Date(baseNow.getTime() + 60_000),
    publicMessage: "Global pause",
    now: baseNow,
  });
  await setPartnerOperationControl({
    db: context.db,
    principal: superAdmin,
    operation: "api_access",
    scopeType: "application",
    organizationId: context.organization._id.toString(),
    apiClientId: context.apiClient._id.toString(),
    environment: "test",
    pausedUntil: new Date(baseNow.getTime() + 120_000),
    publicMessage: "Application pause",
    now: baseNow,
  });
  const block = await getPartnerOperationBlock({
    db: context.db,
    principal: authenticated.principal,
    operation: "api_access",
    now: baseNow,
  });
  assert.equal(block?.scopeType, "application");
  assert.equal(block?.message, "Application pause");
});

test("request logs and generic redaction never retain secrets", async () => {
  const context = await setup();
  const issued = await issue(context);
  const redacted = redactSensitiveData({
    authorization: `Bearer ${issued.apiKey}`,
    nested: { password: "hidden", note: `key=${issued.apiKey}` },
  });
  assert.equal(JSON.stringify(redacted).includes(issued.apiKey), false);
  assert.equal(sanitizeLogText(`agent ${issued.apiKey}`).includes(issued.apiKey), false);

  const requestId = generateRequestId();
  assert.match(requestId, /^req_/);
  await writePartnerRequestLog(context.db, {
    requestId,
    method: "GET",
    routeTemplate: "/api/v1/me",
    responseStatus: 200,
    durationMs: 12,
    credentialPrefix: issued.credential.keyPrefix,
    userAgent: `unsafe-agent ${issued.apiKey}\r\nInjected: yes`,
    correlationId: issued.apiKey,
  });
  const log = await context.db.collection("api_request_logs").findOne({ requestId });
  assert.equal(JSON.stringify(log).includes(issued.apiKey), false);
  assert.equal(JSON.stringify(log).includes("\r\n"), false);
  assert.equal("authorization" in log, false);
  assert.equal("requestBody" in log, false);
});
