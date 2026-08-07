# Partner API Platform - Phase 5 Evidence

**Project:** Cascade Logistics  
**Phase:** 5 - Admin and staff integration  
**Completed:** 2026-08-06  
**Production migration:** Not executed  
**Deployment:** Not performed

## 1. Outcome

Partner-created shipments now participate in the existing admin/staff operating workflow without requiring a Cascade user account. They appear in the same shipment list, use the same edit and bulk-update services, populate the same timeline, retain the same private documents, accept the existing invoice workflow, and remain readable through the authenticated partner shipment API after an internal update.

The dashboard clearly identifies their source, partner organization, creating application, environment and external references. Test shipments receive visible `TEST` labels so they are not mistaken for live partner submissions.

No Phase 6 partner timeline, tracking-number, invoice or payment-proof API endpoint was enabled.

## 2. Admin shipment list

The admin/staff shipment list now displays:

- Creation source: customer dashboard, admin/staff, Partner API or legacy dashboard record.
- Partner organization and application for API-created shipments.
- Test/live environment badge.
- External reference below the Cascade tracking ID.
- External customer ID for partner-managed customers.
- The existing status, route, DELTA number, customer and delivery data.

Search now matches:

- Cascade tracking ID and DELTA number.
- Sender/receiver names and cities.
- External reference and external customer ID.
- Partner organization name.
- Partner application name.

Dedicated filters are available for shipment source, partner organization and shipment status. Selecting a partner automatically selects the Partner API source. The API also accepts a dedicated partial external-reference filter. Filtered pagination totals now use the filtered query rather than the global shipment count.

Partner and user enrichment is performed in batched lookups instead of one organization/user query per shipment.

## 3. Safe admin data contract

Admin list and detail responses include only the partner information needed for operations:

- Organization/application names and opaque public IDs.
- Test/live environment.
- External customer/reference values.
- A flag identifying a partner-managed customer.

The browser response deliberately removes:

- Internal organization and application MongoDB IDs.
- The shipment's idempotency-record ID.
- The internal creating-principal record.
- Credential IDs, prefixes, hashes and secrets.

No API credential collection or integration-control record is exposed through an admin/staff route.

## 4. View-modal field parity

The shipment view modal now includes a Source & Integration section. For partner shipments it shows the partner, application, environment, external reference, external customer ID and whether the customer is managed by the partner or linked to a Cascade user.

The existing modal continues to show every operational field accepted by the partner shipment creation contract:

- Complete sender and receiver details.
- Package type, description, weight, dimensions and quantity.
- Declared value with its actual currency.
- Goods/service type and calculated price.
- Special instructions.
- Every wholesale purchase and tracking number.
- DELTA number added later by staff.
- Timeline events and update images.
- All authorized shipment documents.
- Invoice metadata where present.

Partner files continue to use the existing authorized admin document proxy. The admin UI receives the shipment's normal database ID and safe document metadata, but not integration secrets.

## 5. Partner-managed customer identity

Partner shipments may omit `userId`. Admin/staff shipment read, edit, bulk-update, delete, document and invoice services operate on those records because internal authorization is role-based rather than customer-owner-based.

Customer routes remain owner-scoped by `userId`. An unrelated Cascade user cannot retrieve a partner-managed shipment simply by knowing its database or tracking identity. Admin display falls back to the submitted sender profile when no Cascade customer exists.

## 6. Timelines and partner API visibility

Single admin/staff edits use the canonical admin update planner. Status, current location, estimated delivery, special instructions, DELTA number and update images create one shared timeline entry with human-readable change details.

Bulk status updates continue to use the canonical unique-status timeline helper. Partner shipment data is stored in the same record, so the authenticated partner detail response immediately reflects internal changes, including:

- Updated status and current location.
- Changed special instructions.
- DELTA number.
- Updated delivery dates.
- The new timeline event and its safe image-availability metadata.

The Phase 5 suite verifies an admin update through the internal service and then reads the same shipment through the partner service.

