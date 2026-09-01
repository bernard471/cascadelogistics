import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";

import {
  buildShipmentRecord,
  generateTrackingId,
} from "../src/lib/shipments/factory.ts";
import {
  canUseShipmentUploadMode,
  getShipmentUploadOperation,
  isAuthorizedShipmentUploadPath,
  parseShipmentUploadMode,
} from "../src/lib/shipments/document-policy.ts";
import {
  canAccessUserOwnedResource,
  canBypassShipmentOperationPause,
  canDeleteShipmentAsCustomer,
  canEditShipmentAsCustomer,
  canSubmitProofOfPurchase,
  hasPartnerScope,
} from "../src/lib/shipments/policies.ts";
import { shipmentPrincipalFromSessionUser } from "../src/lib/shipments/principals.ts";
import { submitCustomerProofOfPurchase } from "../src/lib/shipments/service.ts";
import {
  getTrustedVercelBlobAccessKind,
  safeDownloadFileName,
} from "../src/lib/shipments/private-files.ts";
import {
  appendUniqueBulkStatusTimelineEvent,
  appendProofOfPurchaseTimeline,
  createBulkStatusTimelineEvent,
  describeCustomerShipmentChanges,
  ensureTrackingTimeline,
  planAdminShipmentUpdate,
} from "../src/lib/shipments/timeline.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

const now = new Date("2026-08-06T12:00:00.000Z");

function baseShipment(overrides = {}) {
  return {
    trackingId: "CLL123456001",
    userId: "user-1",
    senderName: "Test User",
    senderEmail: "test@example.com",
    senderPhone: "+233000000000",
    senderAddress: "USA Warehouse",
    senderCity: "USA Warehouse",
    senderCountry: "USA",
    receiverName: "Test User",
    receiverEmail: "test@example.com",
    receiverPhone: "+233000000000",
    receiverAddress: "Ghana Warehouse",
    receiverCity: "Ghana Warehouse",
    receiverCountry: "Ghana",
    packageType: "parcel",
    weight: 2,
    dimensions: "10 x 20 x 30",
    quantity: 1,
    description: "Test parcel",
    declaredValue: 100,
    goodsType: "normal",
    serviceType: "standard",
    servicePrice: 30,
    specialInstructions: "Keep dry",
    status: "pending",
    currentLocation: "USA Warehouse",
    timeline: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test("session users resolve to explicit shipment principals", () => {
  assert.deepEqual(
    shipmentPrincipalFromSessionUser({ id: "u1", role: "user", username: "one" }),
    { kind: "customer", userId: "u1", role: "user", username: "one" },
  );
  assert.deepEqual(
    shipmentPrincipalFromSessionUser({ id: "a1", role: "admin" }),
    { kind: "internal", userId: "a1", role: "admin", username: undefined },
  );
});

test("resource policies isolate customers while allowing internal operators", () => {
  const customer = shipmentPrincipalFromSessionUser({ id: "u1", role: "user" });
  const otherCustomer = shipmentPrincipalFromSessionUser({ id: "u2", role: "user" });
  const staff = shipmentPrincipalFromSessionUser({ id: "s1", role: "staff" });
  const owner = shipmentPrincipalFromSessionUser({ id: "root", role: "super_admin" });

  assert.equal(canAccessUserOwnedResource(customer, "u1"), true);
  assert.equal(canAccessUserOwnedResource(otherCustomer, "u1"), false);
  assert.equal(canAccessUserOwnedResource(staff, "u1"), true);
  assert.equal(canBypassShipmentOperationPause(staff), false);
  assert.equal(canBypassShipmentOperationPause(owner), true);
});

test("partner scopes are deny-by-default", () => {
  const principal = {
    kind: "partner_api",
    organizationId: "org-1",
    apiClientId: "app-1",
    credentialId: "key-1",
    environment: "test",
    scopes: ["shipments:read"],
  };
  assert.equal(hasPartnerScope(principal, "shipments:read"), true);
  assert.equal(hasPartnerScope(principal, "shipments:create"), false);
  assert.equal(canAccessUserOwnedResource(principal, "u1"), false);
});

test("customer edit/delete rules preserve current status restrictions", () => {
  assert.equal(canEditShipmentAsCustomer(baseShipment()), true);
  assert.equal(canEditShipmentAsCustomer(baseShipment({ status: "in-transit" })), false);
  assert.equal(canDeleteShipmentAsCustomer(baseShipment()), true);
  assert.equal(canDeleteShipmentAsCustomer(baseShipment({ status: "cancelled" })), true);
  assert.equal(canDeleteShipmentAsCustomer(baseShipment({ status: "delivered" })), false);
  assert.equal(
    canSubmitProofOfPurchase(
      baseShipment({ status: "arrived-at-warehouse-pending-proof" }),
    ),
    true,
  );
  assert.equal(canSubmitProofOfPurchase(baseShipment()), false);
});

test("tracking IDs retain the existing CLL format", () => {
  assert.equal(generateTrackingId(1722945600123, 0.007), "CLL600123007");
});

test("customer shipment factory preserves all submitted operational fields", () => {
  const documents = [
    {
      name: "invoice.pdf",
      type: "application/pdf",
      size: 123,
      data: "",
      url: "https://store.private.blob.vercel-storage.com/file",
      uploadedAt: now,
    },
  ];
  const record = buildShipmentRecord({
    source: "customer",
    owner: {
      userId: "user-1",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "+233000000000",
    },
    payload: {
      packageType: "parcel",
      weight: 2,
      dimensions: "10 x 20 x 30",
      quantity: 2,
      description: "Two parcels",
      declaredValue: 250,
      goodsType: "special",
      serviceType: "standard",
      servicePrice: 72,
      specialInstructions: "Keep upright",
      wholesalePurchases: [
        { name: "Supplier", trackingNumber: "WHOLESALE-1" },
      ],
    },
    documents,
    trackingId: "CLL111111222",
    now,
  });

  assert.equal(record.status, "pending");
  assert.equal(record.trackingId, "CLL111111222");
  assert.equal(record.specialInstructions, "Keep upright");
  assert.equal(record.wholesalePurchases?.[0].trackingNumber, "WHOLESALE-1");
  assert.equal(record.documents?.length, 1);
  assert.equal(record.documents?.[0].purpose, "proof-of-purchase");
  assert.equal(record.documents?.[0].uploadedByRole, "customer");
  assert.deepEqual(record.timeline[0].details, [
    "Package type: parcel",
    "Quantity: 2",
    "1 document attached",
    "Special instructions provided",
    "1 wholesale tracking entry linked",
  ]);
});

test("admin shipment factory starts in the warehouse pending-proof state", () => {
  const record = buildShipmentRecord({
    source: "admin",
    owner: {
      userId: "user-1",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    },
    payload: {
      packageType: "parcel",
      weight: 1,
      quantity: 1,
      description: "Parcel",
      declaredValue: 0,
      goodsType: "normal",
      serviceType: "standard",
      servicePrice: 15,
      deltaNumber: "  DELTA100  ",
    },
    trackingId: "CLL111111223",
    now,
  });

  assert.equal(record.status, "arrived-at-warehouse-pending-proof");
  assert.equal(record.deltaNumber, "DELTA100");
  assert.equal(
    record.timeline[0].status,
    "Arrived at Warehouse – Pending Proof",
  );
  assert.equal(record.timeline[0].completed, false);
});

test("proof submissions append an auditable timeline event", () => {
  const timeline = appendProofOfPurchaseTimeline(baseShipment(), 3, now);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].status, "Proof of Purchase Submitted");
  assert.deepEqual(timeline[0].details, [
    "3 proof-of-purchase files submitted by customer",
    "Awaiting administrative review",
  ]);
});

