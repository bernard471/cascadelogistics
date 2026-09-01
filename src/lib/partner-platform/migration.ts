import type { Db, Document, WithId } from "mongodb";
import { ensurePartnerPlatformIndexes } from "./indexes.ts";
import { generatePublicId } from "./public-id.ts";

export interface Phase2MigrationReport {
  database: string;
  dryRun: boolean;
  startedAt: string;
  completedAt: string;
  before: {
    shipments: number;
    withPublicId: number;
    withEnvironment: number;
    withCreatedVia: number;
  };
  after: {
    shipments: number;
    withPublicId: number;
    withEnvironment: number;
    withCreatedVia: number;
  };
  planned: number;
  updated: number;
  unchanged: number;
  errors: Array<{ id: string; message: string }>;
  indexesEnsured: number;
  reconciled: boolean;
}

interface LegacyShipmentDocument extends Document {
  publicId?: string;
  createdVia?: "dashboard" | "admin" | "partner_api";
  environment?: "test" | "live";
  organizationId?: unknown;
  userId?: string;
  cascadeUserId?: string;
  trackingId?: string;
  timeline?: Array<{ status?: string }>;
}

export function assertPhase2TestDatabase(databaseName: string): void {
  const normalized = databaseName.trim().toLowerCase();
  const explicitlyNonProduction =
    normalized.startsWith("cascade_phase2_test_") ||
    normalized.endsWith("_test") ||
    normalized.endsWith("_sandbox") ||
    normalized.endsWith("_development") ||
    normalized.endsWith("_dev");

  if (!explicitlyNonProduction || normalized === "guangzhou") {
    throw new Error(
      "Phase 2 migration writes are restricted to an explicitly named test, sandbox, development, or dev database",
    );
  }
}

export function inferLegacyShipmentCreatedVia(
  shipment: LegacyShipmentDocument,
): "dashboard" | "admin" | "partner_api" {
  if (shipment.createdVia) return shipment.createdVia;
  if (shipment.organizationId) return "partner_api";

  const initialStatus = shipment.timeline?.[0]?.status?.trim().toLowerCase();
  if (
    initialStatus === "arrived at warehouse" ||
    initialStatus === "arrived at warehouse – pending proof" ||
    initialStatus === "arrived at warehouse - pending proof"
  ) {
    return "admin";
  }
  return "dashboard";
}

export function buildLegacyShipmentBackfill(
  shipment: LegacyShipmentDocument,
  publicId = generatePublicId("shipment"),
): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  const createdVia = inferLegacyShipmentCreatedVia(shipment);

  if (!shipment.publicId) update.publicId = publicId;
  if (!shipment.environment) update.environment = "live";
  if (!shipment.createdVia) update.createdVia = createdVia;
  if (!shipment.cascadeUserId && shipment.userId) {
    update.cascadeUserId = shipment.userId;
  }
  if (
    createdVia === "dashboard" &&
    shipment.userId &&
    !("createdByPrincipal" in shipment)
  ) {
    update.createdByPrincipal = { type: "user", id: shipment.userId };
  }

  return update;
}

async function countMigrationFields(db: Db) {
  const shipments = db.collection("shipments");
  const [total, withPublicId, withEnvironment, withCreatedVia] =
    await Promise.all([
      shipments.countDocuments({}),
      shipments.countDocuments({ publicId: { $type: "string" } }),
      shipments.countDocuments({ environment: { $in: ["test", "live"] } }),
      shipments.countDocuments({
        createdVia: { $in: ["dashboard", "admin", "partner_api"] },
      }),
    ]);

  return { shipments: total, withPublicId, withEnvironment, withCreatedVia };
}

export async function runPhase2Migration(input: {
  db: Db;
  databaseName: string;
  dryRun?: boolean;
  ensureIndexes?: boolean;
  now?: Date;
}): Promise<Phase2MigrationReport> {
  assertPhase2TestDatabase(input.databaseName);
  const dryRun = input.dryRun ?? true;
  const startedAt = (input.now || new Date()).toISOString();
  const before = await countMigrationFields(input.db);
  let indexesEnsured = 0;
  if (!dryRun && input.ensureIndexes !== false) {
    indexesEnsured = (await ensurePartnerPlatformIndexes(input.db)).length;
  }
  const shipments = input.db.collection<LegacyShipmentDocument>("shipments");
  const cursor = shipments.find({});
  let planned = 0;
  let updated = 0;
  let unchanged = 0;
  const errors: Array<{ id: string; message: string }> = [];

  for await (const shipment of cursor) {
    const update = buildLegacyShipmentBackfill(shipment);
    if (Object.keys(update).length === 0) {
      unchanged += 1;
      continue;
    }

    planned += 1;
    if (dryRun) continue;

    try {
      const result = await shipments.updateOne(
        { _id: (shipment as WithId<LegacyShipmentDocument>)._id },
        { $set: update },
      );
      updated += result.modifiedCount;
    } catch (error) {
      errors.push({
        id: String((shipment as WithId<LegacyShipmentDocument>)._id),
        message: error instanceof Error ? error.message : "Unknown migration error",
      });
    }
  }

  const after = await countMigrationFields(input.db);
  const reconciled = dryRun
    ? before.shipments === after.shipments && errors.length === 0
    : before.shipments === after.shipments &&
      after.shipments === after.withPublicId &&
      after.shipments === after.withEnvironment &&
      after.shipments === after.withCreatedVia &&
      errors.length === 0;

  return {
    database: input.databaseName,
    dryRun,
    startedAt,
    completedAt: new Date().toISOString(),
    before,
    after,
    planned,
    updated,
    unchanged,
    errors,
    indexesEnsured,
    reconciled,
  };
}

export async function verifyPhase2ShipmentLookups(db: Db): Promise<{
  checked: number;
  byId: number;
  byTrackingId: number;
  byPublicId: number;
  reconciled: boolean;
}> {
  const shipments = db.collection<LegacyShipmentDocument>("shipments");
  const samples = await shipments.find({}).limit(25).toArray();
  let byId = 0;
  let byTrackingId = 0;
  let byPublicId = 0;

  for (const shipment of samples) {
    if (await shipments.findOne({ _id: shipment._id })) byId += 1;
    if (
      shipment.trackingId &&
      (await shipments.findOne({ trackingId: shipment.trackingId }))
    ) {
      byTrackingId += 1;
    }
    if (
      shipment.publicId &&
      (await shipments.findOne({ publicId: shipment.publicId }))
    ) {
      byPublicId += 1;
    }
  }

  return {
    checked: samples.length,
    byId,
    byTrackingId,
    byPublicId,
    reconciled:
      byId === samples.length &&
      byTrackingId === samples.length &&
      byPublicId === samples.length,
  };
}
