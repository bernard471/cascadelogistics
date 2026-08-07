import { ensurePartnerCoreIndexes } from "@/lib/partner-platform/core-indexes";
import { partnerApiError } from "@/lib/partner-platform/errors";
import { partnerApiResult, handlePartnerApiRequest } from "@/lib/partner-platform/http";
import { requireIdempotencyKey } from "@/lib/partner-platform/idempotency";
import {
  partnerShipmentCreateSchema,
  partnerShipmentListSchema,
} from "@/lib/partner-platform/phase4-schemas";
import {
  createPartnerShipment,
  listPartnerShipments,
} from "@/lib/partner-platform/partner-shipments";
import {
  parsePartnerJson,
  parsePartnerQuery,
} from "@/lib/partner-platform/validation";

export async function POST(request: Request) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments",
      requiredScopes: ["shipments:create"],
      operation: "shipments:create",
    },
    async ({ db, principal, organization }) => {
      await ensurePartnerCoreIndexes(db);
      const idempotencyKey = requireIdempotencyKey(
        request.headers.get("idempotency-key"),
      );
      const data = await parsePartnerJson(request, partnerShipmentCreateSchema);
      if (
        data.uploadIds.length > 0 &&
        !principal.scopes.includes("documents:write")
      ) {
        throw partnerApiError(
          "insufficient_scope",
          "documents:write is required when attaching uploads",
          403,
        );
      }
      const result = await createPartnerShipment({
        db,
        principal,
        organization,
        data,
        idempotencyKey,
      });
      return partnerApiResult(result.body, result.status, {
        "Idempotency-Replayed": result.replayed ? "true" : "false",
      });
    },
  );
}

export async function GET(request: Request) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/shipments",
      requiredScopes: ["shipments:read"],
      operation: "shipments:read",
    },
    async ({ db, principal, organization }) => {
      const query = parsePartnerQuery(request, partnerShipmentListSchema);
      return listPartnerShipments({ db, principal, organization, query });
    },
  );
}
