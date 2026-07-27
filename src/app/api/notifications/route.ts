import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Notification } from "@/models/Notification";
import { MongoQuery } from "@/types";

// GET - Fetch all notifications for the logged-in user
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, read, unread
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50") || 50)
    );

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    // Build query
    const query: MongoQuery = { userId: session.user.id };
    if (filter === "read") {
      query.isRead = true;
    } else if (filter === "unread") {
      query.isRead = false;
    }

    // Fetch notifications
    const notifications = await notificationsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get counts
    const total = await notificationsCollection.countDocuments({ userId: session.user.id });
    const unreadCount = await notificationsCollection.countDocuments({ 
      userId: session.user.id, 
      isRead: false 
    });

    return NextResponse.json({
      notifications: notifications.map(n => ({ ...n, _id: n._id?.toString() })),
      total,
      unreadCount
    });
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    { error: "Notifications can only be created by trusted server workflows" },
    { status: 405, headers: { Allow: "GET" } }
  );
}
