import { del, head } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { ObjectId, type Db } from "mongodb";
import type { ShipmentDocument } from "../../models/Shipment";
import { getPrivateBlobToken } from "../identity-security.ts";
import {
  MAX_SHIPMENT_DOCUMENT_SIZE,
  SHIPMENT_DOCUMENT_CONTENT_TYPES,
} from "../shipment-document-policy.ts";
import { getTrustedVercelBlobAccessKind } from "../shipments/private-files.ts";
import type { PartnerShipmentPrincipal } from "../shipments/principals.ts";
import { partnerApiError } from "./errors.ts";
import type { PartnerUploadIntentInput } from "./phase4-schemas.ts";
import { generatePublicId } from "./public-id.ts";
import type { OrganizationDocument, PartnerEnvironment } from "./types.ts";

export interface PartnerUploadIntentDocument {
  _id?: ObjectId;
  publicId: string;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  pathname: string;
  originalName: string;
  contentType: string;
  declaredSize: number;
  status: "pending" | "reserved" | "abandoning" | "consumed" | "abandoned";
  expiresAt: Date;
  reservedAt?: Date;
  reservedBy?: ObjectId;
  consumedAt?: Date;
  shipmentPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
  deleteAt?: Date;
}

export interface BlobHeadMetadata {
  pathname: string;
  contentType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

function safePathFileName(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/\.{2,}/g, "-")
      .replace(/^\.+/, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "document"
  );
}

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

