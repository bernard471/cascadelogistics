import {
  getShipmentOperationBlock,
  type ShipmentOperationBlock,
  type ShipmentOperationName,
} from "../shipment-operations";
import type { ShipmentPrincipal } from "./principals.ts";

export async function getShipmentOperationBlockForPrincipal(
  action: ShipmentOperationName,
  principal: ShipmentPrincipal,
): Promise<ShipmentOperationBlock | null> {
  const role = principal.kind === "internal" ? principal.role : "user";
  return getShipmentOperationBlock(action, role);
}
