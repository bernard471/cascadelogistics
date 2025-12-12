import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { SupportTicket } from "@/models/SupportTicket";
import { MongoQuery } from "@/types";

// GET - Fetch all support tickets for the logged-in user
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");

    // Build query
    const query: MongoQuery = { userId: session.user.id };
    if (status && status !== "all") {
      query.status = status;
    }

    // Fetch tickets
    const tickets = await ticketsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const total = await ticketsCollection.countDocuments({ userId: session.user.id });

    return NextResponse.json({
      tickets: tickets.map(t => ({ ...t, _id: t._id?.toString() })),
      total
    });
  } catch (error) {
    console.error("GET support tickets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

// POST - Create a new support ticket
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");

    // Generate ticket number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const ticketNumber = `TKT${timestamp}${random}`;

    const newTicket: Omit<SupportTicket, '_id'> = {
      userId: session.user.id,
      ticketNumber,
      subject: body.subject,
      message: body.message,
      priority: body.priority || 'medium',
      status: 'open',
      category: body.category,
      relatedShipmentId: body.relatedShipmentId,
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await ticketsCollection.insertOne(newTicket);

    // Create notification for admin about new support ticket
    const notificationsCollection = db.collection("notifications");
    const adminNotification = {
      userId: "admin", // Special identifier for admin notifications
      title: "New Support Ticket",
      message: `New support ticket ${ticketNumber} has been submitted by ${session.user.name || 'a user'}.`,
      type: "support",
      isRead: false,
      relatedTicketId: result.insertedId.toString(),
      createdAt: new Date()
    };
    await notificationsCollection.insertOne(adminNotification);

    return NextResponse.json(
      { 
        message: "Support ticket created successfully",
        ticketId: result.insertedId.toString(),
        ticketNumber
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST support ticket error:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}

