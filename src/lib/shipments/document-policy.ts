import type { ShipmentOperationName } from "../shipment-operations";
import type { ShipmentPrincipal } from "./principals.ts";

export type ShipmentUploadMode = "create" | "submit";

export function parseShipmentUploadMode(value: unknown): ShipmentUploadMode {
  if (value !== "create" && value !== "submit") {
    throw new Error("Invalid shipment upload mode");
  }

  return value;
}

export function getShipmentUploadOperation(
  mode: ShipmentUploadMode,
): ShipmentOperationName {
  return mode === "create" ? "create" : "submit";
}

export function canUseShipmentUploadMode(
  principal: ShipmentPrincipal,
  mode: ShipmentUploadMode,
): boolean {
  if (mode === "create") {
    return principal.kind === "internal";
  }

  return principal.kind === "customer" || principal.kind === "internal";
}

export function isAuthorizedShipmentUploadPath(input: {
  userId: string;
  prefix: unknown;
  pathname: string;
}): boolean {
  const expectedRoot = `shipment-documents/${input.userId}/`;

  return (
    typeof input.prefix === "string" &&
    input.prefix.startsWith(expectedRoot) &&
    input.pathname.startsWith(`${input.prefix}/`)
  );
}
