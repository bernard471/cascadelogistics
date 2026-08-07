# Partner API Platform - Phase 8 Evidence

**Project:** Cascade Logistics  
**Phase:** 8 - Super-admin integration console  
**Completed:** 2026-08-06  
**Production migration:** Not executed  
**Deployment:** Not performed

## 1. Outcome

The protected Backup Dashboard now contains a complete Partner API Control Center at `/backup-dashboard/integrations`. A super admin can onboard and approve partner organizations, manage organization policies and quotas, create and manage applications, control scopes and test/live access, set per-client request limits, issue/rotate/revoke credentials, pause selected API operations, inspect sanitized requests and webhook delivery attempts, replay failed deliveries, review usage, and inspect privileged audit history without directly editing MongoDB or redeploying the application.

The console uses the existing protected super-admin session and Backup Dashboard layout. Admin, staff, customer and partner API principals receive a not-found response from the integration service and API route, preventing both access and feature discovery.

## 2. Protected owner route

The console uses one private route:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/backup-dashboard/integrations` | Return the sanitized integration console snapshot |
| `POST` | `/api/backup-dashboard/integrations` | Validate and execute one privileged integration mutation |

Both methods require an authenticated `super_admin` session. Unauthorized requests return `404`, responses use `Cache-Control: private, no-store`, and unexpected errors do not log submitted credentials or request bodies.

The Backup Dashboard layout separately checks the same role before rendering `/backup-dashboard` or `/backup-dashboard/integrations`.

## 3. Organization and application management

The console supports:

- Creating a pending partner organization.
- Approving, suspending or archiving an organization.
- Selecting whether the partner, Cascade or neither party sends direct customer email.
- Selecting organization-wide or creating-application shipment visibility.
- Setting organization request, shipment and daily-upload quotas.
- Creating applications with explicit scopes and test/live access.
- Updating application name, purpose, status, scopes, environment access and per-client request quota.
- Suspending or reactivating an application immediately.

Every lookup uses opaque organization/application public IDs and then resolves the record within its organization. A public application ID from a different partner returns `404` and is never mutated.

## 4. Credential lifecycle

The owner can issue a credential only for an environment enabled on the application and only with scopes already granted to that application. The full API key is returned in the successful mutation response and shown in a one-time warning panel. Later console reads contain only the credential public ID and safe key prefix.

Rotation creates a distinct replacement with the same environment, scopes and valid expiry, returns the new key once, revokes the previous credential and links the rotation in the audit history. Revocation takes effect through the existing API authentication layer.

Only versioned secret hashes are stored. The console response omits API-key hashes, plaintext keys, MongoDB IDs, credential ownership internals, endpoint ciphertext and webhook signing secrets.

## 5. Scoped operational controls

The console can pause or resume:

- All partner API access.
- All API operations.
- One named API scope/operation.

Controls can apply globally, to an organization or to one application, optionally only in test or live mode. A future end time is required to pause. The private reason is retained for the audit/owner view while the partner receives only the configured safe public message.

The Phase 8 tests confirm a live application pause is observed immediately by the partner authorization path, does not block test mode, and disappears immediately when resumed.

## 6. Observability and replay

The owner console includes:

- Organization-level shipment totals split by test/live mode.
- Request totals and error totals.
- Latest sanitized API request records with route, status, error code, duration and request ID.
- Webhook endpoint health and subscriptions.
- Delivery status, attempt/replay counts and last safe result.
- Individual webhook attempt history with response status or safe error code and duration.
- Manual delivery replay using the stable event/delivery identity.
- Latest privileged audit entries with redacted metadata.

Manual replay rejects a delivery currently being processed, atomically queues other eligible deliveries, resets transient attempt state, increments the replay generation and records a super-admin audit entry.

## 7. Audit and redaction guarantees

All Phase 8 mutations create audit records, including:

- Organization create/update/approval/suspension.
- Application create/update/suspension.
- Credential issue, rotation and revocation.
- Operation pause and resume.
- Webhook delivery replay.

Audit metadata passes through the existing recursive redaction policy. Phase 8 tests inject password, authorization and API-key values and confirm none appears in the console response. Request source values are stored and presented only as one-way fingerprints.

## 8. Verification

The focused Phase 8 suite covers:

- Super-admin organization/application happy paths.
- Admin, staff, customer and partner API denial for reads and mutations.
- Organization and application quota/policy changes.
- Application scope and environment controls.
- Credential environment and scope boundaries.
- One-time credential disclosure and hash-only storage.
- Credential rotation and revocation.
- Cross-organization application isolation.
- Scoped pause/resume propagation.
- Request, endpoint, delivery and attempt visibility.
- Sensitive-data redaction.
- Webhook replay state and audit creation.
- Strict mutation-schema rejection.

| Check | Result |
|---|---|
| Phase 8 authorization/lifecycle/security suite | Passed: 8/8 |
| Full Phase 1-8 regression/security suite | Passed: 77/77 |
| TypeScript | Passed: no errors |
| ESLint | Passed: zero warnings |
| Production build | Passed: Next.js 15.5.21, 114 pages generated |
| Integration console route discovery | Passed: protected page and GET/POST route included |
| Diff integrity | Passed: no whitespace errors |

The build exercised production compilation and route discovery only. No MongoDB Atlas record, real API credential, webhook delivery, production environment or external partner system was contacted.

## 9. Phase gate

Phase 8 is complete. Phase 9 developer documentation and partner portal work has not started and requires explicit owner approval.

Before a production deployment, the Phase 7 scheduler decision remains open: the five-minute Vercel cron requires Pro/Enterprise, or an external scheduler must invoke the protected worker. Production must also contain the previously documented API-key pepper, webhook encryption key and cron secret.

No files were staged, committed, pushed or deployed. No production migration was executed.
