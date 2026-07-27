import type { ObjectId } from "mongodb";

export type IdentityDocumentType =
  | "ghana-card"
  | "passport"
  | "drivers-licence"
  | "residence-permit";

export type IdentityVerificationStatus =
  | "pending"
  | "under-review"
  | "verified"
  | "rejected"
  | "resubmission-required";

export type IdentityFileKind = "documentFront" | "documentBack" | "selfie";

export interface PrivateIdentityFile {
  pathname: string;
  url: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  captureMethod?: "camera" | "upload";
}

export interface IdentityReviewEvent {
  action: "submitted" | "opened" | "approved" | "rejected" | "resubmission-requested" | "documents-purged";
  actorId?: string;
  actorName?: string;
  note?: string;
  createdAt: Date;
}

export interface IdentityVerification {
  _id?: ObjectId;
  userId: string;
  status: IdentityVerificationStatus;
  documentType: IdentityDocumentType;
  documentNumberHash: string;
  documentNumberLast4: string;
  documentFront?: PrivateIdentityFile;
  documentBack?: PrivateIdentityFile;
  selfie?: PrivateIdentityFile;
  selfieCaptureMethod: "camera" | "upload";
  livenessStatus: "not-configured" | "pending" | "passed" | "failed";
  livenessProvider?: string;
  consent: {
    accepted: true;
    version: string;
    acceptedAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  reviewNotes?: string;
  documentRetentionExpiresAt?: Date;
  documentsPurgedAt?: Date;
  reviewHistory: IdentityReviewEvent[];
  createdAt: Date;
  updatedAt: Date;
}

