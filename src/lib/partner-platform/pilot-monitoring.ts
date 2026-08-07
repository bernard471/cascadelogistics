import type { Db } from "mongodb";
import { getPartnerPilotReports } from "./pilot.ts";
import type { OrganizationDocument } from "./types.ts";

export interface PartnerPilotAlert {
  code: "pilot_api_error_rate" | "pilot_api_latency" | "pilot_webhook_reliability" | "pilot_open_severity";
  severity: "warning" | "critical";
  value: number;
  threshold: number;
}

export function evaluatePartnerPilotMetrics(metrics: {
  requests: number;
  serverErrors: number;
  errorRatePercent: number;
  p95LatencyMs: number;
  webhookDeliveries: number;
  webhookReliabilityPercent: number;
  openHighSeverity: number;
}): PartnerPilotAlert[] {
  const alerts: PartnerPilotAlert[] = [];
  if (metrics.requests >= 20 && metrics.serverErrors > 0 && metrics.errorRatePercent >= 5) {
    alerts.push({ code: "pilot_api_error_rate", severity: "critical", value: metrics.errorRatePercent, threshold: 5 });
  }
  if (metrics.requests >= 20 && metrics.p95LatencyMs >= 1500) {
    alerts.push({ code: "pilot_api_latency", severity: "warning", value: metrics.p95LatencyMs, threshold: 1500 });
  }
  if (metrics.webhookDeliveries > 0 && metrics.webhookReliabilityPercent < 99) {
    alerts.push({ code: "pilot_webhook_reliability", severity: "warning", value: metrics.webhookReliabilityPercent, threshold: 99 });
  }
  if (metrics.openHighSeverity > 0) {
    alerts.push({ code: "pilot_open_severity", severity: "critical", value: metrics.openHighSeverity, threshold: 0 });
  }
  return alerts;
}

export async function getPartnerPilotMonitoringSnapshot(db: Db, now = new Date()) {
  const [reports, organizations] = await Promise.all([
    getPartnerPilotReports(db, now),
    db.collection<OrganizationDocument>("organizations").find({}).toArray(),
  ]);
  const organizationById = new Map(organizations.flatMap((item) => item._id ? [[item._id.toString(), item] as const] : []));
  const pilots = reports
    .filter((item) => item.status !== "completed" && item.status !== "cancelled")
    .map((item) => ({
      pilotId: item.id,
      organizationId: organizationById.get(item.organizationId.toString())?.publicId,
      organizationName: organizationById.get(item.organizationId.toString())?.name,
      status: item.status,
      metrics: item.metrics,
      alerts: evaluatePartnerPilotMetrics(item.metrics),
    }));
  return {
    generatedAt: now.toISOString(),
    activePilots: pilots.length,
    alertCount: pilots.reduce((sum, item) => sum + item.alerts.length, 0),
    pilots,
  };
}
