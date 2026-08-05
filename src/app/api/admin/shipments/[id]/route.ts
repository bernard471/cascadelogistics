import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import type { Shipment } from "@/models/Shipment";
import type { TimelineEvent } from "@/types";
import { sendShipmentUpdateEmail } from "@/lib/email";
import { getShipmentOperationBlock } from "@/lib/shipment-operations";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// GET - Fetch single shipment (Admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
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
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const operationBlock = await getShipmentOperationBlock("update", session.user.role);
    if (operationBlock) {
      return NextResponse.json(
        {
          error: operationBlock.reason || "Shipment updates are temporarily paused",
          code: "SHIPMENT_OPERATION_PAUSED",
          ...operationBlock,
        },
        { status: 423 }
      );
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
      deltaNumber?: string;
    } = {};
    let imageUrl: string | undefined;
    let imageName: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // Extract form fields
      const status = formData.get("status");
      const currentLocation = formData.get("currentLocation");
      const estimatedDelivery = formData.get("estimatedDelivery");
      const specialInstructions = formData.get("specialInstructions");
      const deltaNumber = formData.get("deltaNumber");
      const imageFile = formData.get("updateImage") as File | null;

      if (typeof status === 'string' && status) body.status = status;
      if (typeof currentLocation === 'string') body.currentLocation = currentLocation;
      if (typeof estimatedDelivery === 'string') body.estimatedDelivery = estimatedDelivery;
      if (typeof specialInstructions === 'string') body.specialInstructions = specialInstructions;
      if (typeof deltaNumber === 'string') body.deltaNumber = deltaNumber;

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
        
        // Upload to Vercel Blob Storage
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const imageBlob = await put(
          `shipment-updates/${shipment.trackingId}/${Date.now()}-${imageFile.name}`,
          imageBuffer,
          {
            // The connected Vercel Blob store is private. Images are served
            // through the tracking image route, which verifies the shipment
            // before streaming the blob to the browser.
            access: 'private',
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
    if (body.currentLocation !== undefined) {
      updateData.currentLocation = body.currentLocation.trim();
    }
    if (body.estimatedDelivery) {
      updateData.estimatedDelivery = new Date(body.estimatedDelivery);
    }
    if (body.specialInstructions !== undefined) {
      updateData.specialInstructions = body.specialInstructions.trim();
    }
    if (body.deltaNumber !== undefined) {
      // Allow empty string to clear DELTA number, or set it if provided
      updateData.deltaNumber = body.deltaNumber.trim() || undefined;
    }

    const oldStatus = shipment.status;
    const newStatus = (body.status as string) || shipment.status;
    const currentLocation =
      body.currentLocation?.trim() || shipment.currentLocation || shipment.senderCity;
    const statusLabels: Record<string, string> = {
      pending: "Pending",
      "arrived-at-warehouse": "Arrived at Warehouse",
      "ready-for-shipment": "Ready for Shipment",
      "in-transit": "In Transit",
      "arrived-at-warehouse-ghana": "Arrived at Warehouse (Ghana)",
      "ready-for-pickup": "Ready for Pickup",
      delivered: "Delivered",
      cancelled: "Cancelled",
      "on-hold": "On Hold",
    };
    const updateDetails: string[] = [];

    if (newStatus !== oldStatus) {
      updateDetails.push(`Status changed to ${statusLabels[newStatus] || newStatus}`);
    }
    if (
      body.currentLocation !== undefined &&
      body.currentLocation.trim() !== (shipment.currentLocation || "")
    ) {
      updateDetails.push(
        body.currentLocation.trim()
          ? `Current location updated to ${body.currentLocation.trim()}`
          : "Current location cleared"
      );
    }
    if (body.estimatedDelivery) {
      const previousDelivery = shipment.estimatedDelivery
        ? new Date(shipment.estimatedDelivery).toISOString().slice(0, 10)
        : "";
      const nextDelivery = new Date(body.estimatedDelivery).toISOString().slice(0, 10);
      if (nextDelivery !== previousDelivery) {
        updateDetails.push(
          `Estimated delivery updated to ${new Date(body.estimatedDelivery).toLocaleDateString()}`
        );
      }
    }
    if (
      body.specialInstructions !== undefined &&
      body.specialInstructions.trim() !== (shipment.specialInstructions || "")
    ) {
      updateDetails.push(
        body.specialInstructions.trim()
          ? "Special instructions updated"
          : "Special instructions cleared"
      );
    }
    if (
      body.deltaNumber !== undefined &&
      body.deltaNumber.trim() !== (shipment.deltaNumber || "")
    ) {
      updateDetails.push(
        body.deltaNumber.trim()
          ? `DELTA number updated to ${body.deltaNumber.trim()}`
          : "DELTA number cleared"
      );
    }
    if (imageUrl) updateDetails.push(`Update image added: ${imageName || "image"}`);

    if (updateDetails.length > 0) {
      const timeline: TimelineEvent[] = Array.isArray(shipment.timeline)
        ? [...shipment.timeline]
        : [];
      const now = new Date();
      timeline.push({
        status:
          newStatus !== oldStatus
            ? statusLabels[newStatus] || newStatus
            : "Shipment Details Updated",
        location: currentLocation || shipment.senderCity || "Location not provided",
        date: now,
        time: now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        completed: !["cancelled", "on-hold"].includes(newStatus),
        details: updateDetails,
        ...(imageUrl && { imageUrl, imageName }),
      });
      updateData.timeline = timeline as Shipment["timeline"];
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

    try {
      await sendShipmentUpdateEmail({
        firstName: shipment.senderName.split(/\s+/)[0] || "Customer",
        email: shipment.senderEmail,
        trackingId: shipment.trackingId,
        status: newStatus,
        currentLocation,
        estimatedDelivery:
          updateData.estimatedDelivery || shipment.estimatedDelivery,
      });
    } catch (emailError) {
      console.error("Shipment update email failed:", emailError);
    }

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
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
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
