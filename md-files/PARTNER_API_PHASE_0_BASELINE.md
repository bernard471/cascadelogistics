# Partner API Phase 0 Baseline

## Status

- **Plan approval:** approved by the project owner on 2026-08-06.
- **Recommended decisions:** approved as the controlling first-release decisions.
- **Baseline date:** 2026-08-06.
- **Production host for the project:** `https://cascadelogistics.vercel.app`.
- **Implementation status:** Phase 0 baseline complete; Phase 1 has not started.
- **Push/deployment status:** no commit, push, preview deployment or production deployment performed.

This document records the pre-implementation state used to judge future regressions and migration results. It contains no environment values, credentials or customer records.

---

## 1. Quality baseline

The machine-wide `npm` launcher is currently invalid because it points to a missing global `npm-cli.js`. This is a local tooling issue rather than a project failure. Checks were therefore run directly with the workspace's installed tools and bundled Node executable.

An attempted pnpm invocation started moving npm-managed direct dependencies into pnpm's ignored directory. The command was stopped before installation completed. All moved package entries were restored, the temporary pnpm store was removed, and neither `package.json` nor `package-lock.json` was changed.

| Check | Result | Evidence |
|---|---|---|
| TypeScript `tsc --noEmit` | Pass | Exit code 0, 25.1 seconds |
| ESLint with zero warnings | Pass | Exit code 0, 100.5 seconds |
| Next.js production build | Pass | Exit code 0, 170.8 seconds |
| Next.js compilation | Pass | Compiled successfully in 47 seconds |
| Static page generation | Pass | 105 of 105 pages generated |
| Package/lockfile mutation | None | Git shows no changes to package files |

The production build used Next.js 15.5.21 and the existing `.env.local` configuration.

### Manual mutation tests

Customer shipment creation, admin shipment creation, invoice upload and payment-proof submission were not executed during Phase 0 because the configured database contains live project records and Phase 0 does not authorize test writes to that data.

Before Phase 1 changes existing business behaviour, regression tests will be implemented around the existing services using isolated fixtures. Preview/manual write-flow verification must use an isolated non-production database and Blob namespace.

---

## 2. Configured database baseline

A read-only connection was used. Only collection counts, shipment field names and status counts were returned. No customer field values were printed or stored.

### Collection counts

| Collection | Count |
|---|---:|
| `users` | 30 |
| `shipments` | 3 |
| `payments` | 0 |
| `notifications` | 76 |
| `supportTickets` | 0 |
| `system_controls` | 1 |
| `super_admin_audit_logs` | 5 |
| `api_request_logs` | 0 |
| `organizations` | 0 |
| `api_clients` | 0 |
| `api_credentials` | 0 |
| `webhook_endpoints` | 0 |
| `webhook_deliveries` | 0 |
| `domain_events` | 0 |

### Shipment status counts

| Status | Count |
|---|---:|
| `arrived-at-warehouse` | 3 |

### Fields present on the sampled existing shipment

```text
createdAt
declaredValue
deltaNumber
description
dimensions
documents
goodsType
packageType
quantity
receiverAddress
receiverCity
receiverCountry
receiverEmail
receiverName
receiverPhone
senderAddress
senderCity
senderCountry
senderEmail
senderName
senderPhone
servicePrice
serviceType
specialInstructions
status
timeline
trackingId
updatedAt
userId
weight
wholesalePurchases
```

### Migration reconciliation baseline

When Phase 2 migration begins, the migration report must reconcile at least:

- 3 existing shipments before backfill.
- 3 existing shipments after backfill.
- No tracking IDs changed.
- No user IDs changed.
- No timeline events removed.
- No documents removed.
- Each shipment receives one unique public ID.
- Each existing shipment receives `environment: "live"`.
- Each existing shipment receives a valid `createdVia` classification.

Counts may legitimately change through normal business use before migration. The production migration preflight must take a new count immediately before execution and use that new count for final reconciliation.

---

## 3. Current technology baseline

### Application

- Next.js 15.5.21 App Router.
- React 18.3.
- TypeScript 5.9.
- Zod 4.
- NextAuth 5 beta with Credentials authentication and JWT sessions.

### Persistence and files

- MongoDB Node driver 6.20.
- Main database selected in code as `guangzhou`.
- Private Vercel Blob integration through `@vercel/blob`.
- Shipment documents support legacy base64 `data` and preferred Blob `url`/`pathname` metadata.

