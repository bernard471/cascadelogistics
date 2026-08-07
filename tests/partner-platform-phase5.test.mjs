import assert from "node:assert/strict";
import test from "node:test";

import { issuePartnerApiCredential } from "../src/lib/partner-platform/credentials.ts";
import { ensurePartnerCoreIndexes } from "../src/lib/partner-platform/core-indexes.ts";
import { PartnerApiError } from "../src/lib/partner-platform/errors.ts";
import { setPartnerOperationControl } from "../src/lib/partner-platform/operation-controls.ts";
import {
  partnerShipmentCreateSchema,
  partnerUploadIntentSchema,
} from "../src/lib/partner-platform/phase4-schemas.ts";
import {
  createPartnerShipment,
  getPartnerShipment,
  serializePartnerShipment,
} from "../src/lib/partner-platform/partner-shipments.ts";
import {
  createApiClient,
  createOrganization,
} from "../src/lib/partner-platform/repositories.ts";
import { createPartnerUploadIntents } from "../src/lib/partner-platform/uploads.ts";
import {
  buildAdminShipmentFilter,
  enrichAdminShipments,
  getShipmentCustomerEmailMode,
  listAdminPartnerOptions,
} from "../src/lib/shipments/admin-integration.ts";
import {
  deleteInternalShipment,
  getShipmentByIdForPrincipal,
  updateInternalShipment,
} from "../src/lib/shipments/service.ts";
import { buildPublicTrackingResponse } from "../src/lib/shipments/tracking-response.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

const baseNow = new Date("2026-08-06T12:00:00.000Z");
const admin = {
  kind: "internal",
  userId: "admin-phase-5",
  role: "admin",
};
const staff = {
  kind: "internal",
  userId: "staff-phase-5",
  role: "staff",
};

async function setup(options = {}) {
  const db = options.db || new InMemoryMongoDatabase("cascade_phase5_test");
  const organization = await createOrganization(
    db,
    {
      name: options.name || "Acme Partner Logistics",
      slug: `phase-5-${Math.random().toString(36).slice(2, 10)}`,
      status: "active",
      settings: {
        customerEmailMode: options.emailMode || "partner",
        defaultWebhookVersion: "1",
        shipmentVisibility: "organization",
      },
      limits: {
        requestsPerMinute: 100,
        shipmentsPerDay: 100,
        uploadBytesPerDay: 1024 * 1024 * 1024,
      },
    },
    baseNow,
  );
  const apiClient = await createApiClient(
    db,
    organization._id,
    {
      name: options.applicationName || "Warehouse Connector",
      environmentAccess: ["test"],
      scopes: [
        "shipments:create",
        "shipments:read",
        "shipments:update",
        "shipments:cancel",
        "tracking:read",
        "documents:read",
        "documents:write",
      ],
    },
    baseNow,
  );
  const principal = {
    kind: "partner_api",
    organizationId: organization._id.toString(),
    apiClientId: apiClient._id.toString(),
    credentialId: "credential-phase-5",
    environment: "test",
    scopes: apiClient.scopes,
  };
  await ensurePartnerCoreIndexes(db);
  return { db, organization, apiClient, principal };
}

function shipmentData(overrides = {}) {
  return partnerShipmentCreateSchema.parse({
    externalCustomerId: "partner-customer-501",
    externalReference: "partner-order-501",
    sender: {
      name: "Partner Sender",
      email: "sender@example.com",
      phone: "+233200000001",
      address: "Sender address",
      city: "Accra",
      country: "Ghana",
    },
    receiver: {
      name: "Partner Receiver",
      email: "receiver@example.com",
      phone: "+233200000002",
      address: "Receiver address",
      city: "Kumasi",
      country: "Ghana",
    },
    packageType: "parcel",
    weight: 4.5,
    dimensions: "30 x 20 x 10",
    quantity: 2,
    description: "Phase 5 partner parcel",
    declaredValue: 450,
    declaredCurrency: "GHS",
    goodsType: "special",
    serviceType: "express",
    specialInstructions: "Keep upright and call the receiver",
    wholesalePurchases: [
      { name: "Wholesale Store", trackingNumber: "WHOLESALE-PHASE5" },
    ],
    uploadIds: [],
    ...overrides,
  });
}

function privateBlob(pathname, contentType, size) {
  return {
    pathname,
    contentType,
    size,
    url: `https://phase5.private.blob.vercel-storage.com/${pathname}`,
    uploadedAt: baseNow,
  };
}

async function createShipment(context, options = {}) {
  const result = await createPartnerShipment({
    ...context,
    data: shipmentData(options.data || {}),
    idempotencyKey: options.idempotencyKey || "phase-5-create-001",
    headBlob: options.headBlob,
    now: baseNow,
  });
  const raw = await context.db.collection("shipments").findOne({
    publicId: result.body.shipment.id,
  });
  return { result, raw };
}

