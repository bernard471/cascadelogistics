import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";

import { ensurePartnerCoreIndexes } from "../src/lib/partner-platform/core-indexes.ts";
import { PartnerApiError } from "../src/lib/partner-platform/errors.ts";
import {
  partnerShipmentCreateSchema,
  partnerShipmentUpdateSchema,
  partnerUploadIntentSchema,
} from "../src/lib/partner-platform/phase4-schemas.ts";
import {
  cancelPartnerShipment,
  createPartnerShipment,
  deletePartnerShipmentDocument,
  getPartnerShipment,
  getPartnerShipmentDocument,
  listPartnerShipments,
  serializePartnerShipment,
  updatePartnerShipment,
} from "../src/lib/partner-platform/partner-shipments.ts";
import {
  createApiClient,
  createOrganization,
} from "../src/lib/partner-platform/repositories.ts";
import {
  cleanupAbandonedPartnerUploads,
  createPartnerUploadIntents,
} from "../src/lib/partner-platform/uploads.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

const baseNow = new Date("2026-08-06T12:00:00.000Z");

async function setup(options = {}) {
  const db = options.db || new InMemoryMongoDatabase("cascade_phase4_test");
  const organization = await createOrganization(
    db,
    {
      name: options.name || "Phase 4 Partner",
      slug: `phase-4-${Math.random().toString(36).slice(2, 10)}`,
      status: "active",
      settings: {
        customerEmailMode: "partner",
        defaultWebhookVersion: "1",
        shipmentVisibility: options.shipmentVisibility || "organization",
      },
      limits: {
        requestsPerMinute: 100,
        shipmentsPerDay: options.shipmentsPerDay || 100,
        uploadBytesPerDay: options.uploadBytesPerDay || 1024 * 1024 * 1024,
      },
    },
    baseNow,
  );
  const apiClient = await createApiClient(
    db,
    organization._id,
    {
      name: "Phase 4 Application",
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
    credentialId: "credential-phase-4",
    environment: "test",
    scopes: apiClient.scopes,
  };
  await ensurePartnerCoreIndexes(db);
  return { db, organization, apiClient, principal };
}

function shipmentData(overrides = {}) {
  return partnerShipmentCreateSchema.parse({
    externalCustomerId: "customer-001",
    externalReference: "order-001",
    sender: {
      name: "Sender Name",
      email: "sender@example.com",
      phone: "+233200000001",
      address: "Sender address",
      city: "Accra",
      country: "Ghana",
    },
    receiver: {
      name: "Receiver Name",
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
    description: "Partner API test parcel",
    declaredValue: 320,
    declaredCurrency: "ghs",
    goodsType: "special",
    serviceType: "express",
    specialInstructions: "Keep upright and call on arrival",
    wholesalePurchases: [
      { name: "Wholesale Buyer", trackingNumber: "WHOLESALE-100" },
      { name: "Second Buyer", trackingNumber: "WHOLESALE-200" },
    ],
    uploadIds: [],
    ...overrides,
  });
}

async function expectError(promise, code, status) {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof PartnerApiError &&
      error.code === code &&
      error.status === status,
  );
}

function fakeTokenGenerator(captured) {
  return async (input) => {
    captured.push(input);
    return `client-token-${captured.length}`;
  };
}

function privateBlob(pathname, contentType, size) {
  return {
    pathname,
    contentType,
    size,
    url: `https://phase4.private.blob.vercel-storage.com/${pathname}`,
    uploadedAt: baseNow,
  };
}

test("one and multiple private upload intents use tenant-scoped exact paths", async () => {
  const context = await setup();
  const captured = [];
  const result = await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({
      files: [
        { fileName: "photo one.jpg", contentType: "image/jpeg", size: 1200 },
        { fileName: "commercial invoice.pdf", contentType: "application/pdf", size: 2400 },
      ],
    }),
    generateClientToken: fakeTokenGenerator(captured),
    now: baseNow,
  });

  assert.equal(result.uploads.length, 2);
  assert.equal(captured.length, 2);
  for (const upload of result.uploads) {
    assert.match(
      upload.pathname,
      new RegExp(
        `^partner-uploads/test/${context.organization.publicId}/upl_[A-Za-z0-9_-]+/`,
      ),
    );
    assert.equal(upload.access, "private");
    assert.match(upload.clientToken, /^client-token-/);
  }
  assert.equal(captured[0].contentType, "image/jpeg");
  assert.equal(captured[1].contentType, "application/pdf");
});

