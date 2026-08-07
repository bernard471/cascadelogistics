import { ObjectId, type Db, type Filter } from "mongodb";
import type { PaymentProof } from "../../models/PaymentProof";
import type { Shipment, ShipmentDocument } from "../../models/Shipment";
import type {
  InternalShipmentPrincipal,
  PartnerShipmentPrincipal,
} from "../shipments/principals.ts";
import { appendShipmentDomainEvent } from "./domain-events.ts";
import { partnerApiError } from "./errors.ts";
import {
  claimIdempotency,
  completeIdempotency,
  failIdempotency,
} from "./idempotency.ts";
import type { PartnerPaymentProofCreateInput } from "./phase6-schemas.ts";
import { generatePublicId } from "./public-id.ts";
import { getPartnerShipment } from "./partner-shipments.ts";
import {
  markPartnerUploadsConsumed,
  reserveAndValidatePartnerUploads,
  type BlobHeadMetadata,
} from "./uploads.ts";
import type { OrganizationDocument } from "./types.ts";

function principalObjectIds(principal: PartnerShipmentPrincipal) {
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

function paymentTenantFilter(
  principal: PartnerShipmentPrincipal,
  organization: OrganizationDocument,
): Filter<PaymentProof> {
  const { organizationId, apiClientId } = principalObjectIds(principal);
  return {
    organizationId,
    environment: principal.environment,
    ...(organization.settings.shipmentVisibility === "creating_client"
      ? { apiClientId }
      : {}),
  } as Filter<PaymentProof>;
}

function iso(value: Date | string | undefined): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

function serializeProofFile(paymentPublicId: string, proof: ShipmentDocument) {
  return {
    id: proof.publicId,
    name: proof.name,
    contentType: proof.type,
    size: proof.size,
    uploadedAt: iso(proof.uploadedAt),
    downloadUrl: `/api/v1/payment-proofs/${paymentPublicId}/file?fileId=${encodeURIComponent(proof.publicId || "")}`,
  };
}

export function serializePartnerPaymentProof(payment: PaymentProof) {
  const proofs = payment.proofs || [];
  return {
    id: payment.publicId,
    shipmentId: payment.shipmentPublicId,
    trackingId: payment.trackingId,
    amount: payment.amount,
    currency: payment.currency || "USD",
    paymentMethod: payment.paymentMethod,
    paymentMethodDetails: payment.paymentMethodDetails,
    notes: payment.notes,
    status: payment.status,
    rejectionReason: payment.rejectionReason,
    submittedAt: iso(payment.submittedAt),
    updatedAt: iso(payment.updatedAt),
    reviewedAt: iso(payment.verifiedAt),
    files: proofs.map((proof) =>
      serializeProofFile(payment.publicId as string, proof),
    ),
  };
}

export function serializePartnerInvoice(shipment: Shipment) {
  if (!shipment.invoice) {
    throw partnerApiError("resource_not_found", "Invoice not found", 404);
  }
  return {
    shipmentId: shipment.publicId,
    trackingId: shipment.trackingId,
    fileName: shipment.invoice.fileName,
    uploadedAt: iso(shipment.invoice.uploadedAt),
    downloadUrl: `/api/v1/shipments/${shipment.publicId}/invoice/file`,
  };
}

export async function getPartnerInvoice(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipmentPublicId: string;
}) {
  const shipment = await getPartnerShipment(input);
  return { shipment, invoice: serializePartnerInvoice(shipment) };
}

function legacyPaymentId(now: Date, publicId: string): string {
  return `PAY${String(now.getTime()).slice(-6)}${publicId.slice(-2).toUpperCase()}`;
}