### Email and notifications

- Nodemailer with primary/fallback SMTP configuration.
- Database notifications stored separately.
- Email and notification side effects currently occur directly in several route handlers.

### Existing security foundations

- Session-based role checks for user, staff, admin and super admin.
- Customer ownership filters based on `userId`.
- Private Blob proxy/download routes.
- Zod validation for customer shipment update fields.
- MongoDB-backed fixed-window rate limiting used for registration attempts.
- Global shipment operation controls for `create`, `update` and `submit`.
- Super-admin operation changes recorded in `super_admin_audit_logs`.

### Missing partner-platform foundations

- No organization/tenant model.
- No partner users or portal roles.
- No API client or credential model.
- No API scopes.
- No public resource IDs.
- No versioned `/api/v1` partner boundary.
- No API request ID or partner request log.
- No general partner quotas.
- No request idempotency storage.
- No domain event outbox.
- No webhook endpoint/delivery model.
- No partner developer portal.
- No OpenAPI contract or developer documentation portal.

---

## 4. Environment dependency inventory

Only variable names are recorded. Values remain in environment configuration.

### Database and authentication

```text
MONGO
NEXTAUTH_SECRET
NEXTAUTH_URL
NODE_ENV
```

### Blob storage

```text
BLOB_READ_WRITE_TOKEN
PRIVATE_BLOB_READ_WRITE_TOKEN
VERCEL_BLOB_CALLBACK_URL
```

### Email providers

```text
EMAIL_PROVIDER
EMAIL_HOST
EMAIL_USER
EMAIL_PASSWORD
EMAIL_FROM_ADDRESS
EMAIL_FROM_NAME
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_REQUIRE_TLS
EMAIL_FALLBACK_PROVIDER
EMAIL_FALLBACK_HOST
EMAIL_FALLBACK_SMTP_HOST
EMAIL_FALLBACK_SMTP_PORT
EMAIL_FALLBACK_SMTP_SECURE
EMAIL_FALLBACK_SMTP_REQUIRE_TLS
EMAIL_FALLBACK_USER
EMAIL_FALLBACK_PASSWORD
EMAIL_FALLBACK_FROM_ADDRESS
EMAIL_FALLBACK_FROM_NAME
ADMIN_NOTIFICATION_EMAIL
```

### Identity, registration and scheduled operations

```text
IDENTITY_HASH_SECRET
IDENTITY_RETENTION_DAYS
NEXT_PUBLIC_RECAPTCHA_SITE_KEY
RECAPTCHA_SECRET_KEY
CRON_SECRET
ADMIN_INITIAL_PASSWORD
```

### Local diagnostic/test variables

```text
DEBUG_USERNAME
TEST_LOGIN_USERNAME
TEST_LOGIN_PASSWORD
```

### Variables to add in later phases

Names remain provisional until their implementation phase:

```text
API_KEY_HASH_SECRET
WEBHOOK_SECRET_ENCRYPTION_KEY
API_LOG_RETENTION_DAYS
WEBHOOK_LOG_RETENTION_DAYS
API_IDEMPOTENCY_TTL_HOURS
API_DEFAULT_REQUESTS_PER_MINUTE
API_DEFAULT_SHIPMENTS_PER_DAY
```

No partner credential will be stored as a Vercel environment variable. Partner credentials are records managed through the super-admin platform and stored only as digests.

---

## 5. Current API route inventory

### Route files

- Total API route files: **57**.
- Exported HTTP handlers: **87**.

| Method | Handler count |
|---|---:|
| GET | 38 |
| POST | 24 |
| PATCH | 12 |
| PUT | 3 |
| DELETE | 10 |

### Route groups

| Group | Route files |
|---|---:|
| `admin` | 22 |
| `auth` | 9 |
| `shipments` | 8 |
| `user` | 3 |
| `notifications` | 3 |
| `payments` | 2 |
| `support-tickets` | 2 |
| `contact-submissions` | 2 |
| `newsletter-subscriptions` | 2 |
| `backup-dashboard` | 1 |
| `internal` | 1 |
| `quote-request` | 1 |
| `status` | 1 |

### Shipment-related current routes

