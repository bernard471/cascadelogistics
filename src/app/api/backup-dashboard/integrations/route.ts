import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ensurePartnerCoreIndexes } from "@/lib/partner-platform/core-indexes";
import { PartnerApiError } from "@/lib/partner-platform/errors";
import { superAdminIntegrationActionSchema } from "@/lib/partner-platform/phase8-schemas";
import {
  executeSuperAdminIntegrationAction,
  getSuperAdminIntegrationConsole,
} from "@/lib/partner-platform/super-admin-console";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";

async function context() {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") return null;
  const principal = shipmentPrincipalFromSessionUser(session.user);
  if (principal.kind !== "internal" || principal.role !== "super_admin") return null;
  const client = await clientPromise;
  const db = client.db("guangzhou");
  await ensurePartnerCoreIndexes(db);
  return { db, principal };
}

export async function GET() {
  try {
    const authorized = await context();
    if (!authorized) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      await getSuperAdminIntegrationConsole(authorized),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Super-admin integration console read failed", {
      error: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json(
      { error: "Unable to load integration console" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await context();
    if (!authorized) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
    const parsed = superAdminIntegrationActionSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid integration action" },
        { status: 400 },
      );
    }
    const result = await executeSuperAdminIntegrationAction({
      ...authorized,
      action: parsed.data,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Super-admin integration console mutation failed", {
      error: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json(
      { error: "Unable to update integration configuration" },
      { status: 500 },
    );
  }
}
