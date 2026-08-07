import type { Db, ObjectId } from "mongodb";
import { redactSensitiveData } from "./redaction.ts";

export interface PartnerAuditEntryInput {
  actorType: "super_admin" | "partner_user" | "api_client" | "system";
  actorId: string;
  action: string;
  organizationId?: ObjectId;
  apiClientId?: ObjectId;
  credentialId?: ObjectId;
  targetPublicId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export async function appendPartnerAuditEntry(
  db: Db,
  input: PartnerAuditEntryInput,
): Promise<void> {
  await db.collection("partner_audit_logs").insertOne({
    actorType: input.actorType,
    actorId: input.actorId,
    action: input.action,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    ...(input.apiClientId ? { apiClientId: input.apiClientId } : {}),
    ...(input.credentialId ? { credentialId: input.credentialId } : {}),
    ...(input.targetPublicId ? { targetPublicId: input.targetPublicId } : {}),
    ...(input.metadata
      ? { metadata: redactSensitiveData(input.metadata) }
      : {}),
    createdAt: input.createdAt || new Date(),
  });
}