test("upload schemas reject invalid MIME, size, and count and service enforces byte quota", async () => {
  assert.equal(
    partnerUploadIntentSchema.safeParse({
      files: [{ fileName: "bad.exe", contentType: "application/x-msdownload", size: 1 }],
    }).success,
    false,
  );
  assert.equal(
    partnerUploadIntentSchema.safeParse({
      files: [{ fileName: "large.pdf", contentType: "application/pdf", size: 11 * 1024 * 1024 }],
    }).success,
    false,
  );
  assert.equal(
    partnerUploadIntentSchema.safeParse({
      files: Array.from({ length: 21 }, (_, index) => ({
        fileName: `${index}.pdf`,
        contentType: "application/pdf",
        size: 1,
      })),
    }).success,
    false,
  );

  const context = await setup({ uploadBytesPerDay: 2000 });
  await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({
      files: [{ fileName: "one.pdf", contentType: "application/pdf", size: 1500 }],
    }),
    generateClientToken: async () => "token-one",
    now: baseNow,
  });
  await expectError(
    createPartnerUploadIntents({
      ...context,
      data: partnerUploadIntentSchema.parse({
        files: [{ fileName: "two.pdf", contentType: "application/pdf", size: 600 }],
      }),
      generateClientToken: async () => "token-two",
      now: baseNow,
    }),
    "rate_limit_exceeded",
    429,
  );
});

test("shipment creation preserves every accepted field and multiple documents", async () => {
  const context = await setup();
  const intents = await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({
      files: [
        { fileName: "front.jpg", contentType: "image/jpeg", size: 1000 },
        { fileName: "invoice.pdf", contentType: "application/pdf", size: 2000 },
      ],
    }),
    generateClientToken: async ({ pathname }) => `token:${pathname}`,
    now: baseNow,
  });
  const blobs = new Map(
    intents.uploads.map((upload) => [
      upload.pathname,
      privateBlob(upload.pathname, upload.contentType, upload.maximumSize),
    ]),
  );
  const data = shipmentData({
    uploadIds: intents.uploads.map((upload) => upload.id),
  });
  const result = await createPartnerShipment({
    ...context,
    data,
    idempotencyKey: "create-order-001",
    headBlob: async (pathname) => blobs.get(pathname),
    now: baseNow,
  });

  assert.equal(result.status, 201);
  assert.equal(result.replayed, false);
  const shipment = result.body.shipment;
  assert.match(shipment.id, /^shp_/);
  assert.equal(shipment.externalCustomerId, data.externalCustomerId);
  assert.equal(shipment.externalReference, data.externalReference);
  assert.deepEqual(shipment.sender, data.sender);
  assert.deepEqual(shipment.receiver, data.receiver);
  assert.equal(shipment.packageType, data.packageType);
  assert.equal(shipment.weight, data.weight);
  assert.equal(shipment.dimensions, data.dimensions);
  assert.equal(shipment.quantity, data.quantity);
  assert.equal(shipment.description, data.description);
  assert.equal(shipment.declaredValue, data.declaredValue);
  assert.equal(shipment.declaredCurrency, "GHS");
  assert.equal(shipment.goodsType, data.goodsType);
  assert.equal(shipment.serviceType, data.serviceType);
  assert.equal(shipment.specialInstructions, data.specialInstructions);
  assert.deepEqual(shipment.wholesalePurchases, data.wholesalePurchases);
  assert.equal(shipment.documents.length, 2);
  assert.ok(shipment.documents.every((document) => document.id.startsWith("doc_")));
  assert.ok(shipment.timeline[0].details.includes("2 documents attached"));
  assert.ok(shipment.timeline[0].details.includes("2 wholesale tracking entries linked"));

  const stored = await context.db.collection("shipments").findOne({ publicId: shipment.id });
  assert.equal(stored.userId, undefined);
  assert.equal(stored.senderName, data.sender.name);
  assert.equal(stored.receiverName, data.receiver.name);
  assert.equal(stored.specialInstructions, data.specialInstructions);
  assert.equal(stored.createdVia, "partner_api");
  assert.equal(
    await context.db.collection("domain_events").countDocuments({ type: "shipment.created" }),
    1,
  );
});

