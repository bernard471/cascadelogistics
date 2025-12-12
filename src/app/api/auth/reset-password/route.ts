import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import type { User } from "@/models/User";

// POST - Reset password with token
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        }
      }
    );

    return NextResponse.json({
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}
