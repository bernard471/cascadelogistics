import { z } from "zod";
import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import {
  cancelPartnerShipment,
  serializePartnerShipment,
} from "@/lib/partner-platform/partner-shipments";
import { parsePartnerJson } from "@/lib/partner-platform/validation";

const cancelSchema = z
  .object({ reason: z.string().trim().min(1).max(250).optional() })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/cancel",
      requiredScopes: ["shipments:cancel"],
      operation: "shipments:cancel",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const data = await parsePartnerJson(request, cancelSchema);
      const shipment = await cancelPartnerShipment({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
        reason: data.reason,
      });
      return { shipment: serializePartnerShipment(shipment) };
    },
  );
}
