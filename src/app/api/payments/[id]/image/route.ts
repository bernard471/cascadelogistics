import { get } from "@vercel/blob";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { PaymentProof } from "@/models/PaymentProof";

function safeFileName(fileName: string): string {
  return fileName.replace(/[\r\n"]/g, "_");
}

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

    const canViewAnyProof = ["admin", "staff", "super_admin"].includes(
      session.user.role
    );
    if (!canViewAnyProof && payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!payment.proofImageUrl.includes(".private.blob.vercel-storage.com/")) {
      try {
        const publicUrl = new URL(payment.proofImageUrl);
        if (!publicUrl.hostname.endsWith(".public.blob.vercel-storage.com")) {
          throw new Error("Untrusted payment proof URL");
        }
        return NextResponse.redirect(publicUrl);
      } catch {
        return NextResponse.json({ error: "Payment proof image not found" }, { status: 404 });
      }
    }

    const blob = await get(payment.proofImageUrl, { access: "private" });
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "Payment proof image not found" }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeFileName(payment.proofImageName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET payment proof image error:", error);
    return NextResponse.json({ error: "Unable to retrieve payment proof image" }, { status: 500 });
  }
}
