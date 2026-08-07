import { ObjectId, type Db, type Filter } from "mongodb";
import type { Shipment } from "../../models/Shipment";
import { appendPartnerAuditEntry } from "./audit.ts";
import { partnerApiError } from "./errors.ts";
import { generatePublicId } from "./public-id.ts";
import { sanitizeLogText } from "./redaction.ts";
import type {
  ApiCredentialDocument,
  PartnerPilotDocument,
  PartnerPilotObservationDocument,
  PartnerPilotWorkflow,
  WebhookDeliveryDocument,
} from "./types.ts";
import type { PartnerUploadIntentDocument } from "./uploads.ts";

export interface PilotActor {
  userId: string;
}

function iso(value: Date | string | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

function p95(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] || 0;
}

async function requirePilot(db: Db, organizationId: ObjectId) {
  const pilot = await db.collection<PartnerPilotDocument>("partner_pilots").findOne({ organizationId });
  if (!pilot?._id) throw partnerApiError("resource_not_found", "Pilot record not found", 404);
  return pilot as PartnerPilotDocument & { _id: ObjectId };
}

function safePilot(pilot: PartnerPilotDocument) {
  return {
    id: pilot.publicId,
    organizationId: pilot.organizationId,
    status: pilot.status,
    agreedWorkflows: pilot.agreedWorkflows,
    expectedVolume: pilot.expectedVolume,
    pilotQuota: pilot.pilotQuota,
    supportContactEmail: pilot.supportContactEmail,
    securityReview: pilot.securityReview ? {
      decision: pilot.securityReview.decision,
      keyStorageApproach: pilot.securityReview.keyStorageApproach,
      rotationOwner: pilot.securityReview.rotationOwner,
      notes: pilot.securityReview.notes,
      reviewedAt: iso(pilot.securityReview.reviewedAt),
    } : undefined,
    sandboxAcceptedAt: iso(pilot.sandboxAcceptedAt),
    sandboxNotes: pilot.sandboxNotes,
    liveApprovedAt: iso(pilot.liveApprovedAt),
    liveApprovalNotes: pilot.liveApprovalNotes,
    liveStartedAt: iso(pilot.liveStartedAt),
    acceptance: pilot.acceptance,
    completedAt: iso(pilot.completedAt),
    createdAt: iso(pilot.createdAt),
    updatedAt: iso(pilot.updatedAt),
  };
}

function safeObservation(observation: PartnerPilotObservationDocument) {
  return {
    id: observation.publicId,
    organizationId: observation.organizationId,
    kind: observation.kind,
    category: observation.category,
    severity: observation.severity,
    summary: observation.summary,
    details: observation.details,
    status: observation.status,
    createdAt: iso(observation.createdAt),
    resolvedAt: iso(observation.resolvedAt),
    resolution: observation.resolution,
  };
}

export async function assertPartnerPilotLiveApproved(db: Db, organizationId: ObjectId) {
  const pilot = await db.collection<PartnerPilotDocument>("partner_pilots").findOne({ organizationId });
  if (
    !pilot ||
    !["live_approved", "live", "completed"].includes(pilot.status) ||
    pilot.securityReview?.decision !== "approved" ||
    !pilot.sandboxAcceptedAt
  ) {
    throw partnerApiError(
      "pilot_not_ready",
      "Live access requires an approved security review and accepted sandbox pilot",
      409,
    );
  }
  return pilot;
}

