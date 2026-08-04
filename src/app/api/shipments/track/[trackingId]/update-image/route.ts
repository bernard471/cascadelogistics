import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import clientPromise from "@/lib/mongodb";
import type { Shipment } from "@/models/Shipment";

// Streams a private tracking-update image after confirming it belongs to the
// shipment identified by the public tracking ID.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const indexValue = new URL(request.url).searchParams.get("index");
    const imageIndex = Number(indexValue);

    if (!Number.isInteger(imageIndex) || imageIndex < 0) {
      return NextResponse.json({ error: "Invalid update image" }, { status: 400 });
    }

    const client = await clientPromise;
    const shipment = await client
      .db("guangzhou")
      .collection<Shipment>("shipments")
      .findOne({ trackingId: trackingId.trim() });
    const timeline = Array.isArray(shipment?.timeline) ? shipment.timeline : [];
    const imageUrl = timeline[imageIndex]?.imageUrl;

    if (!imageUrl || !imageUrl.includes(".private.blob.vercel-storage.com/")) {
      return NextResponse.json({ error: "Update image not found" }, { status: 404 });
    }

    const blob = await get(imageUrl, { access: "private" });
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "Update image not found" }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType,
        "Content-Disposition": "inline",
        // The route still validates the shipment for every retrieval.
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET tracked shipment update image error:", error);
    return NextResponse.json(
      { error: "Unable to retrieve update image" },
      { status: 500 }
    );
  }
}

