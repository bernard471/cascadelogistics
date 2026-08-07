export const partnerApiScopes = [
  "shipments:create",
  "shipments:read",
  "shipments:update",
  "shipments:cancel",
  "tracking:read",
  "documents:read",
  "documents:write",
  "invoices:read",
  "payments:read",
  "payments:write",
  "webhooks:manage",
] as const;

export type PartnerApiScope = (typeof partnerApiScopes)[number];

export function normalizePartnerScopes(scopes: readonly string[]): PartnerApiScope[] {
  const allowed = new Set<string>(partnerApiScopes);
  return [...new Set(scopes)].filter((scope): scope is PartnerApiScope =>
    allowed.has(scope),
  );
}

export function hasRequiredPartnerScopes(
  grantedScopes: readonly string[],
  requiredScopes: readonly PartnerApiScope[],
): boolean {
  const granted = new Set(grantedScopes);
  return requiredScopes.every((scope) => granted.has(scope));
}
