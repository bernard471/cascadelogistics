import { del } from "@vercel/blob";
import { ObjectId, type Db, type Filter } from "mongodb";
import type { Shipment, ShipmentDocument } from "../../models/Shipment";
import { getPrivateBlobToken } from "../identity-security.ts";
import { calculateShippingPrice } from "../pricing.ts";
import type { PartnerShipmentPrincipal } from "../shipments/principals.ts";
import {
  appendCustomerUpdateTimeline,
  createInitialShipmentTimelineEvent,
} from "../shipments/timeline.ts";
import { generateTrackingId } from "../shipments/factory.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import { appendShipmentDomainEvent } from "./domain-events.ts";
import { partnerApiError } from "./errors.ts";
import {
  claimIdempotency,
  completeIdempotency,
  failIdempotency,
} from "./idempotency.ts";
import type {
  PartnerShipmentCreateInput,
  PartnerShipmentUpdateInput,
} from "./phase4-schemas.ts";
import { generatePublicId } from "./public-id.ts";
import { upsertPartnerCustomer } from "./repositories.ts";
import {
  markPartnerUploadsConsumed,
  reserveAndValidatePartnerUploads,
  type BlobHeadMetadata,
} from "./uploads.ts";
import type { OrganizationDocument } from "./types.ts";

function objectIds(principal: PartnerShipmentPrincipal) {
  if (
    !ObjectId.isValid(principal.organizationId) ||
    !ObjectId.isValid(principal.apiClientId)
  ) {
    throw partnerApiError("invalid_api_key", "Invalid API key", 401);
  }
  return {
    organizationId: new ObjectId(principal.organizationId),
    apiClientId: new ObjectId(principal.apiClientId),
  };
}

function tenantFilter(
  principal: PartnerShipmentPrincipal,
  organization: OrganizationDocument,
): Filter<Shipment> {
  const { organizationId, apiClientId } = objectIds(principal);
  return {
    organizationId,
    environment: principal.environment,
    ...(organization.settings.shipmentVisibility === "creating_client"
      ? { apiClientId }
      : {}),
  } as Filter<Shipment>;
}

function iso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function serializeDocument(document: ShipmentDocument) {
  return {
    id: document.publicId,
    name: document.name,
    contentType: document.type,
    size: document.size,
    uploadedAt: iso(document.uploadedAt),
  };
}

export function serializePartnerShipment(shipment: Shipment) {
  return {
    id: shipment.publicId,
    trackingId: shipment.trackingId,
    externalCustomerId: shipment.externalCustomerId,
    externalReference: shipment.externalReference,
    environment: shipment.environment,
    sender: {
      name: shipment.senderName,
      email: shipment.senderEmail,
      phone: shipment.senderPhone,
      address: shipment.senderAddress,
      city: shipment.senderCity,
      country: shipment.senderCountry,
    },
    receiver: {
      name: shipment.receiverName,
      email: shipment.receiverEmail,
      phone: shipment.receiverPhone,
      address: shipment.receiverAddress,
      city: shipment.receiverCity,
      country: shipment.receiverCountry,
    },
    packageType: shipment.packageType,
    weight: shipment.weight,
    dimensions: shipment.dimensions,
    quantity: shipment.quantity,
    description: shipment.description,
    declaredValue: shipment.declaredValue,
    declaredCurrency: shipment.declaredCurrency || "USD",
    goodsType: shipment.goodsType || "normal",
    serviceType: shipment.serviceType,
    servicePrice: shipment.servicePrice,
    specialInstructions: shipment.specialInstructions,
    wholesalePurchases: shipment.wholesalePurchases || [],
    deltaNumber: shipment.deltaNumber,
    status: shipment.status,
    currentLocation: shipment.currentLocation,
    pickupDate: iso(shipment.pickupDate),
    estimatedDelivery: iso(shipment.estimatedDelivery),
    actualDelivery: iso(shipment.actualDelivery),
    timeline: (shipment.timeline || []).map((event) => ({
      status: event.status,
      location: event.location,
      date: iso(event.date),
      time: event.time,
      completed: event.completed,
      imageAvailable: Boolean(event.imageUrl),
      imageName: event.imageName,
      details: event.details || [],
    })),
    documents: (shipment.documents || []).map(serializeDocument),
    invoiceAvailable: Boolean(shipment.invoice),
    createdAt: iso(shipment.createdAt),
    updatedAt: iso(shipment.updatedAt),
  };
}

