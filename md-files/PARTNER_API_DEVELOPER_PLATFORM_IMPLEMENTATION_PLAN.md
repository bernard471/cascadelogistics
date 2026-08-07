# Cascade Logistics Partner API and Developer Platform Implementation Plan

## Document purpose

This document is the controlling development plan for turning the existing Cascade Logistics application into a secure partner platform. Approved companies and developers will be able to integrate Cascade shipment capabilities into their own backend systems while Cascade administrators continue managing those shipments through the existing admin dashboard.

This plan covers:

- The versioned Partner API.
- Partner and tenant isolation.
- API credentials and permissions.
- Shipment documents, invoices and payment proofs.
- Shipment lifecycle events and webhooks.
- API request, audit and webhook logs.
- The partner developer portal.
- Public developer documentation.
- Super-admin integration management.
- Development, sandbox, production and operational readiness.

This file is a plan only. Its creation does not authorize implementation, database migration, deployment or production changes.

---

## 1. Fixed project decisions

The following decisions are fixed unless the project owner changes them explicitly:

1. **Current production host:** `https://cascadelogistics.vercel.app`.
2. **Production API base:** `https://cascadelogistics.vercel.app/api/v1`.
3. **Developer documentation:** `https://cascadelogistics.vercel.app/developers`.
4. **Authenticated partner portal:** `https://cascadelogistics.vercel.app/developer-portal`.
5. **Super-admin integration console:** an authenticated section under the existing super-admin area, proposed as `/backup-dashboard/integrations`.
6. **Existing customer login:** remains the current login page and NextAuth session flow.
7. **Partner machine authentication:** separate from customer, staff, admin and super-admin login credentials.
8. **Database:** continue using MongoDB; extend the schema instead of replacing the database.
9. **File storage:** continue using private Vercel Blob storage.
10. **Existing shipment records:** must remain readable and manageable throughout the migration.
11. **API versioning:** no breaking response or request changes will be made inside `/api/v1` after the production contract is published.
12. **Deployment approval:** implementation phases may be completed and tested locally, but no production push or deployment will happen without explicit owner approval at the relevant phase gate.

### Recommended defaults awaiting owner review

These defaults allow implementation planning to continue without ambiguity:

- Partner access begins as **approval-only**, not public self-registration.
- API authentication begins with **opaque API keys**; OAuth client credentials can be added later.
- Partner API calls are **server-to-server**. API secrets must not be embedded in public browser or mobile code.
- API-created shipments appear in the existing admin/staff shipment dashboard immediately.
- Partner-managed customers do not need fake Cascade user accounts.
- Partners receive shipment changes through webhooks; Cascade customer emails for partner-managed customers are configurable per organization.
- Production and test credentials are isolated even when they use the same public host.
- API billing and paid plans are outside the first release unless requested.

---

## 2. Project control rules

These rules apply throughout implementation and are intended to prevent scope drift.

### 2.1 Source-of-truth rule

- This plan is the implementation source of truth.
- New features not described here must be added to the plan and approved before implementation.
- Every phase must update its checklist, decision log and test evidence.
- Later-phase work must not be pulled into an earlier phase merely because it appears convenient.

### 2.2 Phase-gate rule

A phase is complete only when:

- All required deliverables exist.
- Automated checks for that phase pass.
- Manual acceptance tests pass.
- Existing customer, admin and staff shipment flows still pass regression testing.
- Security checks relevant to the phase pass.
- Documentation for the implemented behaviour is updated.
- The owner reviews the result when the phase calls for approval.

No subsequent phase starts while a required acceptance criterion remains unresolved.

### 2.3 Change-safety rule

- Database migrations must be backward-compatible and rerunnable.
- Existing records must be backfilled without destructive replacement.
- New fields must be optional during transition periods.
- Existing APIs must continue working while shared services are introduced.
- Secrets, authorization headers, raw passwords and full payment documents must never be written to logs.
- Unrelated user changes in the working tree must be preserved.

### 2.4 Git and deployment rule

- Each phase should produce a focused commit or small series of focused commits.
- Local verification happens before commit preparation.
- Preview or production pushes require explicit approval when requested by the owner.
- Database migrations must not be executed against production merely because application code has been deployed.
- Every production migration needs a preflight report, backup confirmation and post-migration verification.

---

## 3. Product roles and access boundaries

### 3.1 Cascade customer

An existing Cascade customer can:

- Submit a shipment.
- View their shipments.
- Edit allowed fields while a shipment is pending.
- Cancel or delete where current business rules permit.
- Upload shipment documents.
- Track the shipment lifecycle and wholesale tracking numbers.
- View invoices.
- Submit and view payment proofs.

### 3.2 Partner organization

A partner organization is an approved external business using the API. Its applications can receive scopes such as:

- `shipments:create`
- `shipments:read`
- `shipments:update`
- `shipments:cancel`
- `tracking:read`
- `documents:read`
- `documents:write`
- `invoices:read`
- `payments:read`
- `payments:write`
- `webhooks:manage`

A standard partner must not receive admin-only permissions such as assigning operational shipment statuses, approving payment proofs or uploading official invoices.

### 3.3 Partner portal user

A human belonging to a partner organization may have one of these portal roles:

- **Owner:** manages the organization, team members, applications, credentials and webhooks.
- **Developer:** manages approved applications, test credentials, documentation and technical logs.
- **Operations viewer:** views API-created shipments and integration health without managing secrets.
- **Read-only:** views documentation, usage and safe logs.

### 3.4 Cascade admin and staff

Admins and staff continue performing logistics operations:

- Review all shipments, including API-created shipments.
- View partner source and external reference details.
- Update shipment status and timeline.
- Add images and wholesale tracking numbers.
- Upload invoices.
- Review payment proofs.
- Communicate with the appropriate customer or partner.

Admins and staff must not see partner API secrets or super-admin-only integration controls.

### 3.5 Cascade super admin

The super admin can:

- Approve, suspend and archive partner organizations.
- Create and manage API applications.
- Issue, rotate and revoke credentials.
- Assign scopes and quotas.
- Pause API operations globally, by organization or by application.
- View all sanitized API logs.
- Manage webhook health and replay failed deliveries.
- View immutable audit records for privileged actions.

The super-admin interface may be absent from ordinary navigation, but authorization must rely on the `super_admin` role rather than route obscurity.

---

## 4. Target system architecture

All entry points will use the same domain services instead of duplicating shipment rules.

```text
Cascade customer UI -> Existing session API ----\
                                              \
Partner backend -> Partner API /api/v1 --------> Shipment domain services -> MongoDB
                                              /                         -> Private Blob
Admin/staff UI -> Admin API ------------------/                          -> Domain events
                                                                          -> Webhook worker
                                                                          -> Email/notifications

Super-admin console -> organization, credential, scope, pause, log and webhook controls
Partner portal -> organization-scoped credentials, usage, request logs and webhooks
```