export async function createPartnerUploadIntents(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  organization: OrganizationDocument;
  data: PartnerUploadIntentInput;
  token?: string;
  generateClientToken?: (input: {
    pathname: string;
    contentType: string;
    maximumSize: number;
    expiresAt: Date;
  }) => Promise<string>;
  now?: Date;
}) {
  const now = input.now || new Date();
  const { organizationId, apiClientId } = principalObjectIds(input.principal);
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const existingIntents = await input.db
    .collection<PartnerUploadIntentDocument>("upload_intents")
    .find({
      organizationId,
      environment: input.principal.environment,
      createdAt: { $gte: dayStart },
    })
    .toArray();
  const existingBytes = existingIntents
    .filter((intent) => intent.status !== "abandoned")
    .reduce((total, intent) => total + intent.declaredSize, 0);
  const requestedBytes = input.data.files.reduce(
    (total, file) => total + file.size,
    0,
  );
  if (existingBytes + requestedBytes > input.organization.limits.uploadBytesPerDay) {
    throw partnerApiError(
      "rate_limit_exceeded",
      "Daily upload quota exceeded",
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

  const expiresAt = new Date(now.getTime() + 15 * 60_000);
  const collection = input.db.collection<PartnerUploadIntentDocument>(
    "upload_intents",
  );
  const instructions = [];
  for (const file of input.data.files) {
    if (!SHIPMENT_DOCUMENT_CONTENT_TYPES.includes(file.contentType)) {
      throw partnerApiError(
        "invalid_document_type",
        "Unsupported document type",
        422,
      );
    }
    if (file.size > MAX_SHIPMENT_DOCUMENT_SIZE) {
      throw partnerApiError(
        "document_too_large",
        "Document exceeds the 10MB limit",
        422,
      );
    }
    const publicId = generatePublicId("upload");
    const pathname = `partner-uploads/${input.principal.environment}/${input.organization.publicId}/${publicId}/${safePathFileName(file.fileName)}`;
    const intent: PartnerUploadIntentDocument = {
      publicId,
      organizationId,
      apiClientId,
      environment: input.principal.environment,
      pathname,
      originalName: file.fileName.replace(/[\r\n"]/g, "_").slice(0, 180),
      contentType: file.contentType,
      declaredSize: file.size,
      status: "pending",
      expiresAt,
      createdAt: now,
      updatedAt: now,
      deleteAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
    await collection.insertOne(intent);
    const clientToken = input.generateClientToken
      ? await input.generateClientToken({
          pathname,
          contentType: file.contentType,
          maximumSize: file.size,
          expiresAt,
        })
      : await generateClientTokenFromReadWriteToken({
          token: input.token || getPrivateBlobToken(),
          pathname,
          allowedContentTypes: [file.contentType],
          maximumSizeInBytes: file.size,
          validUntil: expiresAt.getTime(),
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
        });
    instructions.push({
      id: publicId,
      pathname,
      clientToken,
      access: "private" as const,
      contentType: file.contentType,
      maximumSize: file.size,
      expiresAt: expiresAt.toISOString(),
    });
  }

  return { uploads: instructions };
}

async function defaultHead(pathname: string): Promise<BlobHeadMetadata> {
  const blob = await head(pathname, { token: getPrivateBlobToken() });
  return {
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: blob.size,
    url: blob.url,
    uploadedAt: blob.uploadedAt,
  };
}

export async function reserveAndValidatePartnerUploads(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  uploadIds: readonly string[];
  reservationId: ObjectId;
  headBlob?: (pathname: string) => Promise<BlobHeadMetadata>;
  now?: Date;
}): Promise<ShipmentDocument[]> {
  if (new Set(input.uploadIds).size !== input.uploadIds.length) {
    throw partnerApiError("validation_failed", "Upload IDs must be unique", 422);
  }
  const now = input.now || new Date();
  const { organizationId, apiClientId } = principalObjectIds(input.principal);
  const collection = input.db.collection<PartnerUploadIntentDocument>(
    "upload_intents",
  );
  const reserved: ObjectId[] = [];
  const documents: ShipmentDocument[] = [];

  try {
    for (const uploadId of input.uploadIds) {
      const intent = await collection.findOne({
        publicId: uploadId,
        organizationId,
        apiClientId,
        environment: input.principal.environment,
      });
      if (
        !intent?._id ||
        intent.expiresAt.getTime() <= now.getTime() ||
        !["pending", "reserved"].includes(intent.status) ||
        (intent.status === "reserved" &&
          intent.reservedBy?.toString() !== input.reservationId.toString())
      ) {
        throw partnerApiError("upload_not_found", "Upload not found", 404);
      }
      if (intent.status === "pending") {
        const result = await collection.updateOne(
          { _id: intent._id, status: "pending" },
          {
            $set: {
              status: "reserved",
              reservedBy: input.reservationId,
              reservedAt: now,
              updatedAt: now,
            },
          },
        );
        if (result.modifiedCount !== 1) {
          throw partnerApiError("request_in_progress", "Upload is in use", 409);
        }
        reserved.push(intent._id);
      }

      let blob: BlobHeadMetadata;
      try {
        blob = await (input.headBlob || defaultHead)(intent.pathname);
      } catch {
        throw partnerApiError("upload_not_found", "Upload not found", 404);
      }
      if (
        blob.pathname !== intent.pathname ||
        getTrustedVercelBlobAccessKind(blob.url) !== "private"
      ) {
        throw partnerApiError("invalid_upload_owner", "Upload not found", 404);
      }
      if (
        blob.contentType !== intent.contentType ||
        !SHIPMENT_DOCUMENT_CONTENT_TYPES.includes(blob.contentType)
      ) {
        throw partnerApiError(
          "invalid_document_type",
          "Uploaded document type does not match its intent",
          422,
        );
      }
      if (blob.size < 1 || blob.size > MAX_SHIPMENT_DOCUMENT_SIZE) {
        throw partnerApiError(
          "document_too_large",
          "Uploaded document exceeds the size limit",
          422,
        );
      }
      if (blob.size !== intent.declaredSize) {
        throw partnerApiError(
          "validation_failed",
          "Uploaded document size does not match its intent",
          422,
        );
      }
      documents.push({
        publicId: generatePublicId("document"),
        name: intent.originalName,
        type: blob.contentType,
        size: blob.size,
        data: "",
        uploadedAt: blob.uploadedAt,
        url: blob.url,
        pathname: blob.pathname,
      });
    }
    return documents;
  } catch (error) {
    if (reserved.length > 0) {
      await collection.updateMany(
        { _id: { $in: reserved }, reservedBy: input.reservationId },
        {
          $set: { status: "pending", updatedAt: now },
          $unset: { reservedBy: "", reservedAt: "" },
        },
      );
    }
    throw error;
  }
}

export async function markPartnerUploadsConsumed(input: {
  db: Db;
  reservationId: ObjectId;
  shipmentPublicId?: string;
  paymentProofPublicId?: string;
  now?: Date;
}): Promise<void> {
  const now = input.now || new Date();
  await input.db.collection<PartnerUploadIntentDocument>("upload_intents").updateMany(
    { reservedBy: input.reservationId, status: "reserved" },
    {
      $set: {
        status: "consumed",
        ...(input.shipmentPublicId
          ? { shipmentPublicId: input.shipmentPublicId }
          : {}),
        ...(input.paymentProofPublicId
          ? { paymentProofPublicId: input.paymentProofPublicId }
          : {}),
        consumedAt: now,
        updatedAt: now,
        deleteAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    },
  );
}

export async function cleanupAbandonedPartnerUploads(input: {
  db: Db;
  deleteBlobs?: (pathnames: string[]) => Promise<void>;
  now?: Date;
  limit?: number;
}): Promise<{ cleaned: number; failures: number }> {
  const now = input.now || new Date();
  const collection = input.db.collection<PartnerUploadIntentDocument>(
    "upload_intents",
  );
  const staleReservationCutoff = new Date(now.getTime() - 60 * 60_000);
  const expired = await collection
    .find({
      $or: [
        { status: "pending", expiresAt: { $lte: now } },
        {
          status: "reserved",
          expiresAt: { $lte: now },
          reservedAt: { $lte: staleReservationCutoff },
        },
      ],
    })
    .limit(Math.min(input.limit || 100, 500))
    .toArray();
  let cleaned = 0;
  let failures = 0;

  for (const intent of expired) {
    const previousStatus = intent.status;
    try {
      const claim = await collection.updateOne(
        { _id: intent._id, status: previousStatus },
        { $set: { status: "abandoning", updatedAt: now } },
      );
      if (claim.modifiedCount !== 1) continue;

      if (previousStatus === "reserved" && intent.reservedBy) {
        const shipment = await input.db.collection("shipments").findOne({
          idempotencyRecordId: intent.reservedBy,
          organizationId: intent.organizationId,
          environment: intent.environment,
        });
        if (shipment?.publicId) {
          await collection.updateOne(
            { _id: intent._id, status: "abandoning" },
            {
              $set: {
                status: "consumed",
                shipmentPublicId: shipment.publicId,
                consumedAt: now,
                updatedAt: now,
                deleteAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
              },
            },
          );
          cleaned += 1;
          continue;
        }
      }

      await (input.deleteBlobs || (async (pathnames) => {
        await del(pathnames, { token: getPrivateBlobToken() });
      }))([intent.pathname]);
      await collection.updateOne(
        { _id: intent._id, status: "abandoning" },
        {
          $set: {
            status: "abandoned",
            updatedAt: now,
            deleteAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      );
      cleaned += 1;
    } catch {
      await collection.updateOne(
        { _id: intent._id, status: "abandoning" },
        { $set: { status: previousStatus, updatedAt: now } },
      );
      failures += 1;
    }
  }
  return { cleaned, failures };
}
