import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { PartnerEnvironment } from "./types.ts";

const KEY_ID_BYTES = 12;
const SECRET_BYTES = 32;
const HASH_VERSION = "v1";
const apiKeyPattern =
  /^csl_(test|live)_([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{43})$/;

export interface GeneratedPartnerApiKey {
  apiKey: string;
  keyPrefix: string;
  secretHash: string;
  environment: PartnerEnvironment;
}

export interface ParsedPartnerApiKey {
  keyPrefix: string;
  secret: string;
  environment: PartnerEnvironment;
}

function assertPepper(pepper: string): void {
  if (pepper.length < 32) {
    throw new Error("PARTNER_API_KEY_PEPPER must contain at least 32 characters");
  }
}

export function digestPartnerApiSecret(
  keyPrefix: string,
  secret: string,
  pepper: string,
): string {
  assertPepper(pepper);
  const digest = createHmac("sha256", pepper)
    .update(`${keyPrefix}.${secret}`, "utf8")
    .digest("hex");
  return `${HASH_VERSION}:${digest}`;
}

export function generatePartnerApiKey(
  environment: PartnerEnvironment,
  pepper: string,
  entropy: (size: number) => Buffer = randomBytes,
): GeneratedPartnerApiKey {
  const keyId = entropy(KEY_ID_BYTES).toString("base64url");
  const secret = entropy(SECRET_BYTES).toString("base64url");
  const keyPrefix = `csl_${environment}_${keyId}`;

  return {
    apiKey: `${keyPrefix}.${secret}`,
    keyPrefix,
    secretHash: digestPartnerApiSecret(keyPrefix, secret, pepper),
    environment,
  };
}

export function parsePartnerApiKey(value: string): ParsedPartnerApiKey | null {
  const match = apiKeyPattern.exec(value);
  if (!match) return null;
  return {
    environment: match[1] as PartnerEnvironment,
    keyPrefix: `csl_${match[1]}_${match[2]}`,
    secret: match[3],
  };
}

export function parseBearerPartnerApiKey(
  authorization: string | null,
): ParsedPartnerApiKey | null {
  if (!authorization) return null;
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  return match ? parsePartnerApiKey(match[1]) : null;
}

export function verifyPartnerApiSecret(input: {
  keyPrefix: string;
  secret: string;
  storedHash: string;
  pepper: string;
}): boolean {
  const expected = digestPartnerApiSecret(
    input.keyPrefix,
    input.secret,
    input.pepper,
  );
  const expectedBytes = Buffer.from(expected, "utf8");
  const storedBytes = Buffer.from(input.storedHash, "utf8");
  return (
    expectedBytes.length === storedBytes.length &&
    timingSafeEqual(expectedBytes, storedBytes)
  );
}
