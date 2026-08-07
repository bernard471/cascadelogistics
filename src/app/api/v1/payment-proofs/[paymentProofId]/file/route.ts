import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { partnerApiError } from "@/lib/partner-platform/errors";
import {
  getPartnerPaymentProof,
  getPartnerPaymentProofFile,
} from "@/lib/partner-platform/financials";
import { handlePartnerApiRequest } from "@/lib/partner-platform/http";
import {
  getTrustedVercelBlobAccessKind,
  safeDownloadFileName,
} from "@/lib/shipments/private-files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentProofId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/payment-proofs/{paymentProofId}/file",
      requiredScopes: ["payments:read"],
      operation: "payments:read",
    },
    async ({ db, principal, organization }) => {
      const { paymentProofId } = await params;
      const payment = await getPartnerPaymentProof({
        db,
        principal,
        organization,
        paymentProofPublicId: paymentProofId,
      });
      const fileId = new URL(request.url).searchParams.get("fileId");
      const proof = getPartnerPaymentProofFile(payment, fileId);
      if (getTrustedVercelBlobAccessKind(proof.url as string) !== "private") {
        throw partnerApiError("resource_not_found", "Payment proof file not found", 404);
      }
      const blob = await get(proof.url as string, { access: "private" });
      if (!blob || blob.statusCode !== 200) {
        throw partnerApiError("resource_not_found", "Payment proof file not found", 404);
      }
      const download = new URL(request.url).searchParams.get("download") === "1";
      return new NextResponse(blob.stream, {
        status: 200,
        headers: {
          "Content-Type": blob.blob.contentType || proof.type || "application/octet-stream",
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeDownloadFileName(proof.name)}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    },
  );
}
