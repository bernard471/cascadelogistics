import { randomBytes } from "node:crypto";
import { ObjectId, type Db, type Filter } from "mongodb";
import type { Shipment } from "../../models/Shipment";
import type { ShipmentPrincipal } from "../shipments/principals.ts";
import {
  issuePartnerApiCredential,
  revokePartnerApiCredential,
} from "./credentials.ts";
import { partnerApiError } from "./errors.ts";
import { setPartnerOperationControl } from "./operation-controls.ts";
import type { SuperAdminIntegrationAction } from "./phase8-schemas.ts";
import {
  createApiClient,
  createOrganization,
} from "./repositories.ts";
import { normalizePartnerScopes } from "./scopes.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import type {
  ApiClientDocument,
  ApiCredentialDocument,
  OrganizationDocument,
  WebhookDeliveryDocument,
  WebhookEndpointDocument,
} from "./types.ts";
import { createPartnerPortalUser } from "./portal-auth.ts";
import { getPartnerOperationalHealth } from "./operations.ts";
import {
  assertPartnerPilotLiveApproved,
  completePartnerPilot,
  configurePartnerPilot,
  createPartnerPilotObservation,
  decidePartnerPilotLive,
  decidePartnerPilotSandbox,
  getPartnerPilotReports,
  resolvePartnerPilotObservation,
  reviewPartnerPilotSecurity,
  startPartnerPilotLive,
  updatePartnerPilotAcceptance,
} from "./pilot.ts";

type SuperAdminPrincipal = Extract<ShipmentPrincipal, { kind: "internal" }> & {
  role: "super_admin";
};

