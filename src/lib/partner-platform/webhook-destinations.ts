import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { partnerApiError } from "./errors.ts";

export interface ValidatedWebhookDestination {
  url: string;
  hostname: string;
  address: string;
  family: 4 | 6;
}

export type WebhookHostnameResolver = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

function publicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function publicIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (normalized.startsWith("ff")) return false;
  if (normalized.startsWith("2001:db8")) return false;
  if (normalized.startsWith("::ffff:")) {
    return publicIpv4(normalized.slice("::ffff:".length));
  }
  return true;
}

export function isPublicWebhookAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4
    ? publicIpv4(address)
    : family === 6
      ? publicIpv6(address)
      : false;
}

async function defaultResolver(hostname: string) {
  return lookup(hostname, { all: true, verbatim: true });
}

export async function validateWebhookDestination(
  value: string,
  resolver: WebhookHostnameResolver = defaultResolver,
): Promise<ValidatedWebhookDestination> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw partnerApiError("validation_failed", "Webhook URL is invalid", 422);
  }
  if (
    url.protocol !== "https:" ||
    url.port && url.port !== "443" ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw partnerApiError(
      "validation_failed",
      "Webhook URL must use HTTPS on port 443 without credentials or fragments",
      422,
    );
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw partnerApiError("validation_failed", "Webhook destination is not allowed", 422);
  }
  let addresses: Array<{ address: string; family: number }>;
  if (isIP(hostname)) {
    addresses = [{ address: hostname, family: isIP(hostname) }];
  } else {
    try {
      addresses = await resolver(hostname);
    } catch {
      throw partnerApiError("validation_failed", "Webhook hostname could not be resolved", 422);
    }
  }
  if (
    addresses.length === 0 ||
    addresses.some((entry) => !isPublicWebhookAddress(entry.address))
  ) {
    throw partnerApiError("validation_failed", "Webhook destination is not allowed", 422);
  }
  const selected = addresses[0];
  url.hostname = hostname;
  url.port = "";
  return {
    url: url.toString(),
    hostname,
    address: selected.address,
    family: selected.family === 6 ? 6 : 4,
  };
}
