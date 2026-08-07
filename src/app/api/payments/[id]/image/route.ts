import { get } from "@vercel/blob";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { PaymentProof } from "@/models/PaymentProof";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import {
  canAccessPrivateUserResource,
  getTrustedVercelBlobAccessKind,
  safeDownloadFileName,
} from "@/lib/shipments/private-files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid payment proof" }, { status: 400 });
    }

    const client = await clientPromise;
    const payment = await client
      .db("guangzhou")
      .collection<PaymentProof>("payment_proofs")
      .findOne({ _id: new ObjectId(id) as unknown as string });

    if (!payment) {
      return NextResponse.json({ error: "Payment proof not found" }, { status: 404 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    if (!canAccessPrivateUserResource(principal, payment.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fileId = new URL(request.url).searchParams.get("fileId");
    const proof = fileId
      ? payment.proofs?.find((candidate) => candidate.publicId === fileId)
      : payment.proofs?.[0];
    const proofUrl = proof?.url || payment.proofImageUrl;
    const proofName = proof?.name || payment.proofImageName;
    const blobAccess = getTrustedVercelBlobAccessKind(proofUrl);
    if (blobAccess === "public") {
      try {
        const publicUrl = new URL(proofUrl);
        return NextResponse.redirect(publicUrl);
      } catch {
        return NextResponse.json({ error: "Payment proof image not found" }, { status: 404 });
      }
    }
    if (blobAccess !== "private") {
      return NextResponse.json(
        { error: "Payment proof image not found" },
        { status: 404 },
      );
    }

    const blob = await get(proofUrl, { access: "private" });
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "Payment proof image not found" }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeDownloadFileName(proofName)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET payment proof image error:", error);
    return NextResponse.json({ error: "Unable to retrieve payment proof image" }, { status: 500 });
  }
}
