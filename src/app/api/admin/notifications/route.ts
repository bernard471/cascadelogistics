import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Notification } from "@/types";
import { MongoQuery } from "@/types";

// GET - Fetch admin notifications (shipments and support tickets)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, read, unread
    const limit = parseInt(searchParams.get("limit") || "20");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    // Build query for admin notifications
    const query: MongoQuery = { 
      userId: "admin"
    };
    if (filter === "read") {
      query.isRead = true;
    } else if (filter === "unread") {
      query.isRead = false;
    } else if (filter === "all") {
      // For "all" filter, don't add isRead condition to get both read and unread
    } else {
      // Default behavior: only show unread notifications
      query.isRead = false;
    }

    // Fetch notifications
    const notifications = await notificationsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get counts
    const total = await notificationsCollection.countDocuments({ userId: "admin" });
    const unreadCount = await notificationsCollection.countDocuments({ 
      userId: "admin", 
      isRead: false 
    });

    return NextResponse.json({
      notifications: notifications.map(n => ({ ...n, _id: n._id?.toString() })),
      total,
      unreadCount
    });
  } catch (error) {
    console.error("GET admin notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin notifications" },
      { status: 500 }
    );
  }
}

// POST - Create admin notification
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const notificationsCollection = db.collection<Notification>("notifications");

    const newNotification: Omit<Notification, '_id'> = {
      userId: "admin",
      type: body.type,
      title: body.title,
      message: body.message,
      isRead: false,
      relatedShipmentId: body.relatedShipmentId,
      relatedTicketId: body.relatedTicketId,
      createdAt: new Date()
    };

    const result = await notificationsCollection.insertOne(newNotification);

    return NextResponse.json(
      { 
        message: "Admin notification created successfully",
        notificationId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST admin notification error:", error);
    return NextResponse.json(
      { error: "Failed to create admin notification" },
      { status: 500 }
    );
  }
}
