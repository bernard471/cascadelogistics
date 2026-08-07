import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ensurePartnerCoreIndexes } from "@/lib/partner-platform/core-indexes";
import { ensurePartnerSecurityIndexes } from "@/lib/partner-platform/security-indexes";
import { PartnerApiError } from "@/lib/partner-platform/errors";
import { authenticatePartnerPortalCredentials, resolvePartnerPortalSession } from "@/lib/partner-platform/portal-auth";
import { createPartnerPortalSessionToken, expiredPartnerPortalCookie, getPartnerPortalSessionSecret, partnerPortalCookie, readPartnerPortalCookie } from "@/lib/partner-platform/portal-session";
import { partnerPortalLoginSchema } from "@/lib/partner-platform/phase9-schemas";
import { consumePartnerPortalLoginLimit, MongoPartnerRateLimitStore } from "@/lib/partner-platform/rate-limit";
import { fingerprintSource } from "@/lib/partner-platform/redaction";

async function database() { const client = await clientPromise; const db = client.db("guangzhou"); await Promise.all([ensurePartnerCoreIndexes(db), ensurePartnerSecurityIndexes(db)]); return db; }
function sourceIp(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown"; }
function failure(error: unknown) {
  if (error instanceof PartnerApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Partner portal session failed", { error: error instanceof Error ? error.name : "unknown_error" });
  return NextResponse.json({ error: "Unable to complete partner login" }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const parsed = partnerPortalLoginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Organization, email and password are required" }, { status: 400 });
    const db = await database();
    await consumePartnerPortalLoginLimit({ store: new MongoPartnerRateLimitStore(db), sourceFingerprint: fingerprintSource(sourceIp(request), getPartnerPortalSessionSecret()) });
    const principal = await authenticatePartnerPortalCredentials({ db, ...parsed.data });
    const token = createPartnerPortalSessionToken({ userId: principal.userId, organizationId: principal.organizationId });
    await db.collection("partner_users").updateOne({ _id: new (await import("mongodb")).ObjectId(principal.userId) }, { $set: { lastLoginAt: new Date(), updatedAt: new Date() } });
    return NextResponse.json({ user: { name: principal.name, email: principal.email, role: principal.role }, organizationId: principal.organizationPublicId }, { headers: { "Set-Cookie": partnerPortalCookie(token), "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

export async function GET(request: Request) {
  try {
    const token = readPartnerPortalCookie(request.headers.get("cookie"));
    if (!token) return NextResponse.json({ error: "Partner login required" }, { status: 401 });
    const principal = await resolvePartnerPortalSession({ db: await database(), token });
    return NextResponse.json({ user: { id: principal.userPublicId, name: principal.name, email: principal.email, role: principal.role, mustChangePassword: principal.mustChangePassword }, organizationId: principal.organizationPublicId }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

export async function DELETE() {
  return NextResponse.json({ signedOut: true }, { headers: { "Set-Cookie": expiredPartnerPortalCookie(), "Cache-Control": "private, no-store" } });
}
