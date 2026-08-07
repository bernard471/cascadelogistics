import { createHash } from "node:crypto";
import { ObjectId, type Db } from "mongodb";
import { partnerApiError } from "./errors.ts";
import type { PartnerEnvironment } from "./types.ts";

interface IdempotencyRecordDocument {
  _id?: ObjectId;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  operation: string;
  key: string;
  requestHash: string;
  state: "processing" | "completed" | "failed";
  responseStatus?: number;
  responseBody?: unknown;
  resourcePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  );
}

export function hashIdempotencyKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function hashCanonicalRequest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

export function requireIdempotencyKey(value: string | null): string {
  const key = value?.trim();
  if (!key) {
    throw partnerApiError(
      "idempotency_key_required",
      "Idempotency-Key is required",
      400,
    );
  }
  if (key.length < 8 || key.length > 200 || /[\u0000-\u001F\u007F]/.test(key)) {
    throw partnerApiError(
      "validation_failed",
      "Idempotency-Key must contain 8 to 200 safe characters",
      422,
    );
  }
  return key;
}

export type IdempotencyClaim =
  | { kind: "claimed"; record: IdempotencyRecordDocument & { _id: ObjectId } }
  | { kind: "processing"; record: IdempotencyRecordDocument & { _id: ObjectId } }
  | {
      kind: "completed";
      record: IdempotencyRecordDocument & { _id: ObjectId };
      responseStatus: number;
      responseBody: unknown;
    };

export async function claimIdempotency(input: {
  db: Db;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  operation: string;
  key: string;
  request: unknown;
  now?: Date;
}): Promise<IdempotencyClaim> {
  const now = input.now || new Date();
  const key = hashIdempotencyKey(input.key);
  const requestHash = hashCanonicalRequest(input.request);
  const record: IdempotencyRecordDocument & { _id: ObjectId } = {
    _id: new ObjectId(),
    organizationId: input.organizationId,
    apiClientId: input.apiClientId,
    environment: input.environment,
    operation: input.operation,
    key,
    requestHash,
    state: "processing",
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  };
  const collection = input.db.collection<IdempotencyRecordDocument>(
    "idempotency_records",
  );

  try {
    await collection.insertOne(record);
    return { kind: "claimed", record };
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) {
      throw error;
    }
  }

  const existing = await collection.findOne({
    apiClientId: input.apiClientId,
    environment: input.environment,
    operation: input.operation,
    key,
  });
  if (!existing?._id) {
    throw partnerApiError("request_in_progress", "Request is being processed", 409);
  }
  if (existing.requestHash !== requestHash) {
    throw partnerApiError(
      "idempotency_key_reused",
      "Idempotency-Key was already used with a different request",
      409,
    );
  }
  const typed = existing as IdempotencyRecordDocument & { _id: ObjectId };
  if (existing.state === "completed") {
    return {
      kind: "completed",
      record: typed,
      responseStatus: existing.responseStatus || 200,
      responseBody: existing.responseBody,
    };
  }
  if (existing.state === "failed") {
    const result = await collection.updateOne(
      { _id: existing._id, state: "failed" },
      { $set: { state: "processing", updatedAt: now } },
    );
    if (result.modifiedCount === 1) {
      return { kind: "claimed", record: { ...typed, state: "processing" } };
    }
  }
  return { kind: "processing", record: typed };
}

export async function completeIdempotency(input: {
  db: Db;
  recordId: ObjectId;
  responseStatus: number;
  responseBody: unknown;
  resourcePublicId?: string;
  now?: Date;
}): Promise<void> {
  await input.db.collection<IdempotencyRecordDocument>("idempotency_records").updateOne(
    { _id: input.recordId },
    {
      $set: {
        state: "completed",
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
        ...(input.resourcePublicId
          ? { resourcePublicId: input.resourcePublicId }
          : {}),
        updatedAt: input.now || new Date(),
      },
    },
  );
}

export async function failIdempotency(
  db: Db,
  recordId: ObjectId,
  now = new Date(),
): Promise<void> {
  await db.collection<IdempotencyRecordDocument>("idempotency_records").updateOne(
    { _id: recordId, state: "processing" },
    { $set: { state: "failed", updatedAt: now } },
  );
}
