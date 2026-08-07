# Partner API Platform - Phase 7 Evidence

**Project:** Cascade Logistics  
**Phase:** 7 - Durable events and signed webhooks  
**Completed:** 2026-08-06  
**Production migration:** Not executed  
**Deployment:** Not performed

## 1. Outcome

Cascade now has a durable, tenant-scoped webhook delivery system built on the domain-event outbox created in Phases 4–6. Shipment, invoice and payment actions write events without waiting for a partner receiver. A separate worker creates one delivery per subscribed endpoint, signs the exact JSON body, delivers it to a prevalidated public HTTPS destination, retries transient failures, records sanitized attempts and supports manual replay.

The delivery model is intentionally **at least once**. Deployment interruption or a network ambiguity can cause the same event to be sent again. Every payload and request carries the stable opaque event ID so receivers can deduplicate. `occurredAt` is authoritative for lifecycle ordering; receivers must tolerate delayed or out-of-order delivery.

## 2. Event catalogue

All events use schema version `1`:

- `shipment.created`
- `shipment.updated`
- `shipment.cancelled`
- `shipment.document_removed`
- `shipment.deleted`
- `invoice.available`
- `invoice.updated`
- `payment_proof.received`
- `payment_proof.approved`
- `payment_proof.rejected`
- `webhook.test`

Business actions store a redacted outbox event first. No shipment, invoice or payment route performs an immediate outbound webhook request. Existing idempotency-record/event indexes prevent the same idempotent business operation from creating the same event twice.

## 3. Partner routes

All routes require an authenticated API credential with `webhooks:manage`. Ownership is fixed to the credential's organization, application and test/live environment.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v1/webhook-endpoints` | List the application's endpoints |
| `POST` | `/api/v1/webhook-endpoints` | Create an endpoint and reveal its signing secret once |
| `PATCH` | `/api/v1/webhook-endpoints/{endpointId}` | Change URL, events, status or rotate the secret |
| `DELETE` | `/api/v1/webhook-endpoints/{endpointId}` | Soft-delete an endpoint |
| `POST` | `/api/v1/webhook-endpoints/{endpointId}/test` | Queue a targeted durable test event |
| `GET` | `/api/v1/webhook-deliveries` | Inspect sanitized application delivery status |
| `POST` | `/api/v1/webhook-deliveries/{deliveryId}/replay` | Queue an authorized manual replay |

An application may own up to ten non-deleted endpoints. Event subscriptions are explicit. An endpoint never receives another application's events, even when both applications belong to the same organization.

## 4. Signing secrets

Endpoint signing secrets use the `whsec_` format and are generated from 32 random bytes. The full value is returned only in the successful create or rotation response. Lists and later reads return only a short prefix.

The database stores an AES-256-GCM encrypted secret with a random IV and authentication tag. The encryption key is derived from the separate `WEBHOOK_SECRET_ENCRYPTION_KEY` environment variable, which must contain at least 32 characters. The API-key pepper, NextAuth secret and webhook encryption key are deliberately separate.

Rotation replaces the encrypted signing secret atomically and creates a redacted partner audit entry. Deleted endpoints retain only encrypted historical configuration and cannot receive new deliveries.

## 5. Signature contract

The worker serializes one exact JSON body containing:

- `id`
- `type`
- `apiVersion`
- `environment`
- `occurredAt`
- `data`

It signs:

`{unixTimestamp}.{exactRawBody}`

using HMAC-SHA256 and the endpoint secret. Requests include:

- `X-Cascade-Event-Id`
- `X-Cascade-Event-Type`
- `X-Cascade-Webhook-Timestamp`
- `X-Cascade-Webhook-Signature: v1={hexDigest}`
- `Content-Type: application/json`
- `User-Agent: Cascade-Logistics-Webhooks/1.0`

The included verifier uses constant-time comparison and rejects timestamps outside a configurable replay window, defaulting to five minutes. Receivers must verify the raw request bytes before parsing JSON.

## 6. Destination and SSRF protection

Endpoint creation, URL updates and every delivery attempt revalidate the destination:

- HTTPS is mandatory.
- Only the standard HTTPS port is accepted.
- URL credentials and fragments are rejected.
- Localhost, `.local` and `.internal` hostnames are rejected.
- Loopback, private, link-local, carrier-grade NAT, documentation, benchmark, multicast and reserved IP ranges are rejected.
- Every returned DNS address must be public; one private answer rejects the destination.
- Redirects are not followed.

