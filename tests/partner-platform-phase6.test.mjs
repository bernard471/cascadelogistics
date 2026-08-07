import assert from "node:assert/strict";
import test from "node:test";

import { PartnerApiError } from "../src/lib/partner-platform/errors.ts";
import {
  createPartnerPaymentProof,
  decideInternalPartnerPaymentProof,
  getPartnerInvoice,
  getPartnerPaymentProof,
  getPartnerPaymentProofFile,
  listPartnerPaymentProofs,
  serializePartnerPaymentProof,
} from "../src/lib/partner-platform/financials.ts";
import { ensurePartnerCoreIndexes } from "../src/lib/partner-platform/core-indexes.ts";
import { partnerShipmentCreateSchema, partnerUploadIntentSchema } from "../src/lib/partner-platform/phase4-schemas.ts";
import { partnerPaymentProofCreateSchema } from "../src/lib/partner-platform/phase6-schemas.ts";
import {
  createPartnerShipment,
  getPartnerShipment,
  serializePartnerShipment,
} from "../src/lib/partner-platform/partner-shipments.ts";
import { createApiClient, createOrganization } from "../src/lib/partner-platform/repositories.ts";
import { createPartnerUploadIntents } from "../src/lib/partner-platform/uploads.ts";
import { buildPrivateShipmentFilePath } from "../src/lib/shipments/private-files.ts";
import { setInternalShipmentInvoice } from "../src/lib/shipments/service.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

const now = new Date("2026-08-06T12:00:00.000Z");
const admin = { kind: "internal", userId: "phase6-admin", role: "admin" };

async function partner(db, suffix, visibility = "organization") {
  const organization = await createOrganization(db, {
    name: `Phase 6 ${suffix}`,
    slug: `phase-6-${suffix}-${Math.random().toString(36).slice(2, 8)}`,
    status: "active",
    settings: {
      customerEmailMode: "partner",
      defaultWebhookVersion: "1",
      shipmentVisibility: visibility,
    },
    limits: {
      requestsPerMinute: 100,
      shipmentsPerDay: 100,
      uploadBytesPerDay: 1024 * 1024 * 1024,
    },
  }, now);
  const apiClient = await createApiClient(db, organization._id, {
    name: `Phase 6 App ${suffix}`,
    environmentAccess: ["test"],
    scopes: [
      "shipments:create", "shipments:read", "tracking:read",
      "documents:read", "documents:write", "invoices:read",
      "payments:read", "payments:write",
    ],
  }, now);
  return {
    db,
    organization,
    apiClient,
    principal: {
      kind: "partner_api",
      organizationId: organization._id.toString(),
      apiClientId: apiClient._id.toString(),
      credentialId: `credential-${suffix}`,
      environment: "test",
      scopes: apiClient.scopes,
    },
  };
}

function shipmentInput(reference) {
  return partnerShipmentCreateSchema.parse({
    externalCustomerId: `customer-${reference}`,
    externalReference: reference,
    sender: {
      name: "Sender Name", email: "sender@example.com", phone: "+233200000001",
      address: "Sender address", city: "Accra", country: "Ghana",
    },
    receiver: {
      name: "Receiver Name", email: "receiver@example.com", phone: "+233200000002",
      address: "Receiver address", city: "Kumasi", country: "Ghana",
    },
    packageType: "parcel",
    weight: 4,
    dimensions: "20 x 20 x 20",
    quantity: 2,
    description: "Phase 6 parcel",
    declaredValue: 400,
    declaredCurrency: "USD",
    goodsType: "normal",
    serviceType: "express",
    specialInstructions: "Keep upright",
    wholesalePurchases: [
      { name: "Buyer One", trackingNumber: "WHOLE-100" },
      { name: "Buyer Two", trackingNumber: "WHOLE-200" },
    ],
    uploadIds: [],
  });
}

async function shipment(context, reference) {
  const result = await createPartnerShipment({
    ...context,
    data: shipmentInput(reference),
    idempotencyKey: `shipment-${reference}-phase6`,
    now,
  });
  return getPartnerShipment({
    ...context,
    shipmentPublicId: result.body.shipment.id,
  });
}