test("shipment creation rejects Blob metadata whose size differs from its intent", async () => {
  const context = await setup();
  const intents = await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({
      files: [{ fileName: "exact.pdf", contentType: "application/pdf", size: 1000 }],
    }),
    generateClientToken: async () => "exact-token",
    now: baseNow,
  });
  await expectError(
    createPartnerShipment({
      ...context,
      data: shipmentData({ uploadIds: [intents.uploads[0].id] }),
      idempotencyKey: "exact-size-001",
      headBlob: async (pathname) => privateBlob(pathname, "application/pdf", 999),
      now: baseNow,
    }),
    "validation_failed",
    422,
  );
});

test("idempotency replays the original response and rejects a changed body", async () => {
  const context = await setup();
  const data = shipmentData();
  const first = await createPartnerShipment({
    ...context,
    data,
    idempotencyKey: "same-request-001",
    now: baseNow,
  });
  const replay = await createPartnerShipment({
    ...context,
    data,
    idempotencyKey: "same-request-001",
    now: baseNow,
  });
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.body, first.body);
  assert.equal(await context.db.collection("shipments").countDocuments({}), 1);
  await expectError(
    createPartnerShipment({
      ...context,
      data: shipmentData({ description: "Changed request body" }),
      idempotencyKey: "same-request-001",
      now: baseNow,
    }),
    "idempotency_key_reused",
    409,
  );
});

test("concurrent duplicate requests never create duplicate shipments", async () => {
  const context = await setup();
  const data = shipmentData();
  const results = await Promise.allSettled([
    createPartnerShipment({
      ...context,
      data,
      idempotencyKey: "concurrent-request-001",
      now: baseNow,
    }),
    createPartnerShipment({
      ...context,
      data,
      idempotencyKey: "concurrent-request-001",
      now: baseNow,
    }),
  ]);
  assert.equal(await context.db.collection("shipments").countDocuments({}), 1);
  assert.ok(results.some((result) => result.status === "fulfilled"));
  const rejection = results.find((result) => result.status === "rejected");
  if (rejection) {
    assert.equal(rejection.reason.code, "request_in_progress");
  }
});

test("list pagination and filters stay within organization and environment", async () => {
  const context = await setup();
  for (let index = 0; index < 3; index += 1) {
    await createPartnerShipment({
      ...context,
      data: shipmentData({ externalReference: `page-order-${index}` }),
      idempotencyKey: `page-create-${index}`,
      now: new Date(baseNow.getTime() + index * 1000),
    });
  }
  const first = await listPartnerShipments({
    ...context,
    query: { limit: 2 },
  });
  assert.equal(first.shipments.length, 2);
  assert.equal(first.pagination.hasMore, true);
  assert.ok(first.pagination.nextCursor);
  const second = await listPartnerShipments({
    ...context,
    query: { limit: 2, cursor: first.pagination.nextCursor },
  });
  assert.equal(second.shipments.length, 1);
  assert.equal(second.pagination.hasMore, false);
  const filtered = await listPartnerShipments({
    ...context,
    query: { limit: 20, externalReference: "page-order-1" },
  });
  assert.equal(filtered.shipments.length, 1);
  assert.equal(filtered.shipments[0].externalReference, "page-order-1");
});

