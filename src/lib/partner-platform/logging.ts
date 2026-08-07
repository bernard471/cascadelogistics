import type { Db, ObjectId } from "mongodb";
import { generatePublicId } from "./public-id.ts";
import { sanitizeLogText } from "./redaction.ts";
import type { PartnerApiErrorCode } from "./errors.ts";
import type { PartnerEnvironment } from "./types.ts";

export interface PartnerRequestLogInput {
  requestId: string;
  organizationId?: ObjectId;
  apiClientId?: ObjectId;
  credentialPrefix?: string;
  environment?: PartnerEnvironment;
  method: string;
  routeTemplate: string;
  responseStatus: number;
  errorCode?: PartnerApiErrorCode;
  durationMs: number;
  rateLimitOutcome?: "allowed" | "denied" | "not_checked";
  sourceFingerprint?: string;
  userAgent?: string;
  correlationId?: string;
  now?: Date;
}

export function generateRequestId(): string {
  return generatePublicId("request");
}

export async function writePartnerRequestLog(
  db: Db,
  input: PartnerRequestLogInput,
): Promise<void> {
  const now = input.now || new Date();
  await db.collection("api_request_logs").insertOne({
    requestId: input.requestId,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    ...(input.apiClientId ? { apiClientId: input.apiClientId } : {}),
    ...(input.credentialPrefix
      ? { credentialPrefix: sanitizeLogText(input.credentialPrefix, 80) }
      : {}),
    ...(input.environment ? { environment: input.environment } : {}),
    method: sanitizeLogText(input.method, 12),
    routeTemplate: sanitizeLogText(input.routeTemplate, 160),
    responseStatus: input.responseStatus,
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    durationMs: Math.max(0, Math.round(input.durationMs)),
    rateLimitOutcome: input.rateLimitOutcome || "not_checked",
    ...(input.sourceFingerprint
      ? { sourceIp: input.sourceFingerprint }
      : {}),
    ...(input.userAgent
      ? { userAgent: sanitizeLogText(input.userAgent, 300) }
      : {}),
    ...(input.correlationId
      ? { correlationId: sanitizeLogText(input.correlationId, 100) }
      : {}),
    createdAt: now,
    expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
  });
}
