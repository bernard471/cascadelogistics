import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ensurePartnerCoreIndexes } from "@/lib/partner-platform/core-indexes";
import { getPartnerPilotMonitoringSnapshot } from "@/lib/partner-platform/pilot-monitoring";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const client = await clientPromise;
    const db = client.db("guangzhou");
    await ensurePartnerCoreIndexes(db);
    const snapshot = await getPartnerPilotMonitoringSnapshot(db);
    return NextResponse.json(snapshot, {
      status: snapshot.pilots.some((pilot) => pilot.alerts.some((alert) => alert.severity === "critical")) ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Partner pilot monitor failed", { error: error instanceof Error ? error.name : "unknown_error" });
    return NextResponse.json({ error: "Unable to evaluate partner pilot monitoring" }, { status: 500 });
  }
}
