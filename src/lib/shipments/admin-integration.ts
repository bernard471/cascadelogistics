import { ObjectId, type Db, type Filter } from "mongodb";
import type { Shipment } from "../../models/Shipment";
import {
  appendShipmentDomainEvent,
  type ShipmentDomainEventType,
} from "../partner-platform/domain-events.ts";
import type {
  ApiClientDocument,
  OrganizationDocument,
} from "../partner-platform/types.ts";
import type { InternalShipmentPrincipal } from "./principals.ts";

const shipmentStatuses = new Set<Shipment["status"]>([
  "pending",
  "arrived-at-warehouse-pending-proof",
  "arrived-at-warehouse",
  "ready-for-shipment",
  "in-transit",
  "arrived-at-warehouse-ghana",
  "ready-for-pickup",
  "delivered",
  "cancelled",
  "on-hold",
]);

const shipmentSources = new Set<NonNullable<Shipment["createdVia"]>>([
  "dashboard",
  "admin",
  "partner_api",
]);

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export interface AdminShipmentFilters {
  status?: string | null;
  search?: string | null;
  source?: string | null;
  partnerPublicId?: string | null;
  externalReference?: string | null;
}

export async function buildAdminShipmentFilter(
  db: Db,
  input: AdminShipmentFilters,
): Promise<Filter<Shipment>> {
  const conditions: Filter<Shipment>[] = [];
  if (input.status && input.status !== "all" && shipmentStatuses.has(input.status as Shipment["status"])) {
    conditions.push({ status: input.status as Shipment["status"] });
  }
  if (input.source && input.source !== "all" && shipmentSources.has(input.source as NonNullable<Shipment["createdVia"]>)) {
    conditions.push({ createdVia: input.source as NonNullable<Shipment["createdVia"]> });
  }

  if (input.partnerPublicId && input.partnerPublicId !== "all") {
    const organization = await db
      .collection<OrganizationDocument>("organizations")
      .findOne({ publicId: input.partnerPublicId });
    if (!organization?._id) return { _id: { $in: [] } } as Filter<Shipment>;
    conditions.push({
      createdVia: "partner_api",
      organizationId: organization._id,
    } as Filter<Shipment>);
  }

  const externalReference = input.externalReference?.trim().slice(0, 200);
  if (externalReference) {
    conditions.push({ externalReference: escapedRegex(externalReference) } as Filter<Shipment>);
  }

  const search = input.search?.trim().slice(0, 100);
  if (search) {
    const pattern = escapedRegex(search);
    const organizations = await db
      .collection<OrganizationDocument>("organizations")
      .find({ name: pattern })
      .toArray();
    const applications = await db
      .collection<ApiClientDocument>("api_clients")
      .find({ name: pattern })
      .toArray();
    conditions.push({
      $or: [
        { trackingId: pattern },
        { senderName: pattern },
        { receiverName: pattern },
        { senderCity: pattern },
        { receiverCity: pattern },
        { deltaNumber: pattern },
        { externalReference: pattern },
        { externalCustomerId: pattern },
        ...(organizations.some((organization) => organization._id)
          ? [{ organizationId: { $in: organizations.flatMap((organization) => organization._id ? [organization._id] : []) } }]
          : []),
        ...(applications.some((application) => application._id)
          ? [{ apiClientId: { $in: applications.flatMap((application) => application._id ? [application._id] : []) } }]
          : []),
      ],
    } as Filter<Shipment>);
  }

  if (conditions.length === 0) return {};
  return conditions.length === 1
    ? conditions[0]
    : ({ $and: conditions } as Filter<Shipment>);
}

export async function listAdminPartnerOptions(db: Db) {
  const organizations = await db
    .collection<OrganizationDocument>("organizations")
    .find({ status: { $ne: "archived" } })
    .sort({ name: 1 })
    .toArray();
  return organizations.map((organization) => ({
    id: organization.publicId,
    name: organization.name,
    status: organization.status,
  }));
}

function objectIdValues(values: Array<ObjectId | undefined>): ObjectId[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    if (!value || seen.has(value.toString())) return [];
    seen.add(value.toString());
    return [value];
  });
}

