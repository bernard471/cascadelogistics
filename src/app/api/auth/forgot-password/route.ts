import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import type { User } from "@/models/User";

// POST - Send password reset email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: "If an account with that email exists, we've sent a password reset link." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date()
        }
      }
    );

    // Return success (email will be sent by client-side EmailJS)
    return NextResponse.json({
      message: "Password reset email sent successfully",
      resetToken, // For client-side email sending
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