export async function configurePartnerPilot(input: {
  db: Db;
  organizationId: ObjectId;
  actor: PilotActor;
  data: {
    agreedWorkflows: PartnerPilotWorkflow[];
    expectedVolume: PartnerPilotDocument["expectedVolume"];
    pilotQuota: PartnerPilotDocument["pilotQuota"];
    supportContactEmail: string;
  };
  now?: Date;
}) {
  const now = input.now || new Date();
  const existing = await input.db.collection<PartnerPilotDocument>("partner_pilots").findOne({ organizationId: input.organizationId });
  if (existing?.status === "completed" || existing?.status === "cancelled") {
    throw partnerApiError("validation_failed", "A completed or cancelled pilot cannot be reconfigured", 409);
  }
  const publicId = existing?.publicId || generatePublicId("pilot");
  await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne(
    { organizationId: input.organizationId },
    {
      $set: {
        ...input.data,
        status: existing?.status || "sandbox",
        updatedAt: now,
      },
      $setOnInsert: {
        publicId,
        organizationId: input.organizationId,
        acceptance: {
          productionWorkflowsCompleted: false,
          supportProcessAccepted: false,
          noIncidentsConfirmed: false,
        },
        createdAt: now,
        createdBy: input.actor.userId,
      },
    },
    { upsert: true },
  );
  await input.db.collection("organizations").updateOne(
    { _id: input.organizationId },
    { $set: { limits: input.data.pilotQuota, updatedAt: now } },
  );
  const pilot = await requirePilot(input.db, input.organizationId);
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin", actorId: input.actor.userId, action: "pilot.configured",
    organizationId: input.organizationId, targetPublicId: publicId,
    metadata: { agreedWorkflows: input.data.agreedWorkflows, expectedVolume: input.data.expectedVolume, pilotQuota: input.data.pilotQuota }, createdAt: now,
  });
  return safePilot(pilot);
}

export async function reviewPartnerPilotSecurity(input: {
  db: Db; organizationId: ObjectId; actor: PilotActor;
  data: NonNullable<PartnerPilotDocument["securityReview"]> extends infer T
    ? Omit<T, "reviewedAt" | "reviewedBy"> : never;
  now?: Date;
}) {
  const pilot = await requirePilot(input.db, input.organizationId);
  const now = input.now || new Date();
  if (["live", "completed", "cancelled"].includes(pilot.status)) {
    throw partnerApiError("validation_failed", "Security review cannot be changed in the current pilot state", 409);
  }
  const securityReview = {
    ...input.data,
    rotationOwner: sanitizeLogText(input.data.rotationOwner, 120),
    ...(input.data.notes ? { notes: sanitizeLogText(input.data.notes, 1000) } : {}),
    reviewedAt: now,
    reviewedBy: input.actor.userId,
  };
  const resetLiveApproval = input.data.decision === "rejected" && pilot.status === "live_approved";
  await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne(
    { _id: pilot._id },
    {
      $set: { securityReview, ...(resetLiveApproval ? { status: "sandbox_accepted" } : {}), updatedAt: now },
      ...(resetLiveApproval ? { $unset: { liveApprovedAt: "", liveApprovedBy: "" } } : {}),
    },
  );
  if (resetLiveApproval) {
    await input.db.collection<ApiCredentialDocument>("api_credentials").updateMany(
      { organizationId: input.organizationId, environment: "live", status: "active" },
      { $set: { status: "revoked", revokedAt: now, revokedBy: input.actor.userId, revokeReason: "Pilot security approval withdrawn" } },
    );
  }
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin", actorId: input.actor.userId, action: "pilot.security_reviewed",
    organizationId: input.organizationId, targetPublicId: pilot.publicId,
    metadata: { decision: input.data.decision, keyStorageApproach: input.data.keyStorageApproach, rotationOwner: input.data.rotationOwner }, createdAt: now,
  });
  return safePilot(await requirePilot(input.db, input.organizationId));
}

export async function decidePartnerPilotSandbox(input: {
  db: Db; organizationId: ObjectId; actor: PilotActor; accepted: boolean; notes?: string; now?: Date;
}) {
  const pilot = await requirePilot(input.db, input.organizationId);
  if (!["sandbox", "sandbox_accepted"].includes(pilot.status)) {
    throw partnerApiError("validation_failed", "Sandbox decision is not available in the current pilot state", 409);
  }
  const now = input.now || new Date();
  if (input.accepted) {
    await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne(
      { _id: pilot._id },
      { $set: { status: "sandbox_accepted", sandboxAcceptedAt: now, sandboxAcceptedBy: input.actor.userId, sandboxNotes: input.notes ? sanitizeLogText(input.notes, 1000) : undefined, updatedAt: now } },
    );
  } else {
    await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne(
      { _id: pilot._id },
      { $set: { status: "sandbox", sandboxNotes: input.notes ? sanitizeLogText(input.notes, 1000) : undefined, updatedAt: now }, $unset: { sandboxAcceptedAt: "", sandboxAcceptedBy: "" } },
    );
  }
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin", actorId: input.actor.userId, action: input.accepted ? "pilot.sandbox_accepted" : "pilot.sandbox_rejected",
    organizationId: input.organizationId, targetPublicId: pilot.publicId, metadata: { notes: input.notes }, createdAt: now,
  });
  return safePilot(await requirePilot(input.db, input.organizationId));
}

