import type { Db } from "mongodb";
import { partnerApiError } from "./errors.ts";
import type {
  ApiClientDocument,
  OrganizationDocument,
  PartnerEnvironment,
} from "./types.ts";

export interface PartnerRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface PartnerRateLimitStore {
  consume(input: {
    key: string;
    limit: number;
    windowMs: number;
    now: Date;
  }): Promise<PartnerRateLimitResult>;
}

export class MongoPartnerRateLimitStore implements PartnerRateLimitStore {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async consume(input: {
    key: string;
    limit: number;
    windowMs: number;
    now: Date;
  }): Promise<PartnerRateLimitResult> {
    const bucket = Math.floor(input.now.getTime() / input.windowMs);
    const id = `${input.key}:${bucket}`;
    const resetAt = new Date((bucket + 1) * input.windowMs);
    const result = await this.db
      .collection<{ _id: string; count: number; expiresAt: Date }>(
        "partner_rate_limits",
      )
      .findOneAndUpdate(
        { _id: id },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date(resetAt.getTime() + 60_000) },
        },
        { upsert: true, returnDocument: "after" },
      );
    const count = result?.count || 0;
    return {
      allowed: count <= input.limit,
      limit: input.limit,
      remaining: Math.max(0, input.limit - count),
      resetAt,
    };
  }
}

export async function consumePartnerRequestLimits(input: {
  store: PartnerRateLimitStore;
  organization: OrganizationDocument;
  apiClient: ApiClientDocument;
  environment: PartnerEnvironment;
  now?: Date;
}): Promise<PartnerRateLimitResult> {
  const now = input.now || new Date();
  const windowMs = 60_000;
  const organizationLimit = input.organization.limits.requestsPerMinute;
  const applicationLimit = Math.min(
    input.apiClient.requestsPerMinute || organizationLimit,
    organizationLimit,
  );
  const organizationId = input.organization._id?.toString();
  const applicationId = input.apiClient._id?.toString();
  const [organizationResult, applicationResult] = await Promise.all([
    input.store.consume({
      key: `partner:organization:${organizationId}:${input.environment}`,
      limit: organizationLimit,
      windowMs,
      now,
    }),
    input.store.consume({
      key: `partner:application:${applicationId}:${input.environment}`,
      limit: applicationLimit,
      windowMs,
      now,
    }),
  ]);
  const result =
    organizationResult.remaining <= applicationResult.remaining
      ? organizationResult
      : applicationResult;

  if (!organizationResult.allowed || !applicationResult.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000),
    );
    throw partnerApiError(
      "rate_limit_exceeded",
      "Rate limit exceeded",
      429,
      retryAfterSeconds,
    );
  }
  return result;
}

export async function consumePartnerAuthenticationFailureLimit(input: {
  store: PartnerRateLimitStore;
  sourceFingerprint: string;
  now?: Date;
}): Promise<PartnerRateLimitResult> {
  const now = input.now || new Date();
  const result = await input.store.consume({
    key: `partner:authentication-failure:${input.sourceFingerprint}`,
    limit: 20,
    windowMs: 5 * 60_000,
    now,
  });
  if (!result.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000),
    );
    throw partnerApiError(
      "rate_limit_exceeded",
      "Too many authentication attempts",
      429,
      retryAfterSeconds,
    );
  }
  return result;
}

export async function consumePartnerPortalLoginLimit(input: {
  store: PartnerRateLimitStore;
  sourceFingerprint: string;
  now?: Date;
}): Promise<PartnerRateLimitResult> {
  const now = input.now || new Date();
  const result = await input.store.consume({
    key: `partner:portal-login:${input.sourceFingerprint}`,
    limit: 10,
    windowMs: 5 * 60_000,
    now,
  });
  if (!result.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000),
    );
    throw partnerApiError(
      "rate_limit_exceeded",
      "Too many partner portal login attempts",
      429,
      retryAfterSeconds,
    );
  }
  return result;
}
