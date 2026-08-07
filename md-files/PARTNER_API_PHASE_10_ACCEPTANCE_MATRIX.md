# Partner API Platform - Phase 10 Acceptance Matrix

**Evaluated:** 2026-08-06  
**Environment:** isolated in-memory test services and local production build  
**External systems changed:** none

This matrix traces the approved 18-step minimum scenario to automated evidence. File upload/download tests use private Vercel Blob-shaped metadata and mocked Blob inspection so they can prove ownership, field parity, multiple-file handling and authorization without writing to the production Blob store. The first approved test deployment must repeat the marked external smoke steps with real test-mode Blob objects and a real HTTPS webhook receiver.

| Step | Acceptance requirement | Automated evidence | Result |
|---|---|---|---|
| 1 | Create test organization and application | Phase 2 repository tests; Phase 8 organization/application lifecycle test | Passed |
| 2 | Issue test credential | Phase 3 one-time key test; Phase 8 credential issuance test | Passed |
| 3 | Request instructions for two files | Phase 4 `one and multiple private upload intents...` | Passed |
| 4 | Upload both files | Phase 4 multi-document creation verifies both intent paths through Blob metadata inspection | Passed locally; repeat against test Blob |
| 5 | Create shipment with external reference and special instructions | Phase 4 `shipment creation preserves every accepted field and multiple documents` | Passed |
| 6 | Retry without a duplicate | Phase 4 idempotent replay and concurrent-duplicate tests | Passed |
| 7 | Verify all fields in admin dashboard | Phase 5 `admin shipment data shows complete partner context...` | Passed |
| 8 | Add admin status, image, instructions and wholesale tracking | Shipment-domain canonical update test; Phase 5 admin edit/timeline test | Passed |
| 9 | Verify API timeline and webhook delivery | Phase 6 lifecycle/wholesale timeline test; Phase 7 signed end-to-end delivery test | Passed |
| 10 | Upload invoice and create `invoice.available` | Phase 6 invoice upload/replacement event test; Phase 7 independent durable-event test | Passed |
| 11 | Authorized invoice download | Phase 6 tenant-scoped invoice metadata/file access tests | Passed locally; repeat file stream against test Blob |
| 12 | Submit multiple-file payment proof through API | Phase 6 multi-file proof/idempotency test | Passed |
| 13 | View and decide proof as admin/staff | Phase 6 admin approval test and existing internal payment routes | Passed |
| 14 | Receive payment event | Phase 6 approved lifecycle-event assertion; Phase 7 delivery machinery tests | Passed |
| 15 | Deny another organization | Phase 4 cross-tenant shipment/document/upload test; Phase 6 payment isolation test | Passed |
| 16 | Pause submissions and return `503` | Phase 8 scoped-pause propagation test; central API wrapper maps an active block to `operation_paused`/503 | Passed at service/wrapper level |
| 17 | Resume and recover | Phase 8 scoped-pause test clears the control and proves authorization recovers | Passed |
| 18 | Revoke credential and deny immediately | Phase 3 revoked-key authentication test; Phase 8 rotation/revocation test | Passed |

## Additional Phase 10 workload evidence

- 5,000 request-log records plus 1,000 webhook-delivery records were aggregated below the 1,500ms in-process target.
- A burst of 50 upload intents, 50 idempotent shipment creations, 50 event enqueues and 50 successful webhook deliveries completed below the same 1,500ms target.
- Thirty concurrent rate-limit calls allowed exactly the configured application burst of ten and denied twenty.

## First deployment smoke checklist

Run this only after the owner approves a test deployment and test credentials:

1. Use the Postman collection or example client with a `csl_test_...` key.
2. Upload two harmless fixtures through the returned Vercel Blob client tokens.
3. Complete steps 5-18 against test-mode records and an HTTPS request-capture receiver.
4. Run the read-only HTTP load harness with the partner test key; remote execution requires the explicit `--allow-remote` flag.
5. Record request IDs, p95, error rate, webhook signatures/delivery IDs and cleanup confirmation; never record credentials or private URLs.

