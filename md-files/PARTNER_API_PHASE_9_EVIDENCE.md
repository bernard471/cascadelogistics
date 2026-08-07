# Partner API Platform - Phase 9 Evidence

**Completed:** 2026-08-06  
**Production migration/deployment:** Not performed

## Outcome

Cascade now has public developer documentation at `/developers` and a separate authenticated partner portal at `/partner-portal`. Partner sessions cannot be confused with customer, staff or super-admin sessions: they use a dedicated signed, HTTP-only, SameSite cookie, a separate secret and an active database membership check on every API request.

The Backup Dashboard can provision the first partner owner and reveals the generated temporary password once. Owners can manage organization members. Owners and developers can create test-only applications, issue/rotate/revoke credentials within super-admin-approved scopes and environments, and configure webhooks. Operations viewers can inspect operational data and replay deliveries; read-only members cannot mutate integration state.

## Portal capabilities

- Strongly separated test/live environment selector.
- Usage and error summary.
- Sandbox application creation and application suspension.
- One-time API-key issue and rotation.
- Organization-scoped sanitized request logs.
- Webhook endpoint creation, enable/disable, secret rotation, test and replay.
- Delivery and attempt visibility.
- Shipment troubleshooting by tracking/external reference.
- Owner-managed organization membership.
- Temporary-password change flow.

Live access and scope expansion remain super-admin controlled. A portal-created application is always test-only.

## Documentation artifacts

- Landing page, test-mode quick-start, endpoint reference and changelog.
- Versioned OpenAPI 3.1 JSON covering all current v1 route groups.
- Downloadable Postman 2.1 collection.
- Executable Node test-mode shipment workflow example.
- Production base URL set to `https://cascadelogistics.vercel.app/api/v1`.

## Security and isolation

- Login requires organization slug, normalized email and password.
- Sessions expire after 12 hours and reject signature changes and future/expired timestamps.
- Organization/user suspension is checked from MongoDB for every portal request.
- Public responses omit MongoDB IDs, hashes, encrypted webhook secrets and plaintext credentials.
- Credentials and webhook secrets are returned only by their creation/rotation response.
- Partner A cannot read Partner B records; test and live queries remain separate.
- Privileged portal mutations create redacted partner audit records.

## Verification

| Check | Result |
|---|---|
| Phase 9 session/role/isolation/contract suite | Passed: 6/6 |
| Full Phase 1-9 regression/security suite | Passed: 83/83 |
| TypeScript | Passed |
| ESLint | Passed with zero warnings |
| Production build | Passed: Next.js 15.5.21, 122 pages |
| Route discovery | Passed: docs, portal, session and console routes included |
| Diff integrity | Passed |

No real partner login, API key, production database record, webhook or shipment was created. `PARTNER_PORTAL_SESSION_SECRET` must be configured with a separate random value of at least 32 characters before deployment. The Phase 7 scheduler-plan prerequisite remains open.

## Gate

Phase 9 is complete. Phase 10 security/performance readiness has not started and requires explicit owner approval. No files were staged, committed, pushed or deployed.
