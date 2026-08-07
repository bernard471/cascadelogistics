import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { put } from "@vercel/blob";
import { sendShipmentUpdateEmail } from "@/lib/email";
import { getShipmentOperationBlockForPrincipal } from "@/lib/shipments/operation-policy";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import type { AdminShipmentUpdateInput } from "@/lib/shipments/schemas";
import {
  deleteInternalShipment,
  getShipmentByIdForPrincipal,
  ShipmentServiceError,
  updateInternalShipment,
} from "@/lib/shipments/service";
import {
  enrichAdminShipments,
  getShipmentCustomerEmailMode,
} from "@/lib/shipments/admin-integration";
import type { OrganizationDocument } from "@/lib/partner-platform/types";
import { buildPrivateShipmentFilePath } from "@/lib/shipments/private-files";

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
    const principal = shipmentPrincipalFromSessionUser(session.user);
    const shipment = await getShipmentByIdForPrincipal(db, id, principal);

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const [adminShipment] = await enrichAdminShipments(db, [shipment]);
    return NextResponse.json(adminShipment);
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

    const principal = shipmentPrincipalFromSessionUser(session.user);
    const operationBlock = await getShipmentOperationBlockForPrincipal(
      "update",
      principal,
    );
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
    const notificationsCollection = db.collection("notifications");

    // Get the shipment first to find the user and check current status
    const shipment = await getShipmentByIdForPrincipal(db, id, principal);
    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Handle multipart/form-data for image upload
    const contentType = request.headers.get("content-type") || "";
    let body: AdminShipmentUpdateInput = {};
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
        const organization = shipment.organizationId
          ? await db.collection<OrganizationDocument>("organizations").findOne({
              _id: shipment.organizationId,
            })
          : null;
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const imageBlob = await put(
          buildPrivateShipmentFilePath({
            shipment,
            organizationPublicId: organization?.publicId,
            category: "shipment-updates",
            fileName: imageFile.name,
          }),
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

    const { updateData, newStatus, currentLocation } =
      await updateInternalShipment({
        db,
        id,
        principal,
        body,
        media: { imageUrl, imageName },
      });

    if (shipment.userId) {
      await notificationsCollection.insertOne({
        userId: shipment.userId,
        title: "Shipment Update",
        message: `Your shipment ${shipment.trackingId} has been updated by our team.`,
        type: "update",
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Partner organizations choose whether Cascade, the partner, or neither
    // party sends direct customer email. API events are still recorded.
    const customerEmailMode = await getShipmentCustomerEmailMode(db, shipment);
    if (customerEmailMode === "cascade") {
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
    }

    return NextResponse.json({ message: "Shipment updated successfully" });
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
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
    const principal = shipmentPrincipalFromSessionUser(session.user);
    await deleteInternalShipment({ db, id, principal });

    return NextResponse.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    console.error("DELETE admin shipment error:", error);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}
