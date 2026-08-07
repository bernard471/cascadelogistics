import type { Db } from "mongodb";

const day = 24 * 60 * 60 * 1000;
export const partnerRetentionDays = { requestLogs: 90, webhookAttempts: 90, terminalDeliveries: 90, terminalEvents: 90, privilegedAudit: 365 } as const;

export async function cleanupPartnerOperationalData(db: Db, now = new Date()) {
  const before = (days: number) => new Date(now.getTime() - days * day);
  const [requestLogs, attempts, deliveries, events, audits] = await Promise.all([
    db.collection("api_request_logs").deleteMany({ createdAt: { $lt: before(partnerRetentionDays.requestLogs) } }),
    db.collection("webhook_delivery_attempts").deleteMany({ completedAt: { $lt: before(partnerRetentionDays.webhookAttempts) } }),
    db.collection("webhook_deliveries").deleteMany({ status: { $in: ["succeeded", "failed"] }, updatedAt: { $lt: before(partnerRetentionDays.terminalDeliveries) } }),
    db.collection("domain_events").deleteMany({ status: { $in: ["completed", "completed_with_failures"] }, createdAt: { $lt: before(partnerRetentionDays.terminalEvents) } }),
    db.collection("partner_audit_logs").deleteMany({ createdAt: { $lt: before(partnerRetentionDays.privilegedAudit) } }),
  ]);
  return { requestLogs: requestLogs.deletedCount, webhookAttempts: attempts.deletedCount, terminalDeliveries: deliveries.deletedCount, terminalEvents: events.deletedCount, privilegedAudit: audits.deletedCount };
}
