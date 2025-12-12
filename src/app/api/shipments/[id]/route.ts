import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Shipment } from "@/models/Shipment";

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
    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    // Update shipment
    const result = await shipmentsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string, userId: session.user.id },
      { 
        $set: { 
          ...body, 
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
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const result = await shipmentsCollection.deleteOne({
      _id: new ObjectId(id) as unknown as string,
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
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