async function finishPaymentSubmission(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipment: Shipment;
  payment: PaymentProof;
  idempotencyRecordId: ObjectId;
  now: Date;
}) {
  const { organizationId, apiClientId } = principalObjectIds(input.principal);
  const publicId = input.payment.publicId as string;
  const event = await input.db.collection("domain_events").findOne({
    idempotencyRecordId: input.idempotencyRecordId,
    type: "payment_proof.received",
  });
  if (!event) {
    await appendShipmentDomainEvent({
      db: input.db,
      type: "payment_proof.received",
      organizationId,
      apiClientId,
      environment: input.principal.environment,
      shipmentPublicId: input.shipment.publicId as string,
      trackingId: input.shipment.trackingId,
      actorCredentialId: input.principal.credentialId,
      idempotencyRecordId: input.idempotencyRecordId,
      payload: {
        paymentProofId: publicId,
        amount: input.payment.amount,
        fileCount: input.payment.proofs?.length || 0,
      },
      now: input.now,
    });
  }
  await input.db.collection("notifications").updateOne(
    { partnerShipmentPublicId: input.shipment.publicId, type: "payment" },
    {
      $set: {
        userId: "admin",
        title: "Partner payment proof submitted",
        message: `${input.organization.name} submitted payment proof for ${input.shipment.trackingId}.`,
        type: "payment",
        isRead: false,
        updatedAt: input.now,
      },
      $setOnInsert: { createdAt: input.now },
    },
    { upsert: true },
  );
  const response = { paymentProof: serializePartnerPaymentProof(input.payment) };
  await completeIdempotency({
    db: input.db,
    recordId: input.idempotencyRecordId,
    responseStatus: 201,
    responseBody: response,
    resourcePublicId: publicId,
    now: input.now,
  });
  return response;
}

export async function createPartnerPaymentProof(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipmentPublicId: string;
  data: PartnerPaymentProofCreateInput;
  idempotencyKey: string;
  headBlob?: (pathname: string) => Promise<BlobHeadMetadata>;
  now?: Date;
}) {
  const now = input.now || new Date();
  const { organizationId, apiClientId } = principalObjectIds(input.principal);
  const shipment = await getPartnerShipment(input);
  const claim = await claimIdempotency({
    db: input.db,
    organizationId,
    apiClientId,
    environment: input.principal.environment,
    operation: "payments:write",
    key: input.idempotencyKey,
    request: { shipmentId: input.shipmentPublicId, ...input.data },
    now,
  });
  if (claim.kind === "completed") {
    return { replay: true, status: claim.responseStatus, body: claim.responseBody };
  }
  if (claim.kind === "processing") {
    throw partnerApiError("request_in_progress", "Request is being processed", 409);
  }

  try {
    const recovered = await input.db.collection<PaymentProof>("payment_proofs").findOne({
      idempotencyRecordId: claim.record._id,
    } as Filter<PaymentProof>);
    if (recovered) {
      const body = await finishPaymentSubmission({
        ...input,
        shipment,
        payment: recovered,
        idempotencyRecordId: claim.record._id,
        now,
      });
      return { replay: true, status: 201, body };
    }

    const active = await input.db.collection<PaymentProof>("payment_proofs").findOne({
      ...paymentTenantFilter(input.principal, input.organization),
      shipmentPublicId: input.shipmentPublicId,
      status: { $in: ["pending", "verified"] },
    } as Filter<PaymentProof>);
    if (active) {
      throw partnerApiError(
        "active_payment_proof_exists",
        "An active payment proof already exists for this shipment",
        409,
      );
    }

    const proofs = await reserveAndValidatePartnerUploads({
      db: input.db,
      principal: input.principal,
      uploadIds: input.data.uploadIds,
      reservationId: claim.record._id,
      headBlob: input.headBlob,
      now,
    });
    const publicId = generatePublicId("paymentProof");
    const firstProof = proofs[0];
    const payment: PaymentProof = {
      publicId,
      paymentId: legacyPaymentId(now, publicId),
      trackingId: shipment.trackingId,
      shipmentId: shipment._id?.toString() || "",
      shipmentPublicId: shipment.publicId,
      organizationId,
      apiClientId,
      environment: input.principal.environment,
      idempotencyRecordId: claim.record._id,
      submittedVia: "partner_api",
      submittedByPrincipal: { type: "api_client", id: input.principal.credentialId },
      amount: input.data.amount,
      currency: input.data.currency,
      paymentMethod: input.data.paymentMethod,
      paymentMethodDetails: input.data.paymentMethodDetails,
      proofImageUrl: firstProof.url as string,
      proofImageName: firstProof.name,
      proofs,
      status: "pending",
      submittedAt: now,
      updatedAt: now,
      notes: input.data.notes,
    };
    await input.db.collection<PaymentProof>("payment_proofs").insertOne(payment);
    await markPartnerUploadsConsumed({
      db: input.db,
      reservationId: claim.record._id,
      paymentProofPublicId: publicId,
      now,
    });
    const body = await finishPaymentSubmission({
      ...input,
      shipment,
      payment,
      idempotencyRecordId: claim.record._id,
      now,
    });
    return { replay: false, status: 201, body };
  } catch (error) {
    await failIdempotency(input.db, claim.record._id, now);
    throw error;
  }
}

