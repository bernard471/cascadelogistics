import type { Shipment } from "../../models/Shipment";
import type { ShipmentPrincipal } from "./principals.ts";

export function canManageAllShipments(principal: ShipmentPrincipal): boolean {
  return principal.kind === "internal";
}

export function canBypassShipmentOperationPause(
  principal: ShipmentPrincipal,
): boolean {
  return principal.kind === "internal" && principal.role === "super_admin";
}

export function canAccessUserOwnedResource(
  principal: ShipmentPrincipal,
  ownerUserId?: string,
): boolean {
  if (principal.kind === "internal") return true;
  if (!ownerUserId) return false;
  if (principal.kind === "customer") return principal.userId === ownerUserId;
  return false;
}

export function canEditShipmentAsCustomer(shipment: Shipment): boolean {
  return shipment.status === "pending";
}

export function canDeleteShipmentAsCustomer(shipment: Shipment): boolean {
  return shipment.status === "pending" || shipment.status === "cancelled";
}

export function canSubmitProofOfPurchase(shipment: Shipment): boolean {
  return shipment.status === "arrived-at-warehouse-pending-proof";
}

export function hasPartnerScope(
  principal: ShipmentPrincipal,
  scope: string,
): boolean {
  return principal.kind === "partner_api" && principal.scopes.includes(scope);
}
