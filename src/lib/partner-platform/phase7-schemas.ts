import { z } from "zod";
import { partnerDomainEventTypes } from "./domain-events.ts";

const eventType = z.enum(
  partnerDomainEventTypes.filter((type) => type !== "webhook.test") as [
    string,
    ...string[],
  ],
);

export const webhookEndpointCreateSchema = z
  .object({
    url: z.string().trim().url().max(2048),
    description: z.string().trim().max(500).optional(),
    subscribedEvents: z.array(eventType).min(1).max(20),
  })
  .strict();

export const webhookEndpointUpdateSchema = z
  .object({
    url: z.string().trim().url().max(2048).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    subscribedEvents: z.array(eventType).min(1).max(20).optional(),
    status: z.enum(["active", "disabled"]).optional(),
    rotateSecret: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const webhookDeliveryListSchema = z
  .object({
    endpointId: z.string().trim().min(20).optional(),
    status: z
      .enum(["pending", "processing", "retrying", "succeeded", "failed"])
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type WebhookEndpointCreateInput = z.output<
  typeof webhookEndpointCreateSchema
>;
export type WebhookEndpointUpdateInput = z.output<
  typeof webhookEndpointUpdateSchema
>;
