// Reserved for a possible future reCAPTCHA rollout. No active route calls this
// verifier while registration relies on rate limiting and manual KYC review.
type RecaptchaVerificationResponse = {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyRecaptchaToken(token: string, ipAddress?: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV !== "production" && token === "development-bypass") {
      return { success: true, bypassed: true };
    }
    return { success: false, reason: "Anti-bot verification is not configured" };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (ipAddress && ipAddress !== "unknown") {
    body.set("remoteip", ipAddress);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    return { success: false, reason: "Anti-bot verification service is unavailable" };
  }

  const result = (await response.json()) as RecaptchaVerificationResponse;
  return {
    success: result.success,
    reason: result.success ? undefined : "Anti-bot verification failed",
  };
}
