import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import type { Shipment, ShipmentDocument } from "../../models/Shipment";
import { calculateShippingPrice } from "../pricing.ts";
import {
  buildShipmentRecord,
  type ShipmentCreationPayload,
  type ShipmentOwnerProfile,
} from "./factory.ts";
import {
  canDeleteShipmentAsCustomer,
  canEditShipmentAsCustomer,
  canManageAllShipments,
} from "./policies.ts";
import type { ShipmentPrincipal } from "./principals.ts";
import type {
  AdminShipmentUpdateInput,
  CustomerShipmentUpdate,
} from "./schemas.ts";
import {
  appendCustomerUpdateTimeline,
  describeCustomerShipmentChanges,
  planAdminShipmentUpdate,
  type AdminUpdateMedia,
} from "./timeline.ts";
import { appendInternalPartnerShipmentEvent } from "./admin-integration.ts";

export class ShipmentServiceError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = "ShipmentServiceError";
    this.status = status;
    this.code = code;
  }
}

function shipmentId(id: string): ObjectId {
  return new ObjectId(id);
}

function requireCustomerPrincipal(
  principal: ShipmentPrincipal,
): asserts principal is Extract<ShipmentPrincipal, { kind: "customer" }> {
  if (principal.kind !== "customer") {
    throw new ShipmentServiceError("Forbidden", 403);
  }
}

function requireInternalPrincipal(
  principal: ShipmentPrincipal,
): asserts principal is Extract<ShipmentPrincipal, { kind: "internal" }> {
  if (!canManageAllShipments(principal)) {
    throw new ShipmentServiceError("Forbidden", 403);
  }
}

export async function getShipmentByIdForPrincipal(
  db: Db,
  id: string,
  principal: ShipmentPrincipal,
): Promise<Shipment | null> {
  const filter: Record<string, unknown> = {
    _id: shipmentId(id) as unknown as string,
  };

  if (principal.kind === "customer") {
    filter.userId = principal.userId;
  } else if (principal.kind === "partner_api") {
    return null;
  }

  return db.collection<Shipment>("shipments").findOne(filter);
}

export async function getShipmentByTrackingIdForPrincipal(
  db: Db,
  trackingId: string,
  principal: ShipmentPrincipal,
): Promise<Shipment | null> {
  const filter: Record<string, unknown> = { trackingId };

  if (principal.kind === "customer") {
    filter.userId = principal.userId;
  } else if (principal.kind === "partner_api") {
    return null;
  }

  return db.collection<Shipment>("shipments").findOne(filter);
}

export async function getShipmentByPublicIdForPrincipal(
  db: Db,
  publicId: string,
  principal: ShipmentPrincipal,
): Promise<Shipment | null> {
  const filter: Record<string, unknown> = { publicId };

  if (principal.kind === "customer") {
    filter.userId = principal.userId;
  } else if (principal.kind === "partner_api") {
    if (!ObjectId.isValid(principal.organizationId)) return null;
    filter.organizationId = new ObjectId(principal.organizationId);
    filter.environment = principal.environment;
  }

  return db.collection<Shipment>("shipments").findOne(filter);
}

export interface CreateExistingUserShipmentInput {
  db: Db;
  principal: ShipmentPrincipal;
  source: "customer" | "admin";
  owner: ShipmentOwnerProfile;
  payload: ShipmentCreationPayload;
  documents?: ShipmentDocument[];
  trackingId?: string;
  now?: Date;
}

export async function createExistingUserShipment(
  input: CreateExistingUserShipmentInput,
) {
  if (input.source === "customer") {
    requireCustomerPrincipal(input.principal);
    if (input.owner.userId !== input.principal.userId) {
      throw new ShipmentServiceError("Forbidden", 403);
    }
  } else {
    requireInternalPrincipal(input.principal);
  }

  const shipment = buildShipmentRecord({
    source: input.source,
    owner: input.owner,
    payload: input.payload,
    documents: input.documents,
    trackingId: input.trackingId,
    actor:
      input.principal.kind === "customer"
        ? { type: "user", id: input.principal.userId }
        : {
            type:
              input.principal.role === "super_admin"
                ? "admin"
                : input.principal.role,
            id: input.principal.userId,
          },
    now: input.now,
  });
  const result = await input.db
    .collection<Shipment>("shipments")
    .insertOne(shipment);

  return {
    shipment,
    shipmentId: result.insertedId.toString(),
  };
}

