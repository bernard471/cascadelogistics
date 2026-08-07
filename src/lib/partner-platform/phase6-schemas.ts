import { z } from "zod";

export const partnerPaymentProofCreateSchema = z
  .object({
    amount: z.number().positive().max(1_000_000_000),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase())
      .default("USD"),
    paymentMethod: z.enum([
      "mobile-money",
      "bank-transfer",
      "cash",
      "other",
    ]),
    paymentMethodDetails: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
    uploadIds: z
      .array(z.string().trim().min(20))
      .min(1)
      .max(5)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Upload IDs must be unique",
      }),
  })
  .strict();

export type PartnerPaymentProofCreateInput = z.output<
  typeof partnerPaymentProofCreateSchema
>;
