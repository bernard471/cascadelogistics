import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Notification } from "@/types";
import { MongoUpdateData } from "@/types";

// PATCH - Mark admin notification as read/unread
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
    const { isRead } = await request.json();
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    const updateData: MongoUpdateData = { isRead };
    if (isRead) {
      updateData.readAt = new Date();
    }

    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string, userId: "admin" },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Notification updated successfully" });
  } catch (error) {
    console.error("PATCH admin notification error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin notification by ID
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
    const notificationsCollection = db.collection<Notification>("notifications");

    const result = await notificationsCollection.deleteOne({
      _id: new ObjectId(id) as unknown as string,
      userId: "admin"
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("DELETE admin notification error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