export function requireSuperAdminPartnerPrincipal(
  principal: ShipmentPrincipal,
): asserts principal is SuperAdminPrincipal {
  if (principal.kind !== "internal" || principal.role !== "super_admin") {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
}

function iso(value: Date | string | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

function safeOrganization(organization: OrganizationDocument) {
  return {
    id: organization.publicId,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    contacts: organization.contacts,
    settings: organization.settings,
    limits: organization.limits,
    createdAt: iso(organization.createdAt),
    updatedAt: iso(organization.updatedAt),
    approvedAt: iso(organization.approvedAt),
  };
}

function safeApplication(application: ApiClientDocument) {
  return {
    id: application.publicId,
    name: application.name,
    description: application.description,
    status: application.status,
    environmentAccess: application.environmentAccess,
    scopes: application.scopes,
    requestsPerMinute: application.requestsPerMinute,
    createdAt: iso(application.createdAt),
    updatedAt: iso(application.updatedAt),
  };
}

function safeCredential(credential: ApiCredentialDocument) {
  return {
    id: credential.publicId,
    keyPrefix: credential.keyPrefix,
    environment: credential.environment,
    scopes: credential.scopes,
    status: credential.status,
    expiresAt: iso(credential.expiresAt),
    lastUsedAt: iso(credential.lastUsedAt),
    createdAt: iso(credential.createdAt),
    revokedAt: iso(credential.revokedAt),
    revokeReason: credential.revokeReason,
  };
}

function organizationAndApplicationMaps(
  organizations: OrganizationDocument[],
  applications: ApiClientDocument[],
) {
  return {
    organizationByInternalId: new Map(
      organizations.flatMap((organization) =>
        organization._id ? [[organization._id.toString(), organization] as const] : [],
      ),
    ),
    applicationByInternalId: new Map(
      applications.flatMap((application) =>
        application._id ? [[application._id.toString(), application] as const] : [],
      ),
    ),
  };
}

export async function getSuperAdminIntegrationConsole(input: {
  db: Db;
  principal: ShipmentPrincipal;
}) {
  requireSuperAdminPartnerPrincipal(input.principal);
  const [organizations, applications, credentials, controls, requests, endpoints, deliveries, attempts, audits] =
    await Promise.all([
      input.db.collection<OrganizationDocument>("organizations").find({}).sort({ createdAt: -1 }).limit(100).toArray(),
      input.db.collection<ApiClientDocument>("api_clients").find({}).sort({ createdAt: -1 }).limit(200).toArray(),
      input.db.collection<ApiCredentialDocument>("api_credentials").find({}).sort({ createdAt: -1 }).limit(300).toArray(),
      input.db.collection("partner_operation_controls").find({}).sort({ updatedAt: -1 }).limit(100).toArray(),
      input.db.collection("api_request_logs").find({}).sort({ createdAt: -1 }).limit(100).toArray(),
      input.db.collection<WebhookEndpointDocument>("webhook_endpoints").find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 }).limit(100).toArray(),
      input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").find({}).sort({ createdAt: -1 }).limit(100).toArray(),
      input.db.collection("webhook_delivery_attempts").find({}).sort({ completedAt: -1 }).limit(100).toArray(),
      input.db.collection("partner_audit_logs").find({}).sort({ createdAt: -1 }).limit(100).toArray(),
    ]);
  const { organizationByInternalId, applicationByInternalId } =
    organizationAndApplicationMaps(organizations, applications);
  const organizationPublicId = (value: unknown) =>
    value instanceof ObjectId
      ? organizationByInternalId.get(value.toString())?.publicId
      : undefined;
  const applicationPublicId = (value: unknown) =>
    value instanceof ObjectId
      ? applicationByInternalId.get(value.toString())?.publicId
      : undefined;

  const usage = await Promise.all(
    organizations.map(async (organization) => {
      if (!organization._id) {
        return { organizationId: organization.publicId, shipments: 0, testShipments: 0, liveShipments: 0, requests: 0, errors: 0 };
      }
      const [shipments, testShipments, liveShipments, requestCount, errors] = await Promise.all([
        input.db.collection<Shipment>("shipments").countDocuments({ organizationId: organization._id } as Filter<Shipment>),
        input.db.collection<Shipment>("shipments").countDocuments({ organizationId: organization._id, environment: "test" } as Filter<Shipment>),
        input.db.collection<Shipment>("shipments").countDocuments({ organizationId: organization._id, environment: "live" } as Filter<Shipment>),
        input.db.collection("api_request_logs").countDocuments({ organizationId: organization._id }),
        input.db.collection("api_request_logs").countDocuments({ organizationId: organization._id, responseStatus: { $gte: 400 } }),
      ]);
      return { organizationId: organization.publicId, shipments, testShipments, liveShipments, requests: requestCount, errors };
    }),
  );
  const operationalHealth = await getPartnerOperationalHealth(input.db);
  const pilotReports = await getPartnerPilotReports(input.db);

  const safeApplications = applications.map((application) => ({
    ...safeApplication(application),
    organizationId: organizationPublicId(application.organizationId),
  }));
  const safeCredentials = credentials.map((credential) => ({
    ...safeCredential(credential),
    organizationId: organizationPublicId(credential.organizationId),
    applicationId: applicationPublicId(credential.apiClientId),
  }));

  return {
    generatedAt: new Date().toISOString(),
    scopes: normalizePartnerScopes([
      "shipments:create", "shipments:read", "shipments:update", "shipments:cancel",
      "tracking:read", "documents:read", "documents:write", "invoices:read",
      "payments:read", "payments:write", "webhooks:manage",
    ]),
    summary: {
      organizations: organizations.length,
      activeOrganizations: organizations.filter((item) => item.status === "active").length,
      applications: applications.length,
      activeCredentials: credentials.filter((item) => item.status === "active").length,
      webhookEndpoints: endpoints.length,
      failedDeliveries: deliveries.filter((item) => item.status === "failed").length,
    },
    organizations: organizations.map(safeOrganization),
    applications: safeApplications,
    credentials: safeCredentials,
    usage,
    operationalHealth,
    pilots: pilotReports.map((pilot) => ({
      ...pilot,
      organizationId: organizationPublicId(pilot.organizationId),
      observations: pilot.observations.map((observation) => ({
        ...observation,
        organizationId: organizationPublicId(observation.organizationId),
      })),
    })),
    controls: controls.map((control) => ({
      operation: control.operation,
      scopeType: control.scopeType,
      organizationId: organizationPublicId(control.organizationId),
      applicationId: applicationPublicId(control.apiClientId),
      environment: control.environment,
      pausedUntil: iso(control.pausedUntil as Date | undefined),
      reason: control.reason,
      publicMessage: control.publicMessage,
      updatedAt: iso(control.updatedAt as Date | undefined),
    })),
    requestLogs: requests.map((request) => ({
      requestId: request.requestId,
      organizationId: organizationPublicId(request.organizationId),
      applicationId: applicationPublicId(request.apiClientId),
      credentialPrefix: request.credentialPrefix,
      environment: request.environment,
      method: request.method,
      routeTemplate: request.routeTemplate,
      responseStatus: request.responseStatus,
      errorCode: request.errorCode,
      durationMs: request.durationMs,
      rateLimitOutcome: request.rateLimitOutcome,
      sourceFingerprint: request.sourceIp,
      correlationId: request.correlationId,
      createdAt: iso(request.createdAt as Date | undefined),
    })),
    webhookEndpoints: endpoints.map((endpoint) => ({
      id: endpoint.publicId,
      organizationId: organizationPublicId(endpoint.organizationId),
      applicationId: applicationPublicId(endpoint.apiClientId),
      environment: endpoint.environment,
      url: endpoint.url,
      description: endpoint.description,
      subscribedEvents: endpoint.subscribedEvents,
      status: endpoint.status,
      secretPrefix: endpoint.secretPrefix,
      createdAt: iso(endpoint.createdAt),
      updatedAt: iso(endpoint.updatedAt),
    })),
    deliveries: deliveries.map((delivery) => ({
      id: delivery.publicId,
      eventId: delivery.eventPublicId,
      endpointId: delivery.endpointPublicId,
      organizationId: organizationPublicId(delivery.organizationId),
      applicationId: applicationPublicId(delivery.apiClientId),
      environment: delivery.environment,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      replayCount: delivery.replayCount,
      nextAttemptAt: iso(delivery.nextAttemptAt),
      lastStatusCode: delivery.lastStatusCode,
      lastErrorCode: delivery.lastErrorCode,
      lastDurationMs: delivery.lastDurationMs,
      createdAt: iso(delivery.createdAt),
      deliveredAt: iso(delivery.deliveredAt),
      failedAt: iso(delivery.failedAt),
    })),
    deliveryAttempts: attempts.map((attempt) => ({
      id: attempt.publicId,
      deliveryId: attempt.deliveryPublicId,
      eventId: attempt.eventPublicId,
      endpointId: attempt.endpointPublicId,
      attemptNumber: attempt.attemptNumber,
      replayNumber: attempt.replayNumber,
      statusCode: attempt.statusCode,
      errorCode: attempt.errorCode,
      durationMs: attempt.durationMs,
      completedAt: iso(attempt.completedAt as Date | undefined),
    })),
    auditLogs: audits.map((audit) => ({
      actorType: audit.actorType,
      actorId: audit.actorId,
      action: audit.action,
      organizationId: organizationPublicId(audit.organizationId),
      applicationId: applicationPublicId(audit.apiClientId),
      targetPublicId: audit.targetPublicId,
      metadata: audit.metadata,
      createdAt: iso(audit.createdAt as Date | undefined),
    })),
  };
}

