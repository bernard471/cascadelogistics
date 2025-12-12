import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { SupportTicket } from "@/models/SupportTicket";
import { MongoUpdateData } from "@/types";

// GET - Fetch single support ticket by ID
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
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");

    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(id) as unknown as string,
      userId: session.user.id
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ...ticket, _id: ticket._id?.toString() });
  } catch (error) {
    console.error("GET support ticket by ID error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Update support ticket (add response or update status)
export async function PATCH(
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
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");

    const updateData: MongoUpdateData = { updatedAt: new Date() };
    
    // If adding a response
    if (body.response) {
      const newResponse = {
        message: body.response.message,
        respondedBy: session.user.name || session.user.username,
        respondedAt: new Date(),
        isStaff: false
      };
      
      await ticketsCollection.updateOne(
        { _id: new ObjectId(id) as unknown as string, userId: session.user.id },
        { 
          $push: { responses: newResponse },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      // Update other fields (status, priority, etc.)
      if (body.status) updateData.status = body.status;
      if (body.priority) updateData.priority = body.priority;
      
      if (body.status === 'resolved' || body.status === 'closed') {
        updateData.resolvedAt = new Date();
      }
      
      const result = await ticketsCollection.updateOne(
        { _id: new ObjectId(id) as unknown as string, userId: session.user.id },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("PATCH support ticket error:", error);
    return NextResponse.json(
      { error: "Failed to update support ticket" },
      { status: 500 }
    );
  }
}

// DELETE - Delete support ticket by ID
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
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");

    const result = await ticketsCollection.deleteOne({
      _id: new ObjectId(id) as unknown as string,
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("DELETE support ticket error:", error);
    return NextResponse.json(
      { error: "Failed to delete support ticket" },
      { status: 500 }
    );
  }
}

