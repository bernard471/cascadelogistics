import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Shipment } from "@/models/Shipment";
import { MongoQuery } from "@/types";

// GET - Fetch all shipments (Admin only)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = parseInt(searchParams.get("skip") || "0");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
    const usersCollection = db.collection("users");

    // Build query
    const query: MongoQuery = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } },
        { receiverName: { $regex: search, $options: 'i' } },
        { senderCity: { $regex: search, $options: 'i' } },
        { receiverCity: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch shipments
    const shipments = await shipmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Enrich with user data
    const shipmentsWithUsers = await Promise.all(
      shipments.map(async (shipment) => {
        const user = await usersCollection.findOne(
          { _id: new ObjectId(shipment.userId) },
          { projection: { firstName: 1, lastName: 1, email: 1 } }
        );
        
        return {
          ...shipment,
          _id: shipment._id?.toString(),
          customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          customerEmail: user?.email || ''
        };
      })
    );

    // Get stats
    const total = await shipmentsCollection.countDocuments({});
    const inTransit = await shipmentsCollection.countDocuments({ status: 'in-transit' });
    const delivered = await shipmentsCollection.countDocuments({ status: 'delivered' });
    const pending = await shipmentsCollection.countDocuments({ status: 'pending' });
    const cancelled = await shipmentsCollection.countDocuments({ status: 'cancelled' });

    return NextResponse.json({
      shipments: shipmentsWithUsers,
      stats: {
        total,
        inTransit,
        delivered,
        pending,
        cancelled
      },
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET admin shipments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

