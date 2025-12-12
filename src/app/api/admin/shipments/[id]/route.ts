import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import type { Shipment } from "@/models/Shipment";
import type { TimelineEvent } from "@/types";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// GET - Fetch single shipment (Admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const shipment = await shipmentsCollection.findOne({
      _id: new ObjectId(id) as unknown as string
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ ...shipment, _id: shipment._id?.toString() });
  } catch (error) {
    console.error("GET admin shipment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 }
    );
  }
}

// PATCH - Update shipment (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
    const notificationsCollection = db.collection("notifications");

    // Get the shipment first to find the user and check current status
    const shipment = await shipmentsCollection.findOne({ _id: new ObjectId(id) as unknown as string });
    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Handle multipart/form-data for image upload
    const contentType = request.headers.get("content-type") || "";
    let body: {
      status?: string;
      currentLocation?: string;
      estimatedDelivery?: string;
      specialInstructions?: string;
    } = {};
    let updateImage: File | null = null;
    let imageUrl: string | undefined;
    let imageName: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // Extract form fields
      const status = formData.get("status");
      const currentLocation = formData.get("currentLocation");
      const estimatedDelivery = formData.get("estimatedDelivery");
      const specialInstructions = formData.get("specialInstructions");
      const imageFile = formData.get("updateImage") as File | null;

      if (status && typeof status === 'string') body.status = status;
      if (currentLocation && typeof currentLocation === 'string') body.currentLocation = currentLocation;
      if (estimatedDelivery && typeof estimatedDelivery === 'string') body.estimatedDelivery = estimatedDelivery;
      if (specialInstructions && typeof specialInstructions === 'string') body.specialInstructions = specialInstructions;

      // Handle image upload
      if (imageFile && imageFile.size > 0) {
        // Validate file size
        if (imageFile.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: "Image exceeds the 10MB limit" },
            { status: 400 }
          );
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(imageFile.type)) {
          return NextResponse.json(
            { error: "Invalid image type. Only JPEG, PNG, and WebP are allowed" },
            { status: 400 }
          );
        }

        updateImage = imageFile;
        
        // Upload to Vercel Blob Storage
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const imageBlob = await put(
          `shipment-updates/${shipment.trackingId}/${Date.now()}-${imageFile.name}`,
          imageBuffer,
          {
            access: 'public',
            contentType: imageFile.type,
          }
        );

        imageUrl = imageBlob.url;
        imageName = imageFile.name;
      }
    } else {
      body = await request.json();
    }

    // Prepare update object
    const updateData: Partial<Shipment> & { updatedAt: Date } = {
      updatedAt: new Date()
    };
    
    if (body.status) updateData.status = body.status as Shipment['status'];
    if (body.currentLocation) updateData.currentLocation = body.currentLocation;
    if (body.estimatedDelivery) {
      updateData.estimatedDelivery = new Date(body.estimatedDelivery);
    }
    if (body.specialInstructions) updateData.specialInstructions = body.specialInstructions;

    // Auto-generate timeline events based on status changes
    const oldStatus = shipment.status;
    const newStatus = (body.status as string) || shipment.status;
    const currentLocation = (body.currentLocation as string) || shipment.currentLocation || shipment.senderCity;
    
    // If status changed, add timeline event
    if (newStatus && newStatus !== oldStatus) {
      const timeline: TimelineEvent[] = Array.isArray(shipment.timeline) ? [...shipment.timeline] : [];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      let timelineEvent: TimelineEvent | null = null;
      
      // Generate appropriate timeline event based on new status
      switch (newStatus) {
        case 'in-transit':
          timelineEvent = {
            status: 'In Transit',
            location: currentLocation || shipment.senderCity,
            date: now,
            time: timeStr,
            completed: true,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        case 'delivered':
          timelineEvent = {
            status: 'Delivered',
            location: shipment.receiverCity || currentLocation,
            date: now,
            time: timeStr,
            completed: true,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        case 'on-hold':
          timelineEvent = {
            status: 'On Hold',
            location: currentLocation || shipment.senderCity,
            date: now,
            time: timeStr,
            completed: false,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        case 'cancelled':
          timelineEvent = {
            status: 'Cancelled',
            location: currentLocation || shipment.senderCity,
            date: now,
            time: timeStr,
            completed: false,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        case 'arrived-at-warehouse-china':
          timelineEvent = {
            status: 'Arrived at Warehouse (China)',
            location: currentLocation || 'China',
            date: now,
            time: timeStr,
            completed: true,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        case 'ready-for-shipment':
          timelineEvent = {
            status: 'Ready for Shipment',
            location: currentLocation || shipment.senderCity,
            date: now,
            time: timeStr,
            completed: true,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        case 'arrived-at-warehouse-ghana':
          timelineEvent = {
            status: 'Arrived at Warehouse (Ghana)',
            location: currentLocation || 'Ghana',
            date: now,
            time: timeStr,
            completed: true,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        case 'ready-for-pickup':
          timelineEvent = {
            status: 'Ready for Pickup',
            location: currentLocation || shipment.receiverCity,
            date: now,
            time: timeStr,
            completed: true,
            ...(imageUrl && { imageUrl, imageName })
          };
          break;
        default:
          // For other statuses, create a generic update event
          timelineEvent = {
            status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace('-', ' '),
            location: currentLocation || shipment.senderCity,
            date: now,
            time: timeStr,
            completed: newStatus === 'delivered',
            ...(imageUrl && { imageUrl, imageName })
          };
      }
      
      // Only add if it's a new status (avoid duplicates)
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
          
          updateData.timeline = timeline as { status: string; location: string; date: Date; time: string; completed: boolean }[];
        }
      }
    }
    
    // If currentLocation changed but status didn't, add a location update event
    const locationUpdate = body.currentLocation as string | undefined;
    if (locationUpdate && locationUpdate !== shipment.currentLocation && newStatus === oldStatus) {
      const timeline: TimelineEvent[] = Array.isArray(shipment.timeline) ? [...shipment.timeline] : [];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      // Check if we already have an "In Transit" event, if so update it, otherwise add location update
      const inTransitIndex = timeline.findIndex((event: TimelineEvent) => 
        event.status.toLowerCase().includes('transit')
      );
      
      if (inTransitIndex >= 0) {
        // Update existing transit event location
        timeline[inTransitIndex].location = locationUpdate;
        timeline[inTransitIndex].date = now;
        timeline[inTransitIndex].time = timeStr;
        if (imageUrl) {
          timeline[inTransitIndex].imageUrl = imageUrl;
          timeline[inTransitIndex].imageName = imageName;
        }
      } else {
        // Add location update event
        timeline.push({
          status: 'Location Update',
          location: locationUpdate,
          date: now,
          time: timeStr,
          completed: true,
          ...(imageUrl && { imageUrl, imageName })
        });
      }
      
      // Sort timeline by date (oldest first)
      timeline.sort((a: TimelineEvent, b: TimelineEvent) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      updateData.timeline = timeline as { status: string; location: string; date: Date; time: string; completed: boolean }[];
    }

    const result = await shipmentsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string },
      { 
        $set: updateData
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Create notification for the user
    const notification = {
      userId: shipment.userId,
      title: "Shipment Update",
      message: `Your shipment ${shipment.trackingId} has been updated by our team.`,
      type: "update",
      isRead: false,
      createdAt: new Date()
    };

    await notificationsCollection.insertOne(notification);

    return NextResponse.json({ message: "Shipment updated successfully" });
  } catch (error) {
    console.error("PATCH admin shipment error:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipment (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const result = await shipmentsCollection.deleteOne({ _id: new ObjectId(id) as unknown as string });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("DELETE admin shipment error:", error);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}

