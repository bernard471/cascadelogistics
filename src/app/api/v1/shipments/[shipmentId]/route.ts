import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { partnerShipmentUpdateSchema } from "@/lib/partner-platform/phase4-schemas";
import {
  getPartnerShipment,
  serializePartnerShipment,
  updatePartnerShipment,
} from "@/lib/partner-platform/partner-shipments";
import { parsePartnerJson } from "@/lib/partner-platform/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}",
      requiredScopes: ["shipments:read"],
      operation: "shipments:read",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const shipment = await getPartnerShipment({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
      });
      return { shipment: serializePartnerShipment(shipment) };
    },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}",
      requiredScopes: ["shipments:update"],
      operation: "shipments:update",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const data = await parsePartnerJson(request, partnerShipmentUpdateSchema);
      const shipment = await updatePartnerShipment({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
        data,
      });
      return { shipment: serializePartnerShipment(shipment) };
    },
  );
}
