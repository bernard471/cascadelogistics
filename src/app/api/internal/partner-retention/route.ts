import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { cleanupPartnerOperationalData } from "@/lib/partner-platform/retention";

export const runtime = "nodejs"; export const maxDuration = 60;
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const client = await clientPromise; return NextResponse.json(await cleanupPartnerOperationalData(client.db("guangzhou"))); }
  catch (error) { console.error("Partner retention cleanup failed", { error: error instanceof Error ? error.name : "unknown_error" }); return NextResponse.json({ error: "Partner retention cleanup failed" }, { status: 500 }); }
}
