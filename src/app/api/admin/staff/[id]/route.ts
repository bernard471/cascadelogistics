import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Staff } from "@/models/Staff";

// PATCH - Update staff member (Admin only)
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
    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db("logistics");
    const staffCollection = db.collection<Staff>("staff");

    const result = await staffCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string },
      { 
        $set: { 
          ...body, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Staff member updated successfully" });
  } catch (error) {
    console.error("PATCH staff error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff member (Admin only)
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
    const staffCollection = db.collection<Staff>("staff");

    const result = await staffCollection.deleteOne({ _id: new ObjectId(id) as unknown as string });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("DELETE staff error:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}

