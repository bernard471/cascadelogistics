import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { DeltaReportRow } from "@/types";

// GET - Fetch report data for given DELTA number(s). Admin/Staff only.
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deltaParam = searchParams.get("deltaNumbers");
    const deltaNumbers = deltaParam
      ? deltaParam.split(",").map((d) => d.trim()).filter(Boolean)
      : [];

    if (deltaNumbers.length === 0) {
      return NextResponse.json(
        { error: "At least one deltaNumber is required (e.g. ?deltaNumbers=DELTA85720)" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection("shipments");
    const usersCollection = db.collection("users");

    const shipments = await shipmentsCollection
      .find({ deltaNumber: { $in: deltaNumbers } })
      .toArray();

    const userIds = [...new Set(shipments.map((s) => (s as { userId?: string }).userId).filter(Boolean))] as string[];
    const users = await usersCollection
      .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
      .toArray();
    const userMap = new Map(users.map((u) => [u._id?.toString(), u]));

    // One row per shipment: customer, wholesale tracking numbers only, description, quantity, weight
    const reportRows: DeltaReportRow[] = shipments.map((s) => {
      const uid = (s as { userId?: string }).userId;
      const user = (uid ? userMap.get(uid) : undefined) as { firstName?: string; lastName?: string } | undefined;
      const customerName = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown"
        : "Unknown";
      const purchases = (s as { wholesalePurchases?: Array<{ trackingNumber?: string }> }).wholesalePurchases || [];
      const wholesaleTrackingNumbers = purchases
        .map((p) => p.trackingNumber?.trim())
        .filter(Boolean) as string[];
      const description = (s as { description?: string }).description || "";
      const quantity = Number((s as { quantity?: number }).quantity) || 0;
      const totalWeightKg = Math.round((Number((s as { weight?: number }).weight) || 0) * 100) / 100;
      return {
        customerName,
        wholesaleTrackingNumbers,
        description,
        quantity,
        totalWeightKg
      };
    });

    return NextResponse.json({
      deltaNumbers,
      rows: reportRows
    });
  } catch (error) {
    console.error("GET delta report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
