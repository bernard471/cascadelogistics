import { ObjectId, type Db, type Filter } from "mongodb";
import { generatePublicId } from "./public-id.ts";
import {
  apiClientCreateSchema,
  apiCredentialCreateSchema,
  organizationCreateSchema,
  partnerCustomerUpsertSchema,
  type ApiClientCreateInput,
  type ApiCredentialCreateInput,
  type OrganizationCreateInput,
  type PartnerCustomerUpsertInput,
} from "./schemas.ts";
import type {
  ApiClientDocument,
  ApiCredentialDocument,
  OrganizationDocument,
  PartnerCustomerDocument,
} from "./types.ts";

export class PartnerRepositoryError extends Error {
  readonly code: "invalid_id" | "not_found" | "environment_denied";

  constructor(
    message: string,
    code: "invalid_id" | "not_found" | "environment_denied",
  ) {
    super(message);
    this.name = "PartnerRepositoryError";
    this.code = code;
  }
}

export function toOrganizationObjectId(value: string | ObjectId): ObjectId {
  if (value instanceof ObjectId) return value;
  if (!ObjectId.isValid(value)) {
    throw new PartnerRepositoryError("Invalid organization ID", "invalid_id");
  }
  return new ObjectId(value);
}

export async function createOrganization(
  db: Db,
  input: OrganizationCreateInput,
  now = new Date(),
): Promise<OrganizationDocument> {
  const parsed = organizationCreateSchema.parse(input);
  const organization: OrganizationDocument = {
    ...parsed,
    publicId: generatePublicId("organization"),
    createdAt: now,
    updatedAt: now,
  };
  const result = await db
    .collection<OrganizationDocument>("organizations")
    .insertOne(organization);
  return { ...organization, _id: result.insertedId };
}

export async function getOrganizationByPublicId(
  db: Db,
  publicId: string,
): Promise<OrganizationDocument | null> {
  return db
    .collection<OrganizationDocument>("organizations")
    .findOne({ publicId });
}

export async function createApiClient(
  db: Db,
  organizationId: string | ObjectId,
  input: ApiClientCreateInput,
  now = new Date(),
): Promise<ApiClientDocument> {
  const parsed = apiClientCreateSchema.parse(input);
  const scopedOrganizationId = toOrganizationObjectId(organizationId);
  const organization = await db
    .collection<OrganizationDocument>("organizations")
    .findOne({ _id: scopedOrganizationId });
  if (!organization) {
    throw new PartnerRepositoryError("Organization not found", "not_found");
  }
  const client: ApiClientDocument = {
    ...parsed,
    organizationId: scopedOrganizationId,
    publicId: generatePublicId("apiClient"),
    createdAt: now,
    updatedAt: now,
  };
  const result = await db
    .collection<ApiClientDocument>("api_clients")
    .insertOne(client);
  return { ...client, _id: result.insertedId };
}

export async function getApiClientByPublicIdForOrganization(
  db: Db,
  organizationId: string | ObjectId,
  publicId: string,
): Promise<ApiClientDocument | null> {
  return db.collection<ApiClientDocument>("api_clients").findOne({
    organizationId: toOrganizationObjectId(organizationId),
    publicId,
  });
}

export async function createApiCredential(
  db: Db,
  organizationId: string | ObjectId,
  apiClientId: string | ObjectId,
  input: ApiCredentialCreateInput,
  now = new Date(),
): Promise<ApiCredentialDocument> {
  const parsed = apiCredentialCreateSchema.parse(input);
  const scopedOrganizationId = toOrganizationObjectId(organizationId);
  const scopedApiClientId = toOrganizationObjectId(apiClientId);
  const apiClient = await db.collection<ApiClientDocument>("api_clients").findOne({
    _id: scopedApiClientId,
    organizationId: scopedOrganizationId,
  });

  if (!apiClient) {
    throw new PartnerRepositoryError("API application not found", "not_found");
  }
  if (!apiClient.environmentAccess.includes(parsed.environment)) {
    throw new PartnerRepositoryError(
      "API application is not enabled for this environment",
      "environment_denied",
    );
  }

  const credential: ApiCredentialDocument = {
    ...parsed,
    organizationId: scopedOrganizationId,
    apiClientId: scopedApiClientId,
    publicId: generatePublicId("apiCredential"),
    status: "active",
    createdAt: now,
  };
  const result = await db
    .collection<ApiCredentialDocument>("api_credentials")
    .insertOne(credential);
  return { ...credential, _id: result.insertedId };
}

export async function getApiCredentialByPrefix(
  db: Db,
  keyPrefix: string,
): Promise<ApiCredentialDocument | null> {
  return db
    .collection<ApiCredentialDocument>("api_credentials")
    .findOne({ keyPrefix });
}

export async function upsertPartnerCustomer(
  db: Db,
  organizationId: string | ObjectId,
  input: PartnerCustomerUpsertInput,
  now = new Date(),
): Promise<PartnerCustomerDocument> {
  const parsed = partnerCustomerUpsertSchema.parse(input);
  const scopedOrganizationId = toOrganizationObjectId(organizationId);
  const organization = await db
    .collection<OrganizationDocument>("organizations")
    .findOne({ _id: scopedOrganizationId });
  if (!organization) {
    throw new PartnerRepositoryError("Organization not found", "not_found");
  }
  const filter: Filter<PartnerCustomerDocument> = {
    organizationId: scopedOrganizationId,
    externalCustomerId: parsed.externalCustomerId,
  };
  const collection = db.collection<PartnerCustomerDocument>("partner_customers");
  const existing = await collection.findOne(filter);

  if (existing) {
    await collection.updateOne(filter, {
      $set: {
        ...(parsed.cascadeUserId !== undefined
          ? { cascadeUserId: parsed.cascadeUserId }
          : {}),
        ...(parsed.profile !== undefined ? { profile: parsed.profile } : {}),
        updatedAt: now,
      },
    });
    return {
      ...existing,
      ...(parsed.cascadeUserId !== undefined
        ? { cascadeUserId: parsed.cascadeUserId }
        : {}),
      ...(parsed.profile !== undefined ? { profile: parsed.profile } : {}),
      updatedAt: now,
    };
  }

  const customer: PartnerCustomerDocument = {
    ...parsed,
    organizationId: scopedOrganizationId,
    publicId: generatePublicId("partnerCustomer"),
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(customer);
  return { ...customer, _id: result.insertedId };
}

export async function getPartnerCustomerForOrganization(
  db: Db,
  organizationId: string | ObjectId,
  publicId: string,
): Promise<PartnerCustomerDocument | null> {
  return db.collection<PartnerCustomerDocument>("partner_customers").findOne({
    organizationId: toOrganizationObjectId(organizationId),
    publicId,
  });
}