export async function decidePartnerPilotLive(input: {
  db: Db; organizationId: ObjectId; actor: PilotActor; approved: boolean; notes?: string; now?: Date;
}) {
  const pilot = await requirePilot(input.db, input.organizationId);
  const now = input.now || new Date();
  if (input.approved) {
    if (pilot.status !== "sandbox_accepted" || !pilot.sandboxAcceptedAt || pilot.securityReview?.decision !== "approved") {
      throw partnerApiError("pilot_not_ready", "Sandbox acceptance and an approved security review are required", 409);
    }
    const observations = await input.db.collection<PartnerPilotObservationDocument>("partner_pilot_observations").find({ organizationId: input.organizationId }).toArray();
    if (observations.some((item) => item.status === "open" && ["high", "critical"].includes(item.severity))) {
      throw partnerApiError("pilot_not_ready", "Resolve all high and critical pilot observations before live approval", 409);
    }
    if (observations.some((item) => item.kind === "incident" && ["tenant_isolation", "duplicate_shipment", "private_file"].includes(item.category))) {
      throw partnerApiError("pilot_not_ready", "A prohibited pilot incident prevents live approval", 409);
    }
    await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne(
      { _id: pilot._id },
      { $set: { status: "live_approved", liveApprovedAt: now, liveApprovedBy: input.actor.userId, liveApprovalNotes: input.notes ? sanitizeLogText(input.notes, 1000) : undefined, updatedAt: now } },
    );
  } else {
    if (!["live_approved", "sandbox_accepted"].includes(pilot.status)) {
      throw partnerApiError("validation_failed", "Live approval cannot be withdrawn in the current pilot state", 409);
    }
    await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne(
      { _id: pilot._id },
      { $set: { status: "sandbox_accepted", liveApprovalNotes: input.notes ? sanitizeLogText(input.notes, 1000) : undefined, updatedAt: now }, $unset: { liveApprovedAt: "", liveApprovedBy: "" } },
    );
    await input.db.collection<ApiCredentialDocument>("api_credentials").updateMany(
      { organizationId: input.organizationId, environment: "live", status: "active" },
      { $set: { status: "revoked", revokedAt: now, revokedBy: input.actor.userId, revokeReason: "Pilot live approval withdrawn" } },
    );
  }
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin", actorId: input.actor.userId, action: input.approved ? "pilot.live_approved" : "pilot.live_approval_withdrawn",
    organizationId: input.organizationId, targetPublicId: pilot.publicId, metadata: { notes: input.notes }, createdAt: now,
  });
  return safePilot(await requirePilot(input.db, input.organizationId));
}

export async function startPartnerPilotLive(input: { db: Db; organizationId: ObjectId; actor: PilotActor; now?: Date }) {
  const pilot = await assertPartnerPilotLiveApproved(input.db, input.organizationId);
  if (pilot.status !== "live_approved") throw partnerApiError("validation_failed", "Pilot is not awaiting live start", 409);
  const liveCredentials = await input.db.collection<ApiCredentialDocument>("api_credentials").countDocuments({ organizationId: input.organizationId, environment: "live", status: "active" });
  if (!liveCredentials) throw partnerApiError("pilot_not_ready", "Issue an approved live credential before starting the pilot", 409);
  const now = input.now || new Date();
  await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne({ _id: pilot._id }, { $set: { status: "live", liveStartedAt: now, updatedAt: now } });
  await appendPartnerAuditEntry(input.db, { actorType: "super_admin", actorId: input.actor.userId, action: "pilot.live_started", organizationId: input.organizationId, targetPublicId: pilot.publicId, createdAt: now });
  return safePilot(await requirePilot(input.db, input.organizationId));
}