test("pending edits work, cancellation is audited, and later edits are rejected", async () => {
  const context = await setup();
  const created = await createPartnerShipment({
    ...context,
    data: shipmentData(),
    idempotencyKey: "edit-create-001",
    now: baseNow,
  });
  const shipmentId = created.body.shipment.id;
  const update = partnerShipmentUpdateSchema.parse({
    receiver: { city: "Tema", phone: "+233244000000" },
    quantity: 3,
    declaredCurrency: "usd",
    specialInstructions: "Updated special instructions",
  });
  const updated = await updatePartnerShipment({
    ...context,
    shipmentPublicId: shipmentId,
    data: update,
    now: new Date(baseNow.getTime() + 60_000),
  });
  const view = serializePartnerShipment(updated);
  assert.equal(view.receiver.city, "Tema");
  assert.equal(view.quantity, 3);
  assert.equal(view.declaredCurrency, "USD");
  assert.equal(view.specialInstructions, "Updated special instructions");
  assert.ok(view.timeline.at(-1).details.includes("Special instructions updated"));

  const cancelled = await cancelPartnerShipment({
    ...context,
    shipmentPublicId: shipmentId,
    reason: "Customer request",
    now: new Date(baseNow.getTime() + 120_000),
  });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(
    await context.db.collection("partner_audit_logs").countDocuments({
      action: "partner_shipment_cancelled",
    }),
    1,
  );
  await expectError(
    updatePartnerShipment({
      ...context,
      shipmentPublicId: shipmentId,
      data: partnerShipmentUpdateSchema.parse({ quantity: 4 }),
    }),
    "shipment_not_editable",
    422,
  );
});

test("cross-tenant shipment, document, upload, and pathname access returns 404", async () => {
  const owner = await setup({ name: "Owner Partner" });
  const outsider = await setup({ db: owner.db, name: "Other Partner" });
  const intents = await createPartnerUploadIntents({
    ...owner,
    data: partnerUploadIntentSchema.parse({
      files: [{ fileName: "private.pdf", contentType: "application/pdf", size: 1000 }],
    }),
    generateClientToken: async () => "private-token",
    now: baseNow,
  });
  await expectError(
    createPartnerShipment({
      ...outsider,
      data: shipmentData({ uploadIds: [intents.uploads[0].id] }),
      idempotencyKey: "cross-upload-001",
      headBlob: async (pathname) => privateBlob(pathname, "application/pdf", 1000),
      now: baseNow,
    }),
    "upload_not_found",
    404,
  );

  const ownerCreated = await createPartnerShipment({
    ...owner,
    data: shipmentData({ uploadIds: [intents.uploads[0].id] }),
    idempotencyKey: "owner-create-001",
    headBlob: async (pathname) => privateBlob(pathname, "application/pdf", 1000),
    now: baseNow,
  });
  await expectError(
    getPartnerShipment({
      ...outsider,
      shipmentPublicId: ownerCreated.body.shipment.id,
    }),
    "resource_not_found",
    404,
  );
  await expectError(
    deletePartnerShipmentDocument({
      ...outsider,
      shipmentPublicId: ownerCreated.body.shipment.id,
      documentPublicId: ownerCreated.body.shipment.documents[0].id,
      deleteBlob: async () => {
        throw new Error("A cross-tenant delete must never reach Blob storage");
      },
      now: baseNow,
    }),
    "resource_not_found",
    404,
  );

  const mismatchContext = await setup();
  const mismatchIntent = await createPartnerUploadIntents({
    ...mismatchContext,
    data: partnerUploadIntentSchema.parse({
      files: [{ fileName: "mismatch.pdf", contentType: "application/pdf", size: 1000 }],
    }),
    generateClientToken: async () => "mismatch-token",
    now: baseNow,
  });
  await expectError(
    createPartnerShipment({
      ...mismatchContext,
      data: shipmentData({ uploadIds: [mismatchIntent.uploads[0].id] }),
      idempotencyKey: "path-mismatch-001",
      headBlob: async () =>
        privateBlob("partner-uploads/test/another/path.pdf", "application/pdf", 1000),
      now: baseNow,
    }),
    "invalid_upload_owner",
    404,
  );
});

