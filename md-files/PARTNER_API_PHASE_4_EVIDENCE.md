# Partner API Platform - Phase 4 Evidence

**Project:** Cascade Logistics  
**Phase:** 4 - Multi-file uploads and core shipment API  
**Completed:** 2026-08-06  
**Production migration:** Not executed  
**Deployment:** Not performed

## 1. Outcome

Authenticated partner applications can now create private multi-file upload intents, attach the completed uploads to an idempotently-created shipment, list and retrieve their shipments, edit or cancel a pending shipment, and list, view or remove permitted shipment documents.

Partner shipments use the existing `shipments` collection and dashboard-compatible field model. Organization, application and environment ownership are derived from the authenticated API credential and cannot be supplied by the request body.

Dedicated timeline and wholesale-tracking-number endpoints remain disabled because the approved plan introduces them in Phase 6. Admin/staff presentation changes remain reserved for Phase 5, and outbox delivery/webhooks remain reserved for Phase 7.

## 2. Public Phase 4 routes

All routes use the Phase 3 authentication, scope, rate-limit, operation-control, request-ID, audit and redacted logging pipeline.

| Method | Route | Required scope | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/uploads` | `documents:write` | Create one to 20 private upload intents |
| `POST` | `/api/v1/shipments` | `shipments:create` | Create an idempotent partner shipment; attaching uploads also requires `documents:write` |
| `GET` | `/api/v1/shipments` | `shipments:read` | Cursor-paginated, filtered shipment list |
| `GET` | `/api/v1/shipments/{shipmentId}` | `shipments:read` | Shipment detail with complete accepted-field parity |
| `PATCH` | `/api/v1/shipments/{shipmentId}` | `shipments:update` | Edit allowed fields while the shipment is pending |
| `POST` | `/api/v1/shipments/{shipmentId}/cancel` | `shipments:cancel` | Audit and cancel a pending shipment |
| `GET` | `/api/v1/shipments/{shipmentId}/documents` | `documents:read` | List safe document metadata |
| `GET` | `/api/v1/shipments/{shipmentId}/documents/{documentId}` | `documents:read` | Stream a private document inline or as a download |
| `DELETE` | `/api/v1/shipments/{shipmentId}/documents/{documentId}` | `documents:write` | Remove a document while the shipment is pending |

`GET /api/v1/me` from Phase 3 remains available. No timeline, tracking-number, invoice, payment-proof, webhook, partner-portal or super-admin-console route was added in this phase.

## 3. Private multi-file upload flow

The upload-intent endpoint accepts between one and 20 files per request. Each file is limited to 10 MB and must be one of:

- JPEG, PNG or WebP.
- PDF.
- Microsoft Word `.doc` or `.docx`.

Every intent receives an opaque `upl_` identifier and an exact private Vercel Blob pathname:

```text
partner-uploads/{test-or-live}/{organization-public-id}/{upload-public-id}/{safe-file-name}
```

The response provides a short-lived client token for that exact path, MIME type and declared size. Tokens are not stored. Random suffixes and overwrite are disabled. Intent lifetime is 15 minutes.

Shipment creation re-reads Blob metadata and verifies all of the following before attachment:

- The intent belongs to the authenticated organization, application and environment.
- The intent is pending, unexpired and not already consumed.
- The returned pathname exactly matches the reserved pathname.
- The Blob URL is HTTPS on an exact trusted private Vercel Blob hostname suffix.
- MIME type and byte size match the intent and policy.
- Duplicate upload IDs are rejected.

Validated uploads become shipment documents with opaque `doc_` IDs. The consumed intent is linked to the resulting shipment. Daily organization upload-byte limits are enforced before new intents are issued.

## 4. Abandoned upload cleanup

A protected internal cleanup route was added at `/api/internal/partner-upload-cleanup`. It requires `CRON_SECRET`, and `vercel.json` schedules it daily at `03:47` UTC.

Expired pending uploads are deleted from Blob storage and marked abandoned with a database cleanup time. Reservations receive a one-hour recovery window: a stale reservation already attached to a shipment is repaired to `consumed` without deleting its Blob, while a stale unlinked reservation is removed as an orphan. Fresh reservations and consumed uploads are left alone. A storage deletion failure restores the prior state and does not falsely mark the upload as removed.

## 5. Idempotent shipment creation

`POST /api/v1/shipments` requires an `Idempotency-Key` header. Keys are validated, hashed before storage and retained for 24 hours. The canonical request body is hashed separately.

- Same key and same body returns the original status/body with `Idempotency-Replayed: true`.
- Same key and different body returns `idempotency_key_reused` with HTTP 409.
- A genuinely concurrent in-progress request returns `request_in_progress` with HTTP 409 or replays the completed result.
- Unique database indexes exist on the tenant/operation/key record and the shipment's idempotency-record reference.
- Recovery checks the already-created shipment before retrying work after an interrupted response.

This prevents duplicate shipments even when a partner retries because of a timeout or connection loss. Daily organization shipment limits apply only to genuinely new creation attempts, not completed replays.

## 6. Shipment behavior and field parity

Creation preserves and returns every accepted shipment field:

- External customer and reference IDs.
- Complete sender and receiver contact/address data.
- Package type, description, weight, dimensions and quantity.
- Declared value and three-letter currency.
- Goods type and service type.
- Special instructions.
- All wholesale purchase/tracking entries.
- All attached document metadata.
- Cascade tracking ID, status, pricing, timeline and timestamps.
- Safe partner source metadata.

The stored record uses the existing shipment shape, so the admin/staff dashboard continues to read the same operational data rather than a separate partner-only shipment table.

Only pending partner shipments may be edited or cancelled through these endpoints. Edits generate the same canonical customer-update timeline structure used by the existing shipment domain layer. Cancellation records a partner API audit entry. Non-pending edits and document removals return `shipment_not_editable`.

## 7. Listing and tenant isolation

The shipment list supports a maximum page size of 100, opaque cursor pagination, and filters for status, external reference and creation date range.

Every shipment, upload, document, quota and outbox query is constrained by the credential-derived organization and environment. Application ownership is also applied when the organization's configured visibility mode is `creating_client`. Foreign resources deliberately return HTTP 404 rather than revealing their existence.

The isolation suite creates two organizations inside the same database. It verifies that the second organization cannot reserve the first organization's upload, retrieve its shipment or delete its document, and that the forbidden document request never reaches Blob deletion.

## 8. Domain-event outbox

Phase 4 writes durable, tenant-scoped outbox records for:

- `shipment.created`.
- `shipment.updated`.
- `shipment.cancelled`.
- `shipment.document_removed`.

Events use opaque `evt_` IDs, safe redacted payloads and pending dispatch state. Shipment creation events are tied to the idempotency record so a replay cannot create a duplicate event. No webhook delivery or external network call occurs in Phase 4.

## 9. Verification

The Phase 4 suite covers:

- One and multiple upload intents.
- Exact organization/environment paths and short-lived tokens.
- MIME, exact declared size, count and daily upload quota rejection.
- Complete shipment field parity with multiple documents.
- Same-body replay, changed-body rejection and concurrent duplicates.
- Cursor pagination and filters.
- Pending edits, audited cancellation and invalid-state rejection.
- Same-database cross-tenant shipment, upload and document denial.
- Private document retrieval metadata and deletion.
- Expired-upload cleanup, stale orphan removal and attached-reservation recovery.
- Daily shipment quota behavior with idempotent replay.

| Check | Result |
|---|---|
| Phase 4 behavioral/isolation suite | Passed: 12/12 |
| Full Phase 1-4 regression/security suite | Passed: 41/41 |
| TypeScript | Passed: no errors |
| ESLint | Passed: zero warnings |
| Production build | Passed: Next.js 15.5.21, 109 static pages generated |
| Phase 4 route inventory | Passed: only uploads, core shipments and documents added |
| Diff integrity | Passed: no whitespace errors |

MongoDB Atlas DNS and real private Blob credentials were not available to this execution environment, so no external sandbox write was attempted. The exact service paths, indexes, idempotency behavior and isolation rules were exercised against the disposable in-process Mongo-compatible database with deterministic private-Blob metadata. The production build completed successfully.

## 10. Phase gate

Phase 4 is complete. Phase 5 admin/staff integration must not begin until the owner explicitly approves it. No files were staged, committed, pushed or deployed. No production migration, organization, credential, upload, shipment or Blob object was created.
