import { partnerApiResult, handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { queueWebhookTestEvent } from "@/lib/partner-platform/webhook-endpoints";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ endpointId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/webhook-endpoints/{endpointId}/test",
      requiredScopes: ["webhooks:manage"],
      operation: "webhooks:manage",
    },
    async ({ db, principal }) => {
      const { endpointId } = await params;
      return partnerApiResult(
        await queueWebhookTestEvent({
          db,
          principal,
          endpointPublicId: endpointId,
        }),
        202,
      );
    },
  );
}
