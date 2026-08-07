import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { buildPartnerIdentityResponse } from "@/lib/partner-platform/identity";

export async function GET(request: Request) {
  return handlePartnerApiRequest(
    request,
    { routeTemplate: "/api/v1/me", operation: "api_access" },
    async (authentication) => buildPartnerIdentityResponse(authentication),
  );
}