function privateBlob(pathname, contentType, size, uploadedAt = now) {
  return {
    pathname,
    contentType,
    size,
    url: `https://phase6.private.blob.vercel-storage.com/${pathname}`,
    uploadedAt,
  };
}

async function paymentInput(context, files) {
  const intents = await createPartnerUploadIntents({
    ...context,
    data: partnerUploadIntentSchema.parse({ files }),
    generateClientToken: async ({ pathname }) => `token-${pathname}`,
    now,
  });
  const blobs = new Map(intents.uploads.map((upload, index) => [
    upload.pathname,
    privateBlob(upload.pathname, files[index].contentType, files[index].size),
  ]));
  return {
    data: partnerPaymentProofCreateSchema.parse({
      amount: 125.5,
      currency: "ghs",
      paymentMethod: "bank-transfer",
      paymentMethodDetails: "Partner bank reference 50",
      notes: "Two supporting files",
      uploadIds: intents.uploads.map((upload) => upload.id),
    }),
    headBlob: async (pathname) => blobs.get(pathname),
  };
}

async function expectPartnerError(promise, code, status) {
  await assert.rejects(
    promise,
    (error) => error instanceof PartnerApiError && error.code === code && error.status === status,
  );
}

test("Phase 6 schema supports multiple proof files but rejects duplicates and more than five", () => {
  const base = {
    amount: 10,
    paymentMethod: "cash",
    uploadIds: ["upl_1234567890123456", "upl_abcdefghijklmnop"],
  };
  assert.equal(partnerPaymentProofCreateSchema.safeParse(base).success, true);
  assert.equal(partnerPaymentProofCreateSchema.safeParse({ ...base, uploadIds: [base.uploadIds[0], base.uploadIds[0]] }).success, false);
  assert.equal(partnerPaymentProofCreateSchema.safeParse({ ...base, uploadIds: Array.from({ length: 6 }, (_, i) => `upl_123456789012345${i}`) }).success, false);
});

test("timeline serialization includes lifecycle details and every wholesale tracking number", async () => {
  const db = new InMemoryMongoDatabase("phase6_timeline");
  await ensurePartnerCoreIndexes(db);
  const context = await partner(db, "timeline");
  const stored = await shipment(context, "timeline-1");
  const serialized = serializePartnerShipment(stored);
  assert.equal(serialized.specialInstructions, "Keep upright");
  assert.deepEqual(serialized.wholesalePurchases.map((item) => item.trackingNumber), ["WHOLE-100", "WHOLE-200"]);
  assert.match(serialized.timeline[0].details.join(" "), /Special instructions provided/);
});

test("invoice metadata is tenant scoped and never exposes its private URL or uploader", async () => {
  const db = new InMemoryMongoDatabase("phase6_invoice");
  await ensurePartnerCoreIndexes(db);
  const owner = await partner(db, "invoice-owner");
  const outsider = await partner(db, "invoice-outsider");
  const stored = await shipment(owner, "invoice-1");
  await setInternalShipmentInvoice({
    db,
    id: stored._id.toString(),
    principal: admin,
    invoice: {
      url: "https://phase6.private.blob.vercel-storage.com/partner-files/test/invoice.pdf",
      pathname: "partner-files/test/invoice.pdf",
      fileName: "invoice.pdf",
      uploadedAt: now,
      uploadedBy: admin.userId,
    },
    now,
  });
  const result = await getPartnerInvoice({ ...owner, shipmentPublicId: stored.publicId });
  assert.equal(result.invoice.fileName, "invoice.pdf");
  assert.equal("url" in result.invoice, false);
  assert.equal("uploadedBy" in result.invoice, false);
  await expectPartnerError(
    getPartnerInvoice({ ...outsider, shipmentPublicId: stored.publicId }),
    "resource_not_found",
    404,
  );
});