async function ensureCreatedEvent(input: {
  db: Db;
  shipment: Shipment;
  principal: PartnerShipmentPrincipal;
  idempotencyRecordId: ObjectId;
  now: Date;
}) {
  const existing = await input.db.collection("domain_events").findOne({
    idempotencyRecordId: input.idempotencyRecordId,
    type: "shipment.created",
  });
  if (existing) return;
  const { organizationId, apiClientId } = objectIds(input.principal);
  await appendShipmentDomainEvent({
    db: input.db,
    type: "shipment.created",
    organizationId,
    apiClientId,
    environment: input.principal.environment,
    shipmentPublicId: input.shipment.publicId as string,
    trackingId: input.shipment.trackingId,
    actorCredentialId: input.principal.credentialId,
    idempotencyRecordId: input.idempotencyRecordId,
    payload: { documentCount: input.shipment.documents?.length || 0 },
    now: input.now,
  });
}

async function ensureAdminPartnerShipmentNotification(input: {
  db: Db;
  shipment: Shipment;
  organization: OrganizationDocument;
  now: Date;
}) {
  await input.db.collection("notifications").updateOne(
    {
      partnerShipmentPublicId: input.shipment.publicId,
      type: "shipment",
    },
    {
      $setOnInsert: {
        userId: "admin",
        title:
          input.shipment.environment === "test"
            ? "New Test Partner Shipment"
            : "New Partner Shipment",
        message: `[${(input.shipment.environment || "live").toUpperCase()}] ${input.shipment.trackingId} was submitted by ${input.organization.name} through the Partner API.`,
        type: "shipment",
        isRead: false,
        relatedShipmentId: input.shipment._id?.toString(),
        partnerShipmentPublicId: input.shipment.publicId,
        source: "partner_api",
        createdAt: input.now,
      },
    },
    { upsert: true },
  );
}

