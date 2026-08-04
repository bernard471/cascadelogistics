import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { PaymentProof } from "@/models/PaymentProof";
import { ObjectId } from "mongodb";

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
    const paymentsCollection = db.collection<PaymentProof>("payment_proofs");
    const shipmentsCollection = db.collection("shipments");

    // Find payment proof
    const payment = await paymentsCollection.findOne({
      _id: new ObjectId(id) as unknown as string,
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment proof not found" },
        { status: 404 }
      );
    }

    // Update payment proof
    const updateData: Partial<PaymentProof> = {
      status: status as 'verified' | 'rejected',
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    if (notes) {
      updateData.notes = notes;
    }

    await paymentsCollection.updateOne(
      { _id: new ObjectId(id) as unknown as string },
      { $set: updateData }
    );

    // If verified, optionally update shipment status or add a note
    // You can extend this to update shipment payment status if needed
    if (status === 'verified' && payment.shipmentId) {
      // Optionally update shipment to mark as paid
      await shipmentsCollection.updateOne(
        { _id: payment.shipmentId as unknown as ObjectId },
        { 
          $set: { 
            updatedAt: new Date(),
            // You can add a paymentVerified field to Shipment model if needed
          } 
        }
      );
    }

    // Fetch updated payment proof
    const updatedPayment = await paymentsCollection.findOne({
      _id: new ObjectId(id) as unknown as string,
    });

    return NextResponse.json({
      message: `Payment proof ${status} successfully`,
      payment: {
        ...updatedPayment,
        _id: updatedPayment?._id?.toString(),
        proofImageUrl: updatedPayment?.proofImageUrl.includes(".private.blob.vercel-storage.com/")
          ? `/api/payments/${updatedPayment?._id?.toString()}/image`
          : updatedPayment?.proofImageUrl,
      },
    });
  } catch (error) {
    console.error("PATCH payment proof error:", error);
    return NextResponse.json(
      { error: "Failed to update payment proof" },
      { status: 500 }
    );
  }
}
