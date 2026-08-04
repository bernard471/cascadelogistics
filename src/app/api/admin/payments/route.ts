import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { PaymentProof } from "@/models/PaymentProof";
import type { User } from "@/models/User";

// GET - Fetch all payment proofs (admin/staff)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const trackingId = searchParams.get("trackingId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const paymentsCollection = db.collection<PaymentProof>("payment_proofs");
    const usersCollection = db.collection<User>("users");

    // Build query
    const query: Record<string, unknown> = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (trackingId) {
      query.trackingId = { $regex: trackingId, $options: "i" };
    }

    // Fetch payment proofs with pagination
    const payments = await paymentsCollection
      .find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get user info for each payment
    const paymentsWithUserInfo = await Promise.all(
      payments.map(async (payment) => {
        let user = null;
        try {
          // Convert userId string to ObjectId for query
          user = await usersCollection.findOne(
            { _id: new ObjectId(payment.userId) as unknown as string },
            { projection: { password: 0 } }
          );
        } catch (error) {
          console.error(`Error fetching user for payment ${payment.paymentId}:`, error);
        }

        return {
          ...payment,
          _id: payment._id?.toString(),
          proofImageUrl: payment.proofImageUrl.includes(".private.blob.vercel-storage.com/")
            ? `/api/payments/${payment._id?.toString()}/image`
            : payment.proofImageUrl,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userEmail: user?.email || "Unknown",
        };
      })
    );

    // Get total count for pagination
    const total = await paymentsCollection.countDocuments(query);

    // Get stats
    const stats = {
      total: await paymentsCollection.countDocuments({}),
      pending: await paymentsCollection.countDocuments({ status: "pending" }),
      verified: await paymentsCollection.countDocuments({ status: "verified" }),
      rejected: await paymentsCollection.countDocuments({ status: "rejected" }),
    };

    return NextResponse.json({
      payments: paymentsWithUserInfo,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (error) {
    console.error("GET admin payment proofs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment proofs" },
      { status: 500 }
    );
  }
}
