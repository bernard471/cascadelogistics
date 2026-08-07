import type { PartnerAuthenticationResult } from "./authentication.ts";

export function buildPartnerIdentityResponse(
  authentication: PartnerAuthenticationResult,
) {
  return {
    organization: {
      id: authentication.organization.publicId,
      name: authentication.organization.name,
    },
    application: {
      id: authentication.apiClient.publicId,
      name: authentication.apiClient.name,
    },
    environment: authentication.principal.environment,
    scopes: authentication.principal.scopes,
  };
}
