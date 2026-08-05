import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Shipment } from "@/models/Shipment";
import type { TimelineEvent } from "@/types";

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
    const canViewSensitiveDetails = Boolean(
      session?.user &&
        (shipment.userId === session.user.id ||
          ["admin", "staff", "super_admin"].includes(session.user.role))
    );

    // Auto-generate timeline events if missing based on current status
    const timeline: TimelineEvent[] = Array.isArray(shipment.timeline) ? [...shipment.timeline] : [];
    const currentStatus = shipment.status;
    
    // Check if we have timeline events for the current status
    const hasOrderPlaced = timeline.some((e: TimelineEvent) => e.status?.toLowerCase().includes('order placed'));
    const hasInTransit = timeline.some((e: TimelineEvent) => e.status?.toLowerCase().includes('transit'));
    const hasDelivered = timeline.some((e: TimelineEvent) => e.status?.toLowerCase().includes('delivered'));
    
    // If timeline is missing events, generate them based on status
    if (!hasOrderPlaced && timeline.length === 0) {
      // Add Order Placed event
      timeline.push({
        status: 'Order Placed',
        location: `${shipment.senderCity}, ${shipment.senderCountry}`,
        date: shipment.createdAt || new Date(),
        time: shipment.createdAt ? new Date(shipment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        completed: true
      });
    }
    
    // If status is in-transit but no transit event exists
    if (currentStatus === 'in-transit' && !hasInTransit) {
      timeline.push({
        status: 'In Transit',
        location: shipment.currentLocation || shipment.senderCity || 'Origin',
        date: shipment.updatedAt || new Date(),
        time: shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        completed: true
      });
    }
    
    // If status is delivered but no delivered event exists
    if (currentStatus === 'delivered' && !hasDelivered) {
      timeline.push({
        status: 'Delivered',
        location: `${shipment.receiverCity}, ${shipment.receiverCountry}`,
        date: shipment.actualDelivery || shipment.updatedAt || new Date(),
        time: shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        completed: true
      });
    }
    
    // Sort timeline by date (oldest first)
    timeline.sort((a: TimelineEvent, b: TimelineEvent) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Update the shipment in database if we added timeline events
    if (timeline.length > (shipment.timeline?.length || 0)) {
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

    // Serialize timeline dates properly for JSON response
    const serializedTimeline = timeline.map((event, index) => ({
      status: event.status,
      location: event.location,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      time: event.time,
      completed: event.completed,
      // Never expose a private Blob URL. The delivery route confirms that the
      // image belongs to this tracked shipment before it streams the file.
      imageUrl: event.imageUrl
        ? `/api/shipments/track/${encodeURIComponent(shipment.trackingId)}/update-image?index=${index}`
        : undefined,
      imageName: event.imageName,
      details: event.details
    }));

    // Return limited info for public tracking (don't expose sensitive data)
    const publicData = {
      trackingId: shipment.trackingId,
      wholesaleTrackingNumbers: (shipment.wholesalePurchases || [])
        .map((purchase) => purchase.trackingNumber?.trim())
        .filter((number): number is string => Boolean(number)),
      status: shipment.status,
      currentLocation: shipment.currentLocation,
      estimatedDelivery: shipment.estimatedDelivery instanceof Date 
        ? shipment.estimatedDelivery.toISOString() 
        : shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery instanceof Date 
        ? shipment.actualDelivery.toISOString() 
        : shipment.actualDelivery,
      timeline: serializedTimeline,
      origin: `${shipment.senderCity}, ${shipment.senderCountry}`,
      destination: `${shipment.receiverCity}, ${shipment.receiverCountry}`,
      packageType: shipment.packageType,
      weight: shipment.weight,
      serviceType: shipment.serviceType,
      deltaNumber: shipment.deltaNumber,
      specialInstructions: canViewSensitiveDetails
        ? shipment.specialInstructions
        : undefined
    };

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("GET shipment by tracking ID error:", error);
    return NextResponse.json(
      { error: "Failed to track shipment" },
      { status: 500 }
    );
  }
}
