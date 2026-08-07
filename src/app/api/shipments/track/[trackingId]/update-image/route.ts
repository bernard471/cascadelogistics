import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Shipment } from "@/models/Shipment";
import {
  canAccessPrivateUserResource,
  getTrustedVercelBlobAccessKind,
} from "@/lib/shipments/private-files";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";

// Streams a private tracking-update image only to operational staff or the
// user who owns the shipment.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    if (!canAccessPrivateUserResource(principal, shipment.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const timeline = Array.isArray(shipment?.timeline) ? shipment.timeline : [];
    const imageUrl = timeline[imageIndex]?.imageUrl;

    if (
      !imageUrl ||
      getTrustedVercelBlobAccessKind(imageUrl) !== "private"
    ) {
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