export async function createPartnerShipment(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  data: PartnerShipmentCreateInput;
  idempotencyKey: string;
  headBlob?: (pathname: string) => Promise<BlobHeadMetadata>;
  now?: Date;
}) {
  const now = input.now || new Date();
  const { organizationId, apiClientId } = objectIds(input.principal);
  const claim = await claimIdempotency({
    db: input.db,
    organizationId,
    apiClientId,
    environment: input.principal.environment,
    operation: "shipments:create",
    key: input.idempotencyKey,
    request: input.data,
    now,
  });
  if (claim.kind === "completed") {
    return {
      status: claim.responseStatus,
      body: claim.responseBody,
      replayed: true,
    };
  }

  const shipments = input.db.collection<Shipment>("shipments");
  const recovered = await shipments.findOne({
    idempotencyRecordId: claim.record._id,
    organizationId,
    environment: input.principal.environment,
  } as Filter<Shipment>);
  if (recovered) {
    await markPartnerUploadsConsumed({
      db: input.db,
      reservationId: claim.record._id,
      shipmentPublicId: recovered.publicId as string,
      now,
    });
    await ensureCreatedEvent({
      db: input.db,
      shipment: recovered,
      principal: input.principal,
      idempotencyRecordId: claim.record._id,
      now,
    });
    await ensureAdminPartnerShipmentNotification({
      db: input.db,
      shipment: recovered,
      organization: input.organization,
      now,
    });
    const body = { shipment: serializePartnerShipment(recovered) };
    await completeIdempotency({
      db: input.db,
      recordId: claim.record._id,
      responseStatus: 201,
      responseBody: body,
      resourcePublicId: recovered.publicId,
      now,
    });
    return { status: 201, body, replayed: true };
  }
  if (claim.kind === "processing") {
    throw partnerApiError("request_in_progress", "Request is being processed", 409);
  }

  try {
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dailyShipments = await shipments.countDocuments({
      organizationId,
      environment: input.principal.environment,
      createdAt: { $gte: dayStart },
    } as Filter<Shipment>);
    if (dailyShipments >= input.organization.limits.shipmentsPerDay) {
      throw partnerApiError(
        "rate_limit_exceeded",
        "Daily shipment quota exceeded",
        429,
        Math.max(
          1,
          Math.ceil(
            (Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() + 1,
            ) -
              now.getTime()) /
              1000,
          ),
        ),
      );
    }
    const publicId = generatePublicId("shipment");
    const documents = await reserveAndValidatePartnerUploads({
      db: input.db,
      principal: input.principal,
      uploadIds: input.data.uploadIds,
      reservationId: claim.record._id,
      headBlob: input.headBlob,
      now,
    });
    await upsertPartnerCustomer(
      input.db,
      organizationId,
      {
        externalCustomerId: input.data.externalCustomerId,
        profile: {
          name: input.data.sender.name,
          email: input.data.sender.email,
          phone: input.data.sender.phone,
        },
      },
      now,
    );
    const servicePrice = calculateShippingPrice(
      input.data.serviceType,
      input.data.goodsType,
      input.data.weight,
      input.data.quantity,
      input.data.dimensions,
      input.data.description,
      input.data.packageType,
    );
    const shipment: Omit<Shipment, "_id"> = {
      publicId,
      trackingId: generateTrackingId(now.getTime()),
      createdVia: "partner_api",
      environment: input.principal.environment,
      organizationId,
      apiClientId,
      externalCustomerId: input.data.externalCustomerId,
      externalReference: input.data.externalReference,
      idempotencyRecordId: claim.record._id,
      createdByPrincipal: {
        type: "api_client",
        id: input.principal.apiClientId,
      },
      apiVersion: "v1",
      senderName: input.data.sender.name,
      senderEmail: input.data.sender.email,
      senderPhone: input.data.sender.phone,
      senderAddress: input.data.sender.address,
      senderCity: input.data.sender.city,
      senderCountry: input.data.sender.country,
      receiverName: input.data.receiver.name,
      receiverEmail: input.data.receiver.email,
      receiverPhone: input.data.receiver.phone,
      receiverAddress: input.data.receiver.address,
      receiverCity: input.data.receiver.city,
      receiverCountry: input.data.receiver.country,
      packageType: input.data.packageType,
      weight: input.data.weight,
      dimensions: input.data.dimensions,
      quantity: input.data.quantity,
      description: input.data.description,
      declaredValue: input.data.declaredValue,
      declaredCurrency: input.data.declaredCurrency,
      goodsType: input.data.goodsType,
      serviceType: input.data.serviceType,
      servicePrice,
      specialInstructions: input.data.specialInstructions,
      wholesalePurchases: input.data.wholesalePurchases,
      status: "pending",
      currentLocation: "USA Warehouse, USA",
      documents: documents.length > 0 ? documents : undefined,
      timeline: [
        createInitialShipmentTimelineEvent({
          source: "customer",
          packageType: input.data.packageType,
          quantity: input.data.quantity,
          documents,
          specialInstructions: input.data.specialInstructions,
          wholesalePurchases: input.data.wholesalePurchases,
          now,
        }),
      ] as Shipment["timeline"],
      createdAt: now,
      updatedAt: now,
    };
    const result = await shipments.insertOne(shipment);
    const stored = { ...shipment, _id: result.insertedId.toString() } as Shipment;
    await markPartnerUploadsConsumed({
      db: input.db,
      reservationId: claim.record._id,
      shipmentPublicId: publicId,
      now,
    });
    await ensureCreatedEvent({
      db: input.db,
      shipment: stored,
      principal: input.principal,
      idempotencyRecordId: claim.record._id,
      now,
    });
    await ensureAdminPartnerShipmentNotification({
      db: input.db,
      shipment: stored,
      organization: input.organization,
      now,
    });
    const body = { shipment: serializePartnerShipment(stored) };
    await completeIdempotency({
      db: input.db,
      recordId: claim.record._id,
      responseStatus: 201,
      responseBody: body,
      resourcePublicId: publicId,
      now,
    });
    return { status: 201, body, replayed: false };
  } catch (error) {
    await failIdempotency(input.db, claim.record._id, now);
    throw error;
  }
}

