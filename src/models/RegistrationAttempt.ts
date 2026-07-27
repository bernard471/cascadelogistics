import type { ObjectId } from "mongodb";
import type { IdentityFileKind } from "@/models/IdentityVerification";

export interface RegistrationAttemptUpload {
  pathname: string;
  url: string;
  contentType: string;
  size?: number;
  uploadedAt: Date;
}

export interface RegistrationAttempt {
  _id?: ObjectId;
  tokenHash: string;
  emailNormalized: string;
  usernameNormalized: string;
  uploads: Partial<Record<IdentityFileKind, RegistrationAttemptUpload>>;
  createdAt: Date;
  expiresAt: Date;
  deleteAt: Date;
  usedAt?: Date;
  ipAddress?: string;
}
