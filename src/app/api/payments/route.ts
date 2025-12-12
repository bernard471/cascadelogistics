import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { put } from "@vercel/blob";
import type { PaymentProof } from "@/models/PaymentProof";
import type { Shipment } from "@/models/Shipment";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// POST - Submit payment proof
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const trackingId = formData.get("trackingId") as string;
    const amount = formData.get("amount") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const paymentMethodDetails = formData.get("paymentMethodDetails") as string | null;
    const notes = formData.get("notes") as string | null;
    const proofImage = formData.get("proofImage") as File | null;

    // Validation
    if (!trackingId || !amount || !paymentMethod || !proofImage) {
      return NextResponse.json(
        { error: "Tracking ID, amount, payment method, and proof image are required" },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['mobile-money', 'bank-transfer', 'cash', 'other'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Validate image
    if (proofImage.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `Image exceeds the 10MB limit` },
        { status: 400 }
      );
    }

    // Check if image is valid type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(proofImage.type)) {
      return NextResponse.json(
        { error: "Invalid image type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
    const paymentsCollection = db.collection<PaymentProof>("payment_proofs");

    // Find shipment by tracking ID
    const shipment = await shipmentsCollection.findOne({ trackingId });
    
    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found with the provided tracking ID" },
        { status: 404 }
      );
    }

    // Check if shipment belongs to user
    if (shipment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only submit payment proof for your own shipments" },
        { status: 403 }
      );
    }

    // Check if payment proof already exists for this shipment
    const existingPayment = await paymentsCollection.findOne({
      shipmentId: shipment._id?.toString(),
      status: { $in: ['pending', 'verified'] }
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "A payment proof already exists for this shipment. Please wait for verification or contact support." },
        { status: 400 }
      );
    }

    // Upload image to Vercel Blob Storage
    const imageBuffer = Buffer.from(await proofImage.arrayBuffer());
    const imageBlob = await put(
      `payment-proofs/${session.user.id}/${trackingId}-${Date.now()}-${proofImage.name}`,
      imageBuffer,
      {
        access: 'public',
        contentType: proofImage.type,
      }
    );

    // Generate payment ID
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const paymentId = `PAY${timestamp}${random}`;

    // Create payment proof document
    const newPaymentProof: Omit<PaymentProof, '_id'> = {
      paymentId,
      trackingId,
      shipmentId: shipment._id?.toString() || '',
      userId: session.user.id,
      amount: amountNum,
      paymentMethod: paymentMethod as PaymentProof['paymentMethod'],
      paymentMethodDetails: paymentMethodDetails || undefined,
      proofImageUrl: imageBlob.url,
      proofImageName: proofImage.name,
      status: 'pending',
      submittedAt: new Date(),
      updatedAt: new Date(),
      notes: notes || undefined,
    };

    const result = await paymentsCollection.insertOne(newPaymentProof);

    return NextResponse.json(
      {
        message: "Payment proof submitted successfully",
        paymentId: paymentId,
        paymentProofId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST payment proof error:", error);
    return NextResponse.json(
      { error: "Failed to submit payment proof" },
      { status: 500 }
    );
  }
}

// GET - Fetch user's payment proofs
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const trackingId = searchParams.get("trackingId");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const paymentsCollection = db.collection<PaymentProof>("payment_proofs");

    // Build query
    const query: Record<string, unknown> = { userId: session.user.id };
    if (status && status !== "all") {
      query.status = status;
    }
    if (trackingId) {
      query.trackingId = trackingId;
    }

    // Fetch payment proofs
    const payments = await paymentsCollection
      .find(query)
      .sort({ submittedAt: -1 })
      .toArray();

    return NextResponse.json({
      payments: payments.map(p => ({
        ...p,
        _id: p._id?.toString(),
      }))
    });
  } catch (error) {
    console.error("GET payment proofs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment proofs" },
      { status: 500 }
    );
  }
}

