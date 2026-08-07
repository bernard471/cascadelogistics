import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { PaymentProof } from "@/models/PaymentProof";
import { ObjectId } from "mongodb";
import { PartnerApiError } from "@/lib/partner-platform/errors";
import { decideInternalPartnerPaymentProof } from "@/lib/partner-platform/financials";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";

// GET - Get single payment proof
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const paymentsCollection = db.collection<PaymentProof>("payment_proofs");

    const payment = await paymentsCollection.findOne({
      _id: new ObjectId(id) as unknown as string,
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment proof not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...payment,
      _id: payment._id?.toString(),
      proofImageUrl: payment.proofImageUrl.includes(".private.blob.vercel-storage.com/")
        ? `/api/payments/${payment._id?.toString()}/image`
        : payment.proofImageUrl,
      proofs: (payment.proofs || []).map((proof) => ({
        publicId: proof.publicId,
        name: proof.name,
        type: proof.type,
        size: proof.size,
        uploadedAt: proof.uploadedAt,
        data: "",
        url: `/api/payments/${payment._id?.toString()}/image?fileId=${encodeURIComponent(proof.publicId || "")}`,
      })),
    });
  } catch (error) {
    console.error("GET payment proof error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment proof" },
      { status: 500 }
    );
  }
}

// PATCH - Verify or reject payment proof
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason, notes } = body;

    // Validation
    if (!status || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'verified' or 'rejected'" },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting a payment" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const principal = shipmentPrincipalFromSessionUser(session.user);
    if (principal.kind !== "internal") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updatedPayment = await decideInternalPartnerPaymentProof({
      db,
      id,
      principal,
      status,
      rejectionReason,
      notes,
    });

    return NextResponse.json({
      message: `Payment proof ${status} successfully`,
      payment: {
        ...updatedPayment,
        _id: updatedPayment?._id?.toString(),
        proofImageUrl: updatedPayment?.proofImageUrl.includes(".private.blob.vercel-storage.com/")
          ? `/api/payments/${updatedPayment?._id?.toString()}/image`
          : updatedPayment?.proofImageUrl,
        proofs: (updatedPayment?.proofs || []).map((proof) => ({
          publicId: proof.publicId,
          name: proof.name,
          type: proof.type,
          size: proof.size,
          uploadedAt: proof.uploadedAt,
          data: "",
          url: `/api/payments/${updatedPayment?._id?.toString()}/image?fileId=${encodeURIComponent(proof.publicId || "")}`,
        })),
      },
    });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("PATCH payment proof error:", error);
    return NextResponse.json(
      { error: "Failed to update payment proof" },
      { status: 500 }
    );
  }
}
