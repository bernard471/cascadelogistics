import type { Db } from "mongodb";

const indexPromises = new WeakMap<Db, Promise<void>>();

export function ensurePartnerCoreIndexes(db: Db): Promise<void> {
  const existing = indexPromises.get(db);
  if (existing) return existing;

  const promise = (async () => {
    await db.collection("upload_intents").createIndex(
      { publicId: 1 },
      { name: "upload_intents_public_id_unique", unique: true },
    );
    await db.collection("upload_intents").createIndex(
      { organizationId: 1, apiClientId: 1, environment: 1, status: 1, expiresAt: 1 },
      { name: "upload_intents_owner_status_expiry" },
    );
    await db.collection("upload_intents").createIndex(
      { deleteAt: 1 },
      { name: "upload_intents_delete_ttl", expireAfterSeconds: 0 },
    );
    await db.collection("idempotency_records").createIndex(
      { apiClientId: 1, environment: 1, operation: 1, key: 1 },
      {
        name: "idempotency_client_environment_operation_key_unique",
        unique: true,
      },
    );
    await db.collection("idempotency_records").createIndex(
      { expiresAt: 1 },
      { name: "idempotency_expires_ttl", expireAfterSeconds: 0 },
    );
    await db.collection("shipments").createIndex(
      { idempotencyRecordId: 1 },
      {
        name: "shipments_idempotency_record_unique_partial",
        unique: true,
        partialFilterExpression: { idempotencyRecordId: { $type: "objectId" } },
      },
    );
    await db.collection("domain_events").createIndex(
      { publicId: 1 },
      { name: "domain_events_public_id_unique", unique: true },
    );
    await db.collection("domain_events").createIndex(
      { idempotencyRecordId: 1, type: 1 },
      {
        name: "domain_events_idempotency_type_unique_partial",
        unique: true,
        partialFilterExpression: { idempotencyRecordId: { $type: "objectId" } },
      },
    );
    await db.collection("domain_events").createIndex(
      { status: 1, nextAttemptAt: 1 },
      { name: "domain_events_dispatch_queue" },
    );
    await db.collection("notifications").createIndex(
      { partnerShipmentPublicId: 1, type: 1 },
      {
        name: "notifications_partner_shipment_type_unique_partial",
        unique: true,
        partialFilterExpression: { partnerShipmentPublicId: { $type: "string" } },
      },
    );
    await db.collection("payment_proofs").createIndex(
      { publicId: 1 },
      {
        name: "payment_proofs_public_id_unique_partial",
        unique: true,
        partialFilterExpression: { publicId: { $type: "string" } },
      },
    );
    await db.collection("partner_pilots").createIndex(
      { publicId: 1 },
      { name: "partner_pilots_public_id_unique", unique: true },
    );
    await db.collection("partner_pilots").createIndex(
      { organizationId: 1 },
      { name: "partner_pilots_organization_unique", unique: true },
    );
    await db.collection("partner_pilot_observations").createIndex(
      { publicId: 1 },
      { name: "partner_pilot_observations_public_id_unique", unique: true },
    );
    await db.collection("partner_pilot_observations").createIndex(
      { organizationId: 1, status: 1, createdAt: -1 },
      { name: "partner_pilot_observations_org_status_created" },
    );
    await db.collection("webhook_endpoints").createIndex(
      { publicId: 1 },
      { name: "webhook_endpoints_public_id_unique", unique: true },
    );
    await db.collection("webhook_endpoints").createIndex(
      { organizationId: 1, apiClientId: 1, environment: 1, status: 1, createdAt: -1 },
      { name: "webhook_endpoints_owner_status_created" },
    );
    await db.collection("webhook_deliveries").createIndex(
      { publicId: 1 },
      { name: "webhook_deliveries_public_id_unique", unique: true },
    );
    await db.collection("webhook_deliveries").createIndex(
      { eventId: 1, endpointId: 1 },
      { name: "webhook_deliveries_event_endpoint_unique", unique: true },
    );
    await db.collection("webhook_deliveries").createIndex(
      { status: 1, nextAttemptAt: 1 },
      { name: "webhook_deliveries_retry_queue" },
    );
    await db.collection("webhook_deliveries").createIndex(
      { organizationId: 1, apiClientId: 1, environment: 1, createdAt: -1 },
      { name: "webhook_deliveries_owner_created" },
    );
    await db.collection("webhook_delivery_attempts").createIndex(
      { publicId: 1 },
      { name: "webhook_delivery_attempts_public_id_unique", unique: true },
    );
    await db.collection("webhook_delivery_attempts").createIndex(
      { deliveryId: 1, replayNumber: 1, attemptNumber: 1 },
      { name: "webhook_delivery_attempts_delivery_replay_attempt_unique", unique: true },
    );
    await db.collection("payment_proofs").createIndex(
      { organizationId: 1, environment: 1, shipmentPublicId: 1, submittedAt: -1 },
      { name: "payment_proofs_tenant_shipment_submitted" },
    );
    await db.collection("payment_proofs").createIndex(
      { idempotencyRecordId: 1 },
      {
        name: "payment_proofs_idempotency_unique_partial",
        unique: true,
        partialFilterExpression: { idempotencyRecordId: { $type: "objectId" } },
      },
    );
  })();
  indexPromises.set(db, promise);
  void promise.catch(() => indexPromises.delete(db));
  return promise;
}
