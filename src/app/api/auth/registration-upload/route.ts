import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ensureSecurityIndexes } from "@/lib/database-security";
import { getPrivateBlobToken, hashOpaqueToken } from "@/lib/identity-security";
import type { IdentityFileKind } from "@/models/IdentityVerification";
import type { RegistrationAttempt } from "@/models/RegistrationAttempt";

const FILE_KINDS: IdentityFileKind[] = ["documentFront", "documentBack", "selfie"];
const DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function parseClientPayload(payload: string | null) {
  if (!payload) throw new Error("Missing upload authorization");
  const parsed = JSON.parse(payload) as { attemptToken?: string; kind?: IdentityFileKind };
  if (!parsed.attemptToken || !parsed.kind || !FILE_KINDS.includes(parsed.kind)) {
    throw new Error("Invalid upload authorization");
  }
  return { attemptToken: parsed.attemptToken, kind: parsed.kind };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const client = await clientPromise;
    const db = client.db("guangzhou");
    await ensureSecurityIndexes(db);

    const response = await handleUpload({
      request,
      body,
      token: getPrivateBlobToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { attemptToken, kind } = parseClientPayload(clientPayload);
        const attempt = await db.collection<RegistrationAttempt>("registration_attempts").findOne({
          tokenHash: hashOpaqueToken(attemptToken),
          usedAt: { $exists: false },
          expiresAt: { $gt: new Date() },
        });

        if (!attempt?._id) throw new Error("Registration upload session has expired");

        const expectedPrefix = `identity-verifications/${attempt._id.toString()}/${kind}/`;
        if (!pathname.startsWith(expectedPrefix)) {
          throw new Error("Upload path is not authorized");
        }

        return {
          allowedContentTypes: kind === "selfie" ? SELFIE_TYPES : DOCUMENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          validUntil: Math.min(attempt.expiresAt.getTime(), Date.now() + 15 * 60 * 1000),
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({
            attemptId: attempt._id.toString(),
            kind,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const parsed = JSON.parse(tokenPayload) as {
          attemptId?: string;
          kind?: IdentityFileKind;
        };
        if (
          !parsed.attemptId ||
          !ObjectId.isValid(parsed.attemptId) ||
          !parsed.kind ||
          !FILE_KINDS.includes(parsed.kind)
        ) {
          return;
        }

        await db.collection<RegistrationAttempt>("registration_attempts").updateOne(
          { _id: new ObjectId(parsed.attemptId), usedAt: { $exists: false } },
          {
            $set: {
              [`uploads.${parsed.kind}`]: {
                pathname: blob.pathname,
                url: blob.url,
                contentType: blob.contentType,
                uploadedAt: new Date(),
              },
            },
          }
        );
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Registration upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Secure upload failed" },
      { status: 400 }
    );
  }
}