export async function updatePartnerPilotAcceptance(input: {
  db: Db; organizationId: ObjectId; actor: PilotActor; data: Partial<PartnerPilotDocument["acceptance"]>; now?: Date;
}) {
  const pilot = await requirePilot(input.db, input.organizationId);
  if (pilot.status !== "live") throw partnerApiError("validation_failed", "Acceptance can be recorded only during the live pilot", 409);
  const now = input.now || new Date();
  const acceptance = { ...pilot.acceptance, ...input.data };
  await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne({ _id: pilot._id }, { $set: { acceptance, updatedAt: now } });
  await appendPartnerAuditEntry(input.db, { actorType: "super_admin", actorId: input.actor.userId, action: "pilot.acceptance_updated", organizationId: input.organizationId, targetPublicId: pilot.publicId, metadata: { changedFields: Object.keys(input.data) }, createdAt: now });
  return { ...safePilot(pilot), acceptance, updatedAt: iso(now) };
}

export async function createPartnerPilotObservation(input: {
  db: Db; organizationId: ObjectId; actor: PilotActor;
  data: Pick<PartnerPilotObservationDocument, "kind" | "category" | "severity" | "summary" | "details">;
  now?: Date;
}) {
  const pilot = await requirePilot(input.db, input.organizationId);
  const now = input.now || new Date();
  const observation: PartnerPilotObservationDocument = {
    publicId: generatePublicId("pilotObservation"), pilotId: pilot._id, organizationId: input.organizationId,
    ...input.data,
    summary: sanitizeLogText(input.data.summary, 250),
    ...(input.data.details ? { details: sanitizeLogText(input.data.details, 2000) } : {}),
    status: "open", createdAt: now, createdBy: input.actor.userId,
  };
  const inserted = await input.db.collection<PartnerPilotObservationDocument>("partner_pilot_observations").insertOne(observation);
  observation._id = inserted.insertedId;
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin", actorId: input.actor.userId, action: "pilot.observation_created",
    organizationId: input.organizationId, targetPublicId: observation.publicId,
    metadata: { kind: observation.kind, category: observation.category, severity: observation.severity, summary: observation.summary }, createdAt: now,
  });
  return safeObservation(observation);
}

export async function resolvePartnerPilotObservation(input: {
  db: Db; organizationId: ObjectId; actor: PilotActor; observationId: string; resolution: string; now?: Date;
}) {
  const pilot = await requirePilot(input.db, input.organizationId);
  const observation = await input.db.collection<PartnerPilotObservationDocument>("partner_pilot_observations").findOne({ organizationId: input.organizationId, publicId: input.observationId });
  if (!observation?._id) throw partnerApiError("resource_not_found", "Pilot observation not found", 404);
  if (observation.status === "resolved") throw partnerApiError("validation_failed", "Pilot observation is already resolved", 409);
  const now = input.now || new Date();
  await input.db.collection<PartnerPilotObservationDocument>("partner_pilot_observations").updateOne(
    { _id: observation._id, organizationId: input.organizationId },
    { $set: { status: "resolved", resolvedAt: now, resolvedBy: input.actor.userId, resolution: sanitizeLogText(input.resolution, 1000) } },
  );
  await appendPartnerAuditEntry(input.db, { actorType: "super_admin", actorId: input.actor.userId, action: "pilot.observation_resolved", organizationId: input.organizationId, targetPublicId: observation.publicId, metadata: { pilotId: pilot.publicId }, createdAt: now });
  return { ...safeObservation(observation), status: "resolved", resolvedAt: iso(now), resolution: sanitizeLogText(input.resolution, 1000) };
}

