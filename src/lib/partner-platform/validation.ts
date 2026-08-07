import type { z } from "zod";
import { partnerApiError } from "./errors.ts";

export async function parsePartnerJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw partnerApiError("validation_failed", "Request body must be valid JSON", 422);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    throw partnerApiError(
      "validation_failed",
      `${field}${issue?.message || "Invalid request"}`,
      422,
    );
  }
  return parsed.data;
}

export function parsePartnerQuery<T extends z.ZodType>(
  request: Request,
  schema: T,
): z.output<T> {
  const url = new URL(request.url);
  const value = Object.fromEntries(url.searchParams.entries());
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    throw partnerApiError(
      "validation_failed",
      `${field}${issue?.message || "Invalid query"}`,
      422,
    );
  }
  return parsed.data;
}
