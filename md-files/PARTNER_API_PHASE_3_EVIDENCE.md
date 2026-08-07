# Partner API Platform - Phase 3 Evidence

**Project:** Cascade Logistics  
**Phase:** 3 - Partner authentication, scopes, limits and audit foundation  
**Completed:** 2026-08-06  
**Production migration:** Not executed  
**Deployment:** Not performed  
**Shipment API exposure:** None

## 1. Outcome

The partner platform now has machine-credential authentication and an authenticated integration-identity endpoint. `GET /api/v1/me` is the only `/api/v1` route. It returns the organization, application, credential-derived environment and effective scopes after the complete security pipeline succeeds.

No partner shipment create, read, update, cancellation, upload, invoice or payment endpoint is enabled.

## 2. API-key security

Partner keys use visibly separated formats:

```text
csl_test_<lookup-id>.<secret>
csl_live_<lookup-id>.<secret>
```

Security properties:

- Secret material contains 32 random bytes (256 bits).
- The lookup ID contains a separate 12 random bytes.
- Only `keyPrefix` and a versioned HMAC-SHA-256 digest are stored.
- `PARTNER_API_KEY_PEPPER` must contain at least 32 characters and is never client-exposed.
- Secret verification uses constant-time comparison.
- Unknown prefixes also perform a dummy digest comparison before returning the same invalid-key response.
- The full API key is returned once by the issuance service and is absent from credential and audit records.
- Test and live environment identity is encoded in the key and must match the credential and application permissions.
- Rotation is supported by overlapping active credentials; revocation is immediate and audited.

The environment template now documents `PARTNER_API_KEY_PEPPER`. No real pepper or credential was added to source control.

## 3. Authentication and authorization pipeline

Every protected partner request now follows this sequence:

1. Generate an opaque `req_` request ID.
2. Validate the exact Bearer-key structure before credential lookup.
3. Look up the safe credential prefix.
4. Verify the digest in constant time.
5. Check revoked and expired credential states.
6. Resolve the application through the credential's organization.
7. Require active organization and application states.
8. Require credential, key and application environment agreement.
9. Intersect credential scopes with current application scopes.
10. Enforce the route's declared scopes.
11. Apply application and organization fixed-window rate limits.
12. Apply global, organization, application and environment operation controls.
13. Run the route handler.
14. Return the request ID and rate-limit metadata.
15. Write a sanitized technical request log.

Organization, application and environment context are derived exclusively from the credential. Request bodies and query strings cannot select a tenant.

## 4. Stable responses

Authentication and policy failures use stable codes and HTTP status behaviour, including:

- `authentication_required` - 401.
- `invalid_api_key` - 401.
- `api_key_expired` - 401.
- `api_key_revoked` - 401.
- `integration_suspended` - 403.
- `insufficient_scope` - 403.
- `operation_paused` - 503 with `Retry-After`.
- `rate_limit_exceeded` - 429 with `Retry-After`.
- `internal_error` - 500 without an internal stack trace.

Every response includes `X-Request-Id` and `Cache-Control: no-store`. Successful authenticated responses include rate-limit limit, remaining and reset headers. HTTP 401 responses include a Bearer authentication challenge.

## 5. Rate limits and operation controls

- Each request consumes both an organization bucket and an application bucket.
- Application limits cannot exceed the owning organization's configured request rate.
- Authentication failures use a lower source-fingerprint bucket.
- Source addresses are stored only as salted SHA-256 fingerprints.
- Partner operation pauses support global, organization and application scope.
- Pauses may be limited to test/live and to one declared API operation.
- A global `api_access` pause is also checked for future business routes.
- Application-scoped controls take priority over organization and global controls when multiple messages apply.
- Every control change is restricted to `super_admin` and written to the partner audit collection.

Daily shipment/upload quotas remain unenforced because Phase 3 intentionally exposes no shipment or upload operation. Those counters attach to the relevant business endpoints in Phase 4.

## 6. Logging and audit privacy

Ordinary API request logs contain only operational metadata:

- Request ID.
- Organization/application IDs after successful authentication.
- Safe credential lookup prefix.
- Environment, method and route template.
- Response status, stable error code and duration.
- Rate-limit outcome.
- Hashed source fingerprint.
- Sanitized user agent and correlation ID.
- Creation and expiry timestamps.

Authorization headers, cookies, passwords, API secrets, webhook secrets, raw request bodies and uploaded files are not accepted by the logging interface. Generic redaction removes sensitive keys, API-key values, control characters and excessive text.

Credential issue/revocation, organization status, application status/scope/limit and operation-control changes create sanitized append-only audit entries through their service functions. Ordinary admin/staff principals receive a not-found result from these super-admin services.

## 7. `/api/v1/me` contract

An authenticated response has this data shape:

```json
{
  "data": {
    "organization": { "id": "org_...", "name": "Partner name" },
    "application": { "id": "app_...", "name": "Application name" },
    "environment": "test",
    "scopes": ["shipments:read"]
  },
  "meta": { "requestId": "req_..." }
}
```

The identity builder and complete credential-to-principal pipeline were exercised in the isolated security suite. The production build confirms `/api/v1/me` is registered and is the only v1 route.

## 8. Guarded development issuance

The local issuance command displays the full key once and refuses the live `guangzhou` database:

```text
npm run issue:partner-key:test -- --database=<explicit-test-or-sandbox-database> --organization=org_... --application=app_... --environment=test --scopes=shipments:read,tracking:read
```

The selected organization and application must already exist in the named test database. The resulting key can be sent as `Authorization: Bearer <one-time-key>` to the local `/api/v1/me` endpoint.

## 9. Security verification

The Phase 3 suite verifies:

- Valid test and live keys.
- One-time display and absence of plaintext secrets from storage/audits.
- Correct partner principal and `/me` identity response.
- Missing and malformed authorization.
- Wrong secret with a valid prefix.
- Revoked and expired credentials.
- Suspended application and organization.
- Missing scope.
- Environment denial.
- Application, organization and authentication-failure rate limits.
- Global/application/environment operation controls.
- Request-log and recursive secret redaction.
- Safe request IDs and last-used source fingerprints.

## 10. Final validation

| Check | Result |
|---|---|
| Unit/regression/security suite | Passed: 28/28 |
| Isolated migration integration suite | Passed: 1/1 |
| TypeScript | Passed: no errors |
| ESLint | Passed: zero warnings |
| Production build | Passed: Next.js 15.5.21, 106 static pages generated |
| v1 route inventory | Passed: only `/api/v1/me` |
| Diff integrity | Passed: no whitespace errors |

MongoDB Atlas DNS remained unavailable from the execution environment, so an external live/test credential smoke test was not performed and no Atlas record was changed. The authentication, storage, isolation and `/me` response pipeline was verified against the disposable in-process database. The production build completed successfully.

## 11. Phase gate

Phase 3 is complete. Phase 4 uploads and core shipment API work must not begin until the owner explicitly approves it. No files were staged, committed, pushed or deployed. No production credential, migration or secret was created.
