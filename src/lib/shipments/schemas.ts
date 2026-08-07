import { z } from "zod";

export const customerShipmentUpdateSchema = z.object({
  receiverName: z.string().trim().min(2).max(120),
  receiverEmail: z.string().trim().email().max(254),
  receiverPhone: z.string().trim().min(8).max(30),
  receiverAddress: z.string().trim().min(5).max(180),
  receiverCity: z.string().trim().min(2).max(100),
  receiverCountry: z.string().trim().min(2).max(100),
  description: z.string().trim().min(2).max(1000),
  dimensions: z.string().trim().max(80).optional(),
  quantity: z.number().int().min(1).max(10000),
  declaredValue: z.number().min(0).max(100000000),
  goodsType: z.enum(["normal", "special", "battery"]),
  serviceType: z.enum(["standard", "express", "overnight", "economy"]),
  pickupDate: z.coerce.date().optional(),
  specialInstructions: z.string().trim().max(1000).optional(),
});

export type CustomerShipmentUpdate = z.infer<typeof customerShipmentUpdateSchema>;

export interface AdminShipmentUpdateInput {
  status?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  specialInstructions?: string;
  deltaNumber?: string;
}
