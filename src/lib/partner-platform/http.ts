import { NextResponse } from "next/server";
import type { Db } from "mongodb";
import clientPromise from "../mongodb";
import { parseBearerPartnerApiKey } from "./api-keys.ts";
import {
  authenticatePartnerApiRequest,
  type PartnerAuthenticationResult,
} from "./authentication.ts";
import { getPartnerApiKeyPepper } from "./credentials.ts";
import {
  PartnerApiError,
  partnerApiError,
  type PartnerApiErrorCode,
} from "./errors.ts";
import {
  generateRequestId,
  writePartnerRequestLog,
} from "./logging.ts";
import {
  getPartnerOperationBlock,
  type PartnerOperationName,
} from "./operation-controls.ts";
import {
  consumePartnerAuthenticationFailureLimit,
  consumePartnerRequestLimits,
  MongoPartnerRateLimitStore,
  type PartnerRateLimitResult,
} from "./rate-limit.ts";
import { fingerprintSource } from "./redaction.ts";
import type { PartnerApiScope } from "./scopes.ts";
import { ensurePartnerSecurityIndexes } from "./security-indexes.ts";
import { ensurePartnerCoreIndexes } from "./core-indexes.ts";
import { withPartnerSpan } from "./telemetry.ts";
import { assertPartnerRequestSize } from "./request-security.ts";

export interface PartnerApiRouteConfig {
  routeTemplate: string;
  requiredScopes?: readonly PartnerApiScope[];
  operation?: PartnerOperationName;
}

export interface PartnerApiRouteContext extends PartnerAuthenticationResult {
  requestId: string;
  db: Db;
}

export interface PartnerApiResult {
  readonly kind: "partner_api_result";
  readonly data: unknown;
  readonly status: number;
  readonly headers?: Record<string, string>;
}

export function partnerApiResult(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
): PartnerApiResult {
  return { kind: "partner_api_result", data, status, headers };
}

function sourceIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function errorTitle(code: PartnerApiErrorCode): string {
  return code
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function responseHeaders(input: {
  requestId: string;
  rateLimit?: PartnerRateLimitResult;
  retryAfterSeconds?: number;
  authenticate?: boolean;
}): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Request-Id": input.requestId,
  });
  if (input.rateLimit) {
    headers.set("X-RateLimit-Limit", String(input.rateLimit.limit));
    headers.set("X-RateLimit-Remaining", String(input.rateLimit.remaining));
    headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(input.rateLimit.resetAt.getTime() / 1000)),
    );
  }
  if (input.retryAfterSeconds) {
    headers.set("Retry-After", String(input.retryAfterSeconds));
  }
  if (input.authenticate) {
    headers.set("WWW-Authenticate", 'Bearer realm="Cascade Partner API"');
  }
  return headers;
}

export async function handlePartnerApiRequest(
  request: Request,
  config: PartnerApiRouteConfig,
  handler: (context: PartnerApiRouteContext) => Promise<unknown>,
): Promise<NextResponse> {
  return withPartnerSpan("partner.api.request", {
    "http.request.method": request.method,
    "http.route": config.routeTemplate,
    "cascade.partner.operation": config.operation || "api_access",
  }, () => handlePartnerApiRequestInner(request, config, handler));
}