async function findOrganization(db: Db, publicId: string) {
  const organization = await db.collection<OrganizationDocument>("organizations").findOne({ publicId });
  if (!organization?._id) throw partnerApiError("resource_not_found", "Resource not found", 404);
  return organization as OrganizationDocument & { _id: ObjectId };
}

async function findApplication(db: Db, organizationId: ObjectId, publicId: string) {
  const application = await db.collection<ApiClientDocument>("api_clients").findOne({
    publicId,
    organizationId,
  });
  if (!application?._id) throw partnerApiError("resource_not_found", "Resource not found", 404);
  return application as ApiClientDocument & { _id: ObjectId };
}

function validateScopes(scopes: readonly string[]) {
  const normalized = normalizePartnerScopes(scopes);
  if (normalized.length !== new Set(scopes).size) {
    throw partnerApiError("validation_failed", "Invalid API scope", 422);
  }
  return normalized;
}

export async function executeSuperAdminIntegrationAction(input: {
  db: Db;
  principal: ShipmentPrincipal;
  action: SuperAdminIntegrationAction;
  pepper?: string;
  now?: Date;
}) {
  requireSuperAdminPartnerPrincipal(input.principal);
  const now = input.now || new Date();
  const principal = input.principal;
  const action = input.action;

  if (action.action === "member.create") {
    const organization = await findOrganization(input.db, action.organizationId);
    const temporaryPassword = `Csl-${randomBytes(12).toString("base64url")}!`;
    const member = await createPartnerPortalUser({ db: input.db, organizationId: organization._id,
      ...action.data, password: temporaryPassword, now });
    await appendPartnerAuditEntry(input.db, { actorType: "super_admin", actorId: principal.userId,
      action: "partner_user.created", organizationId: organization._id,
      targetPublicId: member.publicId, metadata: { email: member.email, role: member.role }, createdAt: now });
    return { member: { id: member.publicId, name: member.name, email: member.email, role: member.role }, temporaryPassword };
  }

  if (action.action === "organization.create") {
    const organization = await createOrganization(input.db, {
      name: action.data.name,
      slug: action.data.slug,
      status: "pending",
      contacts: action.data.technicalEmail
        ? { technical: { email: action.data.technicalEmail } }
        : {},
    }, now);
    await appendPartnerAuditEntry(input.db, {
      actorType: "super_admin",
      actorId: principal.userId,
      action: "organization.created",
      organizationId: organization._id,
      targetPublicId: organization.publicId,
      metadata: { name: organization.name, slug: organization.slug },
      createdAt: now,
    });
    return { organization: safeOrganization(organization) };
  }

  if (action.action === "organization.update") {
    const organization = await findOrganization(input.db, action.organizationId);
    const settings = {
      ...organization.settings,
      ...(action.data.customerEmailMode
        ? { customerEmailMode: action.data.customerEmailMode }
        : {}),
      ...(action.data.shipmentVisibility
        ? { shipmentVisibility: action.data.shipmentVisibility }
        : {}),
    };
    const limits = {
      ...organization.limits,
      ...(action.data.requestsPerMinute
        ? { requestsPerMinute: action.data.requestsPerMinute }
        : {}),
      ...(action.data.shipmentsPerDay
        ? { shipmentsPerDay: action.data.shipmentsPerDay }
        : {}),
      ...(action.data.uploadBytesPerDay
        ? { uploadBytesPerDay: action.data.uploadBytesPerDay }
        : {}),
    };
    const status = action.data.status || organization.status;
    const update = {
      status,
      settings,
      limits,
      updatedAt: now,
      ...(status === "active" && organization.status !== "active"
        ? { approvedAt: now, approvedBy: principal.userId }
        : {}),
    };
    await input.db.collection<OrganizationDocument>("organizations").updateOne(
      { _id: organization._id },
      { $set: update },
    );
    await appendPartnerAuditEntry(input.db, {
      actorType: "super_admin",
      actorId: principal.userId,
      action: "organization.updated",
      organizationId: organization._id,
      targetPublicId: organization.publicId,
      metadata: { changedFields: Object.keys(action.data), status },
      createdAt: now,
    });
    return { organization: safeOrganization({ ...organization, ...update }) };
  }

  if (action.action === "application.create") {
    const organization = await findOrganization(input.db, action.organizationId);
    const scopes = validateScopes(action.data.scopes);
    const application = await createApiClient(input.db, organization._id, {
      ...action.data,
      scopes,
      status: "active",
    }, now);
    await appendPartnerAuditEntry(input.db, {
      actorType: "super_admin",
      actorId: principal.userId,
      action: "application.created",
      organizationId: organization._id,
      apiClientId: application._id,
      targetPublicId: application.publicId,
      metadata: { name: application.name, scopes, environmentAccess: application.environmentAccess },
      createdAt: now,
    });
    return { application: { ...safeApplication(application), organizationId: organization.publicId } };
  }

  if (action.action === "application.update") {
    const organization = await findOrganization(input.db, action.organizationId);
    const application = await findApplication(input.db, organization._id, action.applicationId);
    const updates: Partial<ApiClientDocument> = {
      ...action.data,
      ...(action.data.scopes ? { scopes: validateScopes(action.data.scopes) } : {}),
      updatedAt: now,
    };
    await input.db.collection<ApiClientDocument>("api_clients").updateOne(
      { _id: application._id, organizationId: organization._id },
      { $set: updates },
    );
    await appendPartnerAuditEntry(input.db, {
      actorType: "super_admin",
      actorId: principal.userId,
      action: "application.updated",
      organizationId: organization._id,
      apiClientId: application._id,
      targetPublicId: application.publicId,
      metadata: { changedFields: Object.keys(action.data) },
      createdAt: now,
    });
    return { application: { ...safeApplication({ ...application, ...updates }), organizationId: organization.publicId } };
  }

  if (action.action === "pilot.configure") {
    const organization = await findOrganization(input.db, action.organizationId);
    const common = { db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, now };
    return { pilot: await configurePartnerPilot({ ...common, data: action.data }) };
  }
  if (action.action === "pilot.security_review") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { pilot: await reviewPartnerPilotSecurity({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, data: action.data, now }) };
  }
  if (action.action === "pilot.sandbox_decision") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { pilot: await decidePartnerPilotSandbox({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, accepted: action.accepted, notes: action.notes, now }) };
  }
  if (action.action === "pilot.live_decision") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { pilot: await decidePartnerPilotLive({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, approved: action.approved, notes: action.notes, now }) };
  }
  if (action.action === "pilot.start") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { pilot: await startPartnerPilotLive({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, now }) };
  }
  if (action.action === "pilot.acceptance_update") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { pilot: await updatePartnerPilotAcceptance({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, data: action.data, now }) };
  }
  if (action.action === "pilot.observation_create") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { observation: await createPartnerPilotObservation({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, data: action.data, now }) };
  }
  if (action.action === "pilot.observation_resolve") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { observation: await resolvePartnerPilotObservation({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, observationId: action.observationId, resolution: action.resolution, now }) };
  }
  if (action.action === "pilot.complete") {
    const organization = await findOrganization(input.db, action.organizationId);
    return { pilot: await completePartnerPilot({ db: input.db, organizationId: organization._id, actor: { userId: principal.userId }, now }) };
  }

  if (action.action === "credential.issue") {
    const organization = await findOrganization(input.db, action.organizationId);
    const application = await findApplication(input.db, organization._id, action.applicationId);
    if (action.environment === "live" && application.environmentAccess.includes("live")) {
      await assertPartnerPilotLiveApproved(input.db, organization._id);
    }
    return issuePartnerApiCredential({
      db: input.db,
      principal,
      organizationId: organization._id.toString(),
      apiClientId: application._id.toString(),
      environment: action.environment,
      scopes: action.scopes,
      expiresAt: action.expiresAt ? new Date(action.expiresAt) : undefined,
      pepper: input.pepper,
      now,
    });
  }

  if (action.action === "credential.revoke" || action.action === "credential.rotate") {
    const organization = await findOrganization(input.db, action.organizationId);
    const credential = await input.db.collection<ApiCredentialDocument>("api_credentials").findOne({
      publicId: action.credentialId,
      organizationId: organization._id,
    });
    if (!credential) throw partnerApiError("resource_not_found", "Resource not found", 404);
    if (action.action === "credential.revoke") {
      await revokePartnerApiCredential({
        db: input.db,
        principal,
        organizationId: organization._id.toString(),
        credentialPublicId: credential.publicId,
        reason: action.reason,
        now,
      });
      return { revoked: true, credentialId: credential.publicId };
    }
    if (credential.status !== "active") {
      throw partnerApiError("validation_failed", "Only active credentials can be rotated", 409);
    }
    const replacement = await issuePartnerApiCredential({
      db: input.db,
      principal,
      organizationId: organization._id.toString(),
      apiClientId: credential.apiClientId.toString(),
      environment: credential.environment,
      scopes: credential.scopes,
      expiresAt:
        credential.expiresAt && credential.expiresAt.getTime() > now.getTime()
          ? credential.expiresAt
          : undefined,
      pepper: input.pepper,
      now,
    });
    await revokePartnerApiCredential({
      db: input.db,
      principal,
      organizationId: organization._id.toString(),
      credentialPublicId: credential.publicId,
      reason: `Rotated to ${replacement.credential.publicId}`,
      now,
    });
    await appendPartnerAuditEntry(input.db, {
      actorType: "super_admin",
      actorId: principal.userId,
      action: "api_credential_rotated",
      organizationId: organization._id,
      apiClientId: credential.apiClientId,
      credentialId: credential._id,
      targetPublicId: credential.publicId,
      metadata: { replacementCredentialId: replacement.credential.publicId },
      createdAt: now,
    });
    return replacement;
  }

  if (action.action === "control.set") {
    const organization = action.organizationId
      ? await findOrganization(input.db, action.organizationId)
      : undefined;
    const application = action.applicationId && organization
      ? await findApplication(input.db, organization._id, action.applicationId)
      : undefined;
    await setPartnerOperationControl({
      db: input.db,
      principal,
      operation: action.operation,
      scopeType: action.scopeType,
      organizationId: organization?._id.toString(),
      apiClientId: application?._id.toString(),
      environment: action.environment,
      pausedUntil: action.pausedUntil ? new Date(action.pausedUntil) : null,
      reason: action.reason,
      publicMessage: action.publicMessage,
      now,
    });
    return { updated: true };
  }

  const delivery = await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").findOne({
    publicId: action.deliveryId,
  });
  if (!delivery || delivery.status === "processing") {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
  const reset = await input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").updateOne(
    { _id: delivery._id, status: delivery.status },
    {
      $set: {
        status: "pending",
        attemptCount: 0,
        nextAttemptAt: now,
        replayCount: delivery.replayCount + 1,
        updatedAt: now,
      },
      $unset: {
        leaseExpiresAt: "", deliveredAt: "", failedAt: "",
        lastStatusCode: "", lastErrorCode: "", lastDurationMs: "",
      },
    },
  );
  if (reset.modifiedCount !== 1) {
    throw partnerApiError("request_in_progress", "Webhook delivery is being processed", 409);
  }
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin",
    actorId: principal.userId,
    action: "webhook_delivery.replayed_by_super_admin",
    organizationId: delivery.organizationId,
    apiClientId: delivery.apiClientId,
    targetPublicId: delivery.publicId,
    metadata: { eventId: delivery.eventPublicId, endpointId: delivery.endpointPublicId },
    createdAt: now,
  });
  return { queued: true, deliveryId: delivery.publicId };
}
