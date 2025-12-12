import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { NewsletterSubscription } from "@/models/NewsletterSubscription";
import { MongoQuery } from "@/types";

// POST - Subscribe to newsletter
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, source } = body;

    // Validation
    if (!email || !source) {
      return NextResponse.json(
        { error: "Email and source are required" },
        { status: 400 }
      );
    }

    // Validate source
    if (!['footer-top', 'footer-gallery'].includes(source)) {
      return NextResponse.json(
        { error: "Invalid source" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const subscriptionsCollection = db.collection<NewsletterSubscription>("newsletter_subscriptions");

    // Check if email already exists
    const existingSubscription = await subscriptionsCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return NextResponse.json(
          { error: "Email is already subscribed to our newsletter" },
          { status: 400 }
        );
      } else {
        // Reactivate subscription
        await subscriptionsCollection.updateOne(
          { _id: existingSubscription._id },
          { 
            $set: { 
              status: 'active',
              source,
              updatedAt: new Date()
            } 
          }
        );
        
        return NextResponse.json(
          { message: "Welcome back! Your subscription has been reactivated." },
          { status: 200 }
        );
      }
    }

    // Create new subscription
    const newSubscription: Omit<NewsletterSubscription, '_id'> = {
      email: email.toLowerCase().trim(),
      source,
      subscribedAt: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await subscriptionsCollection.insertOne(newSubscription);

    return NextResponse.json(
      { message: "Successfully subscribed to newsletter!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "An error occurred during subscription" },
      { status: 500 }
    );
  }
}

// GET - Fetch newsletter subscriptions (Admin only)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const source = searchParams.get("source");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const subscriptionsCollection = db.collection<NewsletterSubscription>("newsletter_subscriptions");

    // Build query
    const query: MongoQuery = {};
    if (source && source !== "all") {
      query.source = source;
    }
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    // Fetch subscriptions
    const subscriptions = await subscriptionsCollection
      .find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const total = await subscriptionsCollection.countDocuments(query);

    // Get stats
    const totalSubscriptions = await subscriptionsCollection.countDocuments({});
    const activeSubscriptions = await subscriptionsCollection.countDocuments({ status: 'active' });
    const unsubscribedCount = await subscriptionsCollection.countDocuments({ status: 'unsubscribed' });
    const topSourceCount = await subscriptionsCollection.countDocuments({ source: 'footer-top' });
    const gallerySourceCount = await subscriptionsCollection.countDocuments({ source: 'footer-gallery' });

    return NextResponse.json({
      subscriptions: subscriptions.map(sub => ({
        ...sub,
        _id: sub._id?.toString(),
        subscribedAt: sub.subscribedAt,
        unsubscribedAt: sub.unsubscribedAt,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        unsubscribed: unsubscribedCount,
        topSource: topSourceCount,
        gallerySource: gallerySourceCount
      }
    });
  } catch (error) {
    console.error("GET newsletter subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter subscriptions" },
      { status: 500 }
    );
  }
}
