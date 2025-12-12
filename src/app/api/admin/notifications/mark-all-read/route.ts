import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Notification } from "@/types";

// POST - Mark all admin notifications as read
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    const result = await notificationsCollection.updateMany(
      { userId: "admin", isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json({ 
      message: "All admin notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark all admin notifications read error:", error);
    return NextResponse.json(
      { error: "Failed to mark admin notifications as read" },
      { status: 500 }
    );
  }
}