function encodeCursor(shipment: Shipment): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: new Date(shipment.createdAt).toISOString(),
      publicId: shipment.publicId,
    }),
    "utf8",
  ).toString("base64url");
}

function decodeCursor(value: string): { createdAt: Date; publicId: string } {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      typeof parsed.publicId !== "string" ||
      typeof parsed.createdAt !== "string" ||
      Number.isNaN(new Date(parsed.createdAt).getTime())
    ) {
      throw new Error("invalid");
    }
    return { createdAt: new Date(parsed.createdAt), publicId: parsed.publicId };
  } catch {
    throw partnerApiError("validation_failed", "Invalid pagination cursor", 422);
  }
}

export async function listPartnerShipments(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  query: {
    limit: number;
    cursor?: string;
    status?: Shipment["status"];
    externalReference?: string;
    createdFrom?: string;
    createdTo?: string;
  };
}) {
  const base = tenantFilter(input.principal, input.organization);
  const filters: Filter<Shipment>[] = [base];
  if (input.query.status) filters.push({ status: input.query.status });
  if (input.query.externalReference) {
    filters.push({ externalReference: input.query.externalReference });
  }
  if (input.query.createdFrom || input.query.createdTo) {
    filters.push({
      createdAt: {
        ...(input.query.createdFrom
          ? { $gte: new Date(input.query.createdFrom) }
          : {}),
        ...(input.query.createdTo ? { $lte: new Date(input.query.createdTo) } : {}),
      },
    } as Filter<Shipment>);
  }
  if (input.query.cursor) {
    const cursor = decodeCursor(input.query.cursor);
    filters.push({
      $or: [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, publicId: { $lt: cursor.publicId } },
      ],
    } as Filter<Shipment>);
  }
  const filter = filters.length === 1 ? filters[0] : ({ $and: filters } as Filter<Shipment>);
  const rows = await input.db
    .collection<Shipment>("shipments")
    .find(filter)
    .sort({ createdAt: -1, publicId: -1 })
    .limit(input.query.limit + 1)
    .toArray();
  const hasMore = rows.length > input.query.limit;
  const page = rows.slice(0, input.query.limit);
  return {
    shipments: page.map(serializePartnerShipment),
    pagination: {
      hasMore,
      nextCursor: hasMore && page.length > 0 ? encodeCursor(page[page.length - 1]) : null,
      limit: input.query.limit,
    },
  };
}

export async function getPartnerShipment(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipmentPublicId: string;
}): Promise<Shipment> {
  const shipment = await input.db.collection<Shipment>("shipments").findOne({
    ...tenantFilter(input.principal, input.organization),
    publicId: input.shipmentPublicId,
  } as Filter<Shipment>);
  if (!shipment) {
    throw partnerApiError("resource_not_found", "Shipment not found", 404);
  }
  return shipment;
}

