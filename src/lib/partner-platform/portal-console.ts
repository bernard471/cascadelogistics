import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { ObjectId, type Db, type Filter } from "mongodb";
import type { Shipment } from "../../models/Shipment";
import type { PartnerShipmentPrincipal } from "../shipments/principals.ts";
import { generatePartnerApiKey } from "./api-keys.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import { getPartnerApiKeyPepper } from "./credentials.ts";
import { partnerApiError } from "./errors.ts";
import type { PartnerPortalPrincipal, PartnerPortalRole } from "./portal-auth.ts";
import { createPartnerPortalUser } from "./portal-auth.ts";
import type { PartnerPortalAction } from "./phase9-schemas.ts";
import { createApiClient, createApiCredential } from "./repositories.ts";
import { normalizePartnerScopes } from "./scopes.ts";
import type { WebhookHostnameResolver } from "./webhook-destinations.ts";
import { replayWebhookDelivery } from "./webhook-delivery.ts";
import { createWebhookEndpoint, queueWebhookTestEvent, updateWebhookEndpoint } from "./webhook-endpoints.ts";
import { assertPartnerPilotLiveApproved } from "./pilot.ts";
import type { ApiClientDocument, ApiCredentialDocument, OrganizationDocument, PartnerEnvironment, PartnerUserDocument, WebhookDeliveryDocument, WebhookEndpointDocument } from "./types.ts";

const managementRoles: PartnerPortalRole[] = ["owner", "developer"];
const replayRoles: PartnerPortalRole[] = ["owner", "developer", "operations_viewer"];
function iso(value: Date | string | undefined) { return value ? new Date(value).toISOString() : undefined; }
function requireRole(principal: PartnerPortalPrincipal, roles: PartnerPortalRole[]) {
  if (!roles.includes(principal.role)) throw partnerApiError("resource_not_found", "Resource not found", 404);
}
function ids(principal: PartnerPortalPrincipal) {
  if (!ObjectId.isValid(principal.organizationId) || !ObjectId.isValid(principal.userId)) throw partnerApiError("authentication_required", "Partner login required", 401);
  return { organizationId: new ObjectId(principal.organizationId), userId: new ObjectId(principal.userId) };
}
async function application(db: Db, organizationId: ObjectId, publicId: string) {
  const value = await db.collection<ApiClientDocument>("api_clients").findOne({ organizationId, publicId });
  if (!value?._id) throw partnerApiError("resource_not_found", "Resource not found", 404);
  return value as ApiClientDocument & { _id: ObjectId };
}
function apiPrincipal(principal: PartnerPortalPrincipal, app: ApiClientDocument & { _id: ObjectId }, environment: PartnerEnvironment): PartnerShipmentPrincipal {
  if (!app.environmentAccess.includes(environment)) throw partnerApiError("validation_failed", "Application is not enabled for this environment", 422);
  return { kind: "partner_api", organizationId: principal.organizationId, apiClientId: app._id.toString(),
    credentialId: `portal:${principal.userPublicId}`, environment, scopes: app.scopes };
}
function safeApplication(app: ApiClientDocument) {
  return { id: app.publicId, name: app.name, description: app.description, status: app.status,
    environmentAccess: app.environmentAccess, scopes: app.scopes, requestsPerMinute: app.requestsPerMinute,
    createdAt: iso(app.createdAt), updatedAt: iso(app.updatedAt) };
}