export async function enrichAdminShipments(db: Db, shipments: Shipment[]) {
  const userIds = Array.from(
    new Set(
      shipments.flatMap((shipment) =>
        shipment.userId && ObjectId.isValid(shipment.userId)
          ? [shipment.userId]
          : [],
      ),
    ),
  ).map((id) => new ObjectId(id));
  const organizationIds = objectIdValues(
    shipments.map((shipment) => shipment.organizationId),
  );
  const apiClientIds = objectIdValues(
    shipments.map((shipment) => shipment.apiClientId),
  );

  const [users, organizations, applications] = await Promise.all([
    userIds.length
      ? db.collection("users").find({ _id: { $in: userIds } }).toArray()
      : [],
    organizationIds.length
      ? db
          .collection<OrganizationDocument>("organizations")
          .find({ _id: { $in: organizationIds } })
          .toArray()
      : [],
    apiClientIds.length
      ? db
          .collection<ApiClientDocument>("api_clients")
          .find({ _id: { $in: apiClientIds } })
          .toArray()
      : [],
  ]);
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  const organizationsById = new Map(
    organizations.flatMap((organization) =>
      organization._id ? [[organization._id.toString(), organization] as const] : [],
    ),
  );
  const applicationsById = new Map(
    applications.flatMap((application) =>
      application._id ? [[application._id.toString(), application] as const] : [],
    ),
  );

  return shipments.map((shipment) => {
    const user = shipment.userId ? usersById.get(shipment.userId) : undefined;
    const organization = shipment.organizationId
      ? organizationsById.get(shipment.organizationId.toString())
      : undefined;
    const application = shipment.apiClientId
      ? applicationsById.get(shipment.apiClientId.toString())
      : undefined;
    const {
      organizationId: _organizationId,
      apiClientId: _apiClientId,
      idempotencyRecordId: _idempotencyRecordId,
      createdByPrincipal: _createdByPrincipal,
      ...safeShipment
    } = shipment;
    void _organizationId;
    void _apiClientId;
    void _idempotencyRecordId;
    void _createdByPrincipal;
    return {
      ...safeShipment,
      _id: shipment._id?.toString(),
      customer: user
        ? `${String(user.firstName || "").trim()} ${String(user.lastName || "").trim()}`.trim()
        : shipment.senderName || organization?.name || "Partner customer",
      customerEmail: user?.email || shipment.senderEmail || "",
      partnerManagedCustomer:
        shipment.createdVia === "partner_api" && !shipment.userId,
      partnerOrganization: organization?.name,
      partnerOrganizationId: organization?.publicId,
      partnerApplication: application?.name,
      partnerApplicationId: application?.publicId,
    };
  });
}

export async function getShipmentCustomerEmailMode(
  db: Db,
  shipment: Shipment,
): Promise<"cascade" | "partner" | "none"> {
  if (shipment.createdVia !== "partner_api") return "cascade";
  if (!shipment.organizationId) return "partner";
  const organization = await db
    .collection<OrganizationDocument>("organizations")
    .findOne({ _id: shipment.organizationId });
  return organization?.settings.customerEmailMode || "partner";
}

export async function appendInternalPartnerShipmentEvent(input: {
  db: Db;
  shipment: Shipment;
  principal: InternalShipmentPrincipal;
  type: ShipmentDomainEventType;
  payload?: Record<string, unknown>;
  now?: Date;
}) {
  const shipment = input.shipment;
  if (
    shipment.createdVia !== "partner_api" ||
    !shipment.organizationId ||
    !shipment.apiClientId ||
    !shipment.publicId ||
    !shipment.environment
  ) {
    return null;
  }
  return appendShipmentDomainEvent({
    db: input.db,
    type: input.type,
    organizationId: shipment.organizationId,
    apiClientId: shipment.apiClientId,
    environment: shipment.environment,
    shipmentPublicId: shipment.publicId,
    trackingId: shipment.trackingId,
    actor: {
      type: input.principal.role,
      id: input.principal.userId,
    },
    payload: input.payload,
    now: input.now,
  });
}
