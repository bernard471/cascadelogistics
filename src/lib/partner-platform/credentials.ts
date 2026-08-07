import { ObjectId, type Db } from "mongodb";
import type { InternalShipmentPrincipal } from "../shipments/principals.ts";
import { generatePartnerApiKey } from "./api-keys.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import { PartnerApiError, partnerApiError } from "./errors.ts";
import { createApiCredential } from "./repositories.ts";
import { normalizePartnerScopes, type PartnerApiScope } from "./scopes.ts";
import type {
  ApiClientDocument,
  ApiCredentialDocument,
  OrganizationDocument,
  PartnerEnvironment,
} from "./types.ts";

function requireSuperAdmin(
  principal: InternalShipmentPrincipal,
): void {
  if (principal.role !== "super_admin") {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
}

function requireObjectId(value: string, label: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw partnerApiError("validation_failed", `Invalid ${label}`, 422);
  }
  return new ObjectId(value);
}

export function getPartnerApiKeyPepper(): string {
  const pepper = process.env.PARTNER_API_KEY_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error(
      "PARTNER_API_KEY_PEPPER must be configured with at least 32 characters",
    );
  }
  return pepper;
}

export async function issuePartnerApiCredential(input: {
  db: Db;
  principal: InternalShipmentPrincipal;
  organizationId: string;
  apiClientId: string;
  environment: PartnerEnvironment;
  scopes: readonly string[];
  expiresAt?: Date;
  pepper?: string;
  now?: Date;
}) {
  requireSuperAdmin(input.principal);
  const organizationId = requireObjectId(input.organizationId, "organization ID");
  const apiClientId = requireObjectId(input.apiClientId, "application ID");
  const [organization, apiClient] = await Promise.all([
    input.db
      .collection<OrganizationDocument>("organizations")
      .findOne({ _id: organizationId }),
    input.db.collection<ApiClientDocument>("api_clients").findOne({
      _id: apiClientId,
      organizationId,
    }),
  ]);

  if (!organization || !apiClient) {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
  if (!apiClient.environmentAccess.includes(input.environment)) {
    throw partnerApiError(
      "validation_failed",
      "Application is not enabled for this environment",
      422,
    );
  }

  const scopes = normalizePartnerScopes(input.scopes);
  if (scopes.length !== new Set(input.scopes).size) {
    throw partnerApiError("validation_failed", "Invalid API scope", 422);
  }
  const applicationScopes = new Set(apiClient.scopes);
  if (scopes.some((scope) => !applicationScopes.has(scope))) {
    throw partnerApiError(
      "validation_failed",
      "Credential scope exceeds application permissions",
      422,
    );
  }

  const now = input.now || new Date();
  if (input.expiresAt && input.expiresAt.getTime() <= now.getTime()) {
    throw partnerApiError(
      "validation_failed",
      "Credential expiry must be in the future",
      422,
    );
  }
  const generated = generatePartnerApiKey(
    input.environment,
    input.pepper || getPartnerApiKeyPepper(),
  );
  const credential = await createApiCredential(
    input.db,
    organizationId,
    apiClientId,
    {
      environment: input.environment,
      keyPrefix: generated.keyPrefix,
      secretHash: generated.secretHash,
      scopes,
      expiresAt: input.expiresAt,
      createdBy: input.principal.userId,
    },
    now,
  );

  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin",
    actorId: input.principal.userId,
    action: "api_credential_issued",
    organizationId,
    apiClientId,
    credentialId: credential._id,
    targetPublicId: credential.publicId,
    metadata: {
      environment: credential.environment,
      scopes: credential.scopes,
      expiresAt: credential.expiresAt?.toISOString(),
      keyPrefix: credential.keyPrefix,
    },
    createdAt: now,
  });

  return {
    apiKey: generated.apiKey,
    credential: {
      publicId: credential.publicId,
      keyPrefix: credential.keyPrefix,
      environment: credential.environment,
      scopes: credential.scopes as PartnerApiScope[],
      status: credential.status,
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
    },
  };
}

export async function revokePartnerApiCredential(input: {
  db: Db;
  principal: InternalShipmentPrincipal;
  organizationId: string;
  credentialPublicId: string;
  reason?: string;
  now?: Date;
}): Promise<void> {
  requireSuperAdmin(input.principal);
  const organizationId = requireObjectId(input.organizationId, "organization ID");
  const now = input.now || new Date();
  const collection = input.db.collection<ApiCredentialDocument>("api_credentials");
  const credential = await collection.findOne({
    publicId: input.credentialPublicId,
    organizationId,
  });
  if (!credential) {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }

  await collection.updateOne(
    { _id: credential._id, organizationId },
    {
      $set: {
        status: "revoked",
        revokedAt: now,
        revokedBy: input.principal.userId,
        revokeReason: input.reason?.trim().slice(0, 250),
      },
    },
  );
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin",
    actorId: input.principal.userId,
    action: "api_credential_revoked",
    organizationId,
    apiClientId: credential.apiClientId,
    credentialId: credential._id,
    targetPublicId: credential.publicId,
    metadata: { reason: input.reason?.trim().slice(0, 250) },
    createdAt: now,
  });
}

export function isPartnerApiError(value: unknown): value is PartnerApiError {
  return value instanceof PartnerApiError;
}
