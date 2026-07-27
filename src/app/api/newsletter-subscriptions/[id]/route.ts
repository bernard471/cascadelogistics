import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { NewsletterSubscription } from "@/models/NewsletterSubscription";
import { MongoUpdateData } from "@/types";

// GET - Get single subscription (Admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const subscriptionsCollection = db.collection<NewsletterSubscription>("newsletter_subscriptions");

    const subscription = await subscriptionsCollection.findOne({ 
      _id: new ObjectId(id) as unknown as string 
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...subscription,
      _id: subscription._id?.toString(),
      subscribedAt: subscription.subscribedAt,
      unsubscribedAt: subscription.unsubscribedAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    });
  } catch (error) {
    console.error("GET newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// PATCH - Update subscription status (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!status || !['active', 'unsubscribed'].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const subscriptionsCollection = db.collection<NewsletterSubscription>("newsletter_subscriptions");

    const updateData: MongoUpdateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'unsubscribed') {
      updateData.unsubscribedAt = new Date();
    } else if (status === 'active') {
      updateData.unsubscribedAt = undefined;
    }

    const result = await subscriptionsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `Subscription ${status === 'active' ? 'activated' : 'unsubscribed'} successfully` 
    });
  } catch (error) {
    console.error("PATCH newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE - Delete subscription (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const subscriptionsCollection = db.collection<NewsletterSubscription>("newsletter_subscriptions");

    const result = await subscriptionsCollection.deleteOne({ 
      _id: new ObjectId(id) as unknown as string 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("DELETE newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
