import nodemailer, { type SendMailOptions } from "nodemailer";

export type EmailProvider = "gmail" | "smtp";

type EmailConfiguration = {
  provider: EmailProvider;
  user: string | undefined;
  passwordConfigured: boolean;
  fromAddress: string | undefined;
  fromName: string;
  adminNotificationEmail: string | undefined;
  smtpHost: string | undefined;
  smtpPort: number;
  smtpSecure: boolean;
  smtpRequireTls: boolean;
};

type EmailAttempt = {
  name: "primary" | "fallback";
  resolveConfiguration: () => EmailConfiguration;
  password: string | undefined;
};

function createConfigurationError(message: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = "EMAIL_CONFIG";
  return error;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseEmailProvider(
  configuredValue: string | undefined,
  smtpHost: string | undefined,
  variableName: string
): EmailProvider {
  const configuredProvider = (configuredValue || (smtpHost ? "smtp" : "gmail"))
    .trim()
    .toLowerCase();

  if (configuredProvider !== "gmail" && configuredProvider !== "smtp") {
    throw createConfigurationError(
      `${variableName} must be either "gmail" or "smtp"`
    );
  }

  return configuredProvider;
}

export function getEmailConfiguration() {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const provider = parseEmailProvider(
    process.env.EMAIL_PROVIDER,
    smtpHost,
    "EMAIL_PROVIDER"
  );
  const user = process.env.EMAIL_USER;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || user;
  const smtpPort = Number(process.env.SMTP_PORT || "587");

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw createConfigurationError("SMTP_PORT must be a valid port number");
  }

  return {
    provider,
    user,
    passwordConfigured: Boolean(process.env.EMAIL_PASSWORD),
    fromAddress,
    fromName: process.env.EMAIL_FROM_NAME || "Cascade Logistics",
    adminNotificationEmail:
      process.env.ADMIN_NOTIFICATION_EMAIL || fromAddress || user,
    // EMAIL_HOST is retained as an alias for older Hostinger configurations.
    smtpHost,
    smtpPort,
    smtpSecure: parseBoolean(
      process.env.SMTP_SECURE,
      smtpPort === 465
    ),
    smtpRequireTls: parseBoolean(process.env.SMTP_REQUIRE_TLS, false),
  };
}

export function getFallbackEmailConfiguration(): EmailConfiguration {
  const smtpHost =
    process.env.EMAIL_FALLBACK_SMTP_HOST ||
    process.env.EMAIL_FALLBACK_HOST;
  const provider = parseEmailProvider(
    process.env.EMAIL_FALLBACK_PROVIDER,
    smtpHost,
    "EMAIL_FALLBACK_PROVIDER"
  );
  const user = process.env.EMAIL_FALLBACK_USER;
  const fromAddress = process.env.EMAIL_FALLBACK_FROM_ADDRESS || user;
  const smtpPort = Number(process.env.EMAIL_FALLBACK_SMTP_PORT || "587");

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw createConfigurationError(
      "EMAIL_FALLBACK_SMTP_PORT must be a valid port number"
    );
  }

  return {
    provider,
    user,
    passwordConfigured: Boolean(process.env.EMAIL_FALLBACK_PASSWORD),
    fromAddress,
    fromName:
      process.env.EMAIL_FALLBACK_FROM_NAME ||
      process.env.EMAIL_FROM_NAME ||
      "Cascade Logistics",
    adminNotificationEmail: undefined,
    smtpHost,
    smtpPort,
    smtpSecure: parseBoolean(
      process.env.EMAIL_FALLBACK_SMTP_SECURE,
      smtpPort === 465
    ),
    smtpRequireTls: parseBoolean(
      process.env.EMAIL_FALLBACK_SMTP_REQUIRE_TLS,
      false
    ),
  };
}

export function getEmailFrom() {
  let configuration: EmailConfiguration;

  try {
    const primaryConfiguration = getEmailConfiguration();
    configuration = primaryConfiguration.fromAddress
      ? primaryConfiguration
      : getFallbackEmailConfiguration();
  } catch (error) {
    if (!process.env.EMAIL_FALLBACK_USER) throw error;
    configuration = getFallbackEmailConfiguration();
  }

  if (!configuration.fromAddress) {
    throw new Error(
      "EMAIL_FROM_ADDRESS, EMAIL_USER, or a fallback email user must be configured"
    );
  }

  return {
    name: configuration.fromName,
    address: configuration.fromAddress,
  };
}

