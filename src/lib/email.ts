import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;

  if (!user || !password) {
    throw new Error("EMAIL_USER and EMAIL_PASSWORD must be configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] || character
  );
}

function getBaseUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

function messageShell(content: string) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f4f6f9;font-family:Arial,sans-serif;color:#1f2937">
        <div style="max-width:620px;margin:0 auto;padding:32px 16px">
          <div style="background:#315694;color:#fff;padding:22px 28px;border-radius:12px 12px 0 0">
            <h1 style="font-size:22px;margin:0">Cascade Logistics</h1>
          </div>
          <div style="background:#fff;padding:30px 28px;border:1px solid #e5e7eb;border-top:0">
            ${content}
          </div>
          <div style="background:#262262;color:#fff;padding:16px 28px;border-radius:0 0 12px 12px;font-size:12px">
            Need help? Contact info@cascadelogistics.co
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendVerificationEmail(input: {
  firstName: string;
  email: string;
  verificationToken: string;
}) {
  const firstName = escapeHtml(input.firstName);
  const verificationUrl = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(input.verificationToken)}`;

  await getTransporter().sendMail({
    from: `"Cascade Logistics" <${process.env.EMAIL_USER}>`,
    to: input.email,
    subject: "Verify your Cascade Logistics email",
    text: `Hello ${input.firstName},\n\nVerify your email: ${verificationUrl}\n\nYour identity documents are also awaiting administrative review. You can sign in after both checks are complete.\n\nThis link expires in 24 hours.`,
    html: messageShell(`
      <p>Hello ${firstName},</p>
      <p>Thank you for registering. Please verify your email address using the button below.</p>
      <p style="margin:26px 0">
        <a href="${verificationUrl}" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">Verify email address</a>
      </p>
      <p>Your identity documents are awaiting administrative review. You can sign in after both email and identity verification are complete.</p>
      <p style="font-size:13px;color:#6b7280">This verification link expires in 24 hours.</p>
    `),
  });
}

export async function sendIdentityDecisionEmail(input: {
  firstName: string;
  email: string;
  decision: "verified" | "rejected" | "resubmission-required";
  reason?: string;
}) {
  const firstName = escapeHtml(input.firstName);
  const safeReason = input.reason ? escapeHtml(input.reason) : "";
  const isVerified = input.decision === "verified";
  const title = isVerified ? "Identity verification approved" : "Identity verification update";
  const action = isVerified
    ? `<p>Your identity verification has been approved. If your email is verified, you can now sign in and use Cascade Logistics.</p>
       <p><a href="${getBaseUrl()}/member-login" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">Sign in</a></p>`
    : `<p>We could not approve the submitted identity documents.</p>
       ${safeReason ? `<p><strong>Reason:</strong> ${safeReason}</p>` : ""}
       <p>Please contact support while the secure resubmission screen is being prepared.</p>`;

  await getTransporter().sendMail({
    from: `"Cascade Logistics" <${process.env.EMAIL_USER}>`,
    to: input.email,
    subject: title,
    text: isVerified
      ? `Hello ${input.firstName}, your identity verification has been approved.`
      : `Hello ${input.firstName}, your identity verification needs attention.${input.reason ? ` Reason: ${input.reason}` : ""}`,
    html: messageShell(`<p>Hello ${firstName},</p>${action}`),
  });
}
