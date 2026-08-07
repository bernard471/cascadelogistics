import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ensurePartnerCoreIndexes } from "@/lib/partner-platform/core-indexes";
import { PartnerApiError, partnerApiError } from "@/lib/partner-platform/errors";
import { resolvePartnerPortalSession } from "@/lib/partner-platform/portal-auth";
import { executePartnerPortalAction, getPartnerPortalConsole } from "@/lib/partner-platform/portal-console";
import { readPartnerPortalCookie } from "@/lib/partner-platform/portal-session";
import { partnerPortalActionSchema, partnerPortalEnvironmentSchema } from "@/lib/partner-platform/phase9-schemas";

async function context(request: Request) {
  const token = readPartnerPortalCookie(request.headers.get("cookie"));
  if (!token) throw partnerApiError("authentication_required", "Partner login required", 401);
  const client = await clientPromise; const db = client.db("guangzhou"); await ensurePartnerCoreIndexes(db);
  return { db, principal: await resolvePartnerPortalSession({ db, token }) };
}
function failure(error: unknown) {
  if (error instanceof PartnerApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Partner portal console failed", { error: error instanceof Error ? error.name : "unknown_error" });
  return NextResponse.json({ error: "Unable to complete partner portal request" }, { status: 500 });
}
export async function GET(request: Request) {
  try {
    const parsed = partnerPortalEnvironmentSchema.safeParse(new URL(request.url).searchParams.get("environment") || "test");
    if (!parsed.success) return NextResponse.json({ error: "Invalid environment" }, { status: 400 });
    return NextResponse.json(await getPartnerPortalConsole({ ...(await context(request)), environment: parsed.data }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const parsed = partnerPortalActionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid portal action" }, { status: 400 });
    return NextResponse.json(await executePartnerPortalAction({ ...(await context(request)), action: parsed.data }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