function createEmailTransporter(
  attempt: EmailAttempt,
  configuration: EmailConfiguration
) {
  const { password } = attempt;
  const user = configuration.user;

  if (!user || !password) {
    const prefix = attempt.name === "primary" ? "EMAIL" : "EMAIL_FALLBACK";
    throw createConfigurationError(
      `${prefix}_USER and ${prefix}_PASSWORD must be configured`
    );
  }

  if (configuration.provider === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: password },
    });
  }

  if (!configuration.smtpHost) {
    const hostVariable =
      attempt.name === "primary" ? "SMTP_HOST" : "EMAIL_FALLBACK_SMTP_HOST";
    throw createConfigurationError(
      `${hostVariable} must be configured when the provider is "smtp"`
    );
  }

  return nodemailer.createTransport({
    host: configuration.smtpHost,
    port: configuration.smtpPort,
    secure: configuration.smtpSecure,
    requireTLS: configuration.smtpRequireTls,
    auth: { user, pass: password },
  });
}

function getEmailAttempts(): EmailAttempt[] {
  const primary: EmailAttempt = {
    name: "primary",
    resolveConfiguration: getEmailConfiguration,
    password: process.env.EMAIL_PASSWORD,
  };
  const fallback: EmailAttempt = {
    name: "fallback",
    resolveConfiguration: getFallbackEmailConfiguration,
    password: process.env.EMAIL_FALLBACK_PASSWORD,
  };
  const fallbackWasConfigured = Boolean(
    process.env.EMAIL_FALLBACK_USER || fallback.password
  );

  return fallbackWasConfigured ? [primary, fallback] : [primary];
}

function getEmailErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return {} as {
      code?: string;
      responseCode?: number;
      accepted?: unknown[];
    };
  }

  return error as {
    code?: string;
    responseCode?: number;
    accepted?: unknown[];
  };
}

function canUseFallback(error: unknown) {
  const details = getEmailErrorDetails(error);

  // Do not retry if the first server reports that it accepted the message.
  if (Array.isArray(details.accepted) && details.accepted.length > 0) {
    return false;
  }

  if (
    details.code &&
    [
      "EMAIL_CONFIG",
      "EAUTH",
      "ECONNECTION",
      "EDNS",
      "ESOCKET",
      "ETIMEDOUT",
    ].includes(details.code)
  ) {
    return true;
  }

  return Boolean(
    details.responseCode &&
      [421, 432, 454, 530, 534, 535].includes(details.responseCode)
  );
}

function fromForAttempt(configuration: EmailConfiguration) {
  if (!configuration.fromAddress) {
    throw createConfigurationError("An email sender address must be configured");
  }

  return {
    name: configuration.fromName,
    address: configuration.fromAddress,
  };
}

