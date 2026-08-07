import { ensurePartnerCoreIndexes } from "@/lib/partner-platform/core-indexes";
import { handlePartnerApiRequest, partnerApiResult } from "@/lib/partner-platform/http";
import { partnerUploadIntentSchema } from "@/lib/partner-platform/phase4-schemas";
import { createPartnerUploadIntents } from "@/lib/partner-platform/uploads";
import { parsePartnerJson } from "@/lib/partner-platform/validation";

export async function POST(request: Request) {
  return handlePartnerApiRequest(
    request,
    {
      routeTemplate: "/api/v1/uploads",
      requiredScopes: ["documents:write"],
      operation: "documents:write",
    },
    async ({ db, principal, organization }) => {
      await ensurePartnerCoreIndexes(db);
      const data = await parsePartnerJson(request, partnerUploadIntentSchema);
      const result = await createPartnerUploadIntents({
        db,
        principal,
        organization,
        data,
      });
      return partnerApiResult(result, 201);
    },
  );
}