test("customer proof submissions append files without advancing admin status", async () => {
  const db = new InMemoryMongoDatabase("shipment-proof-test");
  const id = new ObjectId();
  await db.collection("shipments").insertOne(
    baseShipment({
      _id: id,
      status: "arrived-at-warehouse-pending-proof",
      documents: [
        {
          name: "warehouse-photo.jpg",
          type: "image/jpeg",
          size: 50,
          data: "",
          uploadedAt: now,
          purpose: "supporting-document",
        },
      ],
    }),
  );

  const result = await submitCustomerProofOfPurchase({
    db,
    id: id.toString(),
    principal: shipmentPrincipalFromSessionUser({ id: "user-1", role: "user" }),
    documents: [
      {
        name: "receipt.pdf",
        type: "application/pdf",
        size: 100,
        data: "",
        uploadedAt: now,
        pathname: "shipment-documents/user-1/receipt.pdf",
      },
    ],
    now,
  });

  const stored = await db.collection("shipments").findOne({ _id: id });
  assert.equal(result.proofCount, 1);
  assert.equal(stored.status, "arrived-at-warehouse-pending-proof");
  assert.equal(stored.documents.length, 2);
  assert.equal(stored.documents[0].purpose, "supporting-document");
  assert.equal(stored.documents[1].purpose, "proof-of-purchase");
  assert.equal(stored.timeline.at(-1).status, "Proof of Purchase Submitted");
});