export async function getPartnerPortalConsole(input: { db: Db; principal: PartnerPortalPrincipal; environment: PartnerEnvironment }) {
  const { organizationId } = ids(input.principal);
  const organization = await input.db.collection<OrganizationDocument>("organizations").findOne({ _id: organizationId, status: "active" });
  if (!organization) throw partnerApiError("integration_suspended", "This partner account is not active", 403);
  const [apps, credentials, requests, endpoints, deliveries, shipments, members] = await Promise.all([
    input.db.collection<ApiClientDocument>("api_clients").find({ organizationId, status: { $ne: "archived" } }).sort({ createdAt: -1 }).toArray(),
    input.db.collection<ApiCredentialDocument>("api_credentials").find({ organizationId, environment: input.environment }).sort({ createdAt: -1 }).limit(100).toArray(),
    input.db.collection("api_request_logs").find({ organizationId, environment: input.environment }).sort({ createdAt: -1 }).limit(100).toArray(),
    input.db.collection<WebhookEndpointDocument>("webhook_endpoints").find({ organizationId, environment: input.environment, status: { $ne: "deleted" } } as Filter<WebhookEndpointDocument>).sort({ createdAt: -1 }).limit(100).toArray(),
    input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").find({ organizationId, environment: input.environment }).sort({ createdAt: -1 }).limit(100).toArray(),
    input.db.collection<Shipment>("shipments").find({ organizationId, environment: input.environment } as Filter<Shipment>).sort({ updatedAt: -1 }).limit(50).toArray(),
    input.principal.role === "owner" ? input.db.collection<PartnerUserDocument>("partner_users").find({ organizationId }).sort({ createdAt: 1 }).toArray() : Promise.resolve([]),
  ]);
  const appById = new Map(apps.flatMap((app) => app._id ? [[app._id.toString(), app] as const] : []));
  const deliveryIds = deliveries.map((item) => item.publicId);
  const attempts = deliveryIds.length ? await input.db.collection("webhook_delivery_attempts").find({ deliveryPublicId: { $in: deliveryIds } }).sort({ completedAt: -1 }).limit(100).toArray() : [];
  const requestErrors = requests.filter((item) => Number(item.responseStatus) >= 400).length;
  return {
    generatedAt: new Date().toISOString(), environment: input.environment,
    user: { id: input.principal.userPublicId, name: input.principal.name, email: input.principal.email, role: input.principal.role, mustChangePassword: input.principal.mustChangePassword },
    organization: { id: organization.publicId, name: organization.name, slug: organization.slug, limits: organization.limits, settings: organization.settings },
    permissions: { manageMembers: input.principal.role === "owner", manageApplications: managementRoles.includes(input.principal.role), manageCredentials: managementRoles.includes(input.principal.role), manageWebhooks: managementRoles.includes(input.principal.role), replayWebhooks: replayRoles.includes(input.principal.role) },
    summary: { applications: apps.filter((app) => app.environmentAccess.includes(input.environment)).length, activeCredentials: credentials.filter((item) => item.status === "active").length, shipments: shipments.length, requests: requests.length, errors: requestErrors, failedDeliveries: deliveries.filter((item) => item.status === "failed").length },
    applications: apps.map(safeApplication),
    credentials: credentials.map((item) => ({ id: item.publicId, applicationId: appById.get(item.apiClientId.toString())?.publicId, keyPrefix: item.keyPrefix, environment: item.environment, scopes: item.scopes, status: item.status, expiresAt: iso(item.expiresAt), lastUsedAt: iso(item.lastUsedAt), createdAt: iso(item.createdAt) })),
    members: members.map((item) => ({ id: item.publicId, name: item.name, email: item.email, role: item.role, status: item.status, lastLoginAt: iso(item.lastLoginAt), createdAt: iso(item.createdAt) })),
    requestLogs: requests.map((item) => ({ requestId: item.requestId, applicationId: appById.get(String(item.apiClientId))?.publicId, credentialPrefix: item.credentialPrefix, method: item.method, routeTemplate: item.routeTemplate, responseStatus: item.responseStatus, errorCode: item.errorCode, durationMs: item.durationMs, rateLimitOutcome: item.rateLimitOutcome, sourceFingerprint: item.sourceIp, correlationId: item.correlationId, createdAt: iso(item.createdAt as Date | undefined) })),
    webhookEndpoints: endpoints.map((item) => ({ id: item.publicId, applicationId: appById.get(item.apiClientId.toString())?.publicId, url: item.url, description: item.description, subscribedEvents: item.subscribedEvents, status: item.status, secretPrefix: item.secretPrefix, createdAt: iso(item.createdAt), updatedAt: iso(item.updatedAt) })),
    deliveries: deliveries.map((item) => ({ id: item.publicId, applicationId: appById.get(item.apiClientId.toString())?.publicId, eventId: item.eventPublicId, endpointId: item.endpointPublicId, status: item.status, attemptCount: item.attemptCount, replayCount: item.replayCount, lastStatusCode: item.lastStatusCode, lastErrorCode: item.lastErrorCode, lastDurationMs: item.lastDurationMs, createdAt: iso(item.createdAt) })),
    deliveryAttempts: attempts.map((item) => ({ id: item.publicId, deliveryId: item.deliveryPublicId, attemptNumber: item.attemptNumber, replayNumber: item.replayNumber, statusCode: item.statusCode, errorCode: item.errorCode, durationMs: item.durationMs, completedAt: iso(item.completedAt as Date | undefined) })),
    shipments: shipments.map((item) => ({ id: item.publicId, trackingId: item.trackingId, externalReference: item.externalReference, applicationId: item.apiClientId ? appById.get(item.apiClientId.toString())?.publicId : undefined, status: item.status, currentLocation: item.currentLocation, receiverName: item.receiverName, documentCount: item.documents?.length || 0, invoiceAvailable: Boolean(item.invoice), updatedAt: iso(item.updatedAt), createdAt: iso(item.createdAt) })),
  };
}

