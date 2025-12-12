import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    // Test MongoDB connection
    const client = await clientPromise;
    const db = client.db("guangzhou");
    
    // Get user count
    const usersCollection = db.collection("users");
    const userCount = await usersCollection.countDocuments();
    
    // Check environment variables
    const hasMongoUri = !!process.env.MONGO;
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

    return NextResponse.json({
      status: "ok",
      mongodb: {
        connected: true,
        database: "guangzhou",
        userCount: userCount
      },
      environment: {
        MONGO: hasMongoUri,
        NEXTAUTH_URL: hasNextAuthUrl,
        NEXTAUTH_SECRET: hasNextAuthSecret,
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : 'Unknown error',
      mongodb: {
        connected: false
      }
    }, { status: 500 });
  }
}

