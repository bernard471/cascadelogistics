import type { Db } from "mongodb";

const indexPromises = new WeakMap<Db, Promise<void>>();

export function ensureSecurityIndexes(db: Db) {
  const existing = indexPromises.get(db);
  if (existing) return existing;

  // Build indexes sequentially. Several of these collections may not exist on
  // the first production registration, and concurrent first-time index builds
  // can race while MongoDB creates their namespaces.
  const promise = (async () => {
    await db.collection("users").createIndex(
      { emailNormalized: 1 },
      { unique: true, sparse: true, name: "users_email_normalized_unique" }
    );
    await db.collection("users").createIndex(
      { usernameNormalized: 1 },
      { unique: true, sparse: true, name: "users_username_normalized_unique" }
    );
    await db.collection("identity_verifications").createIndex(
      { documentNumberHash: 1 },
      { unique: true, name: "identity_document_hash_unique" }
    );
    await db.collection("identity_verifications").createIndex(
      { status: 1, submittedAt: -1 },
      { name: "identity_review_queue" }
    );
    await db.collection("identity_verifications").createIndex(
      { documentRetentionExpiresAt: 1 },
      { name: "identity_retention_cleanup" }
    );
    await db.collection("registration_attempts").createIndex(
      { tokenHash: 1 },
      { unique: true, name: "registration_attempt_token_unique" }
    );
    await db.collection("registration_attempts").createIndex(
      { deleteAt: 1 },
      { expireAfterSeconds: 0, name: "registration_attempt_expiry" }
    );
    await db.collection("rate_limits").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "rate_limit_expiry" }
    );
    await db.collection("audit_logs").createIndex(
      { entityType: 1, entityId: 1, createdAt: -1 },
      { name: "audit_log_entity_history" }
    );
  })();

  indexPromises.set(db, promise);
  void promise.catch(() => {
    // A transient first attempt should be retryable in the same function
    // instance instead of leaving a rejected promise cached indefinitely.
    indexPromises.delete(db);
  });
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