export async function updatePartnerShipment(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipmentPublicId: string;
  data: PartnerShipmentUpdateInput;
  now?: Date;
}) {
  const now = input.now || new Date();
  const shipment = await getPartnerShipment(input);
  if (shipment.status !== "pending") {
    throw partnerApiError(
      "shipment_not_editable",
      "Only pending shipments can be edited",
      422,
    );
  }
  const receiver = input.data.receiver || {};
  const updates: Partial<Shipment> = {
    ...(receiver.name !== undefined ? { receiverName: receiver.name } : {}),
    ...(receiver.email !== undefined ? { receiverEmail: receiver.email } : {}),
    ...(receiver.phone !== undefined ? { receiverPhone: receiver.phone } : {}),
    ...(receiver.address !== undefined ? { receiverAddress: receiver.address } : {}),
    ...(receiver.city !== undefined ? { receiverCity: receiver.city } : {}),
    ...(receiver.country !== undefined ? { receiverCountry: receiver.country } : {}),
    ...(input.data.description !== undefined
      ? { description: input.data.description }
      : {}),
    ...(input.data.dimensions !== undefined
      ? { dimensions: input.data.dimensions }
      : {}),
    ...(input.data.quantity !== undefined ? { quantity: input.data.quantity } : {}),
    ...(input.data.declaredValue !== undefined
      ? { declaredValue: input.data.declaredValue }
      : {}),
    ...(input.data.declaredCurrency !== undefined
      ? { declaredCurrency: input.data.declaredCurrency }
      : {}),
    ...(input.data.goodsType !== undefined ? { goodsType: input.data.goodsType } : {}),
    ...(input.data.serviceType !== undefined
      ? { serviceType: input.data.serviceType }
      : {}),
    ...(input.data.specialInstructions !== undefined
      ? { specialInstructions: input.data.specialInstructions }
      : {}),
  };
  const merged = { ...shipment, ...updates };
  const servicePrice = calculateShippingPrice(
    merged.serviceType,
    merged.goodsType || "normal",
    merged.weight,
    merged.quantity,
    merged.dimensions,
    merged.description,
    merged.packageType,
  );
  const details = Object.keys(updates).map((field) =>
    field === "specialInstructions"
      ? "Special instructions updated"
      : field === "declaredCurrency"
        ? "Declared currency updated"
        : `${field.replace(/([A-Z])/g, " $1").trim()} updated`,
  );
  const timeline = appendCustomerUpdateTimeline(shipment, details, now);
  const filter = {
    ...tenantFilter(input.principal, input.organization),
    publicId: input.shipmentPublicId,
    status: "pending",
  } as Filter<Shipment>;
  const result = await input.db.collection<Shipment>("shipments").updateOne(
    filter,
    {
      $set: {
        ...updates,
        servicePrice,
        timeline,
        updatedAt: now,
      },
    },
  );
  if (result.modifiedCount !== 1) {
    throw partnerApiError(
      "shipment_not_editable",
      "Shipment is no longer editable",
      422,
    );
  }
  const updated = { ...shipment, ...updates, servicePrice, timeline, updatedAt: now };
  const { organizationId, apiClientId } = objectIds(input.principal);
  await appendShipmentDomainEvent({
    db: input.db,
    type: "shipment.updated",
    organizationId,
    apiClientId,
    environment: input.principal.environment,
    shipmentPublicId: shipment.publicId as string,
    trackingId: shipment.trackingId,
    actorCredentialId: input.principal.credentialId,
    payload: { changedFields: Object.keys(updates) },
    now,
  });
  return updated;
}