After validation, the worker pins the outbound TLS connection to the validated IP while preserving the original hostname for SNI/certificate verification. This closes the normal DNS-rebinding gap between validation and connection.

## 7. Durable delivery behavior

The worker runs in two stages:

1. Claim pending outbox events and idempotently create one delivery per subscribed endpoint.
2. Claim due deliveries with a five-minute lease and send them independently.

Unique `(eventId, endpointId)` storage prevents duplicate delivery records. Attempt records are unique by delivery, replay generation and attempt number. Stale dispatch and delivery leases are recoverable after an interrupted deployment. Terminal delivery/event state is reconciled on later worker runs if interruption occurs between updates.

The outbound timeout is eight seconds. Any `2xx` response succeeds. `408`, `425`, `429`, `5xx`, timeouts and network errors retry. Other `4xx` responses are terminal. The seven-attempt schedule is:

1. Initial attempt.
2. After 1 minute.
3. After 5 minutes.
4. After 30 minutes.
5. After 2 hours.
6. After 12 hours.
7. After 24 hours, then terminal failure.

Manual replay retains the same delivery and event IDs, increments a replay generation and starts a new attempt sequence. This preserves receiver deduplication and a coherent operational history.

## 8. Logging and data minimization

Delivery attempts store status code, safe error code, duration and timestamps. They deliberately do not store response bodies, authorization headers, signing headers, signing secrets or request payload copies. Endpoint query strings are omitted from audit-log URL metadata. Partner delivery responses omit MongoDB IDs, tenant IDs and encrypted-secret material.

Endpoint create, update, rotation, deletion, test and replay actions create redacted partner audit entries.

## 9. Worker deployment

The protected worker route is:

`GET /api/internal/partner-webhook-delivery`

It requires `Authorization: Bearer {CRON_SECRET}`, uses the Node.js runtime and has a 60-second maximum duration. `vercel.json` schedules it every five minutes.

This schedule requires Vercel Pro or Enterprise. Current Vercel documentation says Hobby cron expressions that run more than once per day fail deployment. If the project is on Hobby, choose one of these before deployment:

1. Upgrade the project to Vercel Pro and keep the five-minute schedule.
2. Remove the five-minute Vercel cron entry and invoke the protected worker from a reliable external scheduler or queue at least every five minutes.

Official reference: [Vercel Cron Jobs usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## 10. Verification

The Phase 7 suite covers:

- Complete versioned event catalogue.
- AES-GCM encryption/decryption and absence of plaintext secrets.
- Valid, modified, invalid and stale webhook signatures.
- HTTP, credentials, localhost, private IP and mixed public/private DNS rejection.
- One-time endpoint secret display, rotation and cross-tenant denial.
- End-to-end targeted test event and header verification.
- `500`, `400`, timeout and network behavior.
- Exact retry delays and terminal maximum-attempt behavior.
- Idempotent event enqueue.
- Recovery after a processing lease interruption and after an attempt record was already persisted.
- Manual replay generation and tenant isolation.
- Subscription filtering and isolation between applications in one organization.
- Admin shipment update and invoice events delivered independently.
- Sanitized delivery lists and attempt logs.

| Check | Result |
|---|---|
| Phase 7 durability/security suite | Passed: 12/12 |
| Full Phase 1–7 regression/security suite | Passed: 69/69 |
| TypeScript | Passed: no errors |
| ESLint | Passed: zero warnings |
| Production build | Passed: Next.js 15.5.21, 112 pages generated |
| Phase 7 route discovery | Passed: five partner route groups and protected worker included |
| Diff integrity | Passed: no whitespace errors |

The first clean build was blocked from downloading the project's configured Google fonts by the restricted execution network. The same local build was rerun with approved network access and passed. MongoDB Atlas SRV lookup warnings appeared after the route manifest but did not fail the build.

No real webhook receiver, MongoDB Atlas database or production deployment was contacted. Delivery, retries, signatures, leases, logs and isolation were exercised against the disposable in-process Mongo-compatible database and an injected deterministic HTTP receiver.

## 11. Phase gate

Phase 7 implementation is complete. Before any production deployment, confirm the Vercel plan or select an external scheduler and set `WEBHOOK_SECRET_ENCRYPTION_KEY` plus `CRON_SECRET`. Phase 8 super-admin UI and log explorer work has not begun and requires explicit owner approval.

No files were staged, committed, pushed or deployed. No production migration, endpoint, event, delivery, audit entry or network webhook was created.
