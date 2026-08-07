import { ObjectId, type Db } from "mongodb";
import type { InternalShipmentPrincipal } from "../shipments/principals.ts";
import { appendPartnerAuditEntry } from "./audit.ts";
import { partnerApiError } from "./errors.ts";
import { normalizePartnerScopes } from "./scopes.ts";
import type {
  ApiClientDocument,
  OrganizationDocument,
  OrganizationStatus,
} from "./types.ts";

function requireSuperAdmin(principal: InternalShipmentPrincipal): void {
  if (principal.role !== "super_admin") {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
}

function objectId(value: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw partnerApiError("validation_failed", "Invalid resource ID", 422);
  }
  return new ObjectId(value);
}

export async function setPartnerOrganizationStatus(input: {
  db: Db;
  principal: InternalShipmentPrincipal;
  organizationId: string;
  status: OrganizationStatus;
  now?: Date;
}): Promise<void> {
  requireSuperAdmin(input.principal);
  const organizationId = objectId(input.organizationId);
  const now = input.now || new Date();
  const result = await input.db
    .collection<OrganizationDocument>("organizations")
    .updateOne(
      { _id: organizationId },
      {
        $set: {
          status: input.status,
          updatedAt: now,
          ...(input.status === "active"
            ? { approvedAt: now, approvedBy: input.principal.userId }
            : {}),
        },
      },
    );
  if (result.matchedCount === 0) {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin",
    actorId: input.principal.userId,
    action: "partner_organization_status_changed",
    organizationId,
    metadata: { status: input.status },
    createdAt: now,
  });
}

export async function updatePartnerApplicationAccess(input: {
  db: Db;
  principal: InternalShipmentPrincipal;
  organizationId: string;
  apiClientId: string;
  status?: ApiClientDocument["status"];
  scopes?: readonly string[];
  requestsPerMinute?: number;
  now?: Date;
}): Promise<void> {
  requireSuperAdmin(input.principal);
  const organizationId = objectId(input.organizationId);
  const apiClientId = objectId(input.apiClientId);
  const scopes = input.scopes ? normalizePartnerScopes(input.scopes) : undefined;
  if (input.scopes && scopes?.length !== new Set(input.scopes).size) {
    throw partnerApiError("validation_failed", "Invalid API scope", 422);
  }
  if (
    input.requestsPerMinute !== undefined &&
    (!Number.isInteger(input.requestsPerMinute) ||
      input.requestsPerMinute < 1 ||
      input.requestsPerMinute > 10000)
  ) {
    throw partnerApiError("validation_failed", "Invalid request limit", 422);
  }
  const now = input.now || new Date();
  const changes = {
    ...(input.status ? { status: input.status } : {}),
    ...(scopes ? { scopes } : {}),
    ...(input.requestsPerMinute !== undefined
      ? { requestsPerMinute: input.requestsPerMinute }
      : {}),
    updatedAt: now,
  };
  const result = await input.db.collection<ApiClientDocument>("api_clients").updateOne(
    { _id: apiClientId, organizationId },
    { $set: changes },
  );
  if (result.matchedCount === 0) {
    throw partnerApiError("resource_not_found", "Resource not found", 404);
  }
  await appendPartnerAuditEntry(input.db, {
    actorType: "super_admin",
    actorId: input.principal.userId,
    action: "partner_application_access_changed",
    organizationId,
    apiClientId,
    metadata: {
      status: input.status,
      scopes,
      requestsPerMinute: input.requestsPerMinute,
    },
    createdAt: now,
  });
}
