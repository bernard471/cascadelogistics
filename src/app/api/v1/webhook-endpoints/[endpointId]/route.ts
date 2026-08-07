import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { webhookEndpointUpdateSchema } from "@/lib/partner-platform/phase7-schemas";
import { parsePartnerJson } from "@/lib/partner-platform/validation";
import {
  deleteWebhookEndpoint,
  updateWebhookEndpoint,
} from "@/lib/partner-platform/webhook-endpoints";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/webhook-endpoints/{endpointId}",
      requiredScopes: ["webhooks:manage"],
      operation: "webhooks:manage",
    },
    async ({ db, principal }) => {
      const { endpointId } = await params;
      const data = await parsePartnerJson(request, webhookEndpointUpdateSchema);
      return updateWebhookEndpoint({
        db,
        principal,
        endpointPublicId: endpointId,
        data,
      });
    },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/webhook-endpoints/{endpointId}",
      requiredScopes: ["webhooks:manage"],
      operation: "webhooks:manage",
    },
    async ({ db, principal }) => {
      const { endpointId } = await params;
      return deleteWebhookEndpoint({
        db,
        principal,
        endpointPublicId: endpointId,
      });
    },
  );
}
