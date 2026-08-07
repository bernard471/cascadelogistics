import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { webhookDeliveryListSchema } from "@/lib/partner-platform/phase7-schemas";
import { parsePartnerQuery } from "@/lib/partner-platform/validation";
import { listWebhookDeliveries } from "@/lib/partner-platform/webhook-delivery";

export async function GET(request: Request) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/webhook-deliveries",
      requiredScopes: ["webhooks:manage"],
      operation: "webhooks:manage",
    },
    async ({ db, principal }) => {
      const query = parsePartnerQuery(request, webhookDeliveryListSchema);
      return listWebhookDeliveries({
        db,
        principal,
        endpointPublicId: query.endpointId,
        status: query.status,
        limit: query.limit,
      });
    },
  );
}
