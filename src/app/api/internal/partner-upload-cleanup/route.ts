import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { cleanupAbandonedPartnerUploads } from "@/lib/partner-platform/uploads";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const client = await clientPromise;
    const result = await cleanupAbandonedPartnerUploads({
      db: client.db("guangzhou"),
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Partner upload cleanup failed" },
      { status: 500 },
    );
  }
}
