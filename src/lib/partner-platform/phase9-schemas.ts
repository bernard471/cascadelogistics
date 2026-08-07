import { z } from "zod";
import { partnerApiScopes } from "./scopes.ts";
import { partnerDomainEventTypes } from "./domain-events.ts";

const publicId = z.string().trim().min(20);
const roles = z.enum(["owner", "developer", "operations_viewer", "read_only"]);
const scopes = z.array(z.enum(partnerApiScopes)).min(1).max(partnerApiScopes.length);
const webhookEvents = z.array(z.enum(partnerDomainEventTypes.filter((item) => item !== "webhook.test") as [string, ...string[]])).min(1).max(20);

export const partnerPortalLoginSchema = z.object({
  organizationSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  email: z.string().trim().email().max(254), password: z.string().min(1).max(128),
}).strict();

export const partnerPortalEnvironmentSchema = z.enum(["test", "live"]);

export const partnerPortalActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("password.change"), currentPassword: z.string().min(1).max(128), newPassword: z.string().min(12).max(128) }).strict(),
  z.object({ action: z.literal("member.create"), data: z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), role: roles }).strict() }).strict(),
  z.object({ action: z.literal("member.update"), memberId: publicId, data: z.object({ role: roles.optional(), status: z.enum(["active", "suspended"]).optional() }).strict().refine((value) => Object.keys(value).length > 0) }).strict(),
  z.object({ action: z.literal("application.create"), data: z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(500).optional(), scopes }).strict() }).strict(),
  z.object({ action: z.literal("application.update"), applicationId: publicId, data: z.object({ name: z.string().trim().min(2).max(120).optional(), description: z.string().trim().max(500).nullable().optional(), status: z.enum(["active", "suspended"]).optional() }).strict().refine((value) => Object.keys(value).length > 0) }).strict(),
  z.object({ action: z.literal("credential.issue"), applicationId: publicId, environment: partnerPortalEnvironmentSchema, scopes, expiresAt: z.string().datetime().optional() }).strict(),
  z.object({ action: z.literal("credential.rotate"), credentialId: publicId }).strict(),
  z.object({ action: z.literal("credential.revoke"), credentialId: publicId }).strict(),
  z.object({ action: z.literal("webhook.create"), applicationId: publicId, environment: partnerPortalEnvironmentSchema, data: z.object({ url: z.string().trim().url().max(2048), description: z.string().trim().max(500).optional(), subscribedEvents: webhookEvents }).strict() }).strict(),
  z.object({ action: z.literal("webhook.update"), applicationId: publicId, environment: partnerPortalEnvironmentSchema, endpointId: publicId, data: z.object({ url: z.string().trim().url().max(2048).optional(), description: z.string().trim().max(500).nullable().optional(), subscribedEvents: webhookEvents.optional(), status: z.enum(["active", "disabled"]).optional(), rotateSecret: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0) }).strict(),
  z.object({ action: z.literal("webhook.test"), applicationId: publicId, environment: partnerPortalEnvironmentSchema, endpointId: publicId }).strict(),
  z.object({ action: z.literal("webhook.replay"), applicationId: publicId, environment: partnerPortalEnvironmentSchema, deliveryId: publicId }).strict(),
]);

export type PartnerPortalAction = z.output<typeof partnerPortalActionSchema>;