test("pending partner documents can be read and removed without affecting dashboard storage", async () => {
  const context = await setup();
  const intents = await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({
      files: [{ fileName: "remove.pdf", contentType: "application/pdf", size: 1000 }],
    }),
    generateClientToken: async () => "remove-token",
    now: baseNow,
  });
  const created = await createPartnerShipment({
    ...context,
    data: shipmentData({ uploadIds: [intents.uploads[0].id] }),
    idempotencyKey: "document-create-001",
    headBlob: async (pathname) => privateBlob(pathname, "application/pdf", 1000),
    now: baseNow,
  });
  const shipment = await getPartnerShipment({
    ...context,
    shipmentPublicId: created.body.shipment.id,
  });
  const documentId = created.body.shipment.documents[0].id;
  assert.equal(getPartnerShipmentDocument(shipment, documentId).name, "remove.pdf");
  const deletedUrls = [];
  const result = await deletePartnerShipmentDocument({
    ...context,
    shipmentPublicId: created.body.shipment.id,
    documentPublicId: documentId,
    deleteBlob: async (url) => deletedUrls.push(url),
    now: new Date(baseNow.getTime() + 60_000),
  });
  assert.equal(result.deleted, true);
  assert.equal(deletedUrls.length, 1);
  const after = await getPartnerShipment({
    ...context,
    shipmentPublicId: created.body.shipment.id,
  });
  assert.equal(after.documents.length, 0);
  assert.equal(
    await context.db.collection("domain_events").countDocuments({
      type: "shipment.document_removed",
    }),
    1,
  );
});

test("abandoned upload cleanup removes orphans and recovers attached reservations", async () => {
  const context = await setup();
  const intents = await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({
      files: [
        { fileName: "abandoned.pdf", contentType: "application/pdf", size: 1000 },
        { fileName: "recovered.pdf", contentType: "application/pdf", size: 1000 },
        { fileName: "orphaned.pdf", contentType: "application/pdf", size: 1000 },
      ],
    }),
    generateClientToken: async () => "abandoned-token",
    now: baseNow,
  });
  const recoveredReservation = new ObjectId();
  const orphanedReservation = new ObjectId();
  await context.db.collection("upload_intents").updateOne(
    { publicId: intents.uploads[1].id },
    {
      $set: {
        status: "reserved",
        reservedBy: recoveredReservation,
        reservedAt: baseNow,
      },
    },
  );
  await context.db.collection("upload_intents").updateOne(
    { publicId: intents.uploads[2].id },
    {
      $set: {
        status: "reserved",
        reservedBy: orphanedReservation,
        reservedAt: baseNow,
      },
    },
  );
  await context.db.collection("shipments").insertOne({
    publicId: "shp_recovered_upload_reservation",
    organizationId: context.organization._id,
    environment: "test",
    idempotencyRecordId: recoveredReservation,
  });
  const deleted = [];
  const result = await cleanupAbandonedPartnerUploads({
    db: context.db,
    deleteBlobs: async (pathnames) => deleted.push(...pathnames),
    now: new Date(baseNow.getTime() + 2 * 60 * 60_000),
  });
  assert.deepEqual(result, { cleaned: 3, failures: 0 });
  assert.deepEqual(deleted, [
    intents.uploads[0].pathname,
    intents.uploads[2].pathname,
  ]);
  const abandoned = await context.db.collection("upload_intents").findOne({
    publicId: intents.uploads[0].id,
  });
  const recovered = await context.db.collection("upload_intents").findOne({
    publicId: intents.uploads[1].id,
  });
  const orphaned = await context.db.collection("upload_intents").findOne({
    publicId: intents.uploads[2].id,
  });
  assert.equal(abandoned.status, "abandoned");
  assert.equal(recovered.status, "consumed");
  assert.equal(
    recovered.shipmentPublicId,
    "shp_recovered_upload_reservation",
  );
  assert.equal(orphaned.status, "abandoned");
});

test("daily shipment quota rejects new keys without affecting idempotent replay", async () => {
  const context = await setup({ shipmentsPerDay: 1 });
  const first = await createPartnerShipment({
    ...context,
    data: shipmentData(),
    idempotencyKey: "quota-create-001",
    now: baseNow,
  });
  const replay = await createPartnerShipment({
    ...context,
    data: shipmentData(),
    idempotencyKey: "quota-create-001",
    now: baseNow,
  });
  assert.equal(replay.body.shipment.id, first.body.shipment.id);
  await expectError(
    createPartnerShipment({
      ...context,
      data: shipmentData({ externalReference: "quota-order-002" }),
      idempotencyKey: "quota-create-002",
      now: baseNow,
    }),
    "rate_limit_exceeded",
    429,
  );
});
