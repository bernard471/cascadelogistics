import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { partnerApiError } from "@/lib/partner-platform/errors";
import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import {
  deletePartnerShipmentDocument,
  getPartnerShipment,
  getPartnerShipmentDocument,
} from "@/lib/partner-platform/partner-shipments";
import { safeDownloadFileName } from "@/lib/shipments/private-files";

export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ shipmentId: string; documentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/documents/{documentId}",
      requiredScopes: ["documents:read"],
      operation: "documents:read",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId, documentId } = await params;
      const shipment = await getPartnerShipment({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
      });
      const document = getPartnerShipmentDocument(shipment, documentId);
      const blob = await get(document.url as string, { access: "private" });
      if (!blob || blob.statusCode !== 200) {
        throw partnerApiError("resource_not_found", "Document not found", 404);
      }
      const download = new URL(request.url).searchParams.get("download") === "1";
      return new NextResponse(blob.stream, {
        status: 200,
        headers: {
          "Content-Type":
            blob.blob.contentType || document.type || "application/octet-stream",
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeDownloadFileName(document.name)}"`,
          "Cache-Control": "private, no-store",
        },
      });
    },
  );
}

export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ shipmentId: string; documentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/documents/{documentId}",
      requiredScopes: ["documents:write"],
      operation: "documents:write",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId, documentId } = await params;
      return deletePartnerShipmentDocument({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
        documentPublicId: documentId,
      });
    },
  );
}
