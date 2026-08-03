import clientPromise from "@/lib/mongodb";

export const shipmentOperationNames = ["create", "update", "submit"] as const;

export type ShipmentOperationName = (typeof shipmentOperationNames)[number];

export interface ShipmentOperationState {
  pausedUntil: Date | null;
  reason: string | null;
}

interface ShipmentOperationsDocument {
  _id: "shipment_operations";
  operations?: Partial<Record<ShipmentOperationName, ShipmentOperationState>>;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface ShipmentOperationBlock {
  action: ShipmentOperationName;
  pausedUntil: string;
  reason: string | null;
}

const defaultOperationState = (): ShipmentOperationState => ({
  pausedUntil: null,
  reason: null,
});

export async function getShipmentOperations() {
  const client = await clientPromise;
  const document = await client
    .db("guangzhou")
    .collection<ShipmentOperationsDocument>("system_controls")
    .findOne({ _id: "shipment_operations" });

  return Object.fromEntries(
    shipmentOperationNames.map((name) => {
      const configured = document?.operations?.[name];
      const pausedUntil = configured?.pausedUntil
        ? new Date(configured.pausedUntil)
        : null;

      return [
        name,
        {
          ...defaultOperationState(),
          ...configured,
          pausedUntil,
          isPaused: Boolean(pausedUntil && pausedUntil.getTime() > Date.now()),
        },
      ];
    })
  ) as Record<
    ShipmentOperationName,
    ShipmentOperationState & { isPaused: boolean }
  >;
}

export async function getShipmentOperationBlock(
  action: ShipmentOperationName,
  role?: string
): Promise<ShipmentOperationBlock | null> {
  // The owner must always be able to recover service from the control dashboard.
  if (role === "super_admin") return null;

  const operations = await getShipmentOperations();
  const operation = operations[action];

  if (!operation.isPaused || !operation.pausedUntil) return null;

  return {
    action,
    pausedUntil: operation.pausedUntil.toISOString(),
    reason: operation.reason,
  };
}

