import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { MongoQuery } from "@/types";

// GET - Fetch all users (Admin only)
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

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");
    const shipmentsCollection = db.collection("shipments");

    // Build query
    const query: MongoQuery = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users
    const users = await usersCollection
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get shipment counts for each user
    const usersWithShipments = await Promise.all(
      users.map(async (user) => {
        const totalShipments = await shipmentsCollection.countDocuments({
          userId: user._id?.toString()
        });
        
        return {
          ...user,
          _id: user._id?.toString(),
          totalShipments,
          registeredDate: new Date(user.createdAt).toISOString().split('T')[0]
        };
      })
    );

    // Get total counts for stats
    const total = await usersCollection.countDocuments({});
    const active = await usersCollection.countDocuments({ status: 'active' });
    const suspended = await usersCollection.countDocuments({ status: 'suspended' });
    const pending = await usersCollection.countDocuments({ status: 'pending' });

    return NextResponse.json({
      users: usersWithShipments,
      stats: {
        total,
        active,
        suspended,
        pending
      }
    });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create a new user (Admin only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, username, password, role, status } = body;

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    // Check if user exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: Omit<User, '_id'> = {
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      role: role || 'user',
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json(
      { 
        message: "User created successfully",
        userId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

