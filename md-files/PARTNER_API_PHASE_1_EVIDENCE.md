# Partner API Platform - Phase 1 Evidence

**Project:** Cascade Logistics  
**Phase:** 1 - Shared domain services and regression protection  
**Completed:** 2026-08-06  
**Production deployment:** Not performed  
**Database migration:** Not performed  
**Partner API exposure:** None

## 1. Outcome

The existing dashboard shipment workflows now share a reusable domain layer for principals, authorization policies, creation, retrieval, editing, deletion, invoicing, upload authorization, private-file access and timeline construction. Existing dashboard URLs and response contracts remain in place. Email and notification delivery remain route-level side effects after successful domain persistence, which prevents the future partner transport from having to duplicate shipment rules.

No `/api/v1` partner endpoint, API-key authentication route, organization collection or public developer feature was introduced in this phase.

## 2. Shared domain modules

| Module | Responsibility |
|---|---|
| `src/lib/shipments/principals.ts` | Explicit customer, internal and future partner API principal types; session-to-principal conversion |
| `src/lib/shipments/policies.ts` | Customer ownership, internal access, edit/delete status rules, pause bypass and deny-by-default partner scopes |
| `src/lib/shipments/schemas.ts` | Canonical customer update validation and admin update input contract |
| `src/lib/shipments/factory.ts` | Tracking ID generation and complete customer/admin shipment record construction |
| `src/lib/shipments/service.ts` | Principal-aware create, retrieve, update, delete and invoice persistence services |
| `src/lib/shipments/timeline.ts` | Initial, customer-edit, admin-edit, bulk-status and tracking-fallback timeline construction |
| `src/lib/shipments/operation-policy.ts` | Principal-aware operation-pause enforcement, including the existing super-admin recovery bypass |
| `src/lib/shipments/document-policy.ts` | Upload-mode authorization, operation mapping and per-user Blob pathname isolation |
| `src/lib/shipments/private-files.ts` | Private-resource authorization, safe filenames and strict trusted Vercel Blob hostname classification |

## 3. Existing routes migrated

The following existing routes now call the shared shipment domain layer while retaining their existing paths:

- Customer shipment collection and item routes.
- Admin shipment collection, item, bulk-update and invoice routes.
- Shipment document upload authorization.
- Shipment document and invoice viewing/downloading.
- Shipment tracking and tracking update-image viewing.
- Payment-proof submission and payment-image viewing.

Email and in-app notification calls remain outside the persistence services. This keeps database state changes separate from optional delivery side effects and preserves the existing behaviour where a mail failure is logged without undoing a successful shipment update.

## 4. Preserved rules covered by regression tests

The built-in Node test harness is available through `npm test` when a working local npm executable is present. The suite currently contains 13 tests covering:

- Explicit customer, staff, admin and super-admin principal handling.
- Customer data isolation and internal access.
- Deny-by-default future partner scopes.
- Pending-only customer editing and current customer deletion restrictions.
- Existing `CLL` tracking-number format.
- Customer and admin shipment creation defaults.
- Multiple-document preservation.
- Special instructions and wholesale tracking-number preservation.
- Customer and admin timeline updates.
- Bulk status timeline de-duplication.
- Deterministic tracking timeline fallback.
- Invoice/payment/document ownership through the shared private-resource policy.
- Exact Vercel Blob host trust and safe download filenames.
- Upload role, operation and user-path isolation.
- Super-admin pause bypass and staff/customer pause enforcement policy.

## 5. Final validation

| Check | Result | Evidence |
|---|---|---|
| Shipment domain tests | Passed | 13 passed, 0 failed |
| TypeScript | Passed | `tsc --noEmit`, no errors |
| ESLint | Passed | Full repository scan, zero warnings; final changed upload/domain files rechecked after the last extraction |
| Production build | Passed | Next.js 15.5.21 optimized build; 105 static pages generated |
| Diff integrity | Passed | `git diff --check` reported no whitespace errors |

The production build used the existing local `.env.local`. No environment values were printed or recorded.

## 6. Compatibility and safety notes

- Existing dashboard route names were not changed.
- Existing customer/admin status defaults and response shapes were preserved.
- No collection schema migration or production data write was required.
- No API credential, organization, partner-member, webhook or usage-log collection exists yet; these intentionally begin in later phases.
- The future partner principal type exists only as an internal contract and cannot authenticate or reach a public partner endpoint.
- Production-connected create/update/payment flows were not invoked during this phase to avoid unapproved data writes. Regression tests, static analysis and the production build provide the Phase 1 implementation evidence.

## 7. Phase gate

Phase 1 is complete. Phase 2 must not begin until the owner explicitly approves beginning the tenant data-model and migration phase. No commit, push or deployment was performed as part of this phase.
