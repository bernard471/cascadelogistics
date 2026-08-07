import { randomBytes } from "node:crypto";

export const publicIdPrefixes = {
  organization: "org",
  partnerUser: "pusr",
  apiClient: "app",
  apiCredential: "key",
  partnerCustomer: "pcus",
  shipment: "shp",
  upload: "upl",
  document: "doc",
  paymentProof: "ppr",
  webhookEndpoint: "whe",
  webhookDelivery: "whd",
  webhookAttempt: "wha",
  request: "req",
  event: "evt",
  pilot: "plt",
  pilotObservation: "pob",
} as const;

export type PublicIdKind = keyof typeof publicIdPrefixes;

export function generatePublicId(
  kind: PublicIdKind,
  entropy: () => Buffer = () => randomBytes(12),
): string {
  return `${publicIdPrefixes[kind]}_${entropy().toString("base64url")}`;
}

export function isPublicId(value: string, kind: PublicIdKind): boolean {
  const prefix = publicIdPrefixes[kind];
  return new RegExp(`^${prefix}_[A-Za-z0-9_-]{16,}$`).test(value);
}
