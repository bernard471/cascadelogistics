import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { del } from "@vercel/blob";
import { z } from "zod";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ensureSecurityIndexes } from "@/lib/database-security";
import { sendIdentityDecisionEmail } from "@/lib/email";
import {
  getIdentityRetentionDays,
  getPrivateBlobToken,
} from "@/lib/identity-security";
import type {
  IdentityVerification,
  IdentityVerificationStatus,
} from "@/models/IdentityVerification";
import type { Notification } from "@/models/Notification";
import type { User } from "@/models/User";

const decisionSchema = z
  .object({
    action: z.enum(["approve", "reject", "request-resubmission"]),
    reason: z.string().trim().max(500).optional().default(""),
    notes: z.string().trim().max(1000).optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.action !== "approve" && value.reason.length < 5) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Provide a clear reason for the customer",
      });
    }
  });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid verification ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const verification = await db
      .collection<IdentityVerification>("identity_verifications")
      .findOne({ _id: new ObjectId(id) });
    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    const user = ObjectId.isValid(verification.userId)
      ? await db.collection<User>("users").findOne(
          { _id: new ObjectId(verification.userId) as never },
          {
            projection: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
              address: 1,
              addressLine2: 1,
              city: 1,
              stateRegion: 1,
              country: 1,
              postalCode: 1,
              digitalAddress: 1,
              emailVerified: 1,
            },
          }
        )
      : null;

    const fileUrl = (kind: string, exists: boolean) =>
      exists
        ? `/api/admin/identity-verifications/${id}/files/${kind}`
        : null;

    return NextResponse.json({
      verification: {
        id,
        status: verification.status,
        documentType: verification.documentType,
        documentNumberLast4: verification.documentNumberLast4,
        selfieCaptureMethod: verification.selfieCaptureMethod,
        livenessStatus: verification.livenessStatus,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        reviewedBy: verification.reviewedBy,
        rejectionReason: verification.rejectionReason,
        reviewNotes: verification.reviewNotes,
        documentRetentionExpiresAt:
          verification.documentRetentionExpiresAt,
        documentsPurgedAt: verification.documentsPurgedAt,
        reviewHistory: verification.reviewHistory,
        files: {
          documentFront: fileUrl(
            "documentFront",
            Boolean(verification.documentFront)
          ),
          documentBack: fileUrl(
            "documentBack",
            Boolean(verification.documentBack)
          ),
          selfie: fileUrl("selfie", Boolean(verification.selfie)),
          documentFrontType: verification.documentFront?.contentType,
          documentBackType: verification.documentBack?.contentType,
          selfieType: verification.selfie?.contentType,
        },
      },
      user: user
        ? {
            id: verification.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            addressLine2: user.addressLine2,
            city: user.city,
            stateRegion: user.stateRegion,
            country: user.country,
            postalCode: user.postalCode,
            digitalAddress: user.digitalAddress,
            emailVerified: user.emailVerified,
          }
        : null,
    });
  } catch (error) {
    console.error("Get identity verification error:", error);
    return NextResponse.json(
      { error: "Failed to load identity verification" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await auth();
    if (!authSession?.user || authSession.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid verification ID" },
        { status: 400 }
      );
    }

    const parsed = decisionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Invalid review decision",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    await ensureSecurityIndexes(db);
    const identityId = new ObjectId(id);
    const existing = await db
      .collection<IdentityVerification>("identity_verifications")
      .findOne({ _id: identityId });
    if (!existing) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }
    if (!ObjectId.isValid(existing.userId)) {
      return NextResponse.json(
        { error: "Verification has an invalid user reference" },
        { status: 409 }
      );
    }

    const status: IdentityVerificationStatus =
      parsed.data.action === "approve"
        ? "verified"
        : parsed.data.action === "reject"
          ? "rejected"
          : "resubmission-required";
    const historyAction =
      parsed.data.action === "approve"
        ? "approved"
        : parsed.data.action === "reject"
          ? "rejected"
          : "resubmission-requested";
    const now = new Date();
    const retentionExpiresAt = new Date(
      now.getTime() +
        getIdentityRetentionDays() * 24 * 60 * 60 * 1000
    );
    const mongoSession = client.startSession();

    try {
      await mongoSession.withTransaction(async () => {
        await db
          .collection<IdentityVerification>("identity_verifications")
          .updateOne(
            { _id: identityId },
            {
              $set: {
                status,
                reviewedAt: now,
                reviewedBy: authSession.user.id,
                rejectionReason:
                  parsed.data.action === "approve"
                    ? ""
                    : parsed.data.reason,
                reviewNotes: parsed.data.notes,
                documentRetentionExpiresAt: retentionExpiresAt,
                updatedAt: now,
              },
              $push: {
                reviewHistory: {
                  action: historyAction,
                  actorId: authSession.user.id,
                  actorName:
                    authSession.user.name ||
                    authSession.user.email ||
                    "Administrator",
                  note:
                    parsed.data.notes ||
                    parsed.data.reason ||
                    undefined,
                  createdAt: now,
                },
              },
            },
            { session: mongoSession }
          );

        const userUpdate =
          status === "verified"
            ? {
                $set: {
                  identityVerificationStatus: status,
                  identityVerifiedAt: now,
                  updatedAt: now,
                },
              }
            : {
                $set: {
                  identityVerificationStatus: status,
                  updatedAt: now,
                },
                $unset: { identityVerifiedAt: "" as const },
              };
        await db.collection<User>("users").updateOne(
          { _id: new ObjectId(existing.userId) as never },
          userUpdate,
          { session: mongoSession }
        );

        const notification: Omit<Notification, "_id"> = {
          userId: existing.userId,
          type: status === "verified" ? "system" : "alert",
          title:
            status === "verified"
              ? "Identity verification approved"
              : "Identity verification update",
          message:
            status === "verified"
              ? "Your identity verification has been approved."
              : parsed.data.reason,
          isRead: false,
          createdAt: now,
        };
        await db
          .collection<Notification>("notifications")
          .insertOne(notification, { session: mongoSession });

        await db.collection("audit_logs").insertOne(
          {
            action: `identity.${historyAction}`,
            entityType: "identity_verification",
            entityId: id,
            actorId: authSession.user.id,
            userId: existing.userId,
            createdAt: now,
            metadata: {
              status,
              reason: parsed.data.reason || undefined,
              notes: parsed.data.notes || undefined,
            },
          },
          { session: mongoSession }
        );
      });
    } finally {
      await mongoSession.endSession();
    }

    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(existing.userId) as never },
      { projection: { firstName: 1, email: 1 } }
    );
    if (user) {
      try {
        await sendIdentityDecisionEmail({
          firstName: user.firstName,
          email: user.email,
          decision: status,
          reason: parsed.data.reason || undefined,
        });
      } catch (emailError) {
        console.error("Identity decision email failed:", emailError);
      }
    }

    return NextResponse.json({
      message: "Identity verification decision saved",
      status,
      retentionExpiresAt,
    });
  } catch (error) {
    console.error("Review identity verification error:", error);
    return NextResponse.json(
      { error: "Failed to save verification decision" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await auth();
    if (!authSession?.user || authSession.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid verification ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const identityId = new ObjectId(id);
    const verification = await db
      .collection<IdentityVerification>("identity_verifications")
      .findOne({ _id: identityId });
    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    const [shipmentCount, paymentCount, ticketCount] = await Promise.all([
      db.collection("shipments").countDocuments({ userId: verification.userId }),
      db.collection("payment_proofs").countDocuments({ userId: verification.userId }),
      db.collection("support_tickets").countDocuments({ userId: verification.userId }),
    ]);
    if (shipmentCount + paymentCount + ticketCount > 0) {
      return NextResponse.json(
        {
          error:
            "This customer already has operational records. Delete or retain the account through user management instead.",
        },
        { status: 409 }
      );
    }

    const blobPathnames = [
      verification.documentFront?.pathname,
      verification.documentBack?.pathname,
      verification.selfie?.pathname,
    ].filter((pathname): pathname is string => Boolean(pathname));

    if (blobPathnames.length > 0) {
      try {
        await del(blobPathnames, { token: getPrivateBlobToken() });
      } catch (blobError) {
        console.error("Identity Blob deletion failed:", blobError);
        return NextResponse.json(
          {
            error:
              "The private identity files could not be deleted. No registration records were removed; please try again.",
          },
          { status: 502 }
        );
      }
    }

    const userObjectId = ObjectId.isValid(verification.userId)
      ? new ObjectId(verification.userId)
      : undefined;
    const user = userObjectId
      ? await db.collection<User>("users").findOne({
          _id: userObjectId as never,
        })
      : null;
    const now = new Date();
    const mongoSession = client.startSession();

    try {
      await mongoSession.withTransaction(async () => {
        await db
          .collection<IdentityVerification>("identity_verifications")
          .deleteOne({ _id: identityId }, { session: mongoSession });
        if (userObjectId && user?.role === "user") {
          await db
            .collection<User>("users")
            .deleteOne(
              { _id: userObjectId as never },
              { session: mongoSession }
            );
        }
        await db
          .collection("notifications")
          .deleteMany(
            { userId: verification.userId },
            { session: mongoSession }
          );
        if (user) {
          await db.collection("registration_attempts").deleteMany(
            {
              $or: [
                { emailNormalized: user.emailNormalized || user.email.toLowerCase() },
                {
                  usernameNormalized:
                    user.usernameNormalized || user.username.toLowerCase(),
                },
              ],
            },
            { session: mongoSession }
          );
        }
        await db.collection("audit_logs").insertOne(
          {
            action: "identity.registration-deleted",
            entityType: "identity_verification",
            entityId: id,
            actorId: authSession.user.id,
            userId: verification.userId,
            createdAt: now,
            metadata: {
              blobsDeleted: blobPathnames.length,
              userDeleted: Boolean(userObjectId && user?.role === "user"),
            },
          },
          { session: mongoSession }
        );
      });
    } finally {
      await mongoSession.endSession();
    }

    return NextResponse.json({
      message:
        "Registration, associated user account, and private identity files were deleted.",
      blobsDeleted: blobPathnames.length,
    });
  } catch (error) {
    console.error("Delete identity registration error:", error);
    return NextResponse.json(
      { error: "Failed to delete identity registration" },
      { status: 500 }
    );
  }
}
