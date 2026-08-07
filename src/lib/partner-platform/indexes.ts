import type { Db, IndexDescription } from "mongodb";

export interface PartnerIndexResult {
  collection: string;
  name: string;
}

const requiredIndexes: Record<string, IndexDescription[]> = {
  organizations: [
    { key: { publicId: 1 }, name: "organizations_public_id_unique", unique: true },
    { key: { slug: 1 }, name: "organizations_slug_unique", unique: true },
  ],
  partner_users: [
    { key: { publicId: 1 }, name: "partner_users_public_id_unique", unique: true },
    {
      key: { organizationId: 1, emailNormalized: 1 },
      name: "partner_users_org_email_unique",
      unique: true,
    },
  ],
  api_clients: [
    { key: { publicId: 1 }, name: "api_clients_public_id_unique", unique: true },
    { key: { organizationId: 1, createdAt: -1 }, name: "api_clients_org_created" },
  ],
  api_credentials: [
    { key: { publicId: 1 }, name: "api_credentials_public_id_unique", unique: true },
    { key: { keyPrefix: 1 }, name: "api_credentials_prefix_unique", unique: true },
    { key: { organizationId: 1, apiClientId: 1 }, name: "api_credentials_org_client" },
  ],
  shipments: [
    {
      key: { publicId: 1 },
      name: "shipments_public_id_unique_partial",
      unique: true,
      partialFilterExpression: { publicId: { $type: "string" } },
    },
    {
      key: { organizationId: 1, externalReference: 1 },
      name: "shipments_org_external_reference_unique_partial",
      unique: true,
      partialFilterExpression: {
        organizationId: { $type: "objectId" },
        externalReference: { $type: "string" },
      },
    },
    { key: { organizationId: 1, createdAt: -1 }, name: "shipments_org_created" },
    { key: { organizationId: 1, trackingId: 1 }, name: "shipments_org_tracking" },
  ],
  partner_customers: [
    { key: { publicId: 1 }, name: "partner_customers_public_id_unique", unique: true },
    {
      key: { organizationId: 1, externalCustomerId: 1 },
      name: "partner_customers_org_external_customer_unique",
      unique: true,
    },
  ],
  idempotency_records: [
    {
      key: { apiClientId: 1, environment: 1, operation: 1, key: 1 },
      name: "idempotency_client_environment_operation_key_unique",
      unique: true,
    },
    { key: { expiresAt: 1 }, name: "idempotency_expires_ttl", expireAfterSeconds: 0 },
  ],
  api_request_logs: [
    { key: { requestId: 1 }, name: "api_request_logs_request_id_unique", unique: true },
    { key: { organizationId: 1, createdAt: -1 }, name: "api_request_logs_org_created" },
    { key: { organizationId: 1, environment: 1, createdAt: -1 }, name: "api_request_logs_org_environment_created" },
    { key: { expiresAt: 1 }, name: "api_request_logs_expires_ttl", expireAfterSeconds: 0 },
  ],
  webhook_deliveries: [
    { key: { publicId: 1 }, name: "webhook_deliveries_public_id_unique", unique: true },
    {
      key: { eventId: 1, endpointId: 1 },
      name: "webhook_deliveries_event_endpoint_unique",
      unique: true,
    },
    {
      key: { endpointId: 1, status: 1, nextAttemptAt: 1 },
      name: "webhook_deliveries_retry_queue",
    },
    {
      key: { organizationId: 1, apiClientId: 1, environment: 1, createdAt: -1 },
      name: "webhook_deliveries_owner_created",
    },
    { key: { status: 1, updatedAt: 1 }, name: "webhook_deliveries_status_updated" },
  ],
  webhook_endpoints: [
    { key: { publicId: 1 }, name: "webhook_endpoints_public_id_unique", unique: true },
    {
      key: { organizationId: 1, apiClientId: 1, environment: 1, status: 1, createdAt: -1 },
      name: "webhook_endpoints_owner_status_created",
    },
  ],
  webhook_delivery_attempts: [
    { key: { publicId: 1 }, name: "webhook_delivery_attempts_public_id_unique", unique: true },
    {
      key: { deliveryId: 1, replayNumber: 1, attemptNumber: 1 },
      name: "webhook_delivery_attempts_delivery_replay_attempt_unique",
      unique: true,
    },
    { key: { completedAt: 1 }, name: "webhook_delivery_attempts_completed" },
  ],
  domain_events: [
    { key: { status: 1, nextAttemptAt: 1 }, name: "domain_events_dispatch_queue" },
    { key: { status: 1, createdAt: 1 }, name: "domain_events_status_created" },
  ],
  partner_audit_logs: [
    { key: { organizationId: 1, createdAt: -1 }, name: "partner_audit_logs_org_created" },
    { key: { createdAt: 1 }, name: "partner_audit_logs_created" },
  ],
  partner_worker_heartbeats: [
    { key: { worker: 1 }, name: "partner_worker_heartbeats_worker_unique", unique: true },
  ],
  partner_pilots: [
    { key: { publicId: 1 }, name: "partner_pilots_public_id_unique", unique: true },
    { key: { organizationId: 1 }, name: "partner_pilots_organization_unique", unique: true },
    { key: { status: 1, updatedAt: -1 }, name: "partner_pilots_status_updated" },
  ],
  partner_pilot_observations: [
    { key: { publicId: 1 }, name: "partner_pilot_observations_public_id_unique", unique: true },
    { key: { organizationId: 1, status: 1, createdAt: -1 }, name: "partner_pilot_observations_org_status_created" },
  ],
  notifications: [
    {
      key: { partnerShipmentPublicId: 1, type: 1 },
      name: "notifications_partner_shipment_type_unique_partial",
      unique: true,
      partialFilterExpression: { partnerShipmentPublicId: { $type: "string" } },
    },
  ],
  payment_proofs: [
    {
      key: { publicId: 1 },
      name: "payment_proofs_public_id_unique_partial",
      unique: true,
      partialFilterExpression: { publicId: { $type: "string" } },
    },
    {
      key: { organizationId: 1, environment: 1, shipmentPublicId: 1, submittedAt: -1 },
      name: "payment_proofs_tenant_shipment_submitted",
    },
    {
      key: { idempotencyRecordId: 1 },
      name: "payment_proofs_idempotency_unique_partial",
      unique: true,
      partialFilterExpression: { idempotencyRecordId: { $type: "objectId" } },
    },
  ],
};

export function getRequiredPartnerIndexNames(): string[] {
  return Object.values(requiredIndexes).flatMap((indexes) =>
    indexes.map((index) => index.name as string),
  );
}

export async function ensurePartnerPlatformIndexes(
  db: Db,
): Promise<PartnerIndexResult[]> {
  const results: PartnerIndexResult[] = [];

  for (const [collectionName, indexes] of Object.entries(requiredIndexes)) {
    const collection = db.collection(collectionName);
    for (const index of indexes) {
      const name = await collection.createIndex(index.key, index);
      results.push({ collection: collectionName, name });
    }
  }

  return results;
}
