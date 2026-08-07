import type { Db } from "mongodb";

const indexPromises = new WeakMap<Db, Promise<void>>();

export function ensurePartnerSecurityIndexes(db: Db): Promise<void> {
  const existing = indexPromises.get(db);
  if (existing) return existing;

  const promise = (async () => {
    await db.collection("api_credentials").createIndex(
      { keyPrefix: 1 },
      { name: "api_credentials_prefix_unique", unique: true },
    );
    await db.collection("api_request_logs").createIndex(
      { requestId: 1 },
      { name: "api_request_logs_request_id_unique", unique: true },
    );
    await db.collection("api_request_logs").createIndex(
      { organizationId: 1, createdAt: -1 },
      { name: "api_request_logs_org_created" },
    );
    await db.collection("api_request_logs").createIndex(
      { expiresAt: 1 },
      { name: "api_request_logs_expires_ttl", expireAfterSeconds: 0 },
    );
    await db.collection("partner_rate_limits").createIndex(
      { expiresAt: 1 },
      { name: "partner_rate_limits_expiry", expireAfterSeconds: 0 },
    );
    await db.collection("partner_audit_logs").createIndex(
      { organizationId: 1, createdAt: -1 },
      { name: "partner_audit_org_created" },
    );
    await db.collection("partner_audit_logs").createIndex(
      { targetPublicId: 1, createdAt: -1 },
      { name: "partner_audit_target_created" },
    );
    await db.collection("partner_operation_controls").createIndex(
      {
        operation: 1,
        scopeType: 1,
        organizationId: 1,
        apiClientId: 1,
        environment: 1,
      },
      { name: "partner_operation_controls_resolution" },
    );
  })();
  indexPromises.set(db, promise);
  void promise.catch(() => indexPromises.delete(db));
  return promise;
}