export async function buildPartnerPilotReport(input: { db: Db; pilot: PartnerPilotDocument; now?: Date }) {
  const now = input.now || new Date();
  const since = input.pilot.createdAt;
  const organizationId = input.pilot.organizationId;
  const [requests, shipments, uploads, deliveries, observations] = await Promise.all([
    input.db.collection("api_request_logs").find({ organizationId, createdAt: { $gte: since } }).toArray(),
    input.db.collection<Shipment>("shipments").find({ organizationId, createdAt: { $gte: since } } as Filter<Shipment>).toArray(),
    input.db.collection<PartnerUploadIntentDocument>("upload_intents").find({ organizationId, createdAt: { $gte: since } }).toArray(),
    input.db.collection<WebhookDeliveryDocument>("webhook_deliveries").find({ organizationId, environment: "live", createdAt: { $gte: since } }).toArray(),
    input.db.collection<PartnerPilotObservationDocument>("partner_pilot_observations").find({ organizationId }).sort({ createdAt: -1 }).toArray(),
  ]);
  const errors = requests.filter((item) => Number(item.responseStatus) >= 400).length;
  const serverErrors = requests.filter((item) => Number(item.responseStatus) >= 500).length;
  const succeededDeliveries = deliveries.filter((item) => item.status === "succeeded").length;
  const terminalDeliveries = deliveries.filter((item) => ["succeeded", "failed"].includes(item.status)).length;
  const webhookReliabilityPercent = terminalDeliveries ? Number(((succeededDeliveries / terminalDeliveries) * 100).toFixed(2)) : 0;
  const prohibitedIncidentCategories = new Set(["tenant_isolation", "duplicate_shipment", "private_file"]);
  const prohibitedIncidents = observations.filter((item) => item.kind === "incident" && prohibitedIncidentCategories.has(item.category));
  const openHighSeverity = observations.filter((item) => item.status === "open" && ["high", "critical"].includes(item.severity));
  const metrics = {
    generatedAt: now.toISOString(),
    requests: requests.length,
    errors,
    errorRatePercent: requests.length ? Number(((errors / requests.length) * 100).toFixed(2)) : 0,
    serverErrors,
    p95LatencyMs: p95(requests.map((item) => Number(item.durationMs) || 0)),
    testShipments: shipments.filter((item) => item.environment === "test").length,
    liveShipments: shipments.filter((item) => item.environment === "live").length,
    uploadIntents: uploads.length,
    uploadBytes: uploads.reduce((sum, item) => sum + (Number(item.declaredSize) || 0), 0),
    webhookDeliveries: deliveries.length,
    webhookReliabilityPercent,
    openObservations: observations.filter((item) => item.status === "open").length,
    openHighSeverity: openHighSeverity.length,
  };
  const blockers: string[] = [];
  if (input.pilot.status !== "live") blockers.push("Pilot is not in the live validation stage");
  if (!input.pilot.acceptance.productionWorkflowsCompleted) blockers.push("Production workflows are not accepted");
  if (!input.pilot.acceptance.supportProcessAccepted) blockers.push("Support process is not accepted");
  if (!input.pilot.acceptance.noIncidentsConfirmed) blockers.push("Incident-free operation has not been confirmed");
  if (!metrics.liveShipments) blockers.push("No live shipment workflow has completed");
  if (openHighSeverity.length) blockers.push("High or critical pilot observations remain open");
  if (prohibitedIncidents.length) blockers.push("A prohibited tenant, duplicate-shipment, or private-file incident is recorded");
  if (input.pilot.agreedWorkflows.includes("webhook_delivery") && (!terminalDeliveries || webhookReliabilityPercent < 99)) {
    blockers.push("Webhook reliability has not reached the 99% pilot target");
  }
  return { ...safePilot(input.pilot), metrics, blockers, readyToComplete: blockers.length === 0, observations: observations.map(safeObservation) };
}

export async function getPartnerPilotReports(db: Db, now?: Date) {
  const pilots = await db.collection<PartnerPilotDocument>("partner_pilots").find({}).sort({ updatedAt: -1 }).toArray();
  return Promise.all(pilots.map((pilot) => buildPartnerPilotReport({ db, pilot, now })));
}

export async function completePartnerPilot(input: { db: Db; organizationId: ObjectId; actor: PilotActor; now?: Date }) {
  const pilot = await requirePilot(input.db, input.organizationId);
  const report = await buildPartnerPilotReport({ db: input.db, pilot, now: input.now });
  if (!report.readyToComplete) {
    throw partnerApiError("pilot_not_ready", report.blockers[0] || "Pilot completion criteria are not met", 409);
  }
  const now = input.now || new Date();
  await input.db.collection<PartnerPilotDocument>("partner_pilots").updateOne({ _id: pilot._id }, { $set: { status: "completed", completedAt: now, completedBy: input.actor.userId, updatedAt: now } });
  await appendPartnerAuditEntry(input.db, { actorType: "super_admin", actorId: input.actor.userId, action: "pilot.completed", organizationId: input.organizationId, targetPublicId: pilot.publicId, metadata: { metrics: report.metrics }, createdAt: now });
  return { ...report, status: "completed", completedAt: iso(now), readyToComplete: true, blockers: [] };
}