export async function cancelPartnerShipment(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipmentPublicId: string;
  reason?: string;
  now?: Date;
}) {
  const now = input.now || new Date();
  const shipment = await getPartnerShipment(input);
  if (shipment.status === "cancelled") return shipment;
  if (shipment.status !== "pending") {
    throw partnerApiError(
      "shipment_not_editable",
      "Only pending shipments can be cancelled",
      422,
    );
  }
  const timeline = [
    ...(shipment.timeline || []),
    {
      status: "Cancelled",
      location: shipment.currentLocation || "USA Warehouse, USA",
      date: now,
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      completed: true,
      details: [
        "Shipment cancelled by partner",
        ...(input.reason ? [`Reason: ${input.reason.trim().slice(0, 250)}`] : []),
      ],
    },
  ];
  const result = await input.db.collection<Shipment>("shipments").updateOne(
    {
      ...tenantFilter(input.principal, input.organization),
      publicId: input.shipmentPublicId,
      status: "pending",
    } as Filter<Shipment>,
    { $set: { status: "cancelled", timeline, updatedAt: now } },
  );
  if (result.modifiedCount !== 1) {
    throw partnerApiError(
      "shipment_not_editable",
      "Shipment is no longer cancellable",
      422,
    );
  }
  const cancelled = { ...shipment, status: "cancelled" as const, timeline, updatedAt: now };
  const { organizationId, apiClientId } = objectIds(input.principal);
  await appendShipmentDomainEvent({
    db: input.db,
    type: "shipment.cancelled",
    organizationId,
    apiClientId,
    environment: input.principal.environment,
    shipmentPublicId: shipment.publicId as string,
    trackingId: shipment.trackingId,
    actorCredentialId: input.principal.credentialId,
    payload: { reason: input.reason?.trim().slice(0, 250) },
    now,
  });
  await appendPartnerAuditEntry(input.db, {
    actorType: "api_client",
    actorId: input.principal.credentialId,
    action: "partner_shipment_cancelled",
    organizationId,
    apiClientId,
    targetPublicId: shipment.publicId,
    metadata: { reason: input.reason?.trim().slice(0, 250) },
    createdAt: now,
  });
  return cancelled;
}

export function listPartnerShipmentDocuments(shipment: Shipment) {
  return (shipment.documents || []).map(serializeDocument);
}

export function getPartnerShipmentDocument(
  shipment: Shipment,
  documentPublicId: string,
): ShipmentDocument {
  const document = shipment.documents?.find(
    (candidate) => candidate.publicId === documentPublicId,
  );
  if (!document?.url || !document.pathname) {
    throw partnerApiError("resource_not_found", "Document not found", 404);
  }
  return document;
}

export async function deletePartnerShipmentDocument(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipmentPublicId: string;
  documentPublicId: string;
  deleteBlob?: (url: string) => Promise<void>;
  now?: Date;
}) {
  const now = input.now || new Date();
  const shipment = await getPartnerShipment(input);
  if (shipment.status !== "pending") {
    throw partnerApiError(
      "shipment_not_editable",
      "Documents can only be removed while a shipment is pending",
      422,
    );
  }
  const document = getPartnerShipmentDocument(shipment, input.documentPublicId);
  const documents = (shipment.documents || []).filter(
    (candidate) => candidate.publicId !== input.documentPublicId,
  );
  const result = await input.db.collection<Shipment>("shipments").updateOne(
    {
      ...tenantFilter(input.principal, input.organization),
      publicId: input.shipmentPublicId,
      status: "pending",
    } as Filter<Shipment>,
    { $set: { documents, updatedAt: now } },
  );
  if (result.modifiedCount !== 1) {
    throw partnerApiError(
      "shipment_not_editable",
      "Shipment is no longer editable",
      422,
    );
  }
  try {
    await (input.deleteBlob || (async (url) => {
      await del(url, { token: getPrivateBlobToken() });
    }))(document.url as string);
  } catch {
    await input.db.collection("orphaned_blobs").insertOne({
      url: document.url,
      pathname: document.pathname,
      reason: "partner_document_removed",
      createdAt: now,
      nextAttemptAt: now,
      status: "pending",
    });
  }
  const { organizationId, apiClientId } = objectIds(input.principal);
  await appendShipmentDomainEvent({
    db: input.db,
    type: "shipment.document_removed",
    organizationId,
    apiClientId,
    environment: input.principal.environment,
    shipmentPublicId: shipment.publicId as string,
    trackingId: shipment.trackingId,
    actorCredentialId: input.principal.credentialId,
    payload: { documentId: input.documentPublicId },
    now,
  });
  return { documentId: input.documentPublicId, deleted: true };
}
