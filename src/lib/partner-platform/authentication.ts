import type { Db } from "mongodb";
import type { PartnerShipmentPrincipal } from "../shipments/principals.ts";
import {
  digestPartnerApiSecret,
  parseBearerPartnerApiKey,
  verifyPartnerApiSecret,
} from "./api-keys.ts";
import { getPartnerApiKeyPepper } from "./credentials.ts";
import { partnerApiError } from "./errors.ts";
import { fingerprintSource } from "./redaction.ts";
import { hasRequiredPartnerScopes, normalizePartnerScopes, type PartnerApiScope } from "./scopes.ts";
import type {
  ApiClientDocument,
  ApiCredentialDocument,
  OrganizationDocument,
} from "./types.ts";

export interface PartnerAuthenticationResult {
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  apiClient: ApiClientDocument;
  credential: ApiCredentialDocument;
}

export async function authenticatePartnerApiRequest(input: {
  db: Db;
  authorization: string | null;
  requiredScopes?: readonly PartnerApiScope[];
  sourceIp?: string;
  pepper?: string;
  now?: Date;
}): Promise<PartnerAuthenticationResult> {
  if (!input.authorization) {
    throw partnerApiError(
      "authentication_required",
      "A Bearer API key is required",
      401,
    );
  }
  const parsed = parseBearerPartnerApiKey(input.authorization);
  if (!parsed) {
    throw partnerApiError("invalid_api_key", "Invalid API key", 401);
  }

  const credential = await input.db
    .collection<ApiCredentialDocument>("api_credentials")
    .findOne({ keyPrefix: parsed.keyPrefix });
  const pepper = input.pepper || getPartnerApiKeyPepper();
  const storedHash =
    credential?.secretHash ||
    digestPartnerApiSecret(parsed.keyPrefix, "0".repeat(43), pepper);
  const secretMatches = verifyPartnerApiSecret({
    keyPrefix: parsed.keyPrefix,
    secret: parsed.secret,
    storedHash,
    pepper,
  });
  if (
    !credential ||
    !secretMatches ||
    credential.environment !== parsed.environment
  ) {
    throw partnerApiError("invalid_api_key", "Invalid API key", 401);
  }

  const now = input.now || new Date();
  if (credential.status === "revoked") {
    throw partnerApiError("api_key_revoked", "API key has been revoked", 401);
  }
  if (
    credential.status === "expired" ||
    (credential.expiresAt && credential.expiresAt.getTime() <= now.getTime())
  ) {
    throw partnerApiError("api_key_expired", "API key has expired", 401);
  }

  const [organization, apiClient] = await Promise.all([
    input.db
      .collection<OrganizationDocument>("organizations")
      .findOne({ _id: credential.organizationId }),
    input.db.collection<ApiClientDocument>("api_clients").findOne({
      _id: credential.apiClientId,
      organizationId: credential.organizationId,
    }),
  ]);
  if (!organization || !apiClient) {
    throw partnerApiError("invalid_api_key", "Invalid API key", 401);
  }
  if (organization.status !== "active" || apiClient.status !== "active") {
    throw partnerApiError(
      "integration_suspended",
      "This integration is not active",
      403,
    );
  }
  if (!apiClient.environmentAccess.includes(credential.environment)) {
    throw partnerApiError("invalid_api_key", "Invalid API key", 401);
  }

  const applicationScopes = new Set(apiClient.scopes);
  const scopes = normalizePartnerScopes(credential.scopes).filter((scope) =>
    applicationScopes.has(scope),
  );
  const requiredScopes = input.requiredScopes || [];
  if (!hasRequiredPartnerScopes(scopes, requiredScopes)) {
    throw partnerApiError(
      "insufficient_scope",
      "The API key does not grant the required scope",
      403,
    );
  }

  const sourceFingerprint = input.sourceIp
    ? fingerprintSource(input.sourceIp, pepper)
    : undefined;
  await input.db.collection<ApiCredentialDocument>("api_credentials").updateOne(
    { _id: credential._id, status: "active" },
    {
      $set: {
        lastUsedAt: now,
        ...(sourceFingerprint ? { lastUsedIp: sourceFingerprint } : {}),
      },
    },
  );

  return {
    principal: {
      kind: "partner_api",
      organizationId: credential.organizationId.toString(),
      apiClientId: credential.apiClientId.toString(),
      credentialId: credential._id?.toString() || credential.publicId,
      environment: credential.environment,
      scopes,
    },
    organization,
    apiClient,
    credential,
  };
}
