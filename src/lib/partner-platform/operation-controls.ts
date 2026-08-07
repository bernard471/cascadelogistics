import { ObjectId, type Db } from "mongodb";
import type {
  InternalShipmentPrincipal,
  PartnerShipmentPrincipal,
} from "../shipments/principals.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import { partnerApiError } from "./errors.ts";
import type { PartnerApiScope } from "./scopes.ts";
import type { PartnerEnvironment } from "./types.ts";

export type PartnerOperationName = "*" | "api_access" | PartnerApiScope;
export type PartnerOperationScope = "global" | "organization" | "application";

interface PartnerOperationControlDocument {
  operation: PartnerOperationName;
  scopeType: PartnerOperationScope;
  organizationId?: ObjectId;
  apiClientId?: ObjectId;
  environment?: PartnerEnvironment;
  pausedUntil: Date | null;
  reason: string | null;
  publicMessage: string | null;
  updatedAt: Date;
  updatedBy: string;
}

export interface PartnerOperationBlock {
  operation: PartnerOperationName;
  scopeType: PartnerOperationScope;
  pausedUntil: Date;
  message: string;
}

function controlMatchesPrincipal(
  control: PartnerOperationControlDocument,
  principal: PartnerShipmentPrincipal,
): boolean {
  if (control.environment && control.environment !== principal.environment) {
    return false;
  }
  if (control.scopeType === "global") return true;
  if (
    !control.organizationId ||
    control.organizationId.toString() !== principal.organizationId
  ) {
    return false;
  }
  if (control.scopeType === "organization") return true;
  return (
    Boolean(control.apiClientId) &&
    control.apiClientId?.toString() === principal.apiClientId
  );
}

export async function getPartnerOperationBlock(input: {
  db: Db;
  principal: PartnerShipmentPrincipal;
  operation: PartnerOperationName;
  now?: Date;
}): Promise<PartnerOperationBlock | null> {
  const now = input.now || new Date();
  const controls = await input.db
    .collection<PartnerOperationControlDocument>("partner_operation_controls")
    .find({
      operation: { $in: [input.operation, "*"] },
      pausedUntil: { $gt: now },
    })
    .toArray();
  const priority: Record<PartnerOperationScope, number> = {
    application: 3,
    organization: 2,
    global: 1,
  };
  const matched = controls
    .filter((control) => controlMatchesPrincipal(control, input.principal))
    .sort((left, right) => priority[right.scopeType] - priority[left.scopeType])[0];
  if (!matched?.pausedUntil) return null;

  return {
    operation: matched.operation,
    scopeType: matched.scopeType,
    pausedUntil: matched.pausedUntil,
    message: matched.publicMessage || "This API operation is temporarily paused",
  };
}

export async function setPartnerOperationControl(input: {
  db: Db;
  principal: InternalShipmentPrincipal;
  operation: PartnerOperationName;
  scopeType: PartnerOperationScope;
  organizationId?: string;
  apiClientId?: string;
  environment?: PartnerEnvironment;
  pausedUntil: Date | null;
  reason?: string;
  publicMessage?: string;
  now?: Date;
}): Promise<void> {
  if (input.principal.role !== "super_admin") {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
  if (input.organizationId && !ObjectId.isValid(input.organizationId)) {
    throw partnerApiError("validation_failed", "Invalid organization ID", 422);
  }
  if (input.apiClientId && !ObjectId.isValid(input.apiClientId)) {
    throw partnerApiError("validation_failed", "Invalid application ID", 422);
  }
  const organizationId = input.organizationId
    ? new ObjectId(input.organizationId)
    : undefined;
  const apiClientId = input.apiClientId
    ? new ObjectId(input.apiClientId)
    : undefined;
  if (input.scopeType !== "global" && !organizationId) {
    throw partnerApiError("validation_failed", "Organization is required", 422);
  }
  if (input.scopeType === "application" && !apiClientId) {
    throw partnerApiError("validation_failed", "Application is required", 422);
  }
  const now = input.now || new Date();
  if (input.pausedUntil && input.pausedUntil.getTime() <= now.getTime()) {
    throw partnerApiError(
      "validation_failed",
      "Pause end time must be in the future",
      422,
    );
  }
  const identity = {
    operation: input.operation,
    scopeType: input.scopeType,
    ...(organizationId ? { organizationId } : {}),
    ...(apiClientId ? { apiClientId } : {}),
    ...(input.environment ? { environment: input.environment } : {}),
  };
  await input.db
    .collection<PartnerOperationControlDocument>("partner_operation_controls")
    .updateOne(
      identity,
      {
        $set: {
          pausedUntil: input.pausedUntil,
          reason: input.pausedUntil ? input.reason?.trim().slice(0, 250) || null : null,
          publicMessage: input.pausedUntil
            ? input.publicMessage?.trim().slice(0, 250) || null
            : null,
          updatedAt: now,
          updatedBy: input.principal.userId,
        },
      },
      { upsert: true },
    );
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin",
    actorId: input.principal.userId,
    action: input.pausedUntil
      ? "partner_operation_paused"
      : "partner_operation_resumed",
    organizationId,
    apiClientId,
    metadata: {
      operation: input.operation,
      scopeType: input.scopeType,
      environment: input.environment,
      pausedUntil: input.pausedUntil?.toISOString(),
      reason: input.reason,
    },
    createdAt: now,
  });
}
