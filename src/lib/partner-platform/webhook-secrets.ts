import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { EncryptedWebhookSecret } from "./types.ts";

function encryptionKey(value?: string): Buffer {
  const material = value || process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  if (!material || material.length < 32) {
    throw new Error("WEBHOOK_SECRET_ENCRYPTION_KEY must contain at least 32 characters");
  }
  return createHash("sha256").update(material, "utf8").digest();
}

export function generateWebhookSecret(
  entropy: () => Buffer = () => randomBytes(32),
): string {
  return `whsec_${entropy().toString("base64url")}`;
}

export function encryptWebhookSecret(
  secret: string,
  keyMaterial?: string,
  iv = randomBytes(12),
): EncryptedWebhookSecret {
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(keyMaterial), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return {
    version: "1",
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

export function decryptWebhookSecret(
  encrypted: EncryptedWebhookSecret,
  keyMaterial?: string,
): string {
  if (encrypted.version !== "1") throw new Error("Unsupported webhook secret version");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(keyMaterial),
    Buffer.from(encrypted.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function signWebhookPayload(input: {
  secret: string;
  timestamp: number;
  body: string;
}): string {
  const digest = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.body}`, "utf8")
    .digest("hex");
  return `v1=${digest}`;
}

export function verifyWebhookSignature(input: {
  secret: string;
  timestamp: string | number;
  body: string;
  signature: string;
  now?: Date;
  toleranceSeconds?: number;
}): boolean {
  const timestamp = Number(input.timestamp);
  if (!Number.isInteger(timestamp) || timestamp <= 0) return false;
  const nowSeconds = Math.floor((input.now || new Date()).getTime() / 1000);
  if (Math.abs(nowSeconds - timestamp) > (input.toleranceSeconds ?? 300)) {
    return false;
  }
  const expected = signWebhookPayload({
    secret: input.secret,
    timestamp,
    body: input.body,
  });
  const received = Buffer.from(input.signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    received.length === expectedBuffer.length &&
    timingSafeEqual(received, expectedBuffer)
  );
}
