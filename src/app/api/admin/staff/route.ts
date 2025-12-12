import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Staff } from "@/models/Staff";
import { MongoQuery } from "@/types";

// GET - Fetch all staff members (Admin only)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const staffCollection = db.collection<Staff>("staff");

    // Build query
    const query: MongoQuery = {};
    if (role && role !== "all") {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch staff
    const staff = await staffCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get stats
    const total = await staffCollection.countDocuments({});
    const administrators = await staffCollection.countDocuments({ role: 'administrator' });
    const managers = await staffCollection.countDocuments({ role: 'manager' });
    const onLeave = await staffCollection.countDocuments({ status: 'on-leave' });

    return NextResponse.json({
      staff: staff.map(s => ({
        ...s,
        _id: s._id?.toString(),
        joinDate: new Date(s.joinDate).toISOString().split('T')[0]
      })),
      stats: {
        total,
        administrators,
        managers,
        onLeave
      }
    });
  } catch (error) {
    console.error("GET staff error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST - Create new staff member (Admin only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const staffCollection = db.collection<Staff>("staff");

    // Check if staff member exists
    const existing = await staffCollection.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json(
        { error: "Staff member with this email already exists" },
        { status: 400 }
      );
    }

    // Generate employee ID
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const employeeId = `EMP${timestamp}${random}`;

    const newStaff: Omit<Staff, '_id'> = {
      ...body,
      employeeId,
      status: body.status || 'active',
      joinDate: body.joinDate ? new Date(body.joinDate) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await staffCollection.insertOne(newStaff);

    return NextResponse.json(
      { 
        message: "Staff member created successfully",
        staffId: result.insertedId.toString(),
        employeeId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST staff error:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}

