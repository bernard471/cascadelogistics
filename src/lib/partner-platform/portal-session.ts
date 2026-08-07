import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const partnerPortalCookieName = "cascade_partner_session";
const sessionLifetimeSeconds = 12 * 60 * 60;

interface PartnerPortalSessionPayload {
  version: 1;
  userId: string;
  organizationId: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function getPartnerPortalSessionSecret() {
  const value = process.env.PARTNER_PORTAL_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("PARTNER_PORTAL_SESSION_SECRET must contain at least 32 characters");
  return value;
}

export function createPartnerPortalSessionToken(input: { userId: string; organizationId: string; secret?: string; now?: Date }) {
  const now = input.now || new Date();
  const payload: PartnerPortalSessionPayload = {
    version: 1, userId: input.userId, organizationId: input.organizationId,
    issuedAt: Math.floor(now.getTime() / 1000),
    expiresAt: Math.floor(now.getTime() / 1000) + sessionLifetimeSeconds,
    nonce: randomBytes(12).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, input.secret || getPartnerPortalSessionSecret())}`;
}

export function verifyPartnerPortalSessionToken(input: { token: string; secret?: string; now?: Date }): PartnerPortalSessionPayload | null {
  const [encoded, supplied, extra] = input.token.split(".");
  if (!encoded || !supplied || extra) return null;
  const expected = Buffer.from(signature(encoded, input.secret || getPartnerPortalSessionSecret()));
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PartnerPortalSessionPayload;
    const now = Math.floor((input.now || new Date()).getTime() / 1000);
    if (payload.version !== 1 || !payload.userId || !payload.organizationId || payload.expiresAt <= now || payload.issuedAt > now + 60) return null;
    return payload;
  } catch { return null; }
}

export function partnerPortalCookie(token: string) {
  return `${partnerPortalCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function expiredPartnerPortalCookie() {
  return `${partnerPortalCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function readPartnerPortalCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  for (const entry of cookieHeader.split(";")) {
    const [name, ...value] = entry.trim().split("=");
    if (name === partnerPortalCookieName) return value.join("=") || null;
  }
  return null;
}
