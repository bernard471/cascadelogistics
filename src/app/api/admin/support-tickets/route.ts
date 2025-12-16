import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { SupportTicket } from "@/models/SupportTicket";
import type { AdminSupportTicket } from "@/types";
import { MongoQuery } from "@/types";

// GET - Fetch all support tickets (Admin only)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const ticketsCollection = db.collection<SupportTicket>("support_tickets");
    const usersCollection = db.collection("users");

    // Build query
    const query: MongoQuery = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch tickets
    const tickets = await ticketsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Enrich with user data
    const ticketsWithUsers: AdminSupportTicket[] = await Promise.all(
      tickets.map(async (ticket) => {
        const user = await usersCollection.findOne(
          { _id: new ObjectId(ticket.userId) },
          { projection: { firstName: 1, lastName: 1, email: 1 } }
        );
        
        return {
          ...ticket,
          _id: ticket._id?.toString(),
          user: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email || ''
        } as AdminSupportTicket;
      })
    );

    // Get stats
    const total = await ticketsCollection.countDocuments({});
    const open = await ticketsCollection.countDocuments({ status: 'open' });
    const inProgress = await ticketsCollection.countDocuments({ status: 'in-progress' });
    const resolved = await ticketsCollection.countDocuments({ status: 'resolved' });
    const closed = await ticketsCollection.countDocuments({ status: 'closed' });

    return NextResponse.json({
      tickets: ticketsWithUsers,
      stats: {
        total,
        open,
        inProgress,
        resolved,
        closed
      },
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET admin support tickets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}
