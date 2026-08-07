# Cascade Partner API Operations and Incident Runbook

## Ownership and initial service targets

- API availability target: 99.9% during the private pilot.
- API latency target: p95 below 1.5 seconds over 15 minutes, excluding private-file streaming.
- API server-error target: below 5% over 15 minutes with at least 20 requests.
- Webhook target: 99% of deliveries accepted or terminally classified within the retry window.
- Recovery point objective: 5 minutes for MongoDB business data when Atlas continuous backup is enabled.
- Recovery time objective: 4 hours for the private pilot.

The protected `/api/internal/partner-health` endpoint returns the current 15-minute request/error/latency view, webhook backlog, pending events, worker heartbeat and evaluated alerts. It requires `Authorization: Bearer {CRON_SECRET}` and must never be exposed in a public dashboard.

## Alert thresholds

| Signal | Warning/critical condition | First response |
|---|---|---|
| API 5xx rate | Critical at 5% with 20+ requests/15m | Inspect request IDs and latest deployment |
| API p95 latency | Warning at 1500ms/15m | Inspect MongoDB query latency and function duration |
| Authentication failures | Warning at 30/15m | Check credential stuffing and affected prefixes |
| Webhook backlog | Critical at 100 pending/retrying | Check worker heartbeat and receiver concentration |
| Oldest webhook | Critical at 15 minutes | Run protected worker once and inspect attempts |
| Worker heartbeat | Critical after 10 minutes | Inspect cron invocation and `CRON_SECRET` |

Connect Vercel traces to an approved observability integration or Trace Drain. The application registers `@vercel/otel` and emits `partner.api.request`, `partner.api.authenticate`, `partner.api.authorize` and `partner.api.operation` spans without customer data or secrets.

## General incident response

1. Record UTC detection time, reporter, affected environment, request IDs and suspected organizations.
2. Classify severity: P1 cross-tenant/private-data/credential exposure; P2 API outage or stalled financial/webhook workflow; P3 degraded isolated function.
3. Contain with the narrowest super-admin operation pause. Do not delete evidence.
4. Preserve sanitized request logs, audit logs, delivery attempts, deployment ID and relevant Atlas activity.
5. Identify the last known-good deployment and database timestamp.
6. Correct and verify in test mode, including tenant-isolation regression tests.
7. Resume the narrow scope first, monitor for 30 minutes, then close broader pauses.
8. Produce a timeline, root cause, affected records, remediation and prevention actions within two business days for P1/P2.

## Suspected credential compromise

1. Revoke the exposed key immediately in the Backup Dashboard or partner portal.
2. Pause the affected application if malicious writes may still be in flight.
3. Search sanitized logs by credential prefix, application, environment and time range.
4. Review created/changed shipments, uploads, proofs and webhook configuration; do not rely only on request status.
5. Rotate webhook secrets if the compromised system stored them.
6. Issue a replacement with the minimum scopes and an explicit expiry. Share it only through the partner's approved secret channel.
7. Resume after the partner confirms secure storage. Record the incident in the privileged audit trail.

Never paste a key into tickets, email, chat, logs or screenshots.

## Webhook failure and backlog

1. Check `/api/internal/partner-health` and the worker heartbeat.
2. If stale, inspect the Vercel cron/function logs and invoke the authenticated worker once.
3. If the worker is healthy, group failures by endpoint and safe error/status code.
4. Confirm public HTTPS DNS remains valid and no receiver redirect/private address is involved.
5. Ask the partner to restore a `2xx` response within eight seconds and deduplicate by event ID.
6. Replay only after the receiver is healthy. Replay preserves event identity.
7. If backlog threatens function limits, disable the failing endpoint or pause webhook management; do not block shipment writes.

## MongoDB backup and restore

Before the private pilot, use an Atlas tier that supports Cloud Backup and enable Continuous Cloud Backup with a restore window meeting the RPO. MongoDB documents point-in-time restore for M10+ dedicated clusters and notes that a restore can replace all target-cluster data. Prefer restoring into a separate recovery cluster first.

Quarterly restore exercise:

1. Select a known UTC timestamp and create a new isolated recovery cluster.
2. Start an Atlas point-in-time restore to the recovery cluster.
3. Use read-only credentials and verify organization, application, credential status, shipment, payment, event and audit counts.
4. Verify all required indexes and sample tenant-isolated queries.
5. Verify referenced private Blob objects exist without exposing their URLs.
6. Record achieved RPO/RTO, missing objects and operator names, then destroy the recovery cluster after approval.

For a real restore, pause all partner writes first, preserve the damaged cluster, restore to a new cluster, validate, rotate database credentials, switch `MONGO`, deploy, run smoke tests, then resume. Never restore directly over the only copy without owner approval.

Atlas references:

- https://www.mongodb.com/docs/atlas/architecture/current/disaster-recovery/
- https://www.mongodb.com/docs/atlas/backup-restore-cluster/
- https://www.mongodb.com/docs/atlas/backup/cloud-backup/backup-compliance-policy/

## Vercel Firewall rollout

No firewall rule was applied automatically. Configure rules in the Vercel Firewall UI, begin with `log`, observe legitimate traffic, then change the action:

1. Partner login: rate-limit `/api/partner-portal/session` POST by IP to 10/minute, return 429, persist for 5 minutes on Pro.
2. Partner API: log `/api/v1/*` above 300 requests/minute/IP; application-level MongoDB limits remain authoritative.
3. Scanner traffic: deny known unrelated paths such as `/wp-admin`, `/.env` and `/.git`.

Hobby currently permits three custom WAF rules but only daily cron schedules; the five-minute delivery worker requires Pro/Enterprise or an external scheduler. This commercial project should use Pro or higher before deployment. Vercel recommends testing WAF rules with a log action before deny/challenge/rate-limit.

Vercel references:

- https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules
- https://vercel.com/docs/tracing/instrumentation
- https://vercel.com/docs/cron-jobs/usage-and-pricing

## Retention

The daily protected retention job removes request logs, webhook attempts, terminal deliveries and terminal events after 90 days, and privileged audit entries after 365 days. MongoDB TTL indexes remain defense in depth for request logs, idempotency records and rate buckets. Legal hold or an active incident must suspend the relevant deletion before its deadline.
