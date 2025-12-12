import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { User } from "@/models/User";

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");
    const shipmentsCollection = db.collection("shipments");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(session.user.id) as unknown as string },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get shipment statistics
    const totalShipments = await shipmentsCollection.countDocuments({
      userId: session.user.id
    });

    const deliveredShipments = await shipmentsCollection.countDocuments({
      userId: session.user.id,
      status: 'delivered'
    });

    return NextResponse.json({
      ...user,
      _id: user._id?.toString(),
      totalShipments,
      deliveredShipments,
      memberSince: user.createdAt
    });
  } catch (error) {
    console.error("GET user profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Remove fields that shouldn't be updated via this endpoint
    const { password, role, status, createdAt, ...updateData } = body;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(session.user.id) as unknown as string },
      { 
        $set: { 
          password: password,
          role: role,
          status: status,
          createdAt: createdAt,
          ...updateData,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("PUT user profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

