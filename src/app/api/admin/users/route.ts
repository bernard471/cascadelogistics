import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { MongoQuery } from "@/types";

// GET - Fetch all users (Admin only)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");
    const shipmentsCollection = db.collection("shipments");
    const visibleUserRoles: User["role"][] = ["user", "admin", "staff"];

    // Build query
    const query: MongoQuery = { role: { $in: visibleUserRoles } };
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users
    const users = await usersCollection
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get shipment counts for each user
    const usersWithShipments = await Promise.all(
      users.map(async (user) => {
        const totalShipments = await shipmentsCollection.countDocuments({
          userId: user._id?.toString()
        });
        
        return {
          ...user,
          _id: user._id?.toString(),
          totalShipments,
          registeredDate: new Date(user.createdAt).toISOString().split('T')[0]
        };
      })
    );

    // Get total counts for stats
    const visibleUserFilter = { role: { $in: visibleUserRoles } };
    const total = await usersCollection.countDocuments(visibleUserFilter);
    const active = await usersCollection.countDocuments({ ...visibleUserFilter, status: 'active' });
    const suspended = await usersCollection.countDocuments({ ...visibleUserFilter, status: 'suspended' });
    const pending = await usersCollection.countDocuments({ ...visibleUserFilter, status: 'pending' });

    return NextResponse.json(
      {
        users: usersWithShipments,
        stats: {
          total,
          active,
          suspended,
          pending
        }
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create a new user (Admin only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, username, password, role, status, emailVerified, phone } = body;

    if (role && !["user", "admin", "staff"].includes(role)) {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection<User>("users");

    // Check if user exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine email verification status
    const isEmailVerified = emailVerified === true;
    
    // Generate verification token only if email is not verified
    let verificationToken: string | undefined;
    let verificationTokenExpiry: Date | undefined;
    
    if (!isEmailVerified) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    const newUser: Omit<User, '_id'> = {
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      role: role || 'user',
      status: status || 'active',
      phone: phone || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: isEmailVerified,
      verificationToken,
      verificationTokenExpiry
    };

    const result = await usersCollection.insertOne(newUser);

    // Send verification email only if email is not verified
    if (!isEmailVerified) {
      try {
        const emailUser = process.env.EMAIL_USER;
        const emailPassword = process.env.EMAIL_PASSWORD;

        if (emailUser && emailPassword && verificationToken) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: emailUser,
              pass: emailPassword,
            },
          });

          const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
          const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #315694 0%, #262262 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                  .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                  .button { display: inline-block; padding: 12px 30px; background: #315694; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { background: #262262; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>Welcome to Cascade Logistics!</h2>
                  </div>
                  <div class="content">
                    <p>Hello ${firstName},</p>
                    <p>Your account has been created by an administrator. Welcome to Cascade Logistics!</p>
                    <p>To complete your registration, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center;">
                      <a href="${verificationUrl}" class="button" style="color: white;">Verify Email Address</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #315694;">${verificationUrl}</p>
                    <p><strong>This verification link will expire in 24 hours.</strong></p>
                    <p>Once verified, you'll be able to access all our shipping services and track your shipments.</p>
                    <p>Your login credentials:</p>
                    <ul>
                      <li><strong>Username:</strong> ${username}</li>
                      <li><strong>Email:</strong> ${email}</li>
                    </ul>
                    <p>If you didn't expect this email, please contact support.</p>
                  </div>
                  <div class="footer">
                    This email was sent from Cascade Logistics. Please do not reply to this email.<br>
                    Need help? Contact us at info@cascadelogistics.co
                  </div>
                </div>
              </body>
            </html>
          `;

          const textVersion = `
Hello ${firstName},

Your account has been created by an administrator. Welcome to Cascade Logistics!

To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

Once verified, you'll be able to access all our shipping services and track your shipments.

Your login credentials:
- Username: ${username}
- Email: ${email}

If you didn't expect this email, please contact support.

Best regards,
Cascade Logistics Team
          `;

          await transporter.sendMail({
            from: emailUser,
            to: email,
            subject: "Welcome to Cascade Logistics - Verify Your Email",
            text: textVersion,
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail user creation if email fails, but log it
      }
    }

    return NextResponse.json(
      { 
        message: isEmailVerified 
          ? "User created successfully with verified email" 
          : "User created successfully. Verification email has been sent.",
        userId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
