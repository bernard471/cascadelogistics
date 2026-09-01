import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Shipment } from "@/models/Shipment";
import { ensureTrackingTimeline } from "@/lib/shipments/timeline";
import { canAccessPrivateUserResource } from "@/lib/shipments/private-files";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import { buildPublicTrackingResponse } from "@/lib/shipments/tracking-response";

// GET - Track shipment by tracking ID (public or authenticated)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const lookupValue = trackingId.trim();

    if (!lookupValue) {
      return NextResponse.json(
        { error: "A Cascade or wholesale tracking number is required" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const escapedLookup = lookupValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactLookup = new RegExp(`^${escapedLookup}$`, "i");
    const shipment = await shipmentsCollection.findOne({
      $or: [
        { trackingId: exactLookup },
        { "wholesalePurchases.trackingNumber": exactLookup },
      ],
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const session = await auth();
    const principal = session?.user
      ? shipmentPrincipalFromSessionUser(session.user)
      : null;
    const canViewSensitiveDetails = Boolean(
      principal && canAccessPrivateUserResource(principal, shipment.userId),
    );
    const canSubmitProofOfPurchase = Boolean(
      principal?.kind === "customer" &&
        principal.userId === shipment.userId &&
        shipment.status === "arrived-at-warehouse-pending-proof",
    );

    const { timeline, addedEvents } = ensureTrackingTimeline(shipment);
    
    // Update the shipment in database if we added timeline events
    if (addedEvents) {
      await shipmentsCollection.updateOne(
        { _id: shipment._id },
        { 
          $set: { 
            timeline: timeline as Shipment["timeline"],
            updatedAt: new Date() 
          } 
        }
      );
    }

    const publicData = buildPublicTrackingResponse({
      shipment,
      timeline,
      canViewSensitiveDetails,
      canSubmitProofOfPurchase,
    });

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("GET shipment by tracking ID error:", error);
    return NextResponse.json(
      { error: "Failed to track shipment" },
      { status: 500 }
    );
  }
}
