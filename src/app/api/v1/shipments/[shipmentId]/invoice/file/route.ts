import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { partnerApiError } from "@/lib/partner-platform/errors";
import { getPartnerInvoice } from "@/lib/partner-platform/financials";
import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import {
  getTrustedVercelBlobAccessKind,
  safeDownloadFileName,
} from "@/lib/shipments/private-files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/invoice/file",
      requiredScopes: ["invoices:read"],
      operation: "invoices:read",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const { shipment } = await getPartnerInvoice({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
      });
      const invoice = shipment.invoice;
      if (!invoice || getTrustedVercelBlobAccessKind(invoice.url) !== "private") {
        throw partnerApiError("resource_not_found", "Invoice not found", 404);
      }
      const blob = await get(invoice.url, { access: "private" });
      if (!blob || blob.statusCode !== 200) {
        throw partnerApiError("resource_not_found", "Invoice not found", 404);
      }
      const download = new URL(request.url).searchParams.get("download") === "1";
      return new NextResponse(blob.stream, {
        status: 200,
        headers: {
          "Content-Type": blob.blob.contentType || "application/pdf",
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeDownloadFileName(invoice.fileName)}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    },
  );
}
