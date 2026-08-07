# Partner API Platform - Phase 6 Evidence

**Project:** Cascade Logistics  
**Phase:** 6 - Tracking, invoices and payment proofs  
**Completed:** 2026-08-06  
**Production migration:** Not executed  
**Deployment:** Not performed

## 1. Outcome

The authenticated partner API now covers shipment lifecycle tracking, wholesale tracking numbers, invoice metadata and private downloads, and multi-file payment-proof submission, listing and private downloads. Admin invoice replacement and payment approval/rejection now create tenant-scoped domain events that will feed Phase 7 webhooks.

All partner reads derive ownership from the authenticated organization, environment and the organization's configured application-visibility policy. Partner responses use opaque public IDs and authorized proxy links; private Blob URLs, pathnames, internal MongoDB IDs and staff identities are not returned.

## 2. Routes completed

| Method | Route | Required scope(s) |
|---|---|---|
| `GET` | `/api/v1/shipments/{shipmentId}/timeline` | `tracking:read` |
| `GET` | `/api/v1/shipments/{shipmentId}/tracking-numbers` | `tracking:read` |
| `GET` | `/api/v1/shipments/{shipmentId}/invoice` | `invoices:read` |
| `GET` | `/api/v1/shipments/{shipmentId}/invoice/file` | `invoices:read` |
| `POST` | `/api/v1/shipments/{shipmentId}/payment-proofs` | `payments:write`, `documents:write` |
| `GET` | `/api/v1/shipments/{shipmentId}/payment-proofs` | `payments:read` |
| `GET` | `/api/v1/payment-proofs/{paymentProofId}/file` | `payments:read` |

The payment-proof create route requires `Idempotency-Key`. A replay returns the stored response with `Idempotent-Replayed: true`; using the same key with a different request remains a conflict.

## 3. Timeline and tracking numbers

The timeline endpoint returns the same canonical lifecycle stored on the shipment and already used by admin, customer and public tracking views. It includes safe update-image availability metadata and human-readable change details without returning the private image URL.

The tracking-number endpoint returns the Cascade tracking number plus every wholesale purchase name/tracking-number pair tied to the shipment. Shipment responses continue to include the complete special-instructions field, while timeline entries describe when instructions were provided or changed.

## 4. Invoice handling

Invoice metadata contains only the partner shipment ID, Cascade tracking ID, original file name, upload time and an authorized download route. It does not expose the Blob URL, Blob pathname or uploader ID.

New partner-shipment invoices use a tenant-owned private path containing environment, organization public ID, shipment public ID and the `invoices` category. Replacing an invoice updates the shipment, emits `invoice.updated`, and attempts to remove the previous Blob only after the database update succeeds. A failed cleanup is recorded in `orphaned_blobs` for later recovery. The first upload emits `invoice.available`.

The partner download route streams only a trusted private Vercel Blob through authenticated authorization. It never redirects to a public Blob URL. Responses use `Cache-Control: private, no-store`, a sanitized `Content-Disposition`, and `X-Content-Type-Options: nosniff`.

## 5. Payment proofs

The approved first-release decision is one payment-proof submission containing one to five files. Files use the Phase 4 private upload-intent flow and its MIME, size, ownership, expiry and exact-path validation. The proof stores all files with opaque document IDs.

For compatibility with the current admin/customer payment screens, the first file is also stored in the existing singular `proofImageUrl` and `proofImageName` fields. The admin payment modal now renders and downloads every submitted file, including non-image documents, and identifies a partner organization as the submitter when no Cascade user exists.

Only one `pending` or `verified` proof may exist for a shipment. A rejected proof permits a new submission. Partner metadata includes amount, currency, method, status, rejection reason, timestamps, notes and authorized file links, but no storage coordinates.

Admin/staff decisions immediately appear in the partner list and create:

- `payment_proof.received` when the partner submits.
- `payment_proof.approved` when an internal operator verifies it.
- `payment_proof.rejected` with the safe rejection reason when rejected.

The submission also creates an idempotent admin notification so operational staff can find the proof in the existing payment workflow.

## 6. Tenant and private-file isolation

Invoice, proof-list and proof-file lookups apply organization, environment and configured application visibility before returning data. A resource owned by another organization receives the same `resource_not_found` response as a nonexistent resource.

Partner invoice and shipment-update uploads now use paths shaped as:

`partner-files/{environment}/{organizationPublicId}/{shipmentPublicId}/{category}/{timestamp}-{safeFileName}`

Private file endpoints require an authenticated API credential with the relevant scope, re-check tenant ownership, accept only the exact trusted private Blob hostname suffix and proxy the content with no-store headers. API serializers are covered by regression tests proving that neither Blob URLs nor pathnames are present.

## 7. Data model and indexes

Payment proofs now support additive partner metadata: public ID, organization, application, environment, shipment public ID, idempotency record, submitting principal and multiple proof files. Existing dashboard payment records remain compatible.

The index catalog and runtime index guard include:

- Unique partial payment-proof public ID.
- Tenant/environment/shipment/submission-time lookup.
- Unique partial payment-proof idempotency record.

These definitions are ready for the guarded migration workflow, but no production migration was run.

## 8. Verification

The Phase 6 suite covers:

- Multiple proof files, schema limits and duplicate upload IDs.
- Timeline/special-instruction parity and every wholesale tracking number.
- Cross-organization invoice, payment-list and proof-file denial.
- Invoice metadata redaction, first upload and replacement events.
- Idempotent payment submission and safe response serialization.
- Active-proof rejection and resubmission after an admin rejection.
- Admin approval visibility and event actor attribution.
- Environment/organization/shipment ownership in private paths.
- Absence of Blob URLs and pathnames in partner responses.

| Check | Result |
|---|---|
| Phase 6 integration/security suite | Passed: 10/10 |
| Full Phase 1-6 regression/security suite | Passed: 57/57 |
| TypeScript | Passed: no errors |
| ESLint | Passed: zero warnings |
| Production build | Passed: Next.js 15.5.21, 109 pages generated |
| Phase 6 route discovery | Passed: all 7 routes included in the production build |
| Diff integrity | Passed: no whitespace errors |

MongoDB Atlas DNS and real private Blob credentials were not available to this execution environment. Tenant behavior, idempotency, events, index creation and isolation were exercised against the disposable in-process Mongo-compatible database with deterministic private Blob metadata. The real Blob network was not written to and production was not contacted.

## 9. Phase gate

Phase 6 is complete. Phase 7 durable delivery, webhook endpoint storage, signatures, retries and replay have not begun and require explicit owner approval. No files were staged, committed, pushed or deployed. No production migration, partner request, notification, event or Blob object was created.
