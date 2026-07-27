import crypto from "crypto";

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashIdentityNumber(documentType: string, documentNumber: string) {
  const secret = process.env.IDENTITY_HASH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("IDENTITY_HASH_SECRET or NEXTAUTH_SECRET must be configured");
  }

  const normalized = `${documentType}:${documentNumber.replace(/[\s-]/g, "").toUpperCase()}`;
  return crypto.createHmac("sha256", secret).update(normalized).digest("hex");
}

export function getIdentityRetentionDays() {
  const configured = Number.parseInt(process.env.IDENTITY_RETENTION_DAYS || "90", 10);
  return Number.isFinite(configured) && configured >= 1 ? configured : 90;
}

export function getPrivateBlobToken() {
  // Vercel automatically provisions BLOB_READ_WRITE_TOKEN for a connected
  // store. PRIVATE_BLOB_READ_WRITE_TOKEN remains an optional override for
  // projects that connect separate public and private stores with prefixes.
  return (
    process.env.PRIVATE_BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN
  );
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function sanitizeFileName(fileName: string) {
  return (
    fileName
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "upload"
  );
}
