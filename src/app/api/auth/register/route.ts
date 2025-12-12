import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, username, password } = body;

    // Validation
    if (!firstName || !lastName || !email || !username || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: Omit<User, '_id'> = {
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      role: "user",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json(
      { 
        message: "User registered successfully",
        userId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