```text
GET/POST          /api/shipments
GET/PUT/DELETE    /api/shipments/{id}
POST              /api/shipments/upload
GET               /api/shipments/{id}/documents/{index}
GET               /api/shipments/{id}/invoice
GET               /api/shipments/{id}/invoice/file
GET               /api/shipments/track/{trackingId}
GET               /api/shipments/track/{trackingId}/update-image

GET/POST          /api/admin/shipments
GET/PATCH/DELETE  /api/admin/shipments/{id}
POST              /api/admin/shipments/bulk-update
POST              /api/admin/shipments/invoice

GET/POST          /api/payments
GET               /api/payments/{id}/image
GET/PATCH         /api/admin/payments/{id}
```

These routes remain internal/session routes. They will not be renamed into or exposed as the partner API.

---

## 6. Current authentication and ownership behaviour

### Browser identities

- NextAuth Credentials validates username/email and password.
- JWT session includes user ID, role and username.
- The same login supports existing user, staff, admin and super-admin roles.

### Customer shipment access

- Customer list queries filter by `userId = session.user.id`.
- Customer shipment detail/update/delete queries repeat the `userId` filter.
- Customer edits are limited to pending shipments.
- Private documents and invoices check session/ownership before delivery.

### Admin shipment access

- Admin/staff shipment list reads across all shipments.
- Admin list enrichment assumes a shipment has a local `userId` that can be looked up in `users`.
- Admin create requires selecting an existing local user.
- Admin updates can change operational status, current location, estimated delivery, special instructions and DELTA number.

### Super-admin controls

- Super-admin role is required for the backup dashboard operation-control API.
- Super admins bypass the global shipment operation block.
- Current controls are global rather than partner/organization scoped.

### Partner-platform implication

The current `userId` assumption is the largest data-model compatibility issue. Partner-managed customers should not require fake Cascade accounts, so shared services and admin enrichment must support both:

1. A shipment linked to a Cascade user.
2. A shipment owned by a partner organization/external customer.

---

## 7. Shipment field parity baseline

Legend:

- **Yes:** currently supported directly.
- **Derived:** generated from the selected/logged-in user or calculated by the application.
- **Limited:** supported in a narrower form than the planned partner contract.
- **No:** not writable on that surface.
- **Internal:** visible/managed operationally but not intended as normal partner input.

| Field/capability | Customer create | Admin create | Customer pending edit | Admin edit | Current stored/read | Partner v1 target |
|---|---|---|---|---|---|---|
| Sender identity/address | Derived | Derived from selected user | No | No | Yes | Writable external customer data, subject to validation |
| Receiver identity/address | Derived | Derived from selected user | Yes | No | Yes | Writable on create and permitted pending edit |
| Package type | Yes | Yes | No | No | Yes | Writable on create |
| Weight | Yes | Yes | No | No | Yes | Writable on create; read afterward |
| Dimensions | Yes | Yes | Yes | No | Yes | Writable on create/pending edit |
| Quantity | Yes | Yes | Yes | No | Yes | Writable on create/pending edit |
| Description | Yes | Yes | Yes | No | Yes | Writable on create/pending edit |
| Declared value | Yes | Limited in admin UI | Yes | No | Yes | Writable on create/pending edit |
| Goods type | Yes | Yes | Yes | No | Yes | Writable on create/pending edit |
| Service type | Yes | Yes | Yes | No | Yes | Writable on create/pending edit |
| Service price | Derived | Derived | No | No | Yes | Read-only calculated field |
| Pickup date | Yes | Yes | No | No | Optional | Writable on create where business rules allow |
| Estimated delivery | User supplies delivery date during submit | Limited | No | Yes | Optional | Read-only for standard partner scope |
| Special instructions | Yes | Yes | Yes | Yes | Yes | Writable on create/pending edit and readable |
| Wholesale purchases/tracking numbers | Multiple | Multiple | No | No | Yes | Multiple on create; readable timeline/tracking output |
| DELTA number | No | Yes | No | Yes | Optional | Internal/admin-only |
| Status | Fixed pending | Fixed pending | No | Yes | Yes | Read-only for standard partner scope |
| Current location | No | No | No | Yes | Optional | Read-only for standard partner scope |
| Shipment documents | Multiple | Multiple | Limited | No | Yes | Multiple create/pending attachment with secure upload intents |
| Timeline update image | No | No | No | One per edit | Yes in timeline | Read-only partner event/document link |
| Timeline | Created automatically | Created automatically | Updated on edit | Updated on operational edit | Yes | Full authenticated lifecycle read |
| Invoice | Read | Admin upload separately | No | Admin upload separately | Optional | Partner read/download only |
| Payment proof | User upload separately | No | N/A | Admin decision separately | Separate collection | Partner submit/read; admin decision |
| External customer ID | No | No | No | No | No | Required or strongly recommended for partner-managed customer |
| External reference | No | No | No | No | No | Optional, unique per organization when supplied |
| Organization/application source | No | No | No | No | No | Automatically derived from credential |
| Idempotency protection | No | No | No | No | No | Required on shipment create/payment proof submit |