async function handlePartnerApiRequestInner(
  request: Request,
  config: PartnerApiRouteConfig,
  handler: (context: PartnerApiRouteContext) => Promise<unknown>,
): Promise<NextResponse> {
  const startedAt = Date.now();
  const requestId = generateRequestId();
  let status = 500;
  let errorCode: PartnerApiErrorCode | undefined;
  let authentication: PartnerAuthenticationResult | undefined;
  let rateLimit: PartnerRateLimitResult | undefined;
  let rateLimitOutcome: "allowed" | "denied" | "not_checked" = "not_checked";
  const parsedKey = parseBearerPartnerApiKey(
    request.headers.get("authorization"),
  );
  let database: Db | undefined;

  try {
    const client = await clientPromise;
    const db = client.db("guangzhou");
    database = db;
    assertPartnerRequestSize(request);
    await Promise.all([
      ensurePartnerSecurityIndexes(db),
      ensurePartnerCoreIndexes(db),
    ]);
    const pepper = getPartnerApiKeyPepper();
    const authenticated = await withPartnerSpan("partner.api.authenticate", {
      "cascade.partner.route": config.routeTemplate,
    }, () => authenticatePartnerApiRequest({
      db,
      authorization: request.headers.get("authorization"),
      requiredScopes: config.requiredScopes,
      sourceIp: sourceIp(request),
      pepper,
    }));
    authentication = authenticated;
    const rateStore = new MongoPartnerRateLimitStore(db);
    rateLimit = await withPartnerSpan("partner.api.authorize", {
      "cascade.partner.environment": authenticated.principal.environment,
    }, () => consumePartnerRequestLimits({
      store: rateStore,
      organization: authenticated.organization,
      apiClient: authenticated.apiClient,
      environment: authenticated.principal.environment,
    }));
    rateLimitOutcome = "allowed";

    const operation = config.operation || "api_access";
    const operations: PartnerOperationName[] =
      operation === "api_access" ? ["api_access"] : [operation, "api_access"];
    let block = null;
    for (const candidate of operations) {
      block = await getPartnerOperationBlock({
        db,
        principal: authenticated.principal,
        operation: candidate,
      });
      if (block) break;
    }
    if (block) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((block.pausedUntil.getTime() - Date.now()) / 1000),
      );
      throw partnerApiError(
        "operation_paused",
        block.message,
        503,
        retryAfterSeconds,
      );
    }

    const handlerResult = await withPartnerSpan("partner.api.operation", {
      "cascade.partner.operation": config.operation || "api_access",
      "cascade.partner.environment": authenticated.principal.environment,
    }, () => handler({ ...authenticated, requestId, db }));
    if (handlerResult instanceof NextResponse) {
      status = handlerResult.status;
      const headers = responseHeaders({ requestId, rateLimit });
      headers.forEach((value, key) => handlerResult.headers.set(key, value));
      return handlerResult;
    }
    const result =
      handlerResult &&
      typeof handlerResult === "object" &&
      "kind" in handlerResult &&
      handlerResult.kind === "partner_api_result"
        ? (handlerResult as PartnerApiResult)
        : partnerApiResult(handlerResult);
    status = result.status;
    const headers = responseHeaders({ requestId, rateLimit });
    Object.entries(result.headers || {}).forEach(([key, value]) =>
      headers.set(key, value),
    );
    return NextResponse.json(
      { data: result.data, meta: { requestId } },
      { status, headers },
    );
  } catch (caught) {
    let error =
      caught instanceof PartnerApiError
        ? caught
        : partnerApiError("internal_error", "An internal error occurred", 500);
    if (!(caught instanceof PartnerApiError)) {
      console.error("Partner API internal error", {
        requestId,
        routeTemplate: config.routeTemplate,
      });
    }

    if (["authentication_required", "invalid_api_key"].includes(error.code)) {
      try {
        const client = await clientPromise;
        const db = client.db("guangzhou");
        const pepper = getPartnerApiKeyPepper();
        await consumePartnerAuthenticationFailureLimit({
          store: new MongoPartnerRateLimitStore(db),
          sourceFingerprint: fingerprintSource(sourceIp(request), pepper),
        });
      } catch (rateError) {
        if (rateError instanceof PartnerApiError) error = rateError;
      }
    }
    status = error.status;
    errorCode = error.code;
    if (error.code === "rate_limit_exceeded") rateLimitOutcome = "denied";
    return NextResponse.json(
      {
        type: `https://cascadelogistics.vercel.app/problems/${error.code}`,
        title: errorTitle(error.code),
        status: error.status,
        code: error.code,
        detail: error.message,
        requestId,
      },
      {
        status,
        headers: responseHeaders({
          requestId,
          rateLimit,
          retryAfterSeconds: error.retryAfterSeconds,
          authenticate: error.status === 401,
        }),
      },
    );
  } finally {
    if (database) {
      const db = database;
      const pepper = process.env.PARTNER_API_KEY_PEPPER;
      try {
        await writePartnerRequestLog(db, {
          requestId,
          organizationId: authentication?.organization._id,
          apiClientId: authentication?.apiClient._id,
          credentialPrefix:
            authentication?.credential.keyPrefix || parsedKey?.keyPrefix,
          environment:
            authentication?.principal.environment || parsedKey?.environment,
          method: request.method,
          routeTemplate: config.routeTemplate,
          responseStatus: status,
          errorCode,
          durationMs: Date.now() - startedAt,
          rateLimitOutcome,
          sourceFingerprint:
            pepper && pepper.length >= 32
              ? fingerprintSource(sourceIp(request), pepper)
              : undefined,
          userAgent: request.headers.get("user-agent") || undefined,
          correlationId:
            request.headers.get("x-cascade-correlation-id") || undefined,
        });
      } catch {
        console.error("Partner API request log failed", { requestId });
      }
    }
  }
}
