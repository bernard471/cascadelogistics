import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type { ContactSubmission } from "@/models/ContactSubmission";
import { MongoQuery } from "@/types";

// POST - Create new contact submission
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, source } = body;

    // Validation
    if (!name || !email || !subject) {
      return NextResponse.json(
        { error: "Name, email, and subject are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const contactSubmissionsCollection = db.collection<ContactSubmission>("contact_submissions");

    // Generate submission ID
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const submissionId = `CON${timestamp}${random}`;

    // Get client IP and user agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const newSubmission: Omit<ContactSubmission, '_id'> = {
      submissionId,
      name,
      email,
      phone: phone || "",
      subject,
      message: message || "",
      source: source || 'contact-page',
      status: 'new',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: ip,
      userAgent
    };

    const result = await contactSubmissionsCollection.insertOne(newSubmission);
    console.log(result);

    return NextResponse.json(
      { 
        message: "Contact submission received successfully",
        submissionId: submissionId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact submission error:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting your message" },
      { status: 500 }
    );
  }
}

// GET - Fetch contact submissions (Admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const contactSubmissionsCollection = db.collection<ContactSubmission>("contact_submissions");

    // Build query
    const query: MongoQuery = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    if (source && source !== "all") {
      query.source = source;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { submissionId: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch submissions
    const submissions = await contactSubmissionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get stats
    const total = await contactSubmissionsCollection.countDocuments({});
    const newCount = await contactSubmissionsCollection.countDocuments({ status: 'new' });
    const inProgress = await contactSubmissionsCollection.countDocuments({ status: 'in-progress' });
    const responded = await contactSubmissionsCollection.countDocuments({ status: 'responded' });
    const closed = await contactSubmissionsCollection.countDocuments({ status: 'closed' });
    const urgent = await contactSubmissionsCollection.countDocuments({ priority: 'urgent' });

    return NextResponse.json({
      submissions: submissions.map(s => ({
        ...s,
        _id: s._id?.toString(),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        respondedAt: s.respondedAt
      })),
      stats: {
        total,
        new: newCount,
        inProgress,
        responded,
        closed,
        urgent
      },
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET contact submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact submissions" },
      { status: 500 }
    );
  }
}
