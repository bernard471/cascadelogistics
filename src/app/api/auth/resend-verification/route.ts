import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import nodemailer from "nodemailer";
import type { User } from "@/models/User";

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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new verification token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationToken,
          verificationTokenExpiry,
          updatedAt: new Date()
        }
      }
    );

    // Get email credentials
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.error("Email credentials not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Email HTML
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
              <h2>Verify Your Email - Cascade Logistics</h2>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>You requested a new verification email. Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button" style="color: white;">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #315694;">${verificationUrl}</p>
              <p>This verification link will expire in 24 hours.</p>
              <p>If you didn't request this email, please ignore it.</p>
            </div>
            <div class="footer">
              This email was sent from Cascade Logistics. Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
Hello ${user.firstName},

You requested a new verification email. Please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't request this email, please ignore it.

Best regards,
Cascade Logistics Team
    `;

    // Send email
    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: "Verify Your Email - Cascade Logistics",
      text: textVersion,
      html: emailHtml,
    });

    return NextResponse.json({
      message: "Verification email sent successfully. Please check your inbox."
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while resending verification email" },
      { status: 500 }
    );
  }
}