export async function updateCustomerShipment(input: {
  db: Db;
  id: string;
  principal: ShipmentPrincipal;
  data: CustomerShipmentUpdate;
  now?: Date;
}) {
  requireCustomerPrincipal(input.principal);
  const collection = input.db.collection<Shipment>("shipments");
  const existing = await collection.findOne({
    _id: shipmentId(input.id) as unknown as string,
    userId: input.principal.userId,
  });

  if (!existing) throw new ShipmentServiceError("Shipment not found", 404);
  if (!canEditShipmentAsCustomer(existing)) {
    throw new ShipmentServiceError("Only pending shipments can be edited", 409);
  }

  const servicePrice = calculateShippingPrice(
    input.data.serviceType,
    input.data.goodsType,
    existing.weight,
    input.data.quantity,
    input.data.dimensions,
    input.data.description,
    existing.packageType,
  );
  const now = input.now || new Date();
  const updateDetails = describeCustomerShipmentChanges(existing, input.data);
  const timeline = appendCustomerUpdateTimeline(existing, updateDetails, now);
  const result = await collection.updateOne(
    {
      _id: shipmentId(input.id) as unknown as string,
      userId: input.principal.userId,
    },
    {
      $set: {
        ...input.data,
        servicePrice,
        ...(updateDetails.length > 0 ? { timeline } : {}),
        updatedAt: now,
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new ShipmentServiceError("Shipment not found", 404);
  }

  return { existing, updateDetails, servicePrice };
}

export async function updateInternalShipment(input: {
  db: Db;
  id: string;
  principal: ShipmentPrincipal;
  body: AdminShipmentUpdateInput;
  media?: AdminUpdateMedia;
  now?: Date;
}) {
  requireInternalPrincipal(input.principal);
  const collection = input.db.collection<Shipment>("shipments");
  const existing = await collection.findOne({
    _id: shipmentId(input.id) as unknown as string,
  });
  if (!existing) throw new ShipmentServiceError("Shipment not found", 404);

  const now = input.now || new Date();
  const plan = planAdminShipmentUpdate(
    existing,
    input.body,
    input.media || {},
    now,
  );
  const result = await collection.updateOne(
    { _id: shipmentId(input.id) as unknown as string },
    { $set: plan.updateData },
  );
  if (result.matchedCount === 0) {
    throw new ShipmentServiceError("Shipment not found", 404);
  }

  if (plan.updateDetails.length > 0) {
    const changedFields = Object.keys(plan.updateData).filter(
      (field) => !["timeline", "updatedAt"].includes(field),
    );
    if (input.media?.imageUrl) changedFields.push("updateImage");
    await appendInternalPartnerShipmentEvent({
      db: input.db,
      shipment: existing,
      principal: input.principal,
      type: "shipment.updated",
      payload: {
        changedFields,
        status: plan.newStatus,
      },
      now,
    });
  }

  return { existing, ...plan };
}

export async function deleteCustomerShipment(input: {
  db: Db;
  id: string;
  principal: ShipmentPrincipal;
}) {
  requireCustomerPrincipal(input.principal);
  const collection = input.db.collection<Shipment>("shipments");
  const existing = await collection.findOne({
    _id: shipmentId(input.id) as unknown as string,
    userId: input.principal.userId,
  });
  if (!existing || !canDeleteShipmentAsCustomer(existing)) {
    throw new ShipmentServiceError(
      "Only pending or cancelled shipments can be deleted",
      409,
    );
  }

  const result = await collection.deleteOne({
    _id: shipmentId(input.id) as unknown as string,
    userId: input.principal.userId,
    status: { $in: ["pending", "cancelled"] },
  });
  if (result.deletedCount === 0) {
    throw new ShipmentServiceError(
      "Only pending or cancelled shipments can be deleted",
      409,
    );
  }
}

export async function deleteInternalShipment(input: {
  db: Db;
  id: string;
  principal: ShipmentPrincipal;
}) {
  requireInternalPrincipal(input.principal);
  const collection = input.db.collection<Shipment>("shipments");
  const id = shipmentId(input.id) as unknown as string;
  const existing = await collection.findOne({ _id: id });
  if (!existing) {
    throw new ShipmentServiceError("Shipment not found", 404);
  }
  const result = await collection.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    throw new ShipmentServiceError("Shipment not found", 404);
  }
  await appendInternalPartnerShipmentEvent({
    db: input.db,
    shipment: existing,
    principal: input.principal,
    type: "shipment.deleted",
    payload: {},
  });
}

export interface ShipmentInvoiceData {
  url: string;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  pathname?: string;
}

export async function setInternalShipmentInvoice(input: {
  db: Db;
  id: string;
  principal: ShipmentPrincipal;
  invoice: ShipmentInvoiceData;
  now?: Date;
}) {
  requireInternalPrincipal(input.principal);
  const collection = input.db.collection<Shipment>("shipments");
  const existing = await collection.findOne({
    _id: shipmentId(input.id) as unknown as string,
  });
  if (!existing) {
    throw new ShipmentServiceError("Shipment not found", 404);
  }
  await collection.updateOne(
    { _id: existing._id },
    {
      $set: {
        invoice: input.invoice,
        updatedAt: input.now || new Date(),
      },
    },
  );
  await appendInternalPartnerShipmentEvent({
    db: input.db,
    shipment: existing,
    principal: input.principal,
    type: existing.invoice ? "invoice.updated" : "invoice.available",
    payload: { fileName: input.invoice.fileName },
    now: input.now,
  });
  return { previousInvoice: existing.invoice };
}
