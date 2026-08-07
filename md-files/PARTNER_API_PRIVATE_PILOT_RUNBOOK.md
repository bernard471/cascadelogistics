# Cascade Partner API - Private Pilot Runbook

## Purpose

Use this runbook to onboard exactly one trusted partner, validate the agreed production workflows, and produce the evidence needed for an owner decision on Phase 12. Do not issue a live credential or create live partner data until every prerequisite and approval below is satisfied.

## Roles

- **Cascade owner:** approves the partner, security review, sandbox acceptance, live credential, live start and pilot completion.
- **Cascade operations:** monitors shipments, invoices, payment proofs, support requests and webhook failures.
- **Partner technical owner:** owns credential storage, rotation, integration defects and webhook receiver availability.
- **Partner operational owner:** validates shipment and financial workflows.

One person may hold multiple roles, but every named responsibility must have an owner.

## Prerequisites before onboarding

1. Vercel Pro or an approved external scheduler is active for the five-minute webhook worker.
2. WAF rules are observed in log mode and then enforced.
3. Vercel tracing/monitoring and the protected health/pilot-monitor endpoints are connected to an operator alert.
4. MongoDB Atlas continuous backup is enabled and a restore-into-new-cluster exercise is recorded.
5. Phase 2 migration has been executed in an approved maintenance window and its reconciliation report is clean.
6. Separate production values exist for `PARTNER_API_KEY_PEPPER`, `PARTNER_PORTAL_SESSION_SECRET`, `WEBHOOK_SECRET_ENCRYPTION_KEY` and `CRON_SECRET`.
7. A harmless pair of test upload fixtures and an HTTPS webhook receiver are available.

## Partner selection and intake

Complete `PARTNER_API_PILOT_INTAKE.md`. Reject or postpone the pilot if the partner cannot:

- store credentials in a managed secret store or encrypted server environment;
- keep API calls server-side;
- restrict who can view or rotate credentials;
- verify webhook signatures and deduplicate by event ID;
- provide technical and operational support contacts;
- start within conservative quotas;
- avoid production customer data during sandbox testing.

Never place an API key, password, webhook secret, private Blob URL or customer document in the intake, dashboard notes, tickets or email.

## Sandbox onboarding

1. Create a pending organization in Backup Dashboard > Integrations > Partners.
2. Set the organization active only after the owner approves the partner.
3. Open **Private pilot**, select the organization and configure:
   - agreed workflows;
   - expected daily requests, shipments and upload bytes;
   - conservative pilot quotas;
   - the partner support email.
4. Provision one partner portal owner and share the temporary password through the approved secure channel. Require immediate password change.
5. Create a test-only application with the minimum scopes.
6. Issue a time-bounded `csl_test_...` credential. Copy it once into the partner's secret channel.
7. Repeat the Phase 10 18-step acceptance scenario using sandbox records, two real test Blob objects and a signed HTTPS webhook receiver.
8. Record defects/feedback in the Private Pilot tab, resolve all high/critical items, and ask the partner to confirm the sandbox result.
9. Record sandbox acceptance. A rejection returns the pilot to sandbox and does not enable live credentials.

## Security review

Record only:

- approval or rejection;
- storage approach;
- named rotation owner;
- safe notes that contain no credential material.

Confirm server-side use, access control, log redaction, incident notification and a tested rotation/revocation procedure. The platform will reject live credential issuance until both this review and sandbox acceptance are approved.

## Live go/no-go

The owner checks:

- security review approved;
- sandbox accepted;
- no open high/critical observation;
- no tenant-isolation, duplicate-shipment or private-file incident;
- WAF, worker, trace, backup and alert prerequisites operational;
- quota and support owners confirmed.

Then:

1. Record limited live approval in the Private Pilot tab.
2. Enable only the required live application access/scopes.
3. Issue one time-bounded live credential.
4. Start the live pilot. The start control verifies an active live credential exists.
5. Revoke unused test/live credentials and rotate immediately after suspected exposure.

## Daily monitoring

Review the Backup Dashboard and `/api/internal/partner-pilot-monitor` each business day. The protected endpoint requires `Authorization: Bearer {CRON_SECRET}` and returns 503 when a critical pilot alert exists.

Record:

- request volume, error rate and p95 latency;
- test/live shipment counts;
- upload intent count and bytes;
- webhook delivery reliability;
- open feedback, support, defects and incidents;
- any quota, credential, WAF or worker intervention.

Initial thresholds:

- critical: API error rate at least 5% with at least 20 requests;
- warning: p95 latency at least 1500ms with at least 20 requests;
- warning: webhook reliability below 99% after delivery begins;
- critical: any open high/critical pilot observation.

## Support and incident handling

Use the Phase 10 operations runbook for API, credential, webhook, backup and isolation incidents. Pause the narrowest affected operation first. A tenant-isolation, duplicate-shipment or private-file incident permanently blocks successful pilot completion and requires an owner review before any new pilot.

Pilot defects must remain within the agreed workflows. Record unrelated feature requests as future work; do not expand the pilot while resolving defects.

## Completion

The dashboard completion action requires:

- live validation stage;
- owner confirmation that production workflows completed;
- owner confirmation that support is workable;
- owner confirmation of incident-free operation;
- at least one live shipment;
- no open high/critical observations;
- no prohibited incident ever recorded;
- at least 99% webhook reliability when webhook delivery is an agreed workflow.

Export or copy the final safe report into the pilot completion record. The owner then decides whether to approve Phase 12. Completion does not automatically broaden scopes, quotas, access or credentials.

## Stop/offboard procedure

1. Pause the partner application or organization.
2. Revoke all credentials.
3. Disable webhook endpoints and let in-flight attempts become terminal.
4. Preserve audit, request, event, delivery and incident evidence under retention policy.
5. Confirm whether test records and orphaned uploads can be cleaned up.
6. Tell the partner through the approved support contact and document the final state.

