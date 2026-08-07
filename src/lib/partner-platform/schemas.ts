import { z } from "zod";
import {
  organizationStatuses,
  partnerEnvironments,
} from "./types.ts";

const trimmedOptionalString = z.string().trim().min(1).optional();
const contactSchema = z
  .object({
    name: trimmedOptionalString,
    email: z.string().trim().email().optional(),
    phone: trimmedOptionalString,
  })
  .strict();

export const organizationCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    status: z.enum(organizationStatuses).default("pending"),
    contacts: z
      .object({
        technical: contactSchema.optional(),
        operational: contactSchema.optional(),
        billing: contactSchema.optional(),
      })
      .strict()
      .default({}),
    settings: z
      .object({
        customerEmailMode: z
          .enum(["partner", "cascade", "none"])
          .default("partner"),
        defaultWebhookVersion: z.literal("1").default("1"),
        shipmentVisibility: z
          .enum(["organization", "creating_client"])
          .default("organization"),
      })
      .strict()
      .default({
        customerEmailMode: "partner",
        defaultWebhookVersion: "1",
        shipmentVisibility: "organization",
      }),
    limits: z
      .object({
        requestsPerMinute: z.number().int().positive().max(10000).default(60),
        shipmentsPerDay: z.number().int().positive().max(100000).default(1000),
        uploadBytesPerDay: z
          .number()
          .int()
          .positive()
          .default(1024 * 1024 * 1024),
      })
      .strict()
      .default({
        requestsPerMinute: 60,
        shipmentsPerDay: 1000,
        uploadBytesPerDay: 1024 * 1024 * 1024,
      }),
  })
  .strict();

export const apiClientCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    status: z.enum(["active", "suspended", "archived"]).default("active"),
    environmentAccess: z
      .array(z.enum(partnerEnvironments))
      .min(1)
      .default(["test"]),
    scopes: z.array(z.string().trim().min(1)).default([]),
    requestsPerMinute: z.number().int().positive().max(10000).optional(),
    allowedIpRanges: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const apiCredentialCreateSchema = z
  .object({
    environment: z.enum(partnerEnvironments),
    keyPrefix: z.string().trim().min(8).max(80),
    secretHash: z.string().min(20),
    scopes: z.array(z.string().trim().min(1)).default([]),
    expiresAt: z.date().optional(),
    createdBy: z.string().trim().min(1),
  })
  .strict();

export const partnerCustomerUpsertSchema = z
  .object({
    externalCustomerId: z.string().trim().min(1).max(200),
    cascadeUserId: z.string().trim().min(1).optional(),
    profile: contactSchema.optional(),
  })
  .strict();

export type OrganizationCreateInput = z.input<typeof organizationCreateSchema>;
export type ApiClientCreateInput = z.input<typeof apiClientCreateSchema>;
export type ApiCredentialCreateInput = z.input<typeof apiCredentialCreateSchema>;
export type PartnerCustomerUpsertInput = z.input<
  typeof partnerCustomerUpsertSchema
>;
