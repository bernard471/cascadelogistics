import { getPartnerInvoice } from "@/lib/partner-platform/financials";
import { handlePartnerApiRequest } from "@/lib/partner-platform/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/invoice",
      requiredScopes: ["invoices:read"],
      operation: "invoices:read",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const { invoice } = await getPartnerInvoice({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
      });
      return { invoice };
    },
  );
}
