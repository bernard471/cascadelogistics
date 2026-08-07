import type { ObjectId } from "mongodb";

export const partnerEnvironments = ["test", "live"] as const;
export type PartnerEnvironment = (typeof partnerEnvironments)[number];

export const organizationStatuses = [
  "pending",
  "active",
  "suspended",
  "archived",
] as const;
export type OrganizationStatus = (typeof organizationStatuses)[number];

export interface PartnerContact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface OrganizationDocument {
  _id?: ObjectId;
  publicId: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  contacts: {
    technical?: PartnerContact;
    operational?: PartnerContact;
    billing?: PartnerContact;
  };
  settings: {
    customerEmailMode: "partner" | "cascade" | "none";
    defaultWebhookVersion: "1";
    shipmentVisibility: "organization" | "creating_client";
  };
  limits: {
    requestsPerMinute: number;
    shipmentsPerDay: number;
    uploadBytesPerDay: number;
  };
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export const partnerPilotWorkflows = [
  "shipment_creation",
  "multiple_file_upload",
  "shipment_tracking",
  "invoice_download",
  "payment_proof",
  "webhook_delivery",
] as const;
export type PartnerPilotWorkflow = (typeof partnerPilotWorkflows)[number];

export type PartnerPilotStatus =
  | "sandbox"
  | "sandbox_accepted"
  | "live_approved"
  | "live"
  | "completed"
  | "cancelled";

export interface PartnerPilotDocument {
  _id?: ObjectId;
  publicId: string;
  organizationId: ObjectId;
  status: PartnerPilotStatus;
  agreedWorkflows: PartnerPilotWorkflow[];
  expectedVolume: {
    requestsPerDay: number;
    shipmentsPerDay: number;
    uploadBytesPerDay: number;
  };
  pilotQuota: {
    requestsPerMinute: number;
    shipmentsPerDay: number;
    uploadBytesPerDay: number;
  };
  supportContactEmail: string;
  securityReview?: {
    decision: "approved" | "rejected";
    keyStorageApproach:
      | "managed_secret_store"
      | "encrypted_server_environment"
      | "other_approved";
    rotationOwner: string;
    notes?: string;
    reviewedAt: Date;
    reviewedBy: string;
  };
  sandboxAcceptedAt?: Date;
  sandboxAcceptedBy?: string;
  sandboxNotes?: string;
  liveApprovedAt?: Date;
  liveApprovedBy?: string;
  liveApprovalNotes?: string;
  liveStartedAt?: Date;
  acceptance: {
    productionWorkflowsCompleted: boolean;
    supportProcessAccepted: boolean;
    noIncidentsConfirmed: boolean;
  };
  completedAt?: Date;
  completedBy?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface PartnerPilotObservationDocument {
  _id?: ObjectId;
  publicId: string;
  pilotId: ObjectId;
  organizationId: ObjectId;
  kind: "feedback" | "support" | "defect" | "incident";
  category:
    | "documentation"
    | "portal"
    | "api"
    | "uploads"
    | "webhooks"
    | "support"
    | "duplicate_shipment"
    | "tenant_isolation"
    | "private_file";
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  details?: string;
  status: "open" | "resolved";
  createdAt: Date;
  createdBy: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface PartnerUserDocument {
  _id?: ObjectId;
  publicId: string;
  organizationId: ObjectId;
  email: string;
  emailNormalized: string;
  name: string;
  role: "owner" | "developer" | "operations_viewer" | "read_only";
  status: "invited" | "active" | "suspended";
  passwordHash?: string;
  mustChangePassword?: boolean;
  invitedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiClientDocument {
  _id?: ObjectId;
  publicId: string;
  organizationId: ObjectId;
  name: string;
  description?: string;
  status: "active" | "suspended" | "archived";
  environmentAccess: PartnerEnvironment[];
  scopes: string[];
  requestsPerMinute?: number;
  allowedIpRanges?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiCredentialDocument {
  _id?: ObjectId;
  publicId: string;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  keyPrefix: string;
  secretHash: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  createdAt: Date;
  createdBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
}

export interface PartnerCustomerDocument {
  _id?: ObjectId;
  publicId: string;
  organizationId: ObjectId;
  externalCustomerId: string;
  cascadeUserId?: string;
  profile?: PartnerContact;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentTenantMetadata {
  publicId?: string;
  createdVia?: "dashboard" | "admin" | "partner_api";
  environment?: PartnerEnvironment;
  organizationId?: ObjectId;
  apiClientId?: ObjectId;
  externalCustomerId?: string;
  externalReference?: string;
  declaredCurrency?: string;
  cascadeUserId?: string;
  idempotencyRecordId?: ObjectId;
  createdByPrincipal?: {
    type: "user" | "admin" | "staff" | "api_client";
    id: string;
  };
  apiVersion?: "v1";
}

export interface EncryptedWebhookSecret {
  version: "1";
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface WebhookEndpointDocument {
  _id?: ObjectId;
  publicId: string;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  url: string;
  description?: string;
  subscribedEvents: string[];
  status: "active" | "disabled" | "deleted";
  secretPrefix: string;
  encryptedSecret: EncryptedWebhookSecret;
  createdByCredentialId: string;
  createdAt: Date;
  updatedAt: Date;
  rotatedAt?: Date;
  deletedAt?: Date;
}

export interface DomainEventDocument {
  _id?: ObjectId;
  publicId: string;
  schemaVersion: "1";
  type: string;
  aggregateType: string;
  aggregatePublicId: string;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  actor: { type: string; id: string };
  payload: Record<string, unknown>;
  status: "pending" | "dispatching" | "dispatched" | "completed" | "completed_with_failures";
  attemptCount: number;
  occurredAt: Date;
  createdAt: Date;
  nextAttemptAt: Date;
  targetEndpointId?: ObjectId;
  dispatchStartedAt?: Date;
  dispatchedAt?: Date;
  completedAt?: Date;
}

export interface WebhookDeliveryDocument {
  _id?: ObjectId;
  publicId: string;
  eventId: ObjectId;
  eventPublicId: string;
  endpointId: ObjectId;
  endpointPublicId: string;
  organizationId: ObjectId;
  apiClientId: ObjectId;
  environment: PartnerEnvironment;
  status: "pending" | "processing" | "retrying" | "succeeded" | "failed";
  attemptCount: number;
  nextAttemptAt: Date;
  leaseExpiresAt?: Date;
  lastStatusCode?: number;
  lastErrorCode?: string;
  lastDurationMs?: number;
  replayCount: number;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  failedAt?: Date;
}
