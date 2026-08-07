import { partnerApiResult, handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { replayWebhookDelivery } from "@/lib/partner-platform/webhook-delivery";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deliveryId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/webhook-deliveries/{deliveryId}/replay",
      requiredScopes: ["webhooks:manage"],
      operation: "webhooks:manage",
    },
    async ({ db, principal }) => {
      const { deliveryId } = await params;
      return partnerApiResult(
        await replayWebhookDelivery({
          db,
          principal,
          deliveryPublicId: deliveryId,
        }),
        202,
      );
    },
  );
}
