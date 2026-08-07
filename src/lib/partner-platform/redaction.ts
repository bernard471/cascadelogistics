import { createHash } from "node:crypto";

const sensitiveKeyPattern =
  /authorization|cookie|password|secret|token|api.?key|credential|webhook.?secret/i;
const apiKeyValuePattern =
  /csl_(?:test|live)_[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{43}/g;

export function sanitizeLogText(value: string, maximumLength = 300): string {
  return value
    .replace(apiKeyValuePattern, "[REDACTED_API_KEY]")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .slice(0, maximumLength);
}

export function redactSensitiveData(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 8) return "[TRUNCATED]";
  if (typeof value === "string") return sanitizeLogText(value, 2000);
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactSensitiveData(item, depth + 1));
  }
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 100)
      .map(([key, nested]) => [
        key,
        sensitiveKeyPattern.test(key)
          ? "[REDACTED]"
          : redactSensitiveData(nested, depth + 1),
      ]),
  );
}

export function fingerprintSource(value: string, salt: string): string {
  return `sha256:${createHash("sha256")
    .update(`${salt}:${value}`, "utf8")
    .digest("hex")}`;
}
