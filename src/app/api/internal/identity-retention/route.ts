import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getPrivateBlobToken } from "@/lib/identity-security";
import type { IdentityVerification } from "@/models/IdentityVerification";
import type { RegistrationAttempt } from "@/models/RegistrationAttempt";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret &&
      request.headers.get("authorization") === `Bearer ${secret}`
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("guangzhou");
  const token = getPrivateBlobToken();
  const now = new Date();
  let purgedVerifications = 0;
  let purgedAttempts = 0;

  const expiredVerifications = await db
    .collection<IdentityVerification>("identity_verifications")
    .find({
      documentRetentionExpiresAt: { $lte: now },
      documentsPurgedAt: { $exists: false },
    })
    .limit(100)
    .toArray();

  for (const verification of expiredVerifications) {
    const paths = [
      verification.documentFront?.pathname,
      verification.documentBack?.pathname,
      verification.selfie?.pathname,
    ].filter(Boolean) as string[];
    if (paths.length > 0) await del(paths, { token });
    await db
      .collection<IdentityVerification>("identity_verifications")
      .updateOne(
        { _id: verification._id },
        {
          $unset: { documentFront: "", documentBack: "", selfie: "" },
          $set: { documentsPurgedAt: now, updatedAt: now },
          $push: {
            reviewHistory: {
              action: "documents-purged",
              createdAt: now,
            },
          },
        }
      );
    purgedVerifications += 1;
  }

  const expiredAttempts = await db
    .collection<RegistrationAttempt>("registration_attempts")
    .find({ expiresAt: { $lte: now }, usedAt: { $exists: false } })
    .limit(100)
    .toArray();
  for (const attempt of expiredAttempts) {
    const paths = Object.values(attempt.uploads).map(
      (upload) => upload.pathname
    );
    if (paths.length > 0) await del(paths, { token });
    await db.collection<RegistrationAttempt>("registration_attempts").deleteOne({
      _id: attempt._id,
    });
    purgedAttempts += 1;
  }

  return NextResponse.json({
    purgedVerifications,
    purgedAttempts,
  });
}

