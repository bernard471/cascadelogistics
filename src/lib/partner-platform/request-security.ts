import { partnerApiError } from "./errors.ts";

export const partnerApiMaximumJsonBytes = 1024 * 1024;

export function assertPartnerRequestSize(request: Request): void {
  const supplied = request.headers.get("content-length");
  if (!supplied || !/^\d+$/.test(supplied)) return;
  if (Number(supplied) > partnerApiMaximumJsonBytes) {
    throw partnerApiError(
      "request_too_large",
      "Request body exceeds the 1 MiB partner API limit",
      413,
    );
  }
}
