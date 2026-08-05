import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getEmailConfiguration,
  getFallbackEmailConfiguration,
  getEmailTransporter,
} from "@/lib/email";

// GET - Test email configuration (Admin only)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configuration = getEmailConfiguration();
    const fallbackConfiguration = getFallbackEmailConfiguration();
    const diagnostics = {
      provider: configuration.provider,
      emailUser: configuration.user ? "Set" : "NOT SET",
      emailPassword: configuration.passwordConfigured ? "Set" : "NOT SET",
      fromAddress: configuration.fromAddress || "NOT SET",
      fromName: configuration.fromName,
      adminNotificationEmail:
        configuration.adminNotificationEmail || "NOT SET",
      smtpHost:
        configuration.provider === "smtp"
          ? configuration.smtpHost || "NOT SET"
          : "Not used for Gmail",
      smtpPort:
        configuration.provider === "smtp" ? configuration.smtpPort : null,
      smtpSecure:
        configuration.provider === "smtp" ? configuration.smtpSecure : null,
      smtpRequireTls:
        configuration.provider === "smtp"
          ? configuration.smtpRequireTls
          : null,
      nextAuthUrl:
        process.env.NEXTAUTH_URL || "NOT SET (using localhost default)",
      emailUserValue: configuration.user
        ? `${configuration.user.substring(0, 3)}***`
        : "N/A",
      fallback: {
        enabled: Boolean(
          fallbackConfiguration.user &&
            fallbackConfiguration.passwordConfigured
        ),
        provider: fallbackConfiguration.provider,
        emailUser: fallbackConfiguration.user ? "Set" : "NOT SET",
        emailPassword: fallbackConfiguration.passwordConfigured
          ? "Set"
          : "NOT SET",
        fromAddress: fallbackConfiguration.fromAddress || "NOT SET",
        smtpHost:
          fallbackConfiguration.provider === "smtp"
            ? fallbackConfiguration.smtpHost || "NOT SET"
            : "Not used for Gmail",
        smtpPort:
          fallbackConfiguration.provider === "smtp"
            ? fallbackConfiguration.smtpPort
            : null,
        smtpSecure:
          fallbackConfiguration.provider === "smtp"
            ? fallbackConfiguration.smtpSecure
            : null,
      },
    };

    let connectionTest;
    try {
      const verification = await getEmailTransporter().verify();
      connectionTest = {
        status: "SUCCESS",
        activeTransport: verification.activeTransport,
        message:
          verification.activeTransport === "fallback"
            ? "Primary email failed; fallback connection verified successfully"
            : "Primary email connection verified successfully",
      };
    } catch (error) {
      connectionTest = {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return NextResponse.json({
      diagnostics,
      connectionTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email config test error:", error);
    return NextResponse.json(
      {
        error: "Failed to test email configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