test("invoice upload and replacement emit available then updated events", async () => {
  const db = new InMemoryMongoDatabase("phase6_invoice_events");
  await ensurePartnerCoreIndexes(db);
  const context = await partner(db, "invoice-events");
  const stored = await shipment(context, "invoice-events-1");
  for (const [index, name] of ["first.pdf", "replacement.pdf"].entries()) {
    await setInternalShipmentInvoice({
      db,
      id: stored._id.toString(),
      principal: admin,
      invoice: {
        url: `https://phase6.private.blob.vercel-storage.com/${name}`,
        pathname: name,
        fileName: name,
        uploadedAt: new Date(now.getTime() + index),
        uploadedBy: admin.userId,
      },
      now: new Date(now.getTime() + index),
    });
  }
  const events = await db.collection("domain_events").find({ aggregatePublicId: stored.publicId }).toArray();
  assert.deepEqual(events.filter((event) => event.type.startsWith("invoice.")).map((event) => event.type), ["invoice.available", "invoice.updated"]);
});

test("partner submission stores multiple private files, returns safe metadata, and replays idempotently", async () => {
  const db = new InMemoryMongoDatabase("phase6_multi_proof");
  await ensurePartnerCoreIndexes(db);
  const context = await partner(db, "multi-proof");
  const stored = await shipment(context, "multi-proof-1");
  const proofInput = await paymentInput(context, [
    { fileName: "receipt.jpg", contentType: "image/jpeg", size: 1200 },
    { fileName: "transfer.pdf", contentType: "application/pdf", size: 2400 },
  ]);
  const first = await createPartnerPaymentProof({
    ...context,
    shipmentPublicId: stored.publicId,
    ...proofInput,
    idempotencyKey: "payment-multi-proof-001",
    now,
  });
  const replay = await createPartnerPaymentProof({
    ...context,
    shipmentPublicId: stored.publicId,
    ...proofInput,
    idempotencyKey: "payment-multi-proof-001",
    now,
  });
  assert.equal(first.body.paymentProof.files.length, 2);
  assert.equal(replay.replay, true);
  assert.deepEqual(replay.body, first.body);
  assert.equal(JSON.stringify(first.body).includes("blob.vercel-storage.com"), false);
  assert.equal(JSON.stringify(first.body).includes("pathname"), false);
  const storedPayment = await getPartnerPaymentProof({
    ...context,
    paymentProofPublicId: first.body.paymentProof.id,
  });
  assert.equal(storedPayment.proofs.length, 2);
  assert.equal(storedPayment.proofImageName, "receipt.jpg");
  assert.equal(getPartnerPaymentProofFile(storedPayment, storedPayment.proofs[1].publicId).name, "transfer.pdf");
});

test("active proof rule blocks duplicates, while rejection allows a new submission", async () => {
  const db = new InMemoryMongoDatabase("phase6_active_rule");
  await ensurePartnerCoreIndexes(db);
  const context = await partner(db, "active-rule");
  const stored = await shipment(context, "active-rule-1");
  const firstInput = await paymentInput(context, [{ fileName: "first.jpg", contentType: "image/jpeg", size: 1000 }]);
  const first = await createPartnerPaymentProof({ ...context, shipmentPublicId: stored.publicId, ...firstInput, idempotencyKey: "payment-active-first", now });
  const secondInput = await paymentInput(context, [{ fileName: "second.jpg", contentType: "image/jpeg", size: 1000 }]);
  await expectPartnerError(
    createPartnerPaymentProof({ ...context, shipmentPublicId: stored.publicId, ...secondInput, idempotencyKey: "payment-active-second", now }),
    "active_payment_proof_exists",
    409,
  );
  const storedFirst = await getPartnerPaymentProof({ ...context, paymentProofPublicId: first.body.paymentProof.id });
  await decideInternalPartnerPaymentProof({ db, id: storedFirst._id.toString(), principal: admin, status: "rejected", rejectionReason: "Unreadable", now });
  const third = await createPartnerPaymentProof({ ...context, shipmentPublicId: stored.publicId, ...secondInput, idempotencyKey: "payment-active-third", now });
  assert.equal(third.body.paymentProof.status, "pending");
});

