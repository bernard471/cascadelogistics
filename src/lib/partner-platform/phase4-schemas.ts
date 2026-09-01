import { z } from "zod";
import {
  MAX_SHIPMENT_DOCUMENTS,
  MAX_SHIPMENT_DOCUMENT_SIZE,
  SHIPMENT_DOCUMENT_CONTENT_TYPES,
} from "../shipment-document-policy.ts";

const personSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(3).max(50),
    address: z.string().trim().min(3).max(300),
    city: z.string().trim().min(2).max(120),
    country: z.string().trim().min(2).max(120),
  })
  .strict();

const wholesalePurchaseSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    trackingNumber: z.string().trim().min(1).max(160),
  })
  .strict();

export const partnerShipmentCreateSchema = z
  .object({
    externalCustomerId: z.string().trim().min(1).max(200),
    externalReference: z.string().trim().min(1).max(200).optional(),
    sender: personSchema,
    receiver: personSchema,
    packageType: z.enum([
      "document",
      "parcel",
      "package",
      "fragile",
      "electronics",
      "other",
    ]),
    weight: z.number().positive().max(50000),
    dimensions: z.string().trim().min(3).max(100).optional(),
    quantity: z.number().int().positive().max(10000),
    description: z.string().trim().min(2).max(2000),
    declaredValue: z.number().min(0).max(1_000_000_000),
    declaredCurrency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .default("USD"),
    goodsType: z.enum(["normal", "special", "battery"]).default("normal"),
    serviceType: z
      .enum(["standard", "express", "overnight", "economy"])
      .default("standard"),
    specialInstructions: z.string().trim().max(2000).optional(),
    wholesalePurchases: z.array(wholesalePurchaseSchema).max(50).optional(),
    uploadIds: z.array(z.string().trim().min(20)).max(MAX_SHIPMENT_DOCUMENTS).default([]),
  })
  .strict();

export const partnerShipmentUpdateSchema = z
  .object({
    receiver: personSchema.partial().strict().optional(),
    description: z.string().trim().min(2).max(2000).optional(),
    dimensions: z.string().trim().min(3).max(100).optional(),
    quantity: z.number().int().positive().max(10000).optional(),
    declaredValue: z.number().min(0).max(1_000_000_000).optional(),
    declaredCurrency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .optional(),
    goodsType: z.enum(["normal", "special", "battery"]).optional(),
    serviceType: z
      .enum(["standard", "express", "overnight", "economy"])
      .optional(),
    specialInstructions: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

export const partnerUploadIntentSchema = z
  .object({
    files: z
      .array(
        z
          .object({
            fileName: z.string().trim().min(1).max(180),
            contentType: z.enum(
              SHIPMENT_DOCUMENT_CONTENT_TYPES as [string, ...string[]],
            ),
            size: z.number().int().positive().max(MAX_SHIPMENT_DOCUMENT_SIZE),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_SHIPMENT_DOCUMENTS),
  })
  .strict();

export const partnerShipmentStatuses = [
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
] as const;

export const partnerShipmentListSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().trim().min(1).max(500).optional(),
    status: z.enum(partnerShipmentStatuses).optional(),
    externalReference: z.string().trim().min(1).max(200).optional(),
    createdFrom: z.string().datetime().optional(),
    createdTo: z.string().datetime().optional(),
  })
  .strict();

export type PartnerShipmentCreateInput = z.output<
  typeof partnerShipmentCreateSchema
>;
export type PartnerShipmentUpdateInput = z.output<
  typeof partnerShipmentUpdateSchema
>;
export type PartnerUploadIntentInput = z.output<
  typeof partnerUploadIntentSchema
>;
