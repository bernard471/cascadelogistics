import { z } from "zod";
import { partnerApiScopes } from "./scopes.ts";
import { partnerEnvironments, partnerPilotWorkflows } from "./types.ts";

const scopesSchema = z.array(z.enum(partnerApiScopes)).min(1).max(partnerApiScopes.length);

const organizationCreate = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  technicalEmail: z.string().trim().email().max(254).optional(),
}).strict();

const organizationUpdate = z.object({
  status: z.enum(["pending", "active", "suspended", "archived"]).optional(),
  customerEmailMode: z.enum(["partner", "cascade", "none"]).optional(),
  shipmentVisibility: z.enum(["organization", "creating_client"]).optional(),
  requestsPerMinute: z.number().int().min(1).max(10000).optional(),
  shipmentsPerDay: z.number().int().min(1).max(100000).optional(),
  uploadBytesPerDay: z.number().int().min(1).max(100 * 1024 * 1024 * 1024).optional(),
}).strict();

const applicationCreate = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  environmentAccess: z.array(z.enum(partnerEnvironments)).min(1).max(2),
  scopes: scopesSchema,
  requestsPerMinute: z.number().int().min(1).max(10000).optional(),
}).strict();

const applicationUpdate = applicationCreate.partial().extend({
  status: z.enum(["active", "suspended", "archived"]).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one application field is required",
});

const operationNames = ["*", "api_access", ...partnerApiScopes] as const;
const pilotOrganizationId = z.string().trim().min(20);
const pilotObservationCategories = [
  "documentation", "portal", "api", "uploads", "webhooks", "support",
  "duplicate_shipment", "tenant_isolation", "private_file",
] as const;

export const superAdminIntegrationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("organization.create"), data: organizationCreate }).strict(),
  z.object({
    action: z.literal("member.create"),
    organizationId: z.string().trim().min(20),
    data: z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(254),
      role: z.enum(["owner", "developer", "operations_viewer", "read_only"]),
    }).strict(),
  }).strict(),
  z.object({
    action: z.literal("organization.update"),
    organizationId: z.string().trim().min(20),
    data: organizationUpdate.refine((value) => Object.keys(value).length > 0),
  }).strict(),
  z.object({
    action: z.literal("application.create"),
    organizationId: z.string().trim().min(20),
    data: applicationCreate,
  }).strict(),
  z.object({
    action: z.literal("application.update"),
    organizationId: z.string().trim().min(20),
    applicationId: z.string().trim().min(20),
    data: applicationUpdate,
  }).strict(),
  z.object({
    action: z.literal("credential.issue"),
    organizationId: z.string().trim().min(20),
    applicationId: z.string().trim().min(20),
    environment: z.enum(partnerEnvironments),
    scopes: scopesSchema,
    expiresAt: z.string().datetime().optional(),
  }).strict(),
  z.object({
    action: z.literal("credential.rotate"),
    organizationId: z.string().trim().min(20),
    credentialId: z.string().trim().min(20),
  }).strict(),
  z.object({
    action: z.literal("credential.revoke"),
    organizationId: z.string().trim().min(20),
    credentialId: z.string().trim().min(20),
    reason: z.string().trim().max(250).optional(),
  }).strict(),
  z.object({
    action: z.literal("control.set"),
    operation: z.enum(operationNames),
    scopeType: z.enum(["global", "organization", "application"]),
    organizationId: z.string().trim().min(20).optional(),
    applicationId: z.string().trim().min(20).optional(),
    environment: z.enum(partnerEnvironments).optional(),
    pausedUntil: z.string().datetime().nullable(),
    reason: z.string().trim().max(250).optional(),
    publicMessage: z.string().trim().max(250).optional(),
  }).strict(),
  z.object({
    action: z.literal("delivery.replay"),
    deliveryId: z.string().trim().min(20),
  }).strict(),
  z.object({
    action: z.literal("pilot.configure"),
    organizationId: pilotOrganizationId,
    data: z.object({
      agreedWorkflows: z.array(z.enum(partnerPilotWorkflows)).min(1).max(partnerPilotWorkflows.length),
      expectedVolume: z.object({
        requestsPerDay: z.number().int().min(1).max(1_000_000),
        shipmentsPerDay: z.number().int().min(1).max(100_000),
        uploadBytesPerDay: z.number().int().min(1).max(100 * 1024 * 1024 * 1024),
      }).strict(),
      pilotQuota: z.object({
        requestsPerMinute: z.number().int().min(1).max(300),
        shipmentsPerDay: z.number().int().min(1).max(5_000),
        uploadBytesPerDay: z.number().int().min(1).max(10 * 1024 * 1024 * 1024),
      }).strict(),
      supportContactEmail: z.string().trim().email().max(254),
    }).strict(),
  }).strict(),
  z.object({
    action: z.literal("pilot.security_review"),
    organizationId: pilotOrganizationId,
    data: z.object({
      decision: z.enum(["approved", "rejected"]),
      keyStorageApproach: z.enum(["managed_secret_store", "encrypted_server_environment", "other_approved"]),
      rotationOwner: z.string().trim().min(2).max(120),
      notes: z.string().trim().max(1000).optional(),
    }).strict(),
  }).strict(),
  z.object({
    action: z.literal("pilot.sandbox_decision"),
    organizationId: pilotOrganizationId,
    accepted: z.boolean(),
    notes: z.string().trim().max(1000).optional(),
  }).strict(),
  z.object({
    action: z.literal("pilot.live_decision"),
    organizationId: pilotOrganizationId,
    approved: z.boolean(),
    notes: z.string().trim().max(1000).optional(),
  }).strict(),
  z.object({ action: z.literal("pilot.start"), organizationId: pilotOrganizationId }).strict(),
  z.object({
    action: z.literal("pilot.acceptance_update"),
    organizationId: pilotOrganizationId,
    data: z.object({
      productionWorkflowsCompleted: z.boolean().optional(),
      supportProcessAccepted: z.boolean().optional(),
      noIncidentsConfirmed: z.boolean().optional(),
    }).strict().refine((value) => Object.keys(value).length > 0),
  }).strict(),
  z.object({
    action: z.literal("pilot.observation_create"),
    organizationId: pilotOrganizationId,
    data: z.object({
      kind: z.enum(["feedback", "support", "defect", "incident"]),
      category: z.enum(pilotObservationCategories),
      severity: z.enum(["low", "medium", "high", "critical"]),
      summary: z.string().trim().min(3).max(250),
      details: z.string().trim().max(2000).optional(),
    }).strict().superRefine((value, context) => {
      if (["duplicate_shipment", "tenant_isolation", "private_file"].includes(value.category) && value.kind !== "incident") {
        context.addIssue({ code: "custom", path: ["kind"], message: "Isolation, duplicate-shipment and private-file reports must be recorded as incidents" });
      }
    }),
  }).strict(),
  z.object({
    action: z.literal("pilot.observation_resolve"),
    organizationId: pilotOrganizationId,
    observationId: z.string().trim().min(20),
    resolution: z.string().trim().min(3).max(1000),
  }).strict(),
  z.object({ action: z.literal("pilot.complete"), organizationId: pilotOrganizationId }).strict(),
]);

export type SuperAdminIntegrationAction = z.output<
  typeof superAdminIntegrationActionSchema
>;
