import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ensurePartnerCoreIndexes } from "@/lib/partner-platform/core-indexes";
import { runWebhookDeliveryWorker } from "@/lib/partner-platform/webhook-delivery";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const client = await clientPromise;
    const db = client.db("guangzhou");
    await ensurePartnerCoreIndexes(db);
    // Five sequential eight-second timeouts remain within the 60-second
    // function ceiling; successful receivers complete much faster.
    const result = await runWebhookDeliveryWorker({ db, limit: 5 });
    await db.collection("partner_worker_heartbeats").updateOne(
      { worker: "webhook-delivery" },
      { $set: { lastSucceededAt: new Date(), result } },
      { upsert: true },
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Partner webhook delivery worker failed", {
      error: error instanceof Error ? error.name : "unknown_error",
    });
    return NextResponse.json(
      { error: "Partner webhook delivery failed" },
      { status: 500 },
    );
  }
}
