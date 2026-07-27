import { del, head } from "@vercel/blob";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import type { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ensureSecurityIndexes } from "@/lib/database-security";
import { sendVerificationEmail } from "@/lib/email";
import {
  getPrivateBlobToken,
  getRequestIp,
  hashIdentityNumber,
  hashOpaqueToken,
} from "@/lib/identity-security";
import {
  normalizeEmail,
  normalizeUsername,
  registrationSubmissionSchema,
} from "@/lib/registration-validation";
import type {
  IdentityFileKind,
  IdentityVerification,
  PrivateIdentityFile,
} from "@/models/IdentityVerification";
import type { RegistrationAttempt } from "@/models/RegistrationAttempt";
import type { User } from "@/models/User";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function verifyUploadedFile(input: {
  pathname: string;
  attemptId: string;
  kind: IdentityFileKind;
  token?: string;
  captureMethod?: "camera" | "upload";
}) {
  const expectedPrefix = `identity-verifications/${input.attemptId}/${input.kind}/`;
  if (!input.pathname.startsWith(expectedPrefix)) {
    throw new Error("One or more uploaded files are not authorized for this registration");
  }

  const blob = await head(input.pathname, { token: input.token });
  const allowedTypes = input.kind === "selfie" ? ALLOWED_SELFIE_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowedTypes.includes(blob.contentType) || blob.size > MAX_FILE_SIZE) {
    throw new Error("An uploaded file has an unsupported type or size");
  }

  const originalName = input.pathname.split("/").pop() || input.kind;
  const file: PrivateIdentityFile = {
    pathname: blob.pathname,
    url: blob.url,
    originalName,
    contentType: blob.contentType,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
    captureMethod: input.captureMethod,
  };
  return file;
}

export async function POST(request: Request) {
  const uploadedPathnames: string[] = [];
  let insertedUserId: string | undefined;
  let insertedVerificationId: string | undefined;
  let insertedUserObjectId: ObjectId | undefined;
  let insertedVerificationObjectId: ObjectId | undefined;

  try {
    const parsed = registrationSubmissionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid registration details",
          field: parsed.error.issues[0]?.path.join("."),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const emailNormalized = normalizeEmail(data.email);
    const usernameNormalized = normalizeUsername(data.username);
    const client = await clientPromise;
    const db = client.db("guangzhou");
    await ensureSecurityIndexes(db);

    const attempt = await db.collection<RegistrationAttempt>("registration_attempts").findOne({
      tokenHash: hashOpaqueToken(data.attemptToken),
      emailNormalized,
      usernameNormalized,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!attempt?._id) {
      return NextResponse.json(
        { error: "Your secure registration session expired. Please submit the form again." },
        { status: 400 }
      );
    }

    const users = db.collection<User>("users");
    const existingUser = await users.findOne({
      $or: [
        { emailNormalized },
        { usernameNormalized },
        { email: emailNormalized },
        { username: usernameNormalized },
      ],
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email or username already exists" },
        { status: 409 }
      );
    }

    const blobToken = getPrivateBlobToken();
    const attemptId = attempt._id.toString();
    const [documentFront, documentBack, selfie] = await Promise.all([
      verifyUploadedFile({
        pathname: data.documentFront.pathname,
        attemptId,
        kind: "documentFront",
        token: blobToken,
      }),
      data.documentBack
        ? verifyUploadedFile({
            pathname: data.documentBack.pathname,
            attemptId,
            kind: "documentBack",
            token: blobToken,
          })
        : Promise.resolve(undefined),
      verifyUploadedFile({
        pathname: data.selfie.pathname,
        attemptId,
        kind: "selfie",
        token: blobToken,
        captureMethod: data.selfieCaptureMethod,
      }),
    ]);

    uploadedPathnames.push(
      documentFront.pathname,
      selfie.pathname,
      ...(documentBack ? [documentBack.pathname] : [])
    );

    const documentNumberNormalized = data.documentNumber.replace(/[\s-]/g, "").toUpperCase();
    const documentNumberHash = hashIdentityNumber(data.documentType, documentNumberNormalized);
    const duplicateIdentity = await db.collection<IdentityVerification>("identity_verifications").findOne({
      documentNumberHash,
    });
    if (duplicateIdentity) {
      return NextResponse.json(
        { error: "This identity document is already associated with an account" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const now = new Date();
    const newUser: Omit<User, "_id"> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: emailNormalized,
      emailNormalized,
      username: usernameNormalized,
      usernameNormalized,
      password: hashedPassword,
      phone: data.phone,
      address: data.address,
      addressLine2: data.addressLine2 || undefined,
      city: data.city,
      stateRegion: data.stateRegion,
      country: data.country,
      postalCode: data.postalCode || undefined,
      digitalAddress: data.digitalAddress || undefined,
      role: "user",
      status: "active",
      createdAt: now,
      updatedAt: now,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      identityVerificationStatus: "pending",
    };

    const userResult = await users.insertOne(newUser);
    insertedUserObjectId = userResult.insertedId as unknown as ObjectId;
    insertedUserId = userResult.insertedId.toString();

    const ipAddress = getRequestIp(request);
    const identityRecord: IdentityVerification = {
      userId: insertedUserId,
      status: "pending",
      documentType: data.documentType,
      documentNumberHash,
      documentNumberLast4: documentNumberNormalized.slice(-4),
      documentFront,
      documentBack,
      selfie,
      selfieCaptureMethod: data.selfieCaptureMethod,
      livenessStatus: "not-configured",
      consent: {
        accepted: true,
        version: "2026-07-identity-v1",
        acceptedAt: now,
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      },
      submittedAt: now,
      reviewHistory: [{ action: "submitted", createdAt: now }],
      createdAt: now,
      updatedAt: now,
    };

    const identityResult = await db
      .collection<IdentityVerification>("identity_verifications")
      .insertOne(identityRecord);
    insertedVerificationId = identityResult.insertedId.toString();
    insertedVerificationObjectId = identityResult.insertedId;

    await users.updateOne(
      { _id: userResult.insertedId as never },
      { $set: { identityVerificationId: insertedVerificationId } }
    );
    await db.collection<RegistrationAttempt>("registration_attempts").updateOne(
      { _id: attempt._id },
      { $set: { usedAt: now } }
    );
    await db.collection("audit_logs").insertOne({
      action: "identity.submitted",
      entityType: "identity_verification",
      entityId: insertedVerificationId,
      userId: insertedUserId,
      createdAt: now,
      metadata: { documentType: data.documentType, selfieCaptureMethod: data.selfieCaptureMethod },
    });

    let emailSent = true;
    try {
      await sendVerificationEmail({
        firstName: data.firstName,
        email: emailNormalized,
        verificationToken,
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Verification email delivery failed:", emailError);
    }

    return NextResponse.json(
      {
        message:
          "Registration submitted. Verify your email while our team reviews your identity documents.",
        userId: insertedUserId,
        emailSent,
        identityStatus: "pending",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (insertedUserId) {
      try {
        const client = await clientPromise;
        const db = client.db("guangzhou");
        if (insertedUserObjectId) {
          await db.collection("users").deleteOne({ _id: insertedUserObjectId });
        }
        if (insertedVerificationObjectId) {
          await db.collection("identity_verifications").deleteOne({
            _id: insertedVerificationObjectId,
          });
        }
      } catch (rollbackError) {
        console.error("Registration rollback failed:", rollbackError);
      }
    }

    if (uploadedPathnames.length > 0) {
      try {
        await del(uploadedPathnames, { token: getPrivateBlobToken() });
      } catch (cleanupError) {
        console.error("Registration file cleanup failed:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 }
    );
  }
}