## 7. Internal changes and domain events

Admin and staff changes to partner shipments create tenant-scoped outbox events with the internal actor's role and user ID:

- Single updates create `shipment.updated`.
- Bulk updates create `shipment.updated` per changed partner shipment.
- A successful internal deletion creates `shipment.deleted`, preserving the shipment public ID and internal actor in the outbox after the operational record is removed.

Event payloads contain safe operational metadata such as changed field names and status. They do not contain uploaded files, API keys or customer request bodies. Existing partner-originated events continue to identify the API credential actor.

Webhook delivery remains disabled until Phase 7.

## 8. Notification behavior

Every newly-created partner shipment creates one idempotent admin notification. It includes the partner name, Cascade tracking ID and a visible `TEST` or `LIVE` label. Replaying the shipment creation request does not create another notification. A partial unique index enforces one partner-shipment notification per type.

Direct customer email after admin/staff updates follows the organization setting:

| Setting | Behavior |
|---|---|
| `partner` | Cascade does not email the partner-managed customer; the partner receives the shipment event for its own notification workflow |
| `cascade` | Cascade sends the existing shipment update email to the submitted sender address |
| `none` | Cascade sends no direct customer email |

Normal dashboard shipments retain the existing Cascade email behavior. Database user notifications are created only when a shipment has a real Cascade `userId`. Email delivery errors remain non-blocking for shipment updates.

## 9. Separation from customer/public views

The public tracking response was moved into a tested explicit serializer. It returns lifecycle data and wholesale tracking numbers but never includes:

- Partner organization/application identity.
- Internal organization/application IDs.
- Creation source.
- External customer or reference IDs.
- Idempotency or credential metadata.

Special instructions remain hidden from unauthenticated tracking users. Customer shipment APIs continue to query by the signed-in customer's `userId`, so partner-managed records do not appear in unrelated customer lists or modals.

## 10. Super-admin separation

Credential issuance, revocation, organization/application access control and partner operation controls still require `super_admin`. Admin and staff principals receive the same HTTP 404-style `resource_not_found` response as a nonexistent integration resource. The Phase 5 test verifies that rejected calls create no credential or control record.

The admin shipment response exposes display metadata only; credential material and integration controls remain reserved for the future Phase 8 super-admin console.

## 11. Verification

The Phase 5 suite covers:

- Immediate admin visibility with complete partner/application/customer context.
- Multiple private documents and complete submitted-field parity.
- Removal of internal integration identifiers from admin responses.
- Search by partner application and external reference.
- Source and partner filters within a shared database.
- Admin update parity in the partner response and shared timeline.
- Admin actor details in the outbox.
- Staff operation on a shipment with no Cascade user.
- Staff deletion event creation.
- Organization email modes.
- Public/customer partner-metadata isolation.
- Admin/staff denial from credentials and integration controls.
- Idempotent admin notification creation.

| Check | Result |
|---|---|
| Phase 5 integration/security suite | Passed: 7/7 |
| Full Phase 1-5 regression/security suite | Passed: 48/48 |
| Isolated migration integration suite | Included and passed |
| TypeScript | Passed: no errors |
| ESLint | Passed: zero warnings |
| Production build | Passed: Next.js 15.5.21, 109 static pages generated |
| Phase boundary | Passed: no new Phase 6 `/api/v1` route |
| Diff integrity | Passed: no whitespace errors |

MongoDB Atlas DNS and real private Blob credentials were not available to this execution environment, so no external sandbox write or browser session against production was attempted. The exact admin enrichment, shared shipment update, outbox, notification, ownership and isolation services were exercised against the disposable in-process Mongo-compatible database. The production build completed successfully.

## 12. Phase gate

Phase 5 is complete. Phase 6 tracking, invoices and payment proofs must not begin until the owner explicitly approves it. No files were staged, committed, pushed or deployed. No production migration, notification, shipment, event, credential or Blob object was created.
