import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Shipment } from "@/models/Shipment";
import type { TimelineEvent } from "@/types";

// POST - Bulk update shipments (Admin/Staff only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { shipmentIds, status, estimatedDelivery, deltaNumber } = body;

    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json(
        { error: "Shipment IDs array is required" },
        { status: 400 }
      );
    }

    if (!status && deltaNumber === undefined) {
      return NextResponse.json(
        { error: "At least one of status or deltaNumber is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
    const notificationsCollection = db.collection("notifications");

    // Convert string IDs to ObjectId
    const objectIds = shipmentIds.map((id: string) => new ObjectId(id) as unknown as string);

    // Get all shipments that match the IDs
    const shipments = await shipmentsCollection.find({
      _id: { $in: objectIds }
    }).toArray();

    if (shipments.length === 0) {
      return NextResponse.json(
        { error: "No shipments found with the provided IDs" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Partial<Shipment> & { updatedAt: Date } = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status as Shipment['status'];
    }
    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }
    if (deltaNumber !== undefined) {
      updateData.deltaNumber = typeof deltaNumber === "string" && deltaNumber.trim() ? deltaNumber.trim() : undefined;
    }

    // Update all shipments
    const result = await shipmentsCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    // For each shipment, add timeline event if status changed
    const bulkOperations = shipments.map(async (shipment) => {
      if (status && shipment.status !== status) {
        const timeline: TimelineEvent[] = Array.isArray(shipment.timeline) ? [...shipment.timeline] : [];
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        let timelineEvent: TimelineEvent | null = null;
        
        // Generate appropriate timeline event based on new status
        switch (status) {
          case 'in-transit':
            timelineEvent = {
              status: 'In Transit',
              location: shipment.currentLocation || shipment.senderCity || 'Origin',
              date: now,
              time: timeStr,
              completed: true
            };
            break;
          case 'delivered':
            timelineEvent = {
              status: 'Delivered',
              location: shipment.receiverCity || shipment.currentLocation || 'Destination',
              date: now,
              time: timeStr,
              completed: true
            };
            break;
          case 'on-hold':
            timelineEvent = {
              status: 'On Hold',
              location: shipment.currentLocation || shipment.senderCity || 'Origin',
              date: now,
              time: timeStr,
              completed: false
            };
            break;
          case 'cancelled':
            timelineEvent = {
              status: 'Cancelled',
              location: shipment.currentLocation || shipment.senderCity || 'Origin',
              date: now,
              time: timeStr,
              completed: false
            };
            break;
          case 'arrived-at-warehouse':
            timelineEvent = {
              status: 'Arrived at Warehouse',
              location: shipment.currentLocation || 'Warehouse',
              date: now,
              time: timeStr,
              completed: true
            };
            break;
          case 'ready-for-shipment':
            timelineEvent = {
              status: 'Ready for Shipment',
              location: shipment.currentLocation || shipment.senderCity || 'Origin',
              date: now,
              time: timeStr,
              completed: true
            };
            break;
          case 'arrived-at-warehouse-ghana':
            timelineEvent = {
              status: 'Arrived at Warehouse (Ghana)',
              location: shipment.currentLocation || 'Ghana',
              date: now,
              time: timeStr,
              completed: true
            };
            break;
          case 'ready-for-pickup':
            timelineEvent = {
              status: 'Ready for Pickup',
              location: shipment.currentLocation || shipment.receiverCity || 'Destination',
              date: now,
              time: timeStr,
              completed: true
            };
            break;
          default:
            timelineEvent = {
              status: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
              location: shipment.currentLocation || shipment.senderCity || 'Origin',
              date: now,
              time: timeStr,
              completed: status === 'delivered'
            };
        }
        
        if (timelineEvent) {
          const statusExists = timeline.some((event: TimelineEvent) => 
            event.status.toLowerCase() === timelineEvent!.status.toLowerCase()
          );
          
          if (!statusExists) {
            timeline.push(timelineEvent);
            
            // Sort timeline by date (oldest first)
            timeline.sort((a: TimelineEvent, b: TimelineEvent) => {
              const dateA = a.date instanceof Date ? a.date : new Date(a.date);
              const dateB = b.date instanceof Date ? b.date : new Date(b.date);
              return dateA.getTime() - dateB.getTime();
            });
            
            // Update timeline for this specific shipment
            await shipmentsCollection.updateOne(
              { _id: shipment._id },
              { $set: { timeline: timeline as { status: string; location: string; date: Date; time: string; completed: boolean }[] } }
            );

            // Create notification for the user
            const notification = {
              userId: shipment.userId,
              title: "Shipment Update",
              message: `Your shipment ${shipment.trackingId} has been updated. Status: ${timelineEvent.status}`,
              type: "update",
              isRead: false,
              relatedShipmentId: shipment._id?.toString(),
              createdAt: new Date()
            };
            await notificationsCollection.insertOne(notification);
          }
        }
      }
    });

    await Promise.all(bulkOperations);

    return NextResponse.json({
      message: `Successfully updated ${result.modifiedCount} shipment(s)`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk update shipments error:", error);
    return NextResponse.json(
      { error: "Failed to update shipments" },
      { status: 500 }
    );
  }
}

