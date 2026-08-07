import { partnerApiResult, handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { webhookEndpointCreateSchema } from "@/lib/partner-platform/phase7-schemas";
import { parsePartnerJson } from "@/lib/partner-platform/validation";
import {
  createWebhookEndpoint,
  listWebhookEndpoints,
} from "@/lib/partner-platform/webhook-endpoints";

export async function GET(request: Request) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/webhook-endpoints",
      requiredScopes: ["webhooks:manage"],
      operation: "webhooks:manage",
    },
    async ({ db, principal }) => listWebhookEndpoints({ db, principal }),
  );
}

export async function POST(request: Request) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/webhook-endpoints",
      requiredScopes: ["webhooks:manage"],
      operation: "webhooks:manage",
    },
    async ({ db, principal }) => {
      const data = await parsePartnerJson(request, webhookEndpointCreateSchema);
      return partnerApiResult(
        await createWebhookEndpoint({ db, principal, data }),
        201,
      );
    },
  );
}
