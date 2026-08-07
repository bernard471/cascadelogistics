import {
  createPartnerPaymentProof,
  listPartnerPaymentProofs,
} from "@/lib/partner-platform/financials";
import {
  handlePartnerApiRequest,
  partnerApiResult,
} from "@/lib/partner-platform/http";
import { requireIdempotencyKey } from "@/lib/partner-platform/idempotency";
import { partnerPaymentProofCreateSchema } from "@/lib/partner-platform/phase6-schemas";
import { parsePartnerJson } from "@/lib/partner-platform/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/payment-proofs",
      requiredScopes: ["payments:write", "documents:write"],
      operation: "payments:write",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      const data = await parsePartnerJson(request, partnerPaymentProofCreateSchema);
      const result = await createPartnerPaymentProof({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
        data,
        idempotencyKey: requireIdempotencyKey(
          request.headers.get("idempotency-key"),
        ),
      });
      return partnerApiResult(result.body, result.status, {
        "Idempotent-Replayed": result.replay ? "true" : "false",
      });
    },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments/{shipmentId}/payment-proofs",
      requiredScopes: ["payments:read"],
      operation: "payments:read",
    },
    async ({ db, principal, organization }) => {
      const { shipmentId } = await params;
      return listPartnerPaymentProofs({
        db,
        principal,
        organization,
        shipmentPublicId: shipmentId,
      });
    },
  );
}
