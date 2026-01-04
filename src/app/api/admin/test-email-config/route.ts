import { NextResponse } from "next/server";
import { auth } from "@/auth";
import nodemailer from "nodemailer";

// GET - Test email configuration (Admin only)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    const diagnostics = {
      emailUser: emailUser ? "✅ Set" : "❌ NOT SET",
      emailPassword: emailPassword ? "✅ Set" : "❌ NOT SET",
      nextAuthUrl: nextAuthUrl || "❌ NOT SET (using default)",
      emailUserValue: emailUser ? `${emailUser.substring(0, 3)}***` : "N/A",
    };

    // Try to create and verify transporter
    let connectionTest = null;
    if (emailUser && emailPassword) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });

        await transporter.verify();
        connectionTest = {
          status: "✅ SUCCESS",
          message: "Email connection verified successfully"
        };
      } catch (error) {
        connectionTest = {
          status: "❌ FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
          error: error instanceof Error ? error.stack : String(error)
        };
      }
    } else {
      connectionTest = {
        status: "⚠️ SKIPPED",
        message: "Email credentials not configured"
      };
    }

    return NextResponse.json({
      diagnostics,
      connectionTest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Email config test error:", error);
    return NextResponse.json(
      { 
        error: "Failed to test email configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

