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
    const admin = searchParams.get("admin"); // true for admin notifications
    const limit = parseInt(searchParams.get("limit") || "50");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    // Build query
    const query: MongoQuery = { 
      userId: admin === "true" ? "admin" : session.user.id 
    };
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
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    const newNotification: Omit<Notification, '_id'> = {
      userId: body.userId || session.user.id,
      type: body.type,
      title: body.title,
      message: body.message,
      isRead: false,
      relatedShipmentId: body.relatedShipmentId,
      createdAt: new Date()
    };

    const result = await notificationsCollection.insertOne(newNotification);

    return NextResponse.json(
      { 
        message: "Notification created successfully",
        notificationId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST notification error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

