export const partnerPlatformEnvironmentVariable = "PARTNER_PLATFORM_ENABLED";

export function isPartnerPlatformEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return environment[partnerPlatformEnvironmentVariable]?.trim().toLowerCase() === "true";
}