export function getEmailTransporter() {
  const attempts = getEmailAttempts();

  return {
    async sendMail(options: SendMailOptions) {
      let lastError: unknown;

      for (const [index, attempt] of attempts.entries()) {
        try {
          const configuration = attempt.resolveConfiguration();
          return await createEmailTransporter(attempt, configuration).sendMail({
            ...options,
            from: fromForAttempt(configuration),
          });
        } catch (error) {
          lastError = error;
          const nextAttempt = attempts[index + 1];

          if (!nextAttempt || !canUseFallback(error)) {
            throw error;
          }

          const details = getEmailErrorDetails(error);
          console.warn("Primary email delivery failed; trying fallback", {
            code: details.code || "UNKNOWN",
            responseCode: details.responseCode || null,
          });
        }
      }

      throw lastError;
    },
    async verify() {
      let lastError: unknown;

      for (const [index, attempt] of attempts.entries()) {
        try {
          const configuration = attempt.resolveConfiguration();
          await createEmailTransporter(attempt, configuration).verify();
          return { activeTransport: attempt.name };
        } catch (error) {
          lastError = error;
          const nextAttempt = attempts[index + 1];

          if (!nextAttempt || !canUseFallback(error)) {
            throw error;
          }
        }
      }

      throw lastError;
    },
  };
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

export function getAdminNotificationEmail() {
  let primaryConfiguration: EmailConfiguration | undefined;
  try {
    primaryConfiguration = getEmailConfiguration();
  } catch (error) {
    if (!process.env.EMAIL_FALLBACK_USER) throw error;
  }

  const recipient =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    primaryConfiguration?.fromAddress ||
    primaryConfiguration?.user ||
    getFallbackEmailConfiguration().fromAddress ||
    getFallbackEmailConfiguration().user;
  if (!recipient) {
    throw new Error(
      "ADMIN_NOTIFICATION_EMAIL, EMAIL_FROM_ADDRESS, or EMAIL_USER must be configured"
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

  await getEmailTransporter().sendMail({
    from: getEmailFrom(),
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

  await getEmailTransporter().sendMail({
    from: getEmailFrom(),
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

  await getEmailTransporter().sendMail({
    from: getEmailFrom(),
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

  await getEmailTransporter().sendMail({
    from: getEmailFrom(),
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

  await getEmailTransporter().sendMail({
    from: getEmailFrom(),
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
  const awaitingProof =
    input.status === "arrived-at-warehouse-pending-proof";
  const statusLabel = awaitingProof
    ? "Arrived at Warehouse – Pending Proof"
    : input.status
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

  await getEmailTransporter().sendMail({
    from: getEmailFrom(),
    to: input.email,
    subject: `Shipment update: ${input.trackingId}`,
    text: `Hello ${input.firstName}, your shipment ${input.trackingId} has been updated. Status: ${statusLabel}.${input.currentLocation ? ` Current location: ${input.currentLocation}.` : ""}${deliveryText ? ` Estimated delivery: ${deliveryText}.` : ""}${awaitingProof ? ` We are awaiting your proof of purchase. You may submit multiple files for shipments with multiple purchase shop tracking numbers: ${trackingUrl}` : ""}`,
    html: messageShell(`
      <p>Hello ${escapeHtml(input.firstName)},</p>
      <p>Your shipment <strong>${escapeHtml(input.trackingId)}</strong> has been updated.</p>
      <p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
      ${input.currentLocation ? `<p><strong>Current location:</strong> ${escapeHtml(input.currentLocation)}</p>` : ""}
      ${deliveryText ? `<p><strong>Estimated delivery:</strong> ${escapeHtml(deliveryText)}</p>` : ""}
      ${awaitingProof ? `<div style="margin:22px 0;padding:16px;border:1px solid #f59e0b;background:#fffbeb;border-radius:8px"><strong>Proof of purchase required</strong><p style="margin:8px 0 0">We are awaiting your proof of purchase. You can upload multiple files if this shipment has more than one Purchase Shop Tracking Number.</p></div>` : ""}
      <p style="margin:26px 0">
        <a href="${trackingUrl}" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">${awaitingProof ? "Submit proof of purchase" : "Track shipment"}</a>
      </p>
    `),
  });
}

export async function sendAdminProofOfPurchaseNotification(input: {
  customerName: string;
  customerEmail: string;
  trackingId: string;
  proofCount: number;
}) {
  const shipmentUrl = `${getBaseUrl()}/admin-dashboard/shipments?shipment=${encodeURIComponent(input.trackingId)}`;
  const safeName = escapeHtml(input.customerName);
  const safeEmail = escapeHtml(input.customerEmail);
  const safeTrackingId = escapeHtml(input.trackingId);

  await getEmailTransporter().sendMail({
    from: getEmailFrom(),
    to: getAdminNotificationEmail(),
    subject: `Proof of purchase submitted: ${input.trackingId}`,
    text: `${input.customerName} (${input.customerEmail}) uploaded ${input.proofCount} proof-of-purchase file${input.proofCount === 1 ? "" : "s"} for shipment ${input.trackingId}. Review: ${shipmentUrl}`,
    html: messageShell(`
      <h2 style="margin-top:0">Proof of purchase submitted</h2>
      <p><strong>Customer:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Shipment:</strong> ${safeTrackingId}</p>
      <p><strong>Files submitted:</strong> ${input.proofCount}</p>
      <p style="margin:26px 0">
        <a href="${shipmentUrl}" style="background:#315694;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block">Review shipment proof</a>
      </p>
    `),
  });
}
