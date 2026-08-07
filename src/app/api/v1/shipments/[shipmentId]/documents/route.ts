import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import {
  getPartnerShipment,
  listPartnerShipmentDocuments,
} from "@/lib/partner-platform/partner-shipments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/documents",
      requiredScopes: ["documents:read"],
      operation: "documents:read",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const shipment = await getPartnerShipment({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
      });
      return { documents: listPartnerShipmentDocuments(shipment) };
    },
  );
}