### Architectural invariants

1. Dashboard routes and partner routes never call each other through HTTP.
2. Both call reusable service functions with an authenticated principal.
3. Partner organization identity is derived from the credential, never the request body.
4. Partner database access always includes an organization filter.
5. Private file access always checks both resource ownership and organization ownership.
6. Business events are recorded before asynchronous webhook or email delivery is attempted.
7. External notifications are retriable and idempotent.
8. API logs contain operational metadata, not secrets or unrestricted payloads.

---

## 5. Environment and URL strategy

### 5.1 Local development

```text
Application:       http://localhost:3000
Partner API:       http://localhost:3000/api/v1
Developer docs:    http://localhost:3000/developers
Partner portal:    http://localhost:3000/developer-portal
```

Local development must use:

- A non-production MongoDB database.
- A development or test Blob store/prefix.
- Test email destinations.
- Test API and webhook secrets.
- Seeded partner organizations and shipments.

### 5.2 Vercel preview

Every implementation phase that changes external behaviour should be tested on a Vercel preview deployment after approval to push. Preview must use preview-specific database, Blob and credential settings.

### 5.3 Production and sandbox on the current host

The production API remains:

```text
https://cascadelogistics.vercel.app/api/v1
```

Recommended credential formats:

```text
csl_test_<prefix>.<secret>
csl_live_<prefix>.<secret>
```

Test and live modes must be isolated by:

- Separate database names or strictly separated collections.
- Separate Blob stores or top-level prefixes.
- Separate webhook endpoints and secrets.
- Separate credentials and request logs.
- A visible environment label in the partner and super-admin portals.

The final sandbox routing decision is recorded in the owner decision section. The recommended first implementation uses the same `/api/v1` base URL and derives test/live isolation from the credential prefix and credential record.

---

## 6. Data model plan

### 6.1 New `organizations` collection

Proposed fields:

```ts
{
  _id: ObjectId;
  publicId: string;                 // org_...
  name: string;
  slug: string;
  status: "pending" | "active" | "suspended" | "archived";
  contacts: {
    technical?: Contact;
    operational?: Contact;
    billing?: Contact;
  };
  settings: {
    customerEmailMode: "partner" | "cascade" | "none";
    defaultWebhookVersion: "1";
    shipmentVisibility: "organization" | "creating_client";
  };
  limits: {
    requestsPerMinute: number;
    shipmentsPerDay: number;
    uploadBytesPerDay: number;
  };
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}
```

### 6.2 New `partner_users` collection

Partner portal identities must be separate from API machine credentials. Proposed fields:

