import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import nodemailer from "nodemailer";
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry
    };

    const result = await usersCollection.insertOne(newUser);

    // Send verification email
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;

      if (emailUser && emailPassword) {
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
                  <p>Thank you for registering with Cascade Logistics! We're excited to have you on board.</p>
                  <p>To complete your registration, please verify your email address by clicking the button below:</p>
                  <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button" style="color: white;">Verify Email Address</a>
                  </div>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #315694;">${verificationUrl}</p>
                  <p><strong>This verification link will expire in 24 hours.</strong></p>
                  <p>Once verified, you'll be able to access all our shipping services and track your shipments.</p>
                  <p>If you didn't create an account with Cascade Logistics, please ignore this email.</p>
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

Thank you for registering with Cascade Logistics! We're excited to have you on board.

To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

Once verified, you'll be able to access all our shipping services and track your shipments.

If you didn't create an account with Cascade Logistics, please ignore this email.

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
      // Don't fail registration if email fails, but log it
    }

    return NextResponse.json(
      { 
        message: "User registered successfully. Please check your email to verify your account.",
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