test("payment proof list and file lookup are isolated between organizations", async () => {
  const db = new InMemoryMongoDatabase("phase6_isolation");
  await ensurePartnerCoreIndexes(db);
  const owner = await partner(db, "payment-owner");
  const outsider = await partner(db, "payment-outsider");
  const stored = await shipment(owner, "payment-isolation-1");
  const input = await paymentInput(owner, [{ fileName: "receipt.png", contentType: "image/png", size: 900 }]);
  const created = await createPartnerPaymentProof({ ...owner, shipmentPublicId: stored.publicId, ...input, idempotencyKey: "payment-isolation-key", now });
  const ownerList = await listPartnerPaymentProofs({ ...owner, shipmentPublicId: stored.publicId });
  assert.equal(ownerList.paymentProofs.length, 1);
  await expectPartnerError(
    getPartnerPaymentProof({ ...outsider, paymentProofPublicId: created.body.paymentProof.id }),
    "resource_not_found",
    404,
  );
  await expectPartnerError(
    listPartnerPaymentProofs({ ...outsider, shipmentPublicId: stored.publicId }),
    "resource_not_found",
    404,
  );
});

test("admin approval is reflected to partners and emits an approved lifecycle event", async () => {
  const db = new InMemoryMongoDatabase("phase6_approval");
  await ensurePartnerCoreIndexes(db);
  const context = await partner(db, "approval");
  const stored = await shipment(context, "approval-1");
  const input = await paymentInput(context, [{ fileName: "receipt.webp", contentType: "image/webp", size: 1100 }]);
  const created = await createPartnerPaymentProof({ ...context, shipmentPublicId: stored.publicId, ...input, idempotencyKey: "payment-approval-key", now });
  const payment = await getPartnerPaymentProof({ ...context, paymentProofPublicId: created.body.paymentProof.id });
  await decideInternalPartnerPaymentProof({ db, id: payment._id.toString(), principal: admin, status: "verified", notes: "Matched", now });
  const list = await listPartnerPaymentProofs({ ...context, shipmentPublicId: stored.publicId });
  assert.equal(list.paymentProofs[0].status, "verified");
  const event = await db.collection("domain_events").findOne({ type: "payment_proof.approved", aggregatePublicId: stored.publicId });
  assert.equal(event.payload.paymentProofId, created.body.paymentProof.id);
  assert.equal(event.actor.type, "admin");
});

test("partner private paths carry environment, organization, shipment, and category ownership", async () => {
  const db = new InMemoryMongoDatabase("phase6_paths");
  await ensurePartnerCoreIndexes(db);
  const context = await partner(db, "paths");
  const stored = await shipment(context, "paths-1");
  const invoicePath = buildPrivateShipmentFilePath({
    shipment: stored,
    organizationPublicId: context.organization.publicId,
    category: "invoices",
    fileName: "Customer Invoice.pdf",
    now,
  });
  assert.match(invoicePath, new RegExp(`^partner-files/test/${context.organization.publicId}/${stored.publicId}/invoices/`));
  assert.equal(invoicePath.includes("Customer Invoice.pdf"), false);
});

test("payment serialization never returns private storage coordinates", () => {
  const serialized = serializePartnerPaymentProof({
    publicId: "ppr_1234567890123456",
    paymentId: "PAY1",
    trackingId: "CAS1",
    shipmentId: "internal-id",
    shipmentPublicId: "shp_1234567890123456",
    amount: 10,
    paymentMethod: "cash",
    proofImageUrl: "https://phase6.private.blob.vercel-storage.com/secret",
    proofImageName: "proof.jpg",
    proofs: [{
      publicId: "doc_1234567890123456",
      name: "proof.jpg",
      type: "image/jpeg",
      size: 100,
      data: "",
      url: "https://phase6.private.blob.vercel-storage.com/secret",
      pathname: "secret",
      uploadedAt: now,
    }],
    status: "pending",
    submittedAt: now,
    updatedAt: now,
  });
  const json = JSON.stringify(serialized);
  assert.equal(json.includes("blob.vercel-storage.com"), false);
  assert.equal(json.includes("pathname"), false);
  assert.match(serialized.files[0].downloadUrl, /^\/api\/v1\/payment-proofs\//);
});
