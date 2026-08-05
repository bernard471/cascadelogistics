import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";
import type { Shipment } from "@/models/Shipment";
import { calculateShippingPrice } from "@/lib/pricing";
import { getShipmentOperationBlock } from "@/lib/shipment-operations";

const customerShipmentUpdateSchema = z.object({
  receiverName: z.string().trim().min(2).max(120),
  receiverEmail: z.string().trim().email().max(254),
  receiverPhone: z.string().trim().min(8).max(30),
  receiverAddress: z.string().trim().min(5).max(180),
  receiverCity: z.string().trim().min(2).max(100),
  receiverCountry: z.string().trim().min(2).max(100),
  description: z.string().trim().min(2).max(1000),
  dimensions: z.string().trim().max(80).optional(),
  quantity: z.number().int().min(1).max(10000),
  declaredValue: z.number().min(0).max(100000000),
  goodsType: z.enum(["normal", "special", "battery"]),
  serviceType: z.enum(["standard", "express", "overnight", "economy"]),
  pickupDate: z.coerce.date().optional(),
  specialInstructions: z.string().trim().max(1000).optional(),
});

// GET - Fetch single shipment by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shipment ID" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const shipment = await shipmentsCollection.findOne({
      _id: new ObjectId(id) as unknown as string,
      userId: session.user.id // Ensure user can only access their own shipments
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ ...shipment, _id: shipment._id?.toString() });
  } catch (error) {
    console.error("GET shipment by ID error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 }
    );
  }
}

// PUT - Update shipment by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
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
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shipment ID" }, { status: 400 });
    }
    const parsed = customerShipmentUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid shipment details" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const existing = await shipmentsCollection.findOne({
      _id: new ObjectId(id) as unknown as string,
      userId: session.user.id,
    });
    if (!existing) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending shipments can be edited" },
        { status: 409 }
      );
    }

    const data = parsed.data;
    const servicePrice = calculateShippingPrice(
      data.serviceType,
      data.goodsType,
      existing.weight,
      data.quantity,
      data.dimensions,
      data.description,
      existing.packageType
    );

    const updateDetails: string[] = [];
    const receiverChanged = [
      "receiverName",
      "receiverEmail",
      "receiverPhone",
      "receiverAddress",
      "receiverCity",
      "receiverCountry",
    ].some(
      (field) =>
        String(data[field as keyof typeof data] || "") !==
        String(existing[field as keyof Shipment] || "")
    );
    if (receiverChanged) updateDetails.push("Destination contact details updated");
    if (data.description !== existing.description) {
      updateDetails.push("Package description updated");
    }
    if ((data.dimensions || "") !== (existing.dimensions || "")) {
      updateDetails.push("Package dimensions updated");
    }
    if (data.quantity !== existing.quantity) {
      updateDetails.push(`Quantity updated to ${data.quantity}`);
    }
    if (data.declaredValue !== existing.declaredValue) {
      updateDetails.push("Declared value updated");
    }
    if (data.goodsType !== existing.goodsType) {
      updateDetails.push(`Goods type updated to ${data.goodsType}`);
    }
    if (data.serviceType !== existing.serviceType) {
      updateDetails.push(`Service type updated to ${data.serviceType}`);
    }
    const previousPickupDate = existing.pickupDate
      ? new Date(existing.pickupDate).toISOString().slice(0, 10)
      : "";
    const nextPickupDate = data.pickupDate
      ? new Date(data.pickupDate).toISOString().slice(0, 10)
      : "";
    if (previousPickupDate !== nextPickupDate) {
      updateDetails.push("Pickup date updated");
    }
    if (
      (data.specialInstructions || "") !==
      (existing.specialInstructions || "")
    ) {
      updateDetails.push(
        data.specialInstructions
          ? "Special instructions updated"
          : "Special instructions cleared"
      );
    }

    const now = new Date();
    const timeline = Array.isArray(existing.timeline)
      ? [...existing.timeline]
      : [];
    if (updateDetails.length > 0) {
      timeline.push({
        status: "Shipment Details Updated",
        location:
          existing.currentLocation ||
          `${existing.senderCity}, ${existing.senderCountry}`,
        date: now,
        time: now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        completed: true,
        details: updateDetails,
      });
    }

    const result = await shipmentsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string, userId: session.user.id },
      { 
        $set: { 
          ...data,
          servicePrice,
          ...(updateDetails.length > 0 ? { timeline } : {}),
          updatedAt: now
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Shipment updated successfully" });
  } catch (error) {
    console.error("PUT shipment error:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipment by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shipment ID" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const result = await shipmentsCollection.deleteOne({
      _id: new ObjectId(id) as unknown as string,
      userId: session.user.id,
      status: { $in: ["pending", "cancelled"] },
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Only pending or cancelled shipments can be deleted" },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("DELETE shipment error:", error);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}
