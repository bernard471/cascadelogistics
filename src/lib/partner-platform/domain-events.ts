import type { Db, ObjectId } from "mongodb";
import { generatePublicId } from "./public-id.ts";
import { redactSensitiveData } from "./redaction.ts";
import type { PartnerEnvironment } from "./types.ts";

export type ShipmentDomainEventType =
  | "shipment.created"
  | "shipment.updated"
  | "shipment.cancelled"
  | "shipment.document_removed"
  | "shipment.deleted"
  | "invoice.available"
  | "invoice.updated"
  | "payment_proof.received"
  | "payment_proof.approved"
  | "payment_proof.rejected";

export type PartnerDomainEventType = ShipmentDomainEventType | "webhook.test";

export const partnerDomainEventTypes: readonly PartnerDomainEventType[] = [
  "shipment.created",
  "shipment.updated",
  "shipment.cancelled",
  "shipment.document_removed",
  "shipment.deleted",
  "invoice.available",
  "invoice.updated",
  "payment_proof.received",
  "payment_proof.approved",
  "payment_proof.rejected",
  "webhook.test",
] as const;

export interface ShipmentDomainEventActor {
  type: "api_client" | "admin" | "staff" | "super_admin" | "system";
  id: string;
}

export async function appendShipmentDomainEvent(input: {
  db: Db;
  type: ShipmentDomainEventType;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  shipmentPublicId: string;
  trackingId: string;
  actor?: ShipmentDomainEventActor;
  actorCredentialId?: string;
  idempotencyRecordId?: ObjectId;
  payload?: Record<string, unknown>;
  now?: Date;
}): Promise<string> {
  const now = input.now || new Date();
  const publicId = generatePublicId("event");
  if (!input.actor && !input.actorCredentialId) {
    throw new Error("A domain event actor is required");
  }
  await input.db.collection("domain_events").insertOne({
    publicId,
    schemaVersion: "1",
    type: input.type,
    aggregateType: "shipment",
    aggregatePublicId: input.shipmentPublicId,
    organizationId: input.organizationId,
    apiClientId: input.apiClientId,
    environment: input.environment,
    actor:
      input.actor || {
        type: "api_client",
        id: input.actorCredentialId as string,
      },
    ...(input.idempotencyRecordId
      ? { idempotencyRecordId: input.idempotencyRecordId }
      : {}),
    payload: redactSensitiveData({
      shipmentId: input.shipmentPublicId,
      trackingId: input.trackingId,
      ...(input.payload || {}),
    }),
    status: "pending",
    attemptCount: 0,
    occurredAt: now,
    createdAt: now,
    nextAttemptAt: now,
  });
  return publicId;
}
