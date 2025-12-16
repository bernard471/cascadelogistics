import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import nodemailer from "nodemailer";
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

    // Send password reset email using nodemailer
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

        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

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
                .warning { background: #fff3cd; border-left: 4px solid #f7941d; padding: 12px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Reset Your Password - Cascade Logistics</h2>
                </div>
                <div class="content">
                  <p>Hello ${user.firstName},</p>
                  <p>We received a request to reset your password for your Cascade Logistics account.</p>
                  <p>Click the button below to reset your password:</p>
                  <div style="text-align: center;">
                    <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
                  </div>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #315694;">${resetUrl}</p>
                  <div class="warning">
                    <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                  </div>
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
Hello ${user.firstName},

We received a request to reset your password for your Cascade Logistics account.

Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
Cascade Logistics Team
        `;

        await transporter.sendMail({
          from: emailUser,
          to: email,
          subject: "Reset Your Password - Cascade Logistics",
          text: textVersion,
          html: emailHtml,
        });
      }
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Still return success to not reveal if email exists
    }

    // Return success (don't reveal if email exists or not for security)
    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link."
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
