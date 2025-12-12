import { NextResponse } from "next/server";
import { testEmailConnection, sendWelcomeEmail } from "@/lib/email";

// GET - Test email connection
export async function GET() {
  try {
    const result = await testEmailConnection();
    
    if (result.success) {
      return NextResponse.json({
        message: "Email connection successful",
        status: "connected"
      });
    } else {
      return NextResponse.json({
        message: "Email connection failed",
        error: result.error,
        status: "failed"
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      message: "Email test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      status: "error"
    }, { status: 500 });
  }
}

// POST - Send test welcome email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, username } = body;

    if (!email || !firstName || !lastName || !username) {
      return NextResponse.json({
        message: "Missing required fields",
        error: "email, firstName, lastName, and username are required"
      }, { status: 400 });
    }

    const result = await sendWelcomeEmail({
      firstName,
      lastName,
      email,
      username
    });

    if (result.success) {
      return NextResponse.json({
        message: "Test welcome email sent successfully",
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        message: "Failed to send test welcome email",
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      message: "Test email failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
