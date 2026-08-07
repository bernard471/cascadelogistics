import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import {
  getPartnerShipment,
  serializePartnerShipment,
} from "@/lib/partner-platform/partner-shipments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/timeline",
      requiredScopes: ["tracking:read"],
      operation: "tracking:read",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const shipment = await getPartnerShipment({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
      });
      return {
        shipmentId: shipment.publicId,
        trackingId: shipment.trackingId,
        timeline: serializePartnerShipment(shipment).timeline,
      };
    },
  );
}
