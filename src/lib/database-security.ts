import type { Db } from "mongodb";

const indexPromises = new WeakMap<Db, Promise<void>>();

export function ensureSecurityIndexes(db: Db) {
  const existing = indexPromises.get(db);
  if (existing) return existing;

  const promise = Promise.all([
    db.collection("users").createIndex(
      { emailNormalized: 1 },
      { unique: true, sparse: true, name: "users_email_normalized_unique" }
    ),
    db.collection("users").createIndex(
      { usernameNormalized: 1 },
      { unique: true, sparse: true, name: "users_username_normalized_unique" }
    ),
    db.collection("identity_verifications").createIndex(
      { documentNumberHash: 1 },
      { unique: true, name: "identity_document_hash_unique" }
    ),
    db.collection("identity_verifications").createIndex(
      { status: 1, submittedAt: -1 },
      { name: "identity_review_queue" }
    ),
    db.collection("identity_verifications").createIndex(
      { documentRetentionExpiresAt: 1 },
      { name: "identity_retention_cleanup" }
    ),
    db.collection("registration_attempts").createIndex(
      { tokenHash: 1 },
      { unique: true, name: "registration_attempt_token_unique" }
    ),
    db.collection("registration_attempts").createIndex(
      { deleteAt: 1 },
      { expireAfterSeconds: 0, name: "registration_attempt_expiry" }
    ),
    db.collection("rate_limits").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "rate_limit_expiry" }
    ),
    db.collection("audit_logs").createIndex(
      { entityType: 1, entityId: 1, createdAt: -1 },
      { name: "audit_log_entity_history" }
    ),
  ]).then(() => undefined);

  indexPromises.set(db, promise);
  return promise;
}

export async function consumeRateLimit(
  db: Db,
  key: string,
  limit: number,
  windowMs: number
) {
  const bucket = Math.floor(Date.now() / windowMs);
  const id = `${key}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowMs + 60_000);

  const result = await db.collection<{ _id: string; count: number; expiresAt: Date }>("rate_limits")
    .findOneAndUpdate(
      { _id: id },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt },
      },
      { upsert: true, returnDocument: "after" }
    );

  return {
    allowed: (result?.count || 0) <= limit,
    remaining: Math.max(0, limit - (result?.count || 0)),
    resetAt: expiresAt,
  };
}
