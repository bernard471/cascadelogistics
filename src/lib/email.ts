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

function getAdminNotificationEmail() {
  const recipient =
    process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  if (!recipient) {
    throw new Error(
      "ADMIN_NOTIFICATION_EMAIL or EMAIL_USER must be configured"
    );
  }
  return recipient;
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

export async function sendAdminRegistrationNotification(input: {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  documentType: string;
}) {
  const customerName = `${input.firstName} ${input.lastName}`.trim();
  const safeName = escapeHtml(customerName);
  const safeEmail = escapeHtml(input.email);
  const safeCountry = escapeHtml(input.country);
  const safeDocumentType = escapeHtml(input.documentType);
  const reviewUrl = `${getBaseUrl()}/admin-dashboard/identity-verifications`;

  await getTransporter().sendMail({
    from: `"Cascade Logistics" <${process.env.EMAIL_USER}>`,
    to: getAdminNotificationEmail(),
    subject: `New customer registration: ${customerName}`,
    text: `${customerName} (${input.email}) registered from ${input.country}. Identity document: ${input.documentType}. Review: ${reviewUrl}`,
    html: messageShell(`
      <h2 style="margin-top:0">New customer registration</h2>
      <p><strong>Customer:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Country:</strong> ${safeCountry}</p>
      <p><strong>Identity document:</strong> ${safeDocumentType}</p>
      <p style="margin:26px 0">
        <a href="${reviewUrl}" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">Review registration</a>
      </p>
    `),
  });
}

export async function sendAdminShipmentCreatedNotification(input: {
  customerName: string;
  customerEmail: string;
  trackingId: string;
  wholesaleTrackingNumbers?: string[];
}) {
  const safeName = escapeHtml(input.customerName);
  const safeEmail = escapeHtml(input.customerEmail);
  const safeTrackingId = escapeHtml(input.trackingId);
  const wholesaleNumbers = (input.wholesaleTrackingNumbers || []).filter(Boolean);
  const safeWholesaleNumbers = wholesaleNumbers.map(escapeHtml).join(", ");
  const shipmentsUrl = `${getBaseUrl()}/admin-dashboard/shipments`;

  await getTransporter().sendMail({
    from: `"Cascade Logistics" <${process.env.EMAIL_USER}>`,
    to: getAdminNotificationEmail(),
    subject: `New shipment created: ${input.trackingId}`,
    text: `${input.customerName} (${input.customerEmail}) created shipment ${input.trackingId}.${wholesaleNumbers.length ? ` Wholesale tracking numbers: ${wholesaleNumbers.join(", ")}.` : ""}`,
    html: messageShell(`
      <h2 style="margin-top:0">New shipment created</h2>
      <p><strong>Customer:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Cascade tracking ID:</strong> ${safeTrackingId}</p>
      ${safeWholesaleNumbers ? `<p><strong>Wholesale tracking numbers:</strong> ${safeWholesaleNumbers}</p>` : ""}
      <p style="margin:26px 0">
        <a href="${shipmentsUrl}" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">Open shipment management</a>
      </p>
    `),
  });
}

export async function sendAdminPaymentNotification(input: {
  customerName: string;
  customerEmail: string;
  paymentId: string;
  trackingId: string;
  amount: number;
  paymentMethod: string;
}) {
  const paymentsUrl = `${getBaseUrl()}/admin-dashboard/payments`;
  const safeName = escapeHtml(input.customerName);
  const safeEmail = escapeHtml(input.customerEmail);
  const safePaymentId = escapeHtml(input.paymentId);
  const safeTrackingId = escapeHtml(input.trackingId);
  const safeMethod = escapeHtml(input.paymentMethod);
  const formattedAmount = input.amount.toFixed(2);

  await getTransporter().sendMail({
    from: `"Cascade Logistics" <${process.env.EMAIL_USER}>`,
    to: getAdminNotificationEmail(),
    subject: `New payment proof: ${input.paymentId}`,
    text: `${input.customerName} (${input.customerEmail}) submitted payment proof ${input.paymentId} for shipment ${input.trackingId}. Amount: ${formattedAmount}. Method: ${input.paymentMethod}.`,
    html: messageShell(`
      <h2 style="margin-top:0">New payment proof submitted</h2>
      <p><strong>Customer:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Payment ID:</strong> ${safePaymentId}</p>
      <p><strong>Shipment:</strong> ${safeTrackingId}</p>
      <p><strong>Amount:</strong> ${formattedAmount}</p>
      <p><strong>Method:</strong> ${safeMethod}</p>
      <p style="margin:26px 0">
        <a href="${paymentsUrl}" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">Review payment proof</a>
      </p>
    `),
  });
}

export async function sendShipmentUpdateEmail(input: {
  firstName: string;
  email: string;
  trackingId: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: Date | string;
}) {
  const trackingUrl = `${getBaseUrl()}/user-dashboard/track-shipment?id=${encodeURIComponent(input.trackingId)}`;
  const statusLabel = input.status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const deliveryText = input.estimatedDelivery
    ? new Date(input.estimatedDelivery).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  await getTransporter().sendMail({
    from: `"Cascade Logistics" <${process.env.EMAIL_USER}>`,
    to: input.email,
    subject: `Shipment update: ${input.trackingId}`,
    text: `Hello ${input.firstName}, your shipment ${input.trackingId} has been updated. Status: ${statusLabel}.${input.currentLocation ? ` Current location: ${input.currentLocation}.` : ""}${deliveryText ? ` Estimated delivery: ${deliveryText}.` : ""}`,
    html: messageShell(`
      <p>Hello ${escapeHtml(input.firstName)},</p>
      <p>Your shipment <strong>${escapeHtml(input.trackingId)}</strong> has been updated.</p>
      <p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
      ${input.currentLocation ? `<p><strong>Current location:</strong> ${escapeHtml(input.currentLocation)}</p>` : ""}
      ${deliveryText ? `<p><strong>Estimated delivery:</strong> ${escapeHtml(deliveryText)}</p>` : ""}
      <p style="margin:26px 0">
        <a href="${trackingUrl}" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">Track shipment</a>
      </p>
    `),
  });
}
