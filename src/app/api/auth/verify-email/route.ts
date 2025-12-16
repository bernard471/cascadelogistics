import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    // Find user with valid verification token
    const user = await usersCollection.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Update user to mark email as verified and clear token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date()
        },
        $unset: {
          verificationToken: "",
          verificationTokenExpiry: ""
        }
      }
    );

    return NextResponse.json({
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying email" },
      { status: 500 }
    );
  }
}

