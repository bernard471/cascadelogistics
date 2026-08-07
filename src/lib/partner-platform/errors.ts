export type PartnerApiErrorCode =
  | "authentication_required"
  | "invalid_api_key"
  | "api_key_expired"
  | "api_key_revoked"
  | "integration_suspended"
  | "insufficient_scope"
  | "resource_not_found"
  | "validation_failed"
  | "idempotency_key_required"
  | "idempotency_key_reused"
  | "request_in_progress"
  | "request_too_large"
  | "operation_paused"
  | "rate_limit_exceeded"
  | "upload_not_found"
  | "invalid_upload_owner"
  | "invalid_document_type"
  | "document_too_large"
  | "shipment_not_editable"
  | "pilot_not_ready"
  | "active_payment_proof_exists"
  | "internal_error";

export class PartnerApiError extends Error {
  readonly code: PartnerApiErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(input: {
    code: PartnerApiErrorCode;
    message: string;
    status: number;
    retryAfterSeconds?: number;
  }) {
    super(input.message);
    this.name = "PartnerApiError";
    this.code = input.code;
    this.status = input.status;
    this.retryAfterSeconds = input.retryAfterSeconds;
  }
}

export function partnerApiError(
  code: PartnerApiErrorCode,
  message: string,
  status: number,
  retryAfterSeconds?: number,
): PartnerApiError {
  return new PartnerApiError({ code, message, status, retryAfterSeconds });
}