async function expectNotFound(promise) {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof PartnerApiError &&
      error.code === "resource_not_found" &&
      error.status === 404,
  );
}

test("admin shipment data shows complete partner context without integration internals", async () => {
  const context = await setup();
  const intents = await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({
      files: [
        { fileName: "photo.png", contentType: "image/png", size: 2048 },
        { fileName: "packing-list.pdf", contentType: "application/pdf", size: 4096 },
      ],
    }),
    generateClientToken: async ({ pathname }) => `token:${pathname}`,
    now: baseNow,
  });
  const { raw } = await createShipment(context, {
    data: { uploadIds: intents.uploads.map((upload) => upload.id) },
    headBlob: async (pathname) => {
      const intent = intents.uploads.find((upload) => upload.pathname === pathname);
      return privateBlob(pathname, intent.contentType, intent.maximumSize);
    },
  });
  const [adminRecord] = await enrichAdminShipments(context.db, [raw]);

  assert.equal(adminRecord.createdVia, "partner_api");
  assert.equal(adminRecord.partnerManagedCustomer, true);
  assert.equal(adminRecord.partnerOrganization, "Acme Partner Logistics");
  assert.equal(adminRecord.partnerOrganizationId, context.organization.publicId);
  assert.equal(adminRecord.partnerApplication, "Warehouse Connector");
  assert.equal(adminRecord.partnerApplicationId, context.apiClient.publicId);
  assert.equal(adminRecord.externalReference, "partner-order-501");
  assert.equal(adminRecord.externalCustomerId, "partner-customer-501");
  assert.equal(adminRecord.specialInstructions, "Keep upright and call the receiver");
  assert.equal(adminRecord.wholesalePurchases[0].trackingNumber, "WHOLESALE-PHASE5");
  assert.equal(adminRecord.documents.length, 2);
  assert.equal("organizationId" in adminRecord, false);
  assert.equal("apiClientId" in adminRecord, false);
  assert.equal("idempotencyRecordId" in adminRecord, false);
  assert.equal("createdByPrincipal" in adminRecord, false);
  assert.equal(JSON.stringify(adminRecord).includes("credential-phase-5"), false);

  await createPartnerShipment({
    ...context,
    data: shipmentData({ uploadIds: intents.uploads.map((upload) => upload.id) }),
    idempotencyKey: "phase-5-create-001",
    now: baseNow,
  });
  assert.equal(
    await context.db.collection("notifications").countDocuments({
      partnerShipmentPublicId: raw.publicId,
      type: "shipment",
    }),
    1,
  );
  const notification = await context.db.collection("notifications").findOne({
    partnerShipmentPublicId: raw.publicId,
  });
  assert.equal(notification.userId, "admin");
  assert.ok(notification.message.includes("Acme Partner Logistics"));

  const options = await listAdminPartnerOptions(context.db);
  assert.deepEqual(options, [
    {
      id: context.organization.publicId,
      name: "Acme Partner Logistics",
      status: "active",
    },
  ]);
});

test("admin filters find shipments by source, partner, application, and external reference", async () => {
  const owner = await setup();
  const other = await setup({
    db: owner.db,
    name: "Other Partner",
    applicationName: "Other Connector",
  });
  await createShipment(owner);
  await createShipment(other, {
    idempotencyKey: "phase-5-other-001",
    data: {
      externalCustomerId: "other-customer",
      externalReference: "other-reference",
    },
  });
  await owner.db.collection("shipments").insertOne({
    ...shipmentData({
      externalCustomerId: "dashboard-customer",
      externalReference: "dashboard-reference",
    }),
    trackingId: "CLL-DASHBOARD-PHASE5",
    createdVia: "dashboard",
    status: "pending",
    currentLocation: "Accra",
    timeline: [],
    createdAt: baseNow,
    updatedAt: baseNow,
  });

  const partnerFilter = await buildAdminShipmentFilter(owner.db, {
    source: "partner_api",
    partnerPublicId: owner.organization.publicId,
    externalReference: "order-501",
  });
  const partnerRows = await owner.db.collection("shipments").find(partnerFilter).toArray();
  assert.equal(partnerRows.length, 1);
  assert.equal(partnerRows[0].organizationId.toString(), owner.organization._id.toString());

  const applicationSearch = await buildAdminShipmentFilter(owner.db, {
    search: "Warehouse Connector",
  });
  assert.equal(
    (await owner.db.collection("shipments").find(applicationSearch).toArray()).length,
    1,
  );
  const externalSearch = await buildAdminShipmentFilter(owner.db, {
    search: "other-reference",
  });
  assert.equal(
    (await owner.db.collection("shipments").find(externalSearch).toArray())[0]
      .externalCustomerId,
    "other-customer",
  );
});

