import type { Db } from "mongodb";

export const partnerAlertThresholds = {
  windowMinutes: 15,
  minimumRequestsForErrorRate: 20,
  apiErrorRatePercent: 5,
  authenticationFailures: 30,
  p95LatencyMs: 1500,
  webhookBacklog: 100,
  webhookOldestMinutes: 15,
  workerStaleMinutes: 10,
} as const;

export interface PartnerOperationalHealth {
  generatedAt: string;
  windowMinutes: number;
  requests: number;
  serverErrors: number;
  errorRatePercent: number;
  authenticationFailures: number;
  p95LatencyMs: number;
  webhookBacklog: number;
  oldestWebhookMinutes: number;
  pendingEvents: number;
  workerLastSucceededAt?: string;
}

export function evaluatePartnerAlerts(health: PartnerOperationalHealth) {
  const alerts: Array<{ code: string; severity: "warning" | "critical"; value: number; threshold: number }> = [];
  if (health.requests >= partnerAlertThresholds.minimumRequestsForErrorRate && health.errorRatePercent >= partnerAlertThresholds.apiErrorRatePercent) alerts.push({ code: "api_error_rate", severity: "critical", value: health.errorRatePercent, threshold: partnerAlertThresholds.apiErrorRatePercent });
  if (health.authenticationFailures >= partnerAlertThresholds.authenticationFailures) alerts.push({ code: "authentication_failures", severity: "warning", value: health.authenticationFailures, threshold: partnerAlertThresholds.authenticationFailures });
  if (health.p95LatencyMs >= partnerAlertThresholds.p95LatencyMs) alerts.push({ code: "api_p95_latency", severity: "warning", value: health.p95LatencyMs, threshold: partnerAlertThresholds.p95LatencyMs });
  if (health.webhookBacklog >= partnerAlertThresholds.webhookBacklog) alerts.push({ code: "webhook_backlog", severity: "critical", value: health.webhookBacklog, threshold: partnerAlertThresholds.webhookBacklog });
  if (health.oldestWebhookMinutes >= partnerAlertThresholds.webhookOldestMinutes) alerts.push({ code: "webhook_oldest", severity: "critical", value: health.oldestWebhookMinutes, threshold: partnerAlertThresholds.webhookOldestMinutes });
  const workerAge = health.workerLastSucceededAt ? (new Date(health.generatedAt).getTime() - new Date(health.workerLastSucceededAt).getTime()) / 60_000 : Number.POSITIVE_INFINITY;
  if (workerAge >= partnerAlertThresholds.workerStaleMinutes) alerts.push({ code: "webhook_worker_stale", severity: "critical", value: Math.round(workerAge), threshold: partnerAlertThresholds.workerStaleMinutes });
  return alerts;
}

export async function getPartnerOperationalHealth(db: Db, now = new Date()): Promise<PartnerOperationalHealth & { alerts: ReturnType<typeof evaluatePartnerAlerts> }> {
  const since = new Date(now.getTime() - partnerAlertThresholds.windowMinutes * 60_000);
  const [logs, backlog, oldest, pendingEvents, heartbeat] = await Promise.all([
    db.collection("api_request_logs").find({ createdAt: { $gte: since } }).toArray(),
    db.collection("webhook_deliveries").countDocuments({ status: { $in: ["pending", "retrying"] } }),
    db.collection("webhook_deliveries").find({ status: { $in: ["pending", "retrying"] } }).sort({ createdAt: 1 }).limit(1).toArray(),
    db.collection("domain_events").countDocuments({ status: { $in: ["pending", "dispatching", "dispatched"] } }),
    db.collection("partner_worker_heartbeats").findOne({ worker: "webhook-delivery" }),
  ]);
  const durations = logs.map((item) => Number(item.durationMs) || 0).sort((a, b) => a - b);
  const serverErrors = logs.filter((item) => Number(item.responseStatus) >= 500).length;
  const authenticationFailures = logs.filter((item) => ["authentication_required", "invalid_api_key"].includes(String(item.errorCode))).length;
  const health: PartnerOperationalHealth = {
    generatedAt: now.toISOString(), windowMinutes: partnerAlertThresholds.windowMinutes,
    requests: logs.length, serverErrors, errorRatePercent: logs.length ? Number(((serverErrors / logs.length) * 100).toFixed(2)) : 0,
    authenticationFailures, p95LatencyMs: durations.length ? durations[Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1)] : 0,
    webhookBacklog: backlog,
    oldestWebhookMinutes: oldest[0]?.createdAt ? Math.max(0, Math.floor((now.getTime() - new Date(oldest[0].createdAt).getTime()) / 60_000)) : 0,
    pendingEvents, workerLastSucceededAt: heartbeat?.lastSucceededAt ? new Date(heartbeat.lastSucceededAt).toISOString() : undefined,
  };
  return { ...health, alerts: evaluatePartnerAlerts(health) };
}
