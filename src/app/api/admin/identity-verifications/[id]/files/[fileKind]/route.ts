import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { getPrivateBlobToken } from "@/lib/identity-security";
import type {
  IdentityFileKind,
  IdentityVerification,
} from "@/models/IdentityVerification";

const FILE_KINDS: IdentityFileKind[] = [
  "documentFront",
  "documentBack",
  "selfie",
];

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; fileKind: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, fileKind } = await params;
    if (
      !ObjectId.isValid(id) ||
      !FILE_KINDS.includes(fileKind as IdentityFileKind)
    ) {
      return NextResponse.json(
        { error: "Invalid file request" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const verification = await db
      .collection<IdentityVerification>("identity_verifications")
      .findOne({ _id: new ObjectId(id) });
    const file = verification?.[fileKind as IdentityFileKind];
    if (!file || typeof file !== "object" || !("pathname" in file)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const result = await get(file.pathname, {
      access: "private",
      token: getPrivateBlobToken(),
    });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await db.collection("audit_logs").insertOne({
      action: "identity.file-viewed",
      entityType: "identity_verification",
      entityId: id,
      actorId: session.user.id,
      createdAt: new Date(),
      metadata: { fileKind },
    });

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `inline; filename="${file.originalName.replace(/["\r\n]/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Read private identity file error:", error);
    return NextResponse.json(
      { error: "Unable to load identity file" },
      { status: 500 }
    );
  }
}

