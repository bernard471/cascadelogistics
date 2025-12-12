import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Notification } from "@/models/Notification";

// POST - Mark all notifications as read
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    const result = await notificationsCollection.updateMany(
      { userId: session.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json({ 
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}

