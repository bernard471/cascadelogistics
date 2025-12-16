import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { ContactSubmission } from "@/models/ContactSubmission";
import { MongoUpdateData } from "@/types";

// GET - Fetch single contact submission (Admin only)
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
    const contactSubmissionsCollection = db.collection<ContactSubmission>("contact_submissions");

    const submission = await contactSubmissionsCollection.findOne({ 
      _id: new ObjectId(id) as unknown as string 
    });

    if (!submission) {
      return NextResponse.json({ error: "Contact submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...submission,
      _id: submission._id?.toString(),
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      respondedAt: submission.respondedAt
    });
  } catch (error) {
    console.error("GET contact submission error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact submission" },
      { status: 500 }
    );
  }
}

// PATCH - Update contact submission (Admin only)
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
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const contactSubmissionsCollection = db.collection<ContactSubmission>("contact_submissions");

    const updateData: MongoUpdateData = {
      ...body,
      updatedAt: new Date()
    };

    // If responding, add response details
    if (body.adminResponse) {
      updateData.adminResponse = body.adminResponse;
      updateData.respondedBy = session.user.name || "Admin";
      updateData.respondedAt = new Date();
      updateData.status = body.status || 'responded';
    }

    const result = await contactSubmissionsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Contact submission not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Contact submission updated successfully" });
  } catch (error) {
    console.error("PATCH contact submission error:", error);
    return NextResponse.json(
      { error: "Failed to update contact submission" },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact submission (Admin only)
export async function DELETE(
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
    const contactSubmissionsCollection = db.collection<ContactSubmission>("contact_submissions");

    const result = await contactSubmissionsCollection.deleteOne({ 
      _id: new ObjectId(id) as unknown as string 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Contact submission not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Contact submission deleted successfully" });
  } catch (error) {
    console.error("DELETE contact submission error:", error);
    return NextResponse.json(
      { error: "Failed to delete contact submission" },
      { status: 500 }
    );
  }
}