### Field-parity acceptance rule

For every field accepted by the Partner API, tests must prove that it is:

1. Stored correctly.
2. Returned by the partner read endpoint where permitted.
3. Visible in the admin view modal where operationally relevant.
4. Represented in the timeline when the action is a lifecycle update.
5. Included in webhook payloads when the event contract requires it.

No accepted partner field may be silently discarded.

---

## 8. Current side-effect and consistency baseline

### Shipment creation

The customer creation route currently performs, in one request handler:

1. Session and pause checks.
2. Document validation/upload handling.
3. User lookup.
4. Tracking ID generation.
5. Shipment insert.
6. Customer notification insert.
7. Admin notification insert.
8. Admin email attempt.

### Admin creation/update

Admin shipment routes currently combine:

- Authentication and authorization.
- Request parsing.
- Blob upload.
- Shipment persistence.
- Timeline construction.
- Database notification creation.
- Customer email attempts.

### Payments and invoices

- Payment proof submission validates ownership and sends an admin email in the route.
- Invoice upload updates the shipment directly.
- There is no durable event record connecting these mutations to future partner webhooks.

### Phase 1 implication

Phase 1 must separate:

- HTTP/session parsing.
- Principal authorization.
- Shipment business rules.
- Persistence.
- Domain event creation.
- Email/database notification delivery.

The Partner API must call the same domain functions as the existing routes rather than duplicating these sequences.

---

## 9. Current upload baseline

- Shipment document UI supports multiple files.
- Maximum document size is currently 10 MB per file in the customer flow.
- New document uploads prefer private Vercel Blob metadata.
- Existing types retain base64 `data` for legacy compatibility.
- Customer upload tokens are tied to the authenticated session user and a user-specific pathname prefix.
- Admin creation can upload multiple documents.
- Admin edit currently accepts one timeline update image per edit.
- Invoice and payment proof files use separate private routes.

### Partner-platform changes required

- Replace session-user upload ownership with credential-derived organization ownership for partner uploads.
- Issue multiple short-lived upload instructions in one request.
- Store upload intent/consumption metadata.
- Validate existence, environment, organization, size and type before attaching.
- Never accept an arbitrary Blob or external URL.
- Preserve existing customer upload behaviour during transition.

---

## 10. Phase 1 entry findings

The following findings determine the Phase 1 work order:

1. **Create/update logic is route-coupled.** Extract shared services before public endpoints.
2. **Shipment creation validation is not centralized.** Define explicit service schemas and field policies.
3. **`userId` is mandatory throughout current types and enrichment.** Introduce a compatible ownership abstraction before partner records.
4. **Notifications and email are immediate side effects.** Define domain events before webhooks.
5. **Tracking/timeline formatting is partly synthesized on read.** Establish one canonical timeline/event model.
6. **Documents use legacy and Blob representations.** Keep dual-read support and standardize new attachments.
7. **Current pauses are global.** Preserve them now; add organization/application scope only in its planned phase.
8. **No automated test runner is configured.** Phase 1 must add a test harness before substantial refactoring.
9. **Production data is small but active.** Migrations must still be idempotent and count-reconciled.
10. **No partner collections contain data.** New partner schemas can be introduced without legacy partner migration.

---

## 11. Phase 0 conclusion

Phase 0 establishes a green static quality baseline and a read-only data/schema baseline. Known limitations are documented:

- The global `npm` launcher is broken locally, so direct installed tools were used.
- Manual write-flow tests were intentionally not run against the configured live records.
- A non-production test database/Blob namespace is required before manual mutation testing.
- No public partner implementation exists yet.

Phase 1 may begin only after this baseline is accepted. Its first deliverable must be regression protection and shared domain service boundaries, not a publicly reachable partner shipment endpoint.