test("admin edits appear in the partner API response, timeline, and outbox", async () => {
  const context = await setup();
  const { result, raw } = await createShipment(context);
  const updateNow = new Date(baseNow.getTime() + 60_000);
  await updateInternalShipment({
    db: context.db,
    id: raw._id.toString(),
    principal: admin,
    body: {
      status: "in-transit",
      currentLocation: "Tema Port",
      specialInstructions: "Release only after identity check",
      deltaNumber: "DELTA501",
    },
    now: updateNow,
  });
  const updated = await getPartnerShipment({
    ...context,
    shipmentPublicId: result.body.shipment.id,
  });
  const apiShipment = serializePartnerShipment(updated);
  assert.equal(apiShipment.status, "in-transit");
  assert.equal(apiShipment.currentLocation, "Tema Port");
  assert.equal(apiShipment.specialInstructions, "Release only after identity check");
  assert.equal(apiShipment.deltaNumber, "DELTA501");
  assert.equal(apiShipment.timeline.at(-1).status, "In Transit");
  assert.ok(apiShipment.timeline.at(-1).details.includes("Special instructions updated"));

  const event = await context.db.collection("domain_events").findOne({
    type: "shipment.updated",
  });
  assert.equal(event.aggregatePublicId, result.body.shipment.id);
  assert.deepEqual(event.actor, { type: "admin", id: "admin-phase-5" });
  assert.deepEqual(
    new Set(event.payload.changedFields),
    new Set(["status", "currentLocation", "specialInstructions", "deltaNumber"]),
  );
});

test("admin and staff can operate on partner-managed shipments without a Cascade user", async () => {
  const context = await setup();
  const { raw } = await createShipment(context);
  assert.equal(raw.userId, undefined);
  assert.equal(
    (await getShipmentByIdForPrincipal(context.db, raw._id.toString(), admin)).publicId,
    raw.publicId,
  );
  assert.equal(
    await getShipmentByIdForPrincipal(context.db, raw._id.toString(), {
      kind: "customer",
      userId: "unrelated-user",
      role: "user",
    }),
    null,
  );
  await deleteInternalShipment({
    db: context.db,
    id: raw._id.toString(),
    principal: staff,
  });
  assert.equal(await context.db.collection("shipments").findOne({ _id: raw._id }), null);
  const event = await context.db.collection("domain_events").findOne({
    type: "shipment.deleted",
  });
  assert.deepEqual(event.actor, { type: "staff", id: "staff-phase-5" });
});

test("partner customer email behavior follows organization settings", async () => {
  const partner = await setup({ emailMode: "partner" });
  const cascade = await setup({ emailMode: "cascade" });
  const none = await setup({ emailMode: "none" });
  const partnerShipment = (await createShipment(partner)).raw;
  const cascadeShipment = (await createShipment(cascade)).raw;
  const noneShipment = (await createShipment(none)).raw;
  assert.equal(await getShipmentCustomerEmailMode(partner.db, partnerShipment), "partner");
  assert.equal(await getShipmentCustomerEmailMode(cascade.db, cascadeShipment), "cascade");
  assert.equal(await getShipmentCustomerEmailMode(none.db, noneShipment), "none");
  assert.equal(
    await getShipmentCustomerEmailMode(partner.db, {
      ...partnerShipment,
      createdVia: "dashboard",
      organizationId: undefined,
    }),
    "cascade",
  );
});

test("public tracking keeps lifecycle and wholesale numbers without partner metadata", async () => {
  const context = await setup();
  const { raw } = await createShipment(context);
  const response = buildPublicTrackingResponse({
    shipment: raw,
    timeline: raw.timeline,
    canViewSensitiveDetails: false,
  });
  assert.deepEqual(response.wholesaleTrackingNumbers, ["WHOLESALE-PHASE5"]);
  assert.equal(response.specialInstructions, undefined);
  assert.equal("createdVia" in response, false);
  assert.equal("organizationId" in response, false);
  assert.equal("apiClientId" in response, false);
  assert.equal("externalCustomerId" in response, false);
  assert.equal("externalReference" in response, false);
  assert.equal("partnerOrganization" in response, false);
});

test("admin and staff receive not-found responses for partner credentials and controls", async () => {
  const context = await setup();
  await expectNotFound(
    issuePartnerApiCredential({
      db: context.db,
      principal: admin,
      organizationId: context.organization._id.toString(),
      apiClientId: context.apiClient._id.toString(),
      environment: "test",
      scopes: ["shipments:read"],
      pepper: "phase-5-pepper-longer-than-thirty-two-characters",
    }),
  );
  await expectNotFound(
    setPartnerOperationControl({
      db: context.db,
      principal: staff,
      operation: "shipments:update",
      scopeType: "organization",
      organizationId: context.organization._id.toString(),
      pausedUntil: new Date(baseNow.getTime() + 60_000),
      now: baseNow,
    }),
  );
  assert.equal(await context.db.collection("api_credentials").countDocuments({}), 0);
  assert.equal(
    await context.db.collection("partner_operation_controls").countDocuments({}),
    0,
  );
});