export async function listPartnerPaymentProofs(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  shipmentPublicId: string;
}) {
  await getPartnerShipment(input);
  const payments = await input.db
    .collection<PaymentProof>("payment_proofs")
    .find({
      ...paymentTenantFilter(input.principal, input.organization),
      shipmentPublicId: input.shipmentPublicId,
    } as Filter<PaymentProof>)
    .sort({ submittedAt: -1 })
    .toArray();
  return { paymentProofs: payments.map(serializePartnerPaymentProof) };
}

export async function getPartnerPaymentProof(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  paymentProofPublicId: string;
}) {
  const payment = await input.db.collection<PaymentProof>("payment_proofs").findOne({
    ...paymentTenantFilter(input.principal, input.organization),
    publicId: input.paymentProofPublicId,
  } as Filter<PaymentProof>);
  if (!payment) {
    throw partnerApiError("resource_not_found", "Payment proof not found", 404);
  }
  return payment;
}

export function getPartnerPaymentProofFile(
  payment: PaymentProof,
  filePublicId?: string | null,
) {
  const proofs = payment.proofs || [];
  const proof = filePublicId
    ? proofs.find((candidate) => candidate.publicId === filePublicId)
    : proofs[0];
  if (!proof?.url) {
    throw partnerApiError("resource_not_found", "Payment proof file not found", 404);
  }
  return proof;
}

export async function decideInternalPartnerPaymentProof(input: {
  db: Db;
  id: string;
  principal: InternalShipmentPrincipal;
  status: "verified" | "rejected";
  rejectionReason?: string;
  notes?: string;
  now?: Date;
}) {
  if (!ObjectId.isValid(input.id)) {
    throw partnerApiError("resource_not_found", "Payment proof not found", 404);
  }
  const now = input.now || new Date();
  const collection = input.db.collection<PaymentProof>("payment_proofs");
  const payment = await collection.findOne({
    _id: new ObjectId(input.id) as unknown as string,
  });
  if (!payment) {
    throw partnerApiError("resource_not_found", "Payment proof not found", 404);
  }
  await collection.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: input.status,
        verifiedBy: input.principal.userId,
        verifiedAt: now,
        updatedAt: now,
        ...(input.status === "rejected"
          ? { rejectionReason: input.rejectionReason }
          : {}),
        ...(input.notes ? { notes: input.notes } : {}),
      },
      ...(input.status === "verified" ? { $unset: { rejectionReason: "" } } : {}),
    },
  );
  const updated = (await collection.findOne({ _id: payment._id })) as PaymentProof;
  if (
    payment.organizationId &&
    payment.apiClientId &&
    payment.environment &&
    payment.shipmentPublicId
  ) {
    const shipment = await input.db.collection<Shipment>("shipments").findOne({
      publicId: payment.shipmentPublicId,
      organizationId: payment.organizationId,
      environment: payment.environment,
    } as Filter<Shipment>);
    if (shipment) {
      await appendShipmentDomainEvent({
        db: input.db,
        type:
          input.status === "verified"
            ? "payment_proof.approved"
            : "payment_proof.rejected",
        organizationId: payment.organizationId,
        apiClientId: payment.apiClientId,
        environment: payment.environment,
        shipmentPublicId: payment.shipmentPublicId,
        trackingId: shipment.trackingId,
        actor: { type: input.principal.role, id: input.principal.userId },
        payload: {
          paymentProofId: payment.publicId,
          ...(input.status === "rejected"
            ? { rejectionReason: input.rejectionReason }
            : {}),
        },
        now,
      });
    }
  }
  return updated;
}