async function issueCredential(input: { db: Db; principal: PartnerPortalPrincipal; app: ApiClientDocument & { _id: ObjectId }; environment: PartnerEnvironment; scopes: readonly string[]; expiresAt?: Date; pepper?: string; now: Date }) {
  const normalized = normalizePartnerScopes(input.scopes);
  if (normalized.length !== new Set(input.scopes).size || normalized.some((scope) => !input.app.scopes.includes(scope))) throw partnerApiError("validation_failed", "Credential scope exceeds application permissions", 422);
  if (!input.app.environmentAccess.includes(input.environment)) throw partnerApiError("validation_failed", "Application is not enabled for this environment", 422);
  if (input.environment === "live") await assertPartnerPilotLiveApproved(input.db, new ObjectId(input.principal.organizationId));
  if (input.expiresAt && input.expiresAt <= input.now) throw partnerApiError("validation_failed", "Credential expiry must be in the future", 422);
  const generated = generatePartnerApiKey(input.environment, input.pepper || getPartnerApiKeyPepper());
  const stored = await createApiCredential(input.db, input.principal.organizationId, input.app._id, { environment: input.environment, keyPrefix: generated.keyPrefix, secretHash: generated.secretHash, scopes: normalized, expiresAt: input.expiresAt, createdBy: input.principal.userPublicId }, input.now);
  await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.api_credential_issued", organizationId: new ObjectId(input.principal.organizationId), apiClientId: input.app._id, credentialId: stored._id, targetPublicId: stored.publicId, metadata: { environment: stored.environment, scopes: stored.scopes, keyPrefix: stored.keyPrefix }, createdAt: input.now });
  return { apiKey: generated.apiKey, credential: { id: stored.publicId, keyPrefix: stored.keyPrefix, environment: stored.environment, scopes: stored.scopes, status: stored.status } };
}