test("customer change descriptions include special instructions and field parity", () => {
  const existing = baseShipment();
  const details = describeCustomerShipmentChanges(existing, {
    receiverName: "New Receiver",
    receiverEmail: "new@example.com",
    receiverPhone: "+233111111111",
    receiverAddress: "New Address",
    receiverCity: "Accra",
    receiverCountry: "Ghana",
    description: "Updated parcel",
    dimensions: "20 x 20 x 20",
    quantity: 2,
    declaredValue: 200,
    goodsType: "special",
    serviceType: "express",
    specialInstructions: "Call on arrival",
  });

  assert.ok(details.includes("Destination contact details updated"));
  assert.ok(details.includes("Package description updated"));
  assert.ok(details.includes("Quantity updated to 2"));
  assert.ok(details.includes("Special instructions updated"));
});

test("admin update plan builds one canonical timeline event", () => {
  const existing = baseShipment();
  const plan = planAdminShipmentUpdate(
    existing,
    {
      status: "in-transit",
      currentLocation: "Accra Hub",
      specialInstructions: "Release after inspection",
      deltaNumber: "DELTA200",
    },
    { imageUrl: "https://store.private.blob.vercel-storage.com/update.jpg", imageName: "update.jpg" },
    now,
  );

  assert.equal(plan.newStatus, "in-transit");
  assert.equal(plan.currentLocation, "Accra Hub");
  assert.ok(plan.updateDetails.includes("Status changed to In Transit"));
  assert.ok(plan.updateDetails.includes("Special instructions updated"));
  assert.equal(plan.updateData.timeline?.length, 1);
  assert.equal(plan.updateData.timeline?.[0].imageName, "update.jpg");
});

test("bulk timeline helpers preserve the existing unique-status rule", () => {
  const existing = baseShipment();
  const event = createBulkStatusTimelineEvent(existing, "in-transit", now);
  const firstTimeline = appendUniqueBulkStatusTimelineEvent(existing, event);
  const secondTimeline = appendUniqueBulkStatusTimelineEvent(
    { ...existing, timeline: firstTimeline },
    event,
  );

  assert.equal(event.status, "In Transit");
  assert.equal(firstTimeline.length, 1);
  assert.equal(secondTimeline.length, 1);
});

test("tracking timeline fallback is deterministic and does not duplicate events", () => {
  const shipment = baseShipment({ status: "in-transit", timeline: [] });
  const first = ensureTrackingTimeline(shipment, now);
  const second = ensureTrackingTimeline(
    { ...shipment, timeline: first.timeline },
    now,
  );

  assert.equal(first.addedEvents, true);
  assert.deepEqual(
    first.timeline.map((event) => event.status),
    ["Order Placed", "In Transit"],
  );
  assert.equal(second.addedEvents, false);
  assert.equal(second.timeline.length, 2);
});

test("private file helpers trust only exact Vercel Blob host suffixes", () => {
  assert.equal(
    getTrustedVercelBlobAccessKind(
      "https://store.private.blob.vercel-storage.com/file.pdf",
    ),
    "private",
  );
  assert.equal(
    getTrustedVercelBlobAccessKind(
      "https://store.public.blob.vercel-storage.com/file.pdf",
    ),
    "public",
  );
  assert.equal(
    getTrustedVercelBlobAccessKind(
      "https://store.private.blob.vercel-storage.com.evil.example/file.pdf",
    ),
    null,
  );
  assert.equal(safeDownloadFileName("bad\r\n\"name.pdf"), "bad___name.pdf");
});

test("document upload policies preserve role, operation, and path isolation", () => {
  const customer = shipmentPrincipalFromSessionUser({ id: "u1", role: "user" });
  const staff = shipmentPrincipalFromSessionUser({ id: "s1", role: "staff" });

  assert.equal(parseShipmentUploadMode("submit"), "submit");
  assert.throws(() => parseShipmentUploadMode("replace"));
  assert.equal(getShipmentUploadOperation("create"), "create");
  assert.equal(canUseShipmentUploadMode(customer, "create"), false);
  assert.equal(canUseShipmentUploadMode(customer, "submit"), true);
  assert.equal(canUseShipmentUploadMode(staff, "create"), true);
  assert.equal(
    isAuthorizedShipmentUploadPath({
      userId: "u1",
      prefix: "shipment-documents/u1/upload-1",
      pathname: "shipment-documents/u1/upload-1/invoice.pdf",
    }),
    true,
  );
  assert.equal(
    isAuthorizedShipmentUploadPath({
      userId: "u1",
      prefix: "shipment-documents/u2/upload-1",
      pathname: "shipment-documents/u2/upload-1/invoice.pdf",
    }),
    false,
  );
});