```ts
{
  _id: ObjectId;
  organizationId: ObjectId;
  email: string;
  emailNormalized: string;
  name: string;
  role: "owner" | "developer" | "operations_viewer" | "read_only";
  status: "invited" | "active" | "suspended";
  passwordHash?: string;
  invitedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

The final authentication implementation may integrate these identities into the current users collection if that produces a cleaner NextAuth model, but partner roles and organization membership must remain explicit.

### 6.3 New `api_clients` collection

```ts
{
  _id: ObjectId;
  publicId: string;                 // app_...
  organizationId: ObjectId;
  name: string;
  description?: string;
  status: "active" | "suspended" | "archived";
  environmentAccess: ("test" | "live")[];
  scopes: string[];
  allowedIpRanges?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.4 New `api_credentials` collection

```ts
{
  _id: ObjectId;
  publicId: string;                 // key_...
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: "test" | "live";
  keyPrefix: string;
  secretHash: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  createdAt: Date;
  createdBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
}
```

The plaintext secret is displayed once and is never stored.

### 6.5 Shipment schema additions

Existing shipments gain backward-compatible fields:

```ts
{
  publicId?: string;                // shp_...
  createdVia?: "dashboard" | "admin" | "partner_api";
  environment?: "test" | "live";
  organizationId?: ObjectId;
  apiClientId?: ObjectId;
  externalCustomerId?: string;
  externalReference?: string;
  cascadeUserId?: string;
  createdByPrincipal?: {
    type: "user" | "admin" | "staff" | "api_client";
    id: string;
  };
  apiVersion?: "v1";
}
```

Existing `userId` behaviour remains supported during migration. Partner-managed shipments may not have a Cascade `userId`, so admin data enrichment and notification logic must support both ownership types.

### 6.6 New `partner_customers` collection

This collection is optional for the first shipment endpoint but should be available for stable customer mapping:

```ts
{
  _id: ObjectId;
  publicId: string;                 // pcus_...
  organizationId: ObjectId;
  externalCustomerId: string;
  cascadeUserId?: string;
  profile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.7 New `idempotency_records` collection

Required for shipment creation, payment proof submission and other non-repeatable POST operations.

```ts
{
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: "test" | "live";
  operation: string;
  key: string;
  requestHash: string;
  state: "processing" | "completed" | "failed";
  responseStatus?: number;
  responseBody?: unknown;           // sanitized API response only
  resourcePublicId?: string;
  createdAt: Date;
  expiresAt: Date;
}
```

### 6.8 New `api_request_logs` collection

```ts
{
  requestId: string;                // req_...
  organizationId?: ObjectId;
  apiClientId?: ObjectId;
  credentialPrefix?: string;
  environment?: "test" | "live";
  method: string;
  routeTemplate: string;
  responseStatus: number;
  errorCode?: string;
  durationMs: number;
  idempotencyOutcome?: string;
  rateLimitOutcome?: string;
  sourceIp?: string;                // retained or hashed per policy
  userAgent?: string;
  createdAt: Date;
  expiresAt?: Date;
}
```

Raw authorization headers and complete request bodies are forbidden.

### 6.9 New webhook collections

`webhook_endpoints` stores URLs, subscribed events, status and encrypted/hashed secret material.

`webhook_deliveries` stores event ID, attempt count, status, timestamps, safe HTTP result metadata and the next retry time.

`domain_events` acts as a durable outbox for events created by customer, partner, admin or staff actions.

### 6.10 Expanded operation controls

The existing global shipment operation controls will be expanded to support:

- Global scope.
- Organization scope.
- API client scope.
- Environment scope.
- Operation name.
- Start and expiry.
- Reason and public message.
- Actor and audit metadata.

### 6.11 Required indexes

At minimum:

```text
organizations.publicId                                 unique
organizations.slug                                     unique
partner_users(organizationId, emailNormalized)         unique
api_clients.publicId                                   unique
api_credentials.keyPrefix                              unique
shipments.publicId                                     unique, partial
shipments(organizationId, externalReference)           unique, partial
shipments(organizationId, createdAt desc)
shipments(organizationId, trackingId)
partner_customers(organizationId, externalCustomerId)  unique
idempotency_records(apiClientId, operation, key)        unique
idempotency_records.expiresAt                           TTL
api_request_logs(requestId)                             unique
api_request_logs(organizationId, createdAt desc)
webhook_deliveries(endpointId, status, nextAttemptAt)
domain_events(status, nextAttemptAt)
```

### 6.12 Migration strategy

1. Create new collections and indexes.
2. Add optional fields to TypeScript types and validators.
3. Deploy dual-read-compatible application code.
4. Backfill existing shipments in batches:
   - Generate `publicId`.
   - Set `createdVia` to `dashboard` or `admin` where determinable.
   - Set `environment` to `live`.
   - Preserve existing `_id`, `trackingId`, `userId`, timeline and documents.
5. Verify counts and sampled records.
6. Make new fields required only for newly created API records.
7. Retain a migration report with start/end counts and errors.

No destructive rewrite or deletion is part of the migration.

---

## 7. Partner API contract

### 7.1 Common request requirements

- HTTPS in production.
- `Authorization: Bearer <api-key>`.
- `Content-Type: application/json` except direct file upload operations.
- `Idempotency-Key` required on shipment creation and payment proof submission.
- Optional partner correlation header such as `X-Cascade-Correlation-Id`.
- Server-generated `X-Request-Id` returned on every response.

### 7.2 Common response rules

- JSON responses use camelCase.
- Timestamps use ISO 8601 UTC.
- List endpoints use cursor pagination.
- Public resource IDs are used instead of MongoDB ObjectIds.
- Errors use a stable problem-details structure.
- Validation errors identify safe field paths without exposing internals.

### 7.3 Proposed endpoints

#### Integration identity

```text
GET /api/v1/me
```

Returns the authenticated organization, application, environment and granted scopes.

#### Uploads

```text
POST /api/v1/uploads
```

Accepts multiple file intents and returns short-lived, single-object upload instructions. The endpoint validates file count, filename, MIME type and declared size before issuing upload permission.

#### Shipments

```text
POST  /api/v1/shipments
GET   /api/v1/shipments
GET   /api/v1/shipments/{shipmentId}
PATCH /api/v1/shipments/{shipmentId}
POST  /api/v1/shipments/{shipmentId}/cancel
GET   /api/v1/shipments/{shipmentId}/timeline
GET   /api/v1/shipments/{shipmentId}/tracking-numbers
```

Hard deletion is not exposed in the first partner API because immutable records and cancellation provide safer auditability. This is an intentional difference from any current dashboard deletion behaviour.

#### Documents

```text
GET    /api/v1/shipments/{shipmentId}/documents
GET    /api/v1/shipments/{shipmentId}/documents/{documentId}
DELETE /api/v1/shipments/{shipmentId}/documents/{documentId}
```

Deletion is allowed only when shipment state and document ownership permit it.

#### Invoices

```text
GET /api/v1/shipments/{shipmentId}/invoice
GET /api/v1/shipments/{shipmentId}/invoice/file
```

Partners can retrieve invoices but cannot upload official invoices with standard scopes.

#### Payment proofs

```text
POST /api/v1/shipments/{shipmentId}/payment-proofs
GET  /api/v1/shipments/{shipmentId}/payment-proofs
GET  /api/v1/payment-proofs/{paymentProofId}/file
```

#### Webhook endpoints

```text
GET    /api/v1/webhook-endpoints
POST   /api/v1/webhook-endpoints
PATCH  /api/v1/webhook-endpoints/{endpointId}
DELETE /api/v1/webhook-endpoints/{endpointId}
POST   /api/v1/webhook-endpoints/{endpointId}/test
```

These endpoints may be restricted to partner portal users rather than machine credentials in the first release.

### 7.4 Shipment field parity requirement

Every supported customer shipment field must be classified as one of:

- Writable on API creation.
- Writable while pending.
- Read-only after creation.
- Admin/staff only.
- Internal only and never exposed.

The classification matrix must include:

- Sender and receiver information.
- Service type.
- Package type, description, quantity, weight and dimensions.
- Declared value and currency where used.
- Special instructions.
- Wholesale purchase tracking numbers.
- Documents and images.
- Status.
- Timeline.
- DELTA or other internal grouping numbers.
- Invoice data.
- Payment proof data.
- Creation and update timestamps.

The API must not silently drop accepted fields. Contract tests will compare create/update inputs against read responses, admin view data and timeline behaviour.

### 7.5 Proposed stable error codes

```text
authentication_required
invalid_api_key
api_key_expired
api_key_revoked
integration_suspended
insufficient_scope
resource_not_found
validation_failed
idempotency_key_required
idempotency_key_reused
request_in_progress
operation_paused
rate_limit_exceeded
upload_not_found
invalid_upload_owner
invalid_document_type
document_too_large
shipment_not_editable
internal_error
```

Suggested status behaviour:

- `401` invalid or missing machine credential.
- `403` suspended integration or insufficient scope.
- `404` missing resource or resource belonging to another organization.
- `409` concurrent/idempotency processing conflict.
- `422` validation or invalid state transition.
- `429` rate limit exceeded.
- `503` temporarily paused operation, with `Retry-After` when known.

---

## 8. Authentication and security design

### 8.1 API key format and storage

- Generate at least 256 bits of random secret material.
- Use visibly different `csl_test_` and `csl_live_` prefixes.
- Store a lookup prefix and cryptographic digest, never the plaintext secret.
- Show the complete key only once.
- Allow overlapping old/new keys during planned rotation.
- Record last-used time and safe source metadata.
- Revoke immediately without requiring a deployment.

### 8.2 Authentication middleware

Create a partner API authentication layer that:

1. Reads the Bearer credential.
2. Validates format before database work.
3. Looks up the key prefix.
4. Verifies the secret digest using constant-time comparison.
5. Checks credential, application and organization status.
6. Resolves environment and scopes.
7. Produces a non-optional `PartnerPrincipal`.
8. Attaches a request ID and safe log context.

### 8.3 Authorization

- Each route declares required scopes.
- Each partner repository method requires `organizationId`.
- Organization identity cannot be accepted from a request body or query string.
- Other-tenant resources return `404`.
- Admin and super-admin cross-tenant access uses separate internal principals and explicit policy checks.
- Documents, invoices and payment proofs repeat ownership checks rather than trusting a parent ID alone.

### 8.4 Rate limits and quotas

Apply multiple layers:

- Vercel WAF/IP controls for obvious abuse.
- Application limits by API credential and organization.
- Daily shipment creation quotas.
- Upload byte and file-count quotas.
- Lower limits on authentication failures and expensive list queries.
- Maximum pagination page size.

The current MongoDB fixed-window mechanism may be adapted for the controlled pilot. Its performance will be measured before wider public access; a dedicated distributed rate-limit store can replace it behind an interface if required.

### 8.5 Input and file security

- Validate all API bodies with Zod or generated schemas.
- Enforce maximum string, array and pagination sizes.
- Validate MIME type, extension and file signature where practical.
- Enforce per-file and per-request upload sizes.
- Reject arbitrary external URLs and unowned Blob paths.
- Generate storage pathnames server-side.
- Use private Blob access.
- Prevent filename path traversal and unsafe content disposition.
- Consider malware scanning before high-risk document types are enabled.

### 8.6 Logging and privacy

- Redact Authorization, cookies, passwords, API secrets and webhook secrets.
- Do not log raw uploaded files.
- Avoid raw request bodies in ordinary logs.
- Mask email, phone and address information in technical views unless necessary for authorized operational support.
- Make audit logs append-only through application permissions.
- Set explicit retention for request and webhook logs.

### 8.7 Security test requirements

- Missing, malformed, expired and revoked credentials.
- Scope denial for every protected endpoint.
- Cross-organization access attempts for every resource type.
- ID guessing and public ID enumeration resistance.
- Rate-limit bypass attempts.
- Idempotency collisions across organizations.
- Arbitrary Blob pathname submission.
- Oversized, unsupported and deceptive files.
- Webhook replay, signature manipulation and timestamp expiry.
- Log injection and secret redaction.
- Super-admin route access by admin, staff, partner and ordinary user roles.

---

## 9. Upload and private file flow

### 9.1 Upload intent

The partner requests upload instructions with metadata for one or more files.

### 9.2 Server authorization

Cascade checks:

- Credential and scope.
- Organization/application status.
- Operation pause state.
- File count, declared size and MIME type.
- Organization upload quota.

### 9.3 Private direct upload

Cascade returns short-lived single-object upload permission. Storage paths include environment, organization and an upload identifier generated by Cascade.

Example logical prefix:

```text
partner-uploads/live/{organizationPublicId}/{uploadId}/{generatedFilename}
```

### 9.4 Shipment attachment validation

Before shipment creation or update, Cascade confirms:

- Every referenced upload exists.
- The pathname belongs to the authenticated organization and environment.
- The upload has not expired or already been consumed improperly.
- Stored metadata matches allowed limits.
- The shipment operation is still allowed.

### 9.5 Private delivery

Downloads go through an authenticated API route or a short-lived signed URL issued only after authorization. The permanent Blob read/write token is never sent to partners.

### 9.6 Cleanup

A scheduled cleanup process removes abandoned upload intents and eligible orphaned Blob objects after the configured retention window.

---

## 10. Events and webhooks

### 10.1 Initial event catalogue

```text
shipment.created
shipment.updated
shipment.status_changed
shipment.cancelled
shipment.document_added
shipment.document_removed
shipment.tracking_numbers_updated
invoice.available
invoice.updated
payment_proof.received
payment_proof.approved
payment_proof.rejected
```

### 10.2 Event envelope

Every event includes:

```ts
{
  id: string;                       // evt_...
  type: string;
  version: "1";
  occurredAt: string;
  organizationId: string;
  apiClientId?: string;
  data: unknown;
}
```

### 10.3 Event production

- Customer, API, admin and staff updates all emit events through the same domain service.
- Shipment update and event creation are committed reliably.
- Webhook HTTP calls do not occur inside the database transaction.
- Failed external delivery cannot undo a successful shipment update.

### 10.4 Webhook signing

- Each endpoint receives a high-entropy secret.
- Sign timestamp plus raw request body with HMAC-SHA256.
- Include event ID, timestamp, delivery ID and signature headers.
- Permit secret rotation with a controlled overlap window.

### 10.5 Delivery semantics

- At-least-once delivery.
- Exponential retry with a maximum attempt policy.
- Partner deduplication by event ID.
- No guaranteed event order; event timestamps and shipment version support reconciliation.
- Manual replay from partner and super-admin portals.
- Poisoned deliveries become terminal failures after policy limits and remain visible for support.

### 10.6 Webhook safety

- HTTPS endpoints only in production.
- Block private, loopback, link-local and metadata-service destinations.
- Resolve and revalidate destination addresses to reduce SSRF risk.
- Apply connection and response timeouts.
- Limit response body capture and redact it before logging.
- Do not follow unsafe redirect chains automatically.

---

## 11. Developer documentation plan

The documentation at `/developers` must be generated from or continuously checked against the OpenAPI contract.

Required sections:

1. Platform overview.
2. Quick start.
3. Authentication and secure key storage.
4. Test versus live environments.
5. Creating a shipment.
6. Uploading multiple documents.
7. Listing and retrieving shipments.
8. Editing or cancelling pending shipments.
9. Shipment status lifecycle.
10. Timeline and wholesale tracking numbers.
11. Invoices.
12. Payment proofs.
13. Webhook configuration and signature verification.
14. Idempotency and safe retries.
15. Pagination and filtering.
16. Rate limits and quotas.
17. Error reference.
18. Security recommendations.
19. API changelog and deprecation policy.
20. Service status and support process.

Downloadable developer assets:

- OpenAPI JSON/YAML.
- Bruno or Postman collection.
- Example webhook verifier.
- Example shipment creation requests.
- Test webhook payloads.

SDK generation is a later enhancement and is not required for the first production API.

---

## 12. Partner developer portal plan

### 12.1 Partner overview

- Organization and approval status.
- Test/live environment selector.
- Request success and error counts.
- API-created shipment count.
- Active applications and credentials.
- Quota usage.
- Recent webhook failures.
- Current maintenance or operation-pause messages.

### 12.2 Applications and credentials

- List applications.
- Create or request a new application.
- View scopes.
- Generate test credentials.
- Request live access.
- Rotate and revoke credentials.
- Display plaintext secret once.
- View prefix, expiry, created date and last-used date afterward.
- Configure allowed IP ranges where enabled.

### 12.3 API request logs

Partners see only their organization’s sanitized logs:

- Request ID.
- Timestamp.
- Method and route template.
- Status.
- Duration.
- Application and environment.
- Error code.
- Idempotency outcome.

They never see credentials, internal stack traces, other organizations or unrestricted raw payloads.

### 12.4 Webhook management

- Create and disable endpoints.
- Select events.
- Rotate secrets.
- Send test events.
- View delivery attempts.
- Replay eligible failures.
- View safe response status and excerpts.

### 12.5 Shipment troubleshooting

Provide a compact integration view containing:

- Cascade shipment public ID.
- Tracking ID.
- External reference.
- External customer ID.
- Submission time and source application.
- Current status.
- Document count.
- Latest event and webhook state.
- Related request IDs.

This view supports technical troubleshooting; it does not replace the partner’s own customer-facing product.

### 12.6 Partner team management

- Invite members.
- Assign portal roles.
- Suspend members.
- Review partner-level audit activity.

Team management may follow the private pilot if it is not required for the first partner.

---

## 13. Super-admin integration console plan

### 13.1 Organizations

- Search and filter partners.
- Approve, suspend, resume and archive.
- Manage contacts and notification policy.
- Set quotas and allowed environments.
- View organization usage and shipment totals.

### 13.2 Applications and credentials

- Create applications.
- Assign scopes.
- Issue test/live credentials.
- Rotate and revoke credentials.
- View safe last-used metadata.
- Never redisplay complete secrets.

### 13.3 Operation controls

- Pause globally.
- Pause one environment.
- Pause one organization.
- Pause one application.
- Pause shipment creation, update, document upload, invoice access, payment proof submission or webhook delivery separately.
- Set expiry and public reason.
- Resume manually.

### 13.4 Logs and diagnostics

- Request search by request ID.
- Filter by organization, application, environment, route, status and date.
- View usage, failure rates and latency.
- View rate-limit violations and authentication failures.
- Export sanitized operational records where authorized.

### 13.5 Webhook operations

- View endpoints and health across organizations.
- View delivery attempts.
- Replay failed deliveries.
- Disable a dangerous endpoint.
- Rotate compromised webhook secrets.

### 13.6 Audit

Audit at minimum:

- Partner approval or suspension.
- Credential issue, rotation or revocation.
- Scope and quota changes.
- Environment access changes.
- Operation pause and resume.
- Webhook endpoint disablement or replay.
- Partner portal role changes.
- Log exports.

---

## 14. Phased implementation roadmap

## Phase 0 - Owner review, decisions and baseline

### Goal

Freeze the first-release scope and document the existing application baseline before modifying architecture.

### Work

- Review and approve this plan.
- Resolve the owner decisions at the end of the document.
- Record current production environment dependencies without exposing values.
- Inventory existing shipment, invoice, payment, tracking, notification and Blob routes.
- Record current data counts and representative schema shapes using safe read-only checks.
- Define the API field parity matrix.
- Define the first partner pilot profile and expected request volume.
- Establish the no-push approval workflow for subsequent phases.

### Tests and evidence

- Existing type check, lint and production build results recorded.
- Manual customer shipment creation/read/update flow recorded.
- Manual admin shipment creation/update/invoice flow recorded.
- Manual payment proof and private file flow recorded.

### Exit criteria

- Owner approves the scope and decisions.
- Baseline checks pass or known existing failures are documented.
- No implementation has begun before approval.

---

## Phase 1 - Shared domain services and regression protection

### Goal

Extract reusable shipment business logic so dashboard APIs and the future partner API behave consistently.

### Work

- Define principal types for customer, staff, admin, super admin and partner API client.
- Extract shipment creation, update, cancellation and retrieval services.
- Extract document validation and attachment services.
- Extract invoice and payment-proof authorization helpers.
- Centralize operation-pause enforcement.
- Centralize timeline event construction.
- Separate database updates from email/webhook side effects.
- Add unit tests around current shipment rules before changing external behaviour.
- Keep existing dashboard routes and response shapes compatible.

### Tests

- Customer ownership enforcement.
- Pending-only customer edits.
- Admin/staff operational updates.
- Multiple document preservation.
- Special instructions and all accepted fields survive create/update/read.
- Timeline and wholesale tracking number behaviour.
- Invoice and payment-proof ownership.
- Operation pauses.

### Exit criteria

- Existing UI routes call the shared services.
- No user-visible regression.
- Type check, lint, build and new tests pass.
- No partner endpoint is public yet.

---

## Phase 2 - Tenant data model, public IDs and migrations

### Goal

Add the organization and integration data foundation without disrupting existing shipments.

### Work

- Add collection types and validation schemas.
- Add organization, application, credential and partner-customer repositories.
- Add optional shipment ownership/source fields.
- Implement public ID generation.
- Create required indexes safely.
- Write idempotent migration and verification scripts.
- Backfill a local/test database first.
- Update admin shipment enrichment to support partner-managed shipments without local users.
- Add environment isolation fields.

### Tests

- Migration rerun safety.
- Record counts before and after migration.
- Uniqueness and partial index behaviour.
- Existing shipment retrieval by current `_id` and `trackingId`.
- New retrieval by public ID.
- Partner shipment admin rendering without `userId`.

### Exit criteria

- Test migration report reconciles all records.
- Existing records remain readable.
- New partner-owned record fixtures work.
- Production migration remains unexecuted until separately approved.

---

## Phase 3 - Partner authentication, scopes, limits and audit foundation

### Goal

Implement secure machine authentication before exposing business operations.

### Work

- Implement API key generation and one-time display.
- Implement secure digest storage and constant-time verification.
- Implement partner principal resolution.
- Implement route scope declarations.
- Implement credential, application and organization suspension checks.
- Implement test/live isolation.
- Add request IDs.
- Add sanitized request logging.
- Add application and organization rate limits.
- Expand operation controls for API scope.
- Audit all credential and access-control changes.
- Add `GET /api/v1/me` as the first authenticated endpoint.

### Tests

- Valid test/live keys.
- Missing and malformed keys.
- Wrong secret with valid prefix.
- Revoked and expired keys.
- Suspended application and organization.
- Missing scope.
- Environment mismatch.
- Rate limit and quota responses.
- Secret redaction in every log path.

### Exit criteria

- `/api/v1/me` works with correct isolation.
- No credential plaintext exists after initial display.
- Security tests pass.
- No shipment write endpoint is enabled yet.

---

## Phase 4 - Multi-file upload sessions and core shipment API

### Goal

Allow an authenticated partner backend to upload multiple private files and submit/retrieve shipments.

### Work

- Implement multi-file upload-intent endpoint.
- Generate environment/organization-scoped Blob paths.
- Validate completed uploads before attachment.
- Add abandoned upload cleanup.
- Implement shipment creation with idempotency.
- Implement shipment list with cursor pagination and filters.
- Implement shipment detail retrieval.
- Implement allowed pending shipment edits.
- Implement audited shipment cancellation.
- Implement document list/read/delete where permitted.
- Add complete field parity validation.
- Emit domain events into the outbox without delivering webhooks yet.

### Tests

- One and multiple document uploads.
- Image, PDF and allowed document types.
- Invalid MIME, size, count and pathname.
- Cross-organization upload references.
- Same idempotency key/same body returns original result.
- Same idempotency key/different body is rejected.
- Concurrent duplicate request behaviour.
- List pagination and filtering.
- Pending edit and invalid state transition.
- Cross-tenant shipment/document access returns `404`.
- All accepted fields appear in API read response and admin data.

### Exit criteria

- Complete sandbox happy path passes.
- Duplicate shipments are prevented.
- Multiple files work reliably.
- Existing dashboard uploads remain functional.

---

## Phase 5 - Admin and staff integration

### Goal

Make partner-created shipments operationally indistinguishable from normal shipments while clearly identifying their source.

### Work

- Display source, partner, application and external reference in shipment lists and view modal.
- Support partner-managed customer identity where no Cascade `userId` exists.
- Ensure edits populate the same timeline used by user and tracking views.
- Ensure wholesale tracking numbers are visible.
- Add API event creation for admin/staff changes.
- Define partner-specific notification behaviour.
- Add admin search/filter by partner and external reference.
- Protect partner credentials and integration controls from admin/staff access.

### Tests

- API-created shipment appears immediately to admin/staff.
- Admin view displays every submitted field.
- Admin update appears in API shipment and timeline responses.
- Images and documents remain accessible to authorized roles.
- Admin cannot access API secrets or super-admin integration endpoints.
- Partner source information does not leak into unrelated customer views.

### Exit criteria

- Admin/staff can complete normal operational work on API-created shipments.
- Field parity and timeline regression suite passes.

---

## Phase 6 - Tracking, invoices and payment proofs

### Goal

Complete the partner-facing shipment lifecycle and financial-document functionality.

### Work

- Implement authenticated timeline endpoint.
- Implement wholesale tracking-number endpoint.
- Implement invoice metadata and private download endpoints.
- Implement payment-proof upload, list and private download endpoints.
- Ensure admin invoice uploads and payment decisions emit events.
- Apply tenant ownership to every private file.
- Add safe caching and content-disposition behaviour.

### Tests

- Full lifecycle timeline parity.
- All wholesale tracking numbers returned.
- Partner cannot retrieve another organization’s invoice or proof.
- Multiple payment-proof files if allowed by the product decision.
- Invoice replacement/update behaviour.
- Admin approval/rejection reflected in partner API.
- Private files cannot be accessed with Blob URLs alone.

### Exit criteria

- Shipment, tracking, invoice and payment API capabilities are complete.
- Cross-tenant file tests pass.

---

## Phase 7 - Durable events and signed webhooks

### Goal

Deliver shipment changes reliably to partner systems.

### Work

- Finalize event catalogue and schemas.
- Implement domain event outbox writes.
- Implement webhook endpoint storage and secret rotation.
- Implement secure destination validation.
- Implement HMAC signatures and timestamp headers.
- Implement background delivery worker.
- Implement retries and terminal failure handling.
- Implement manual replay.
- Implement test event delivery.
- Record sanitized delivery logs.
- Add event and delivery idempotency.

### Tests

- Valid and invalid signatures.
- Replay-window rejection.
- Receiver timeout, 4xx and 5xx handling.
- Retry schedule.
- Duplicate delivery deduplication guidance and event IDs.
- Out-of-order event tolerance.
- SSRF/private-address destination rejection.
- Deployment interruption during delivery.
- Admin update and invoice upload generate correct events.

### Exit criteria

- End-to-end webhook delivery works from every required shipment action.
- Failed delivery can be inspected and replayed.
- No shipment transaction depends on immediate webhook success.

---

## Phase 8 - Super-admin integration console

### Goal

Give the super admin complete control and visibility over partner API operations.

### Work

- Organization onboarding and approval UI.
- Applications and scope management.
- One-time credential generation, rotation and revocation.
- Test/live access controls.
- Per-organization and per-client quotas.
- Scoped operation pause controls.
- Request log explorer.
- Webhook health, attempt and replay UI.
- Partner shipment usage summaries.
- Privileged audit log explorer.
- Authorization tests keeping all features unavailable to admin/staff.

### Tests

- Super-admin happy paths.
- Admin/staff/partner/user denial for every route.
- Credential one-time display.
- Pause and resume propagation to API responses.
- Audit entry creation for every privileged mutation.
- Sensitive-field redaction.

### Exit criteria

- Super admin can manage the API lifecycle without database editing or deployment.
- Privileged functionality is role-isolated and audited.

---

## Phase 9 - Developer documentation and partner portal

### Goal

Allow approved partners to onboard, integrate and troubleshoot safely.

### Work

- Publish versioned OpenAPI definition.
- Build developer documentation pages.
- Add quick-start and complete workflow examples.
- Produce Bruno/Postman collection.
- Implement partner portal authentication and organization membership.
- Implement portal overview and usage.
- Implement application and credential management within approved permissions.
- Implement organization-scoped request logs.
- Implement webhook configuration, test and replay screens.
- Implement shipment troubleshooting view.
- Add test/live environment selector and strong visual separation.
- Add documentation changelog.

### Tests

- Documentation examples execute successfully against test mode.
- OpenAPI contract matches route validation and responses.
- Partner A cannot view Partner B portal data.
- Portal roles enforce allowed actions.
- Credential secret is visible only once.
- Request and webhook logs are sanitized.
- Mobile and desktop portal usability.

### Exit criteria

- A developer unfamiliar with the codebase can complete the sandbox happy path using only the documentation and portal.

---

## Phase 10 - Automated quality, security and performance readiness

### Goal

Demonstrate that the complete platform is safe and stable before a real partner pilot.

### Work

- Complete unit, integration, contract and end-to-end test suites.
- Add CI checks for type check, lint, tests, build and OpenAPI drift.
- Add dependency and secret scanning.
- Run OWASP-focused API tests.
- Run load tests for reads, shipment creation, upload-intent creation and webhook bursts.
- Verify MongoDB indexes with representative queries.
- Verify rate-limit behaviour under concurrency.
- Add OpenTelemetry spans and operational dashboards.
- Configure Vercel WAF rules.
- Define alert thresholds.
- Define log retention and cleanup jobs.
- Write incident, credential-compromise and webhook-failure runbooks.
- Review backup and restore procedures.

### Minimum end-to-end acceptance scenario

1. Create a test organization and application.
2. Issue a test credential.
3. Request upload instructions for at least two files.
4. Upload both files.
5. Create a shipment with an external reference and special instructions.
6. Retry creation and prove no duplicate was created.
7. Verify the shipment and all fields in the admin dashboard.
8. Add admin status, image, instructions and wholesale tracking updates.
9. Verify API timeline and webhook delivery.
10. Upload an invoice and receive `invoice.available`.
11. Download the invoice through authorized partner access.
12. Submit payment proof through the API.
13. View and decide the proof as admin/staff.
14. Receive the payment event.
15. Attempt equivalent access from another organization and verify denial.
16. Pause submissions for the partner and verify `503` behaviour.
17. Resume and verify recovery.
18. Revoke the credential and verify immediate denial.

### Exit criteria

- No critical or high-severity unresolved security issue.
- Agreed performance and error targets are met.
- Monitoring and runbooks are ready.
- Owner approves private pilot readiness.

---

## Phase 11 - Private partner pilot

### Goal

Validate the platform with one trusted integration before general production availability.

### Work

- Onboard one approved pilot partner.
- Complete sandbox integration first.
- Review partner security and key-storage approach.
- Approve live credentials only after sandbox acceptance.
- Start with conservative quotas.
- Monitor request, error, latency, upload and webhook metrics daily.
- Collect documentation and portal feedback.
- Resolve pilot defects without expanding unrelated scope.
- Produce a pilot completion report.

### Exit criteria

- Partner completes agreed production workflows.
- No cross-tenant, duplicate shipment or private-file incident.
- Webhook reliability meets the agreed target.
- Support process is workable.
- Owner approves broader release.

---

## Phase 12 - General production release and ongoing operations

### Goal

Operate a stable versioned partner platform for additional approved organizations.

### Work

- Formalize partner onboarding and production approval.
- Publish support, change and deprecation policies.
- Establish API uptime and incident communication expectations.
- Review capacity and costs monthly.
- Rotate internal signing and hashing secrets on policy.
- Review inactive credentials and endpoints.
- Review audit and access logs.
- Run restore and incident exercises.
- Plan `/v2` only for genuine breaking changes.

### Later optional capabilities

- OAuth 2.0 client credentials.
- User-delegated OAuth with Authorization Code and PKCE.
- Generated SDKs.
- API usage billing and paid plans.
- Self-service public partner registration.
- Dedicated custom API and developer domains.
- Per-tenant databases for contractual or regulatory isolation.
- Partner-specific data residency.

These are not automatically part of the first production release.

---

## 15. Test matrix

### Functional

- Shipment create, list, get, update and cancel.
- Multiple document upload and retrieval.
- Special instructions and every accepted field.
- Timeline and tracking numbers.
- Invoice availability and download.
- Payment proof upload, view and decision.
- Admin/staff updates reflected in API.
- Webhook event coverage.

### Isolation

- Organization A versus Organization B shipment IDs.
- Documents, invoices and payment proofs.
- External references and customer IDs.
- Request logs and webhook deliveries.
- Test versus live environments.
- Suspended versus active credentials.

### Reliability

- Client timeout after successful create.
- Concurrent duplicate submission.
- Database transient error.
- Blob upload interruption.
- Webhook receiver timeout and outage.
- Worker restart or deployment during delivery.
- Email provider failure independent of API success.

### Security

- Credential guessing and revoked key reuse.
- Missing scopes.
- ID enumeration.
- Oversized requests.
- Malicious filenames and MIME mismatch.
- Arbitrary URLs and SSRF targets.
- Webhook replay and signature tampering.
- Secret and personal-data leakage in logs.
- Unauthorized super-admin access.

### Performance

- Shipment list queries with pagination.
- Burst shipment creation within quotas.
- Multiple parallel uploads.
- Webhook fan-out after bulk admin updates.
- Request log queries over the retention window.

---

## 16. Observability, retention and operational targets

### Proposed initial targets

- Every API response has a request ID.
- API authentication, authorization, shipment service, Blob and webhook operations have traceable spans.
- Alerts exist for elevated `5xx`, authentication failures, webhook backlog and worker failure.
- Request logs default to 90 days.
- Webhook delivery details default to 90 days.
- Security and privileged audit logs default to at least one year.
- Idempotency records default to 24 hours unless business retry requirements demand longer.
- Abandoned upload intents are cleaned after a documented window.

Retention periods are recommended defaults and require owner approval before production enforcement.

### Operational dashboards

- Request volume by organization and route.
- Success/error rate.
- p50, p95 and p99 latency.
- Rate-limit events.
- Shipment creation volume.
- Upload failure rate and storage use.
- Webhook success, retries and backlog.
- Active/revoked credential counts.
- Suspended partners and active operation pauses.

---

## 17. Main risks and mitigations

| Risk | Mitigation |
|---|---|
| Cross-partner shipment exposure | Mandatory organization context in repositories, cross-tenant tests and `404` behaviour |
| Duplicate shipments after network retry | Required idempotency keys and stored request fingerprints |
| API key leak | Server-to-server usage, one-time display, hashing, rotation, revocation and optional IP restrictions |
| Partner secret embedded in frontend | Documentation, onboarding review and portal warnings |
| Unauthorized Blob access | Private store, organization-scoped paths and authenticated/signed delivery |
| Arbitrary upload URL or SSRF | Never accept arbitrary storage URLs; validate webhook destinations |
| Admin routes and partner routes diverge | Shared domain services and contract/regression tests |
| Email or webhook failure makes API request fail | Durable events and asynchronous retriable delivery |
| Log storage exposes personal data | Redaction, no raw bodies, limited retention and role-based views |
| Test data contaminates live operations | Credential-derived environment isolation and clear UI labels |
| Hidden super-admin path mistaken for security | Strict role enforcement, audit and optional MFA |
| Public API increases infrastructure cost | Quotas, rate limits, WAF, pagination and usage monitoring |
| Breaking partner integrations | Versioned OpenAPI contract and additive-only `/v1` changes |

---

## 18. Definition of first production release complete

The first production release is complete only when:

- Approved partners can authenticate with scoped live credentials.
- Test and live data are isolated.
- Partners can upload multiple documents and create shipments idempotently.
- Admins and staff can see and manage API-created shipments.
- All accepted shipment fields are visible in admin and partner reads.
- Timeline and wholesale tracking numbers are correct.
- Partners can retrieve invoices and submit/view payment proofs.
- Admin/staff changes create signed, retriable webhooks.
- Super admin can manage partners, keys, scopes, quotas, pauses and logs.
- Partners can manage permitted credentials and webhooks in their portal.
- Developer documentation is sufficient for independent integration.
- Cross-tenant, private-file, idempotency, security and load tests pass.
- Monitoring, backups and incident procedures are operational.
- The owner has approved production deployment.

---

## 19. Owner decisions required before Phase 1

The recommended choice is shown first. These decisions should be recorded directly in this section after review.

**Decision status:** Approved by the project owner on 2026-08-06. All recommended choices below are now the controlling first-release decisions. Decision 9 remains an operational input required before the private pilot rather than a blocker for Phases 0-10.

### Decision 1 - Initial partner onboarding

- **Recommended:** super-admin approval and invitation only.
- Alternative: public partner registration with approval queue.

### Decision 2 - Partner API credentials

- **Recommended:** API keys for the first release; OAuth later.
- Alternative: implement OAuth client credentials before the pilot.

### Decision 3 - Test/live routing

- **Recommended:** one `/api/v1` base; `csl_test_` and `csl_live_` credentials select isolated environments.
- Alternative: separate `/api/sandbox/v1` and `/api/v1` paths.

### Decision 4 - Customer emails for partner-created shipments

- **Recommended:** partner handles customer messaging by default; Cascade emails can be enabled per organization.
- Alternative: Cascade always emails the supplied customer address.
- Alternative: Cascade never emails partner-managed customers.

### Decision 5 - Credential management

- **Recommended:** partners may generate test keys; live keys require super-admin approval.
- Alternative: only the super admin can generate any key.

### Decision 6 - Partner shipment visibility

- **Recommended:** applications in one organization can access the organization’s shipments according to scopes.
- Alternative: each application sees only shipments it created.

### Decision 7 - Partner portal team roles

- **Recommended:** owner, developer, operations viewer and read-only.
- Alternative: owner and developer only for the pilot.

### Decision 8 - Retention

- **Recommended:** request/webhook logs 90 days; privileged audit one year; idempotency 24 hours.
- Alternative: owner-specified periods.

### Decision 9 - First pilot access

- Required before Phase 11: identify the first trusted partner and expected daily request/upload volume.

### Decision 10 - Commercial model

- **Recommended:** no automated API billing in the first release; quotas are operational controls.
- Alternative: include paid usage tiers before production.

---

## 20. Implementation progress tracker

Update this table only after verifiable work is complete.

| Phase | Status | Approval | Notes |
|---|---|---|---|
| 0. Owner review and baseline | Completed | Approved 2026-08-06 | Baseline evidence recorded in `PARTNER_API_PHASE_0_BASELINE.md`; no implementation or deployment performed |
| 1. Shared domain services | Completed | Approved to begin 2026-08-06 | Shared domain layer and 13 regression tests recorded in `PARTNER_API_PHASE_1_EVIDENCE.md`; no partner endpoint, migration or deployment performed |
| 2. Tenant model and migration | Completed | Approved to begin 2026-08-06 | Tenant repositories, public IDs, 21 safe indexes and guarded idempotent migration recorded in `PARTNER_API_PHASE_2_EVIDENCE.md`; production migration not executed |
| 3. Authentication and security | Completed | Approved to begin 2026-08-06 | One-time hashed credentials, tenant principal resolution, scopes, limits, controls, redacted logs/audits and authenticated `/api/v1/me` recorded in `PARTNER_API_PHASE_3_EVIDENCE.md`; no shipment API exposed |
| 4. Uploads and core shipment API | Completed | Approved to begin 2026-08-06 | Private multi-file intents, idempotent shipment create/list/detail/edit/cancel, document operations, quotas, cleanup and outbox creation recorded in `PARTNER_API_PHASE_4_EVIDENCE.md`; no migration or deployment performed |
| 5. Admin/staff integration | Completed | Approved to begin 2026-08-06 | Safe source/partner/application display, partner-managed customers, search/filtering, shared timeline parity, internal outbox events and notification policy recorded in `PARTNER_API_PHASE_5_EVIDENCE.md`; no migration or deployment performed |
| 6. Tracking, invoices and payments | Completed | Approved to begin 2026-08-06 | Authenticated timeline/tracking, tenant-safe invoice downloads, idempotent multi-file payment proofs, admin decisions and financial events recorded in `PARTNER_API_PHASE_6_EVIDENCE.md`; no migration or deployment performed |
| 7. Events and webhooks | Completed | Approved to begin 2026-08-06 | Encrypted endpoint secrets, SSRF-safe HTTPS validation, signed at-least-once delivery, leases, retries, replay, sanitized logs and worker route recorded in `PARTNER_API_PHASE_7_EVIDENCE.md`; scheduler plan must be confirmed before deployment |
| 8. Super-admin integration console | Completed | Approved to begin 2026-08-06 | Protected Backup Dashboard control center, partner/app lifecycle, quotas/scopes, one-time credentials, scoped pauses, sanitized request/webhook observability, replay and privileged audits recorded in `PARTNER_API_PHASE_8_EVIDENCE.md`; no migration or deployment performed |
| 9. Documentation and partner portal | Completed | Approved to begin 2026-08-06 | Public v1 docs/OpenAPI/Postman/workflow example plus isolated role-based partner portal, test/live operations, credentials, logs, webhooks, shipment troubleshooting and membership recorded in `PARTNER_API_PHASE_9_EVIDENCE.md`; no migration or deployment performed |
| 10. Security and performance readiness | Completed locally | Approved to begin 2026-08-06 | CI/CodeQL, OWASP controls, zero-vulnerability audit, OpenAPI/secret checks, OTel health dashboard/alerts, retention, indexes, workload/concurrency tests and runbooks recorded in `PARTNER_API_PHASE_10_EVIDENCE.md`; Phase 11 and infrastructure activation still require owner approval |
| 11. Private partner pilot | Ready for partner onboarding | Approved to begin 2026-08-06 | Pilot gates, conservative quotas, safe security review, daily monitoring, feedback/incident tracking and completion enforcement implemented locally in `PARTNER_API_PHASE_11_EVIDENCE.md`; real partner identity, deployment and workflow evidence remain required |
| 12. General production release | Not started | Owner approval | |

---

## 21. Change log

| Date | Change | Author/approver |
|---|---|---|
| 2026-08-06 | Initial full implementation plan created for owner review | Codex / awaiting owner approval |
| 2026-08-06 | Owner approved the plan and all recommended first-release decisions; Phase 0 started | Project owner |
| 2026-08-06 | Phase 0 static quality, route, environment, data-count and field-parity baseline completed | Codex |
| 2026-08-06 | Phase 1 shared shipment domain services, route compatibility refactor and regression suite completed | Codex |
| 2026-08-06 | Phase 2 tenant model, public IDs, scoped repositories, index definitions and isolated migration verification completed | Codex |
| 2026-08-06 | Phase 3 partner authentication, scopes, limits, controls, audit/log redaction and `/api/v1/me` completed | Codex |
| 2026-08-06 | Phase 4 private multi-file uploads, idempotent core shipment API, document controls, quotas, cleanup and domain-event outbox completed | Codex |
| 2026-08-06 | Phase 5 admin/staff source display, partner-managed customer workflow, filtering, timeline parity, internal outbox events and notification policy completed | Codex |
| 2026-08-06 | Phase 6 authenticated lifecycle tracking, invoice proxy/replacement, multi-file payment proofs, tenant isolation and financial domain events completed | Codex |
| 2026-08-06 | Phase 7 encrypted webhook endpoints, signed durable delivery, SSRF controls, retry/recovery, replay and sanitized delivery logging completed | Codex |
| 2026-08-06 | Phase 8 super-admin partner lifecycle console, application access controls, credential rotation, scoped pauses, usage/request/webhook observability and privileged audit explorer completed | Codex |
| 2026-08-06 | Phase 9 developer documentation, OpenAPI/Postman assets, separate partner authentication, role-based portal and tenant-isolated troubleshooting completed | Codex |
| 2026-08-06 | Phase 10 automated quality/security gates, OWASP hardening, zero-vulnerability audit, OpenTelemetry health/alerts, retention, workload/concurrency verification and operational runbooks completed locally | Codex |
| 2026-08-06 | Phase 11 private-pilot governance, live credential gates, daily metrics/alerts, feedback and incident controls, completion report and onboarding runbook implemented locally | Codex |