export async function executePartnerPortalAction(input: { db: Db; principal: PartnerPortalPrincipal; action: PartnerPortalAction; pepper?: string; encryptionKey?: string; resolver?: WebhookHostnameResolver; now?: Date }) {
  const now = input.now || new Date(); const { organizationId, userId } = ids(input.principal); const action = input.action;
  if (action.action === "password.change") {
    const user = await input.db.collection<PartnerUserDocument>("partner_users").findOne({ _id: userId, organizationId });
    if (!user?.passwordHash || !(await bcrypt.compare(action.currentPassword, user.passwordHash))) throw partnerApiError("validation_failed", "Current password is incorrect", 422);
    await input.db.collection<PartnerUserDocument>("partner_users").updateOne({ _id: userId, organizationId }, { $set: { passwordHash: await bcrypt.hash(action.newPassword, 12), mustChangePassword: false, updatedAt: now } });
    await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.password_changed", organizationId, targetPublicId: input.principal.userPublicId, createdAt: now });
    return { updated: true };
  }
  if (action.action === "member.create") {
    requireRole(input.principal, ["owner"]); const temporaryPassword = `Csl-${randomBytes(12).toString("base64url")}!`;
    const member = await createPartnerPortalUser({ db: input.db, organizationId, ...action.data, password: temporaryPassword, now });
    await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.member_created", organizationId, targetPublicId: member.publicId, metadata: { email: member.email, role: member.role }, createdAt: now });
    return { member: { id: member.publicId, name: member.name, email: member.email, role: member.role }, temporaryPassword };
  }
  if (action.action === "member.update") {
    requireRole(input.principal, ["owner"]); const member = await input.db.collection<PartnerUserDocument>("partner_users").findOne({ organizationId, publicId: action.memberId });
    if (!member?._id || member._id.toString() === input.principal.userId) throw partnerApiError("resource_not_found", "Resource not found", 404);
    await input.db.collection<PartnerUserDocument>("partner_users").updateOne({ _id: member._id, organizationId }, { $set: { ...action.data, updatedAt: now } });
    await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.member_updated", organizationId, targetPublicId: member.publicId, metadata: { changedFields: Object.keys(action.data) }, createdAt: now });
    return { updated: true };
  }
  if (action.action === "application.create") {
    requireRole(input.principal, managementRoles); const app = await createApiClient(input.db, organizationId, { ...action.data, environmentAccess: ["test"], status: "active" }, now);
    await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.application_created", organizationId, apiClientId: app._id, targetPublicId: app.publicId, metadata: { scopes: app.scopes, environmentAccess: ["test"] }, createdAt: now });
    return { application: safeApplication(app) };
  }
  if (action.action === "application.update") {
    requireRole(input.principal, managementRoles); const app = await application(input.db, organizationId, action.applicationId);
    const updates = { ...action.data, updatedAt: now } as Partial<ApiClientDocument>; await input.db.collection<ApiClientDocument>("api_clients").updateOne({ _id: app._id, organizationId }, { $set: updates, ...(action.data.description === null ? { $unset: { description: "" } } : {}) });
    await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.application_updated", organizationId, apiClientId: app._id, targetPublicId: app.publicId, metadata: { changedFields: Object.keys(action.data) }, createdAt: now });
    return { application: safeApplication({ ...app, ...updates }) };
  }
  if (action.action === "credential.issue") {
    requireRole(input.principal, managementRoles); const app = await application(input.db, organizationId, action.applicationId);
    return issueCredential({ db: input.db, principal: input.principal, app, environment: action.environment, scopes: action.scopes, expiresAt: action.expiresAt ? new Date(action.expiresAt) : undefined, pepper: input.pepper, now });
  }
  if (action.action === "credential.rotate" || action.action === "credential.revoke") {
    requireRole(input.principal, managementRoles); const credential = await input.db.collection<ApiCredentialDocument>("api_credentials").findOne({ organizationId, publicId: action.credentialId });
    if (!credential?._id) throw partnerApiError("resource_not_found", "Resource not found", 404);
    if (action.action === "credential.revoke") {
      await input.db.collection<ApiCredentialDocument>("api_credentials").updateOne({ _id: credential._id, organizationId }, { $set: { status: "revoked", revokedAt: now, revokedBy: input.principal.userPublicId, revokeReason: "Revoked from partner portal" } });
      await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.api_credential_revoked", organizationId, apiClientId: credential.apiClientId, credentialId: credential._id, targetPublicId: credential.publicId, createdAt: now }); return { revoked: true };
    }
    if (credential.status !== "active") throw partnerApiError("validation_failed", "Only active credentials can be rotated", 409);
    const app = await application(input.db, organizationId, (await input.db.collection<ApiClientDocument>("api_clients").findOne({ _id: credential.apiClientId, organizationId }))?.publicId || "");
    const replacement = await issueCredential({ db: input.db, principal: input.principal, app, environment: credential.environment, scopes: credential.scopes, expiresAt: credential.expiresAt, pepper: input.pepper, now });
    await input.db.collection<ApiCredentialDocument>("api_credentials").updateOne({ _id: credential._id, organizationId }, { $set: { status: "revoked", revokedAt: now, revokedBy: input.principal.userPublicId, revokeReason: `Rotated to ${replacement.credential.id}` } });
    await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: "portal.api_credential_rotated", organizationId, apiClientId: credential.apiClientId, credentialId: credential._id, targetPublicId: credential.publicId, metadata: { replacementCredentialId: replacement.credential.id }, createdAt: now }); return replacement;
  }
  const app = await application(input.db, organizationId, action.applicationId); const portalApiPrincipal = apiPrincipal(input.principal, app, action.environment);
  let result: unknown;
  if (action.action === "webhook.create") { requireRole(input.principal, managementRoles); result = await createWebhookEndpoint({ db: input.db, principal: portalApiPrincipal, data: action.data, resolver: input.resolver, encryptionKey: input.encryptionKey, now }); }
  else if (action.action === "webhook.update") { requireRole(input.principal, managementRoles); result = await updateWebhookEndpoint({ db: input.db, principal: portalApiPrincipal, endpointPublicId: action.endpointId, data: action.data, resolver: input.resolver, encryptionKey: input.encryptionKey, now }); }
  else if (action.action === "webhook.test") { requireRole(input.principal, managementRoles); result = await queueWebhookTestEvent({ db: input.db, principal: portalApiPrincipal, endpointPublicId: action.endpointId, now }); }
  else { requireRole(input.principal, replayRoles); result = await replayWebhookDelivery({ db: input.db, principal: portalApiPrincipal, deliveryPublicId: action.deliveryId, now }); }
  await appendPartnerAuditEntry(input.db, { actorType: "partner_user", actorId: input.principal.userPublicId, action: `portal.${action.action.replace(".", "_")}`, organizationId, apiClientId: app._id, targetPublicId: "endpointId" in action ? action.endpointId : "deliveryId" in action ? action.deliveryId : undefined, createdAt: now });
  return result;
}
