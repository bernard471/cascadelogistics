import type { Shipment, ShipmentDocument } from "../../models/Shipment";
import { generatePublicId } from "../partner-platform/public-id.ts";
import { createInitialShipmentTimelineEvent } from "./timeline.ts";

export type ShipmentCreationPayload = Omit<
  Shipment,
  | "_id"
  | "publicId"
  | "trackingId"
  | "userId"
  | "createdVia"
  | "environment"
  | "organizationId"
  | "apiClientId"
  | "externalCustomerId"
  | "externalReference"
  | "cascadeUserId"
  | "idempotencyRecordId"
  | "createdByPrincipal"
  | "apiVersion"
  | "status"
  | "timeline"
  | "createdAt"
  | "updatedAt"
  | "documents"
  | "senderName"
  | "senderEmail"
  | "senderPhone"
  | "senderAddress"
  | "senderCity"
  | "senderCountry"
  | "receiverName"
  | "receiverEmail"
  | "receiverPhone"
  | "receiverAddress"
  | "receiverCity"
  | "receiverCountry"
>;

export interface ShipmentOwnerProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export function generateTrackingId(
  timestamp = Date.now(),
  randomValue = Math.random(),
): string {
  const timestampPart = timestamp.toString().slice(-6);
  const boundedRandom = Math.max(0, Math.min(0.999999, randomValue));
  const randomPart = Math.floor(boundedRandom * 1000)
    .toString()
    .padStart(3, "0");
  return `CLL${timestampPart}${randomPart}`;
}

export interface BuildShipmentRecordInput {
  source: "customer" | "admin";
  owner: ShipmentOwnerProfile;
  payload: ShipmentCreationPayload;
  documents?: ShipmentDocument[];
  trackingId?: string;
  publicId?: string;
  actor?: { type: "user" | "admin" | "staff"; id: string };
  now?: Date;
}

export function buildShipmentRecord(
  input: BuildShipmentRecordInput,
): Omit<Shipment, "_id"> {
  const now = input.now || new Date();
  const trackingId = input.trackingId || generateTrackingId(now.getTime());
  const payload = input.payload;
  const fullName = `${input.owner.firstName} ${input.owner.lastName}`;
  const isAdminCreated = input.source === "admin";
  const documents = input.documents?.length
    ? input.documents.map((document) => ({
        ...document,
        purpose:
          document.purpose ||
          (isAdminCreated ? "supporting-document" : "proof-of-purchase"),
        uploadedByRole:
          document.uploadedByRole ||
          (isAdminCreated
            ? input.actor?.type === "staff"
              ? "staff"
              : "admin"
            : "customer"),
        uploadedById:
          document.uploadedById || input.actor?.id || input.owner.userId,
      }))
    : undefined;

  return {
    ...payload,
    declaredValue: Number(
      (payload as ShipmentCreationPayload & { declaredValue?: unknown }).declaredValue,
    ) || 0,
    goodsType: payload.goodsType || "normal",
    publicId: input.publicId || generatePublicId("shipment"),
    trackingId,
    userId: input.owner.userId,
    cascadeUserId: input.owner.userId,
    createdVia: isAdminCreated ? "admin" : "dashboard",
    environment: "live",
    createdByPrincipal:
      input.actor || {
        type: isAdminCreated ? "admin" : "user",
        id: input.owner.userId,
      },
    status: isAdminCreated
      ? "arrived-at-warehouse-pending-proof"
      : "pending",
    deltaNumber: payload.deltaNumber?.trim() || undefined,
    documents,
    senderName: fullName,
    senderEmail: input.owner.email,
    senderPhone: input.owner.phone || "",
    senderAddress: "USA Warehouse",
    senderCity: "USA Warehouse",
    senderCountry: "USA",
    receiverName: fullName,
    receiverEmail: input.owner.email,
    receiverPhone: input.owner.phone || "",
    receiverAddress: "Ghana Warehouse",
    receiverCity: "Ghana Warehouse",
    receiverCountry: "Ghana",
    timeline: [
      createInitialShipmentTimelineEvent({
        source: input.source,
        packageType: payload.packageType,
        quantity: payload.quantity,
        documents,
        specialInstructions: payload.specialInstructions,
        wholesalePurchases: payload.wholesalePurchases,
        now,
      }),
    ] as Shipment["timeline"],
    createdAt: now,
    updatedAt: now,
  };
}
