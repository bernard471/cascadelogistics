# Partner API Platform - Phase 2 Evidence

**Project:** Cascade Logistics  
**Phase:** 2 - Tenant data model, public IDs and migrations  
**Completed:** 2026-08-06  
**Production migration:** Not executed  
**Deployment:** Not performed  
**Partner API exposure:** None

## 1. Outcome

The application now has a backward-compatible tenant and integration data foundation. Existing Cascade shipments continue to work with their Mongo `_id`, `trackingId` and optional `userId`; new dashboard/admin shipments also receive an opaque `shp_` public ID, source metadata, the `live` environment and their Cascade-user mapping. Partner-managed shipment records can omit `userId` and remain readable by admin shipment enrichment.

No `/api/v1` endpoint, bearer credential authentication, partner portal, production collection migration or deployment was introduced.

## 2. Data model and validation

`src/lib/partner-platform` now defines:

- Organization, partner-user, API application, API credential and partner-customer document types.
- Explicit `test` and `live` environments.
- Backward-compatible shipment tenant/source metadata.
- Strict Zod input schemas with conservative first-release defaults.
- Opaque public IDs for organizations, applications, credentials, customers, shipments, requests and future events.
- Organization-scoped repository methods for applications and partner customers.
- API credential creation that verifies both organization ownership and allowed environment.
- Credential storage contracts that contain only `secretHash` and `keyPrefix`; plaintext secret storage is not supported.

## 3. Index foundation

The safe index installer defines 21 stable named indexes across the planned collections, including:

- Unique organization public IDs and slugs.
- Unique API application and credential public IDs.
- Unique credential prefixes.
- A partial unique shipment public-ID index.
- A partial unique `(organizationId, externalReference)` shipment index.
- Organization shipment lookup indexes by creation time and tracking number.
- Organization-scoped partner-customer uniqueness.
- Environment-aware idempotency uniqueness and expiry.
- Request-log lookup/expiry indexes.
- Webhook delivery and domain-event queue indexes.

Index installation uses MongoDB's idempotent named `createIndex` operation. The same installer can be rerun; incompatible existing definitions fail visibly instead of silently replacing an index.

## 4. Migration behaviour and safeguards

The Phase 2 migration is additive only. For legacy shipments it can add:

- `publicId`.
- `environment: "live"`.
- `createdVia`, inferred as dashboard/admin from the original initial timeline where possible.
- `cascadeUserId` copied from the existing `userId`.
- A user creation principal where the legacy record proves dashboard ownership.

It does not replace or delete `_id`, `trackingId`, `userId`, documents, invoices, timeline events or shipment fields.

The migration command refuses `guangzhou` and any database name that is not explicitly marked test, sandbox, development or dev. It defaults to dry-run; writes require `--apply`.

```text
npm run migrate:phase2 -- --database=<explicit-test-database>
npm run migrate:phase2 -- --database=<explicit-test-database> --apply
```

There is deliberately no production override in this Phase 2 command.

## 5. Isolated migration report

The exact migration and repository code was exercised against a disposable in-process Mongo-compatible test database:

| Check | Result |
|---|---|
| Records before migration | 3 |
| Records after migration | 3 |
| Legacy records updated | 2 |
| Complete partner fixture preserved | 1 |
| Index definitions installed | 21 |
| Migration errors | 0 |
| Second-run planned updates | 0 |
| Second-run unchanged records | 3 |
| Lookup by existing `_id` | 3/3 |
| Lookup by existing `trackingId` | 3/3 |
| Lookup by new `publicId` | 3/3 |

The same test also confirmed:

- Duplicate shipment public IDs are rejected.
- Duplicate external references inside one organization are rejected.
- The same external reference is allowed in a different organization.
- Applications and partner customers are invisible through another organization's repository context.
- A test-only application cannot receive a live credential.
- A partner shipment without a Cascade `userId` remains operationally readable.

An attempt to run the disposable test against MongoDB Atlas was stopped by DNS/network refusal before connection, so no Atlas test database or production record was created. The isolated in-process database became the non-production Phase 2 verification target. A real Atlas test-database run remains available through the guarded migration command once the environment can reach Atlas; production remains separately gated.

## 6. Dashboard compatibility

- Existing dashboard shipment creation now adds public/source/environment metadata automatically.
- Admin shipment lists resolve a Cascade user when present and otherwise fall back to partner shipment sender/organization information.
- Admin updates do not create user notifications when a partner shipment has no Cascade user.
- Partner-managed shipments default to partner-owned customer messaging, so the current Cascade email sender is not invoked for them.
- Existing customer/private-file ownership remains based on the legacy `userId`; missing ownership denies customer access while internal staff remain able to operate the shipment.
- A principal-aware public-ID lookup service is available for the future API without exposing a route.

## 7. Final validation

| Check | Result |
|---|---|
| Existing and Phase 2 unit/regression suite | Passed: 19/19 |
| Isolated migration integration suite | Passed: 1/1 |
| TypeScript | Passed: no errors |
| ESLint | Passed: zero warnings |
| Production build | Passed: Next.js 15.5.21, 105 static pages generated |
| Diff integrity | Passed: no whitespace errors |

The production build required network access for the existing Geist font configuration. MongoDB Atlas DNS remained unavailable during build-time data attempts, but the optimized build completed successfully. No environment values were printed or recorded.

## 8. Phase gate

Phase 2 is complete. Phase 3 authentication and security work must not begin until the owner explicitly approves it. No files were staged, committed, pushed or deployed, and the production migration was not run.
