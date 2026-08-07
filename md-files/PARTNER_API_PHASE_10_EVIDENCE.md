# Partner API Platform - Phase 10 Evidence

**Completed locally:** 2026-08-06  
**Production migration/deployment:** Not performed  
**Private pilot:** Not started

## Outcome

The partner platform now has automated CI quality/security gates, OpenAPI drift and secret detection, CodeQL configuration, dependency auditing, centralized OpenTelemetry spans, operational health/alert evaluation in the Backup Dashboard, protected health and retention jobs, worker heartbeats, query/retention indexes, bounded request and login controls, workload tests, and an operations/incident/restore runbook.

Phase 10 is locally ready for the owner's pilot-readiness decision. No database migration, Vercel firewall rule, scheduler, trace drain, Atlas backup policy, credential, external webhook, Blob object or production deployment was changed.

## Security and supply chain

- Non-forced dependency remediation reduced the advisory report from 1 critical, 5 high and 1 moderate to zero known vulnerabilities.
- GitHub Actions now runs typecheck, lint, all automated tests, OpenAPI drift, secret scan, dependency audit and production build.
- CodeQL v3 is configured for JavaScript/TypeScript pushes, pull requests and a schedule.
- Partner JSON requests with a declared body over 1 MiB return `request_too_large`/413 before authentication work continues.
- Partner portal login is limited to 10 attempts per source fingerprint per five minutes, in addition to the documented Vercel WAF rule.
- Strict schemas, MIME/size/count rules, tenant-scoped paths, path sanitization, redaction, SSRF controls, scoped authorization and cross-tenant not-found behavior are regression tested.

## Monitoring and lifecycle

- `@vercel/otel` registers `partner.api.request`, `partner.api.authenticate`, `partner.api.authorize` and `partner.api.operation` spans without customer fields or secrets.
- Backup Dashboard integration overview exposes the rolling request count, 5xx rate, p95 latency, webhook backlog, oldest delivery and evaluated alerts.
- `/api/internal/partner-health` requires `CRON_SECRET` and returns 503 while critical platform alerts are active.
- The webhook worker records a success heartbeat.
- The daily retention job deletes 90-day operational data and 365-day privileged audits; legal-hold/incident suspension is documented.
- Required tenant, queue, heartbeat, alert and retention indexes are included in the idempotent index catalogue.

## Verification

| Check | Result |
|---|---|
| Phase 10 focused security/operations/workload suite | Passed: 10/10 |
| Full Phase 1-10 regression/security suite | Passed: 93/93 |
| TypeScript | Passed with incremental cache disabled |
| ESLint | Passed with zero warnings |
| OpenAPI drift | Passed: 18 v1 route paths |
| Secret-pattern scan | Passed |
| Dependency audit | Passed: 0 vulnerabilities |
| Production build | Passed: Next.js 15.5.21, 124 static pages generated |
| In-process operational aggregation workload | Passed below 1,500ms |
| In-process upload/create/webhook burst | Passed below 1,500ms |
| Concurrent rate limiting | Passed: exactly 10 allowed, 20 denied |
| Diff whitespace/integrity | Passed |

The final clean build completed successfully with the patched OpenTelemetry dependency set and returned exit code zero. No database mutation was performed.

## Infrastructure activation required before a private pilot

1. Use Vercel Pro or an approved external scheduler because the five-minute webhook worker is incompatible with Hobby cron frequency.
2. Apply the three documented WAF rules in log mode, observe test traffic, then enforce them.
3. Configure an approved Vercel Trace Drain/observability destination and validate the protected health monitor.
4. Enable Atlas continuous backup on a suitable dedicated tier and complete a restore-into-new-cluster exercise.
5. Configure separate production secrets, run the Phase 2 migration in an approved maintenance window, and execute the external smoke checklist in `PARTNER_API_PHASE_10_ACCEPTANCE_MATRIX.md`.
6. Identify the first trusted partner and expected request, shipment and upload volumes.

## Gate

Phase 10 implementation and local verification are complete. Phase 11 has not started and requires explicit owner approval after the infrastructure items above are accepted or scheduled. No files were staged, committed, pushed or deployed.
