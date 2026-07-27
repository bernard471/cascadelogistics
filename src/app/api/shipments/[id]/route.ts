import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";
import type { Shipment } from "@/models/Shipment";
import { calculateShippingPrice } from "@/lib/pricing";

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

    const result = await shipmentsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string, userId: session.user.id },
      { 
        $set: { 
          ...data,
          servicePrice,
          updatedAt: new Date() 
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
