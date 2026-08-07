import bcrypt from "bcryptjs";
import { ObjectId, type Db } from "mongodb";
import { partnerApiError } from "./errors.ts";
import { generatePublicId } from "./public-id.ts";
import { verifyPartnerPortalSessionToken } from "./portal-session.ts";
import type { OrganizationDocument, PartnerUserDocument } from "./types.ts";

export type PartnerPortalRole = PartnerUserDocument["role"];
export interface PartnerPortalPrincipal {
  kind: "partner_portal";
  userId: string; userPublicId: string; organizationId: string; organizationPublicId: string;
  role: PartnerPortalRole; name: string; email: string; mustChangePassword: boolean;
}

function toPrincipal(user: PartnerUserDocument & { _id: ObjectId }, organization: OrganizationDocument & { _id: ObjectId }): PartnerPortalPrincipal {
  return { kind: "partner_portal", userId: user._id.toString(), userPublicId: user.publicId,
    organizationId: organization._id.toString(), organizationPublicId: organization.publicId,
    role: user.role, name: user.name, email: user.email, mustChangePassword: Boolean(user.mustChangePassword) };
}

export async function authenticatePartnerPortalCredentials(input: { db: Db; organizationSlug: string; email: string; password: string }) {
  const organization = await input.db.collection<OrganizationDocument>("organizations").findOne({ slug: input.organizationSlug.trim().toLowerCase() });
  const user = organization?._id ? await input.db.collection<PartnerUserDocument>("partner_users").findOne({ organizationId: organization._id, emailNormalized: input.email.trim().toLowerCase() }) : null;
  const valid = await bcrypt.compare(input.password, user?.passwordHash || "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv").catch(() => false);
  if (!organization?._id || !user?._id || !valid) throw partnerApiError("authentication_required", "Invalid partner login", 401);
  if (organization.status !== "active" || user.status !== "active") throw partnerApiError("integration_suspended", "This partner account is not active", 403);
  return toPrincipal(user as PartnerUserDocument & { _id: ObjectId }, organization as OrganizationDocument & { _id: ObjectId });
}

export async function resolvePartnerPortalSession(input: { db: Db; token: string; secret?: string; now?: Date }) {
  const payload = verifyPartnerPortalSessionToken(input);
  if (!payload || !ObjectId.isValid(payload.userId) || !ObjectId.isValid(payload.organizationId)) throw partnerApiError("authentication_required", "Partner login required", 401);
  const organizationId = new ObjectId(payload.organizationId);
  const [organization, user] = await Promise.all([
    input.db.collection<OrganizationDocument>("organizations").findOne({ _id: organizationId }),
    input.db.collection<PartnerUserDocument>("partner_users").findOne({ _id: new ObjectId(payload.userId), organizationId }),
  ]);
  if (!organization?._id || !user?._id) throw partnerApiError("authentication_required", "Partner login required", 401);
  if (organization.status !== "active" || user.status !== "active") throw partnerApiError("integration_suspended", "This partner account is not active", 403);
  return toPrincipal(user as PartnerUserDocument & { _id: ObjectId }, organization as OrganizationDocument & { _id: ObjectId });
}

export async function createPartnerPortalUser(input: { db: Db; organizationId: ObjectId; email: string; name: string; role: PartnerPortalRole; password: string; status?: PartnerUserDocument["status"]; now?: Date }) {
  const now = input.now || new Date();
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 12 || input.password.length > 128) throw partnerApiError("validation_failed", "Password must contain 12 to 128 characters", 422);
  const document: PartnerUserDocument = { publicId: generatePublicId("partnerUser"), organizationId: input.organizationId,
    email, emailNormalized: email, name: input.name.trim(), role: input.role, status: input.status || "active",
    passwordHash: await bcrypt.hash(input.password, 12), mustChangePassword: true, createdAt: now, updatedAt: now };
  try {
    const result = await input.db.collection<PartnerUserDocument>("partner_users").insertOne(document);
    return { ...document, _id: result.insertedId };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw partnerApiError("validation_failed", "A member with this email already exists", 409);
    throw error;
  }
}
