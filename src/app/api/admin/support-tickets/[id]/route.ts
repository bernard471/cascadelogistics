import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { SupportTicket } from "@/models/SupportTicket";
import type { AdminSupportTicket } from "@/types";
import { MongoUpdateData } from "@/types";

// GET - Fetch single support ticket (Admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");
    const usersCollection = db.collection("users");

    // Fetch ticket
    const ticket = await ticketsCollection.findOne({ _id: new ObjectId(id) as unknown as string });
    
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get user data
    const user = await usersCollection.findOne(
      { _id: new ObjectId(ticket.userId) },
      { projection: { firstName: 1, lastName: 1, email: 1 } }
    );

    const ticketWithUser: AdminSupportTicket = {
      ...ticket,
      _id: ticket._id?.toString(),
      user: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      userEmail: user?.email || ''
    } as AdminSupportTicket;

    return NextResponse.json(ticketWithUser);
  } catch (error) {
    console.error("GET admin support ticket error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Update support ticket status (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, response } = body;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");
    const notificationsCollection = db.collection("notifications");

    // Get current ticket
    const currentTicket = await ticketsCollection.findOne({ _id: new ObjectId(id) as unknown as string });
    if (!currentTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Update ticket
    const updateData: MongoUpdateData = {
      $set: {
        status,
        updatedAt: new Date()
      }
    };

    // Add response if provided
    if (response && response.trim()) {
      const newResponse = {
        message: response.trim(),
        respondedBy: session.user.name || 'Admin',
        respondedAt: new Date(),
        isStaff: true
      };

      updateData.$push = {
        responses: newResponse
      };
    }

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string },
      updateData
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create notification for user about status update
    const userNotification = {
      userId: currentTicket.userId,
      title: "Support Ticket Updated",
      message: `Your support ticket ${currentTicket.ticketNumber} status has been updated to ${status.replace('-', ' ')}.`,
      type: "update",
      isRead: false,
      createdAt: new Date(),
      ticketId: id
    };
    await notificationsCollection.insertOne(userNotification);

    // If there's a response, create another notification
    if (response && response.trim()) {
      const responseNotification = {
        userId: currentTicket.userId,
        title: "New Response to Your Ticket",
        message: `You have received a new response for ticket ${currentTicket.ticketNumber}.`,
        type: "support",
        isRead: false,
        createdAt: new Date(),
        ticketId: id
      };
      await notificationsCollection.insertOne(responseNotification);
    }

    return NextResponse.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("PATCH admin support ticket error:", error);
    return NextResponse.json(
      { error: "Failed to update support ticket" },
      { status: 500 }
    );
  }
}
