import { NextResponse } from "next/server";
import { ObjectId, type Collection } from "mongodb";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ensureSecurityIndexes } from "@/lib/database-security";
import type {
  IdentityVerification,
  IdentityVerificationStatus,
} from "@/models/IdentityVerification";
import type { User } from "@/models/User";

const STATUSES: IdentityVerificationStatus[] = [
  "pending",
  "under-review",
  "verified",
  "rejected",
  "resubmission-required",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getStats(collection: Collection<IdentityVerification>) {
  const [pending, underReview, verified, rejected, resubmissionRequired] =
    await Promise.all([
      collection.countDocuments({ status: "pending" }),
      collection.countDocuments({ status: "under-review" }),
      collection.countDocuments({ status: "verified" }),
      collection.countDocuments({ status: "rejected" }),
      collection.countDocuments({ status: "resubmission-required" }),
    ]);
  return { pending, underReview, verified, rejected, resubmissionRequired };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status");
    const status =
      requestedStatus &&
      STATUSES.includes(requestedStatus as IdentityVerificationStatus)
        ? (requestedStatus as IdentityVerificationStatus)
        : undefined;
    const page = Math.max(
      1,
      Number.parseInt(url.searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20
      )
    );
    const search = url.searchParams.get("search")?.trim();

    const client = await clientPromise;
    const db = client.db("guangzhou");
    await ensureSecurityIndexes(db);
    const verifications =
      db.collection<IdentityVerification>("identity_verifications");
    const users = db.collection<User>("users");

    let userIds: string[] | undefined;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      const matchingUsers = await users
        .find(
          {
            $or: [
              { firstName: pattern },
              { lastName: pattern },
              { email: pattern },
              { username: pattern },
            ],
          },
          { projection: { _id: 1 } }
        )
        .limit(100)
        .toArray();
      userIds = matchingUsers
        .map((user) => user._id?.toString())
        .filter(Boolean) as string[];
      if (userIds.length === 0) {
        return NextResponse.json({
          verifications: [],
          pagination: { page, limit, total: 0, pages: 0 },
          stats: await getStats(verifications),
        });
      }
    }

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (userIds) query.userId = { $in: userIds };

    const [records, total, stats] = await Promise.all([
      verifications
        .find(query)
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      verifications.countDocuments(query),
      getStats(verifications),
    ]);

    const ids = records
      .map((record) => record.userId)
      .filter(ObjectId.isValid)
      .map((id) => new ObjectId(id));
    const relatedUsers = await users
      .find(
        { _id: { $in: ids } as never },
        {
          projection: {
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            country: 1,
          },
        }
      )
      .toArray();
    const userMap = new Map(
      relatedUsers.map((user) => [user._id?.toString(), user])
    );

    return NextResponse.json({
      verifications: records.map((record) => {
        const user = userMap.get(record.userId);
        return {
          id: record._id?.toString(),
          status: record.status,
          documentType: record.documentType,
          documentNumberLast4: record.documentNumberLast4,
          livenessStatus: record.livenessStatus,
          selfieCaptureMethod: record.selfieCaptureMethod,
          submittedAt: record.submittedAt,
          reviewedAt: record.reviewedAt,
          user: {
            id: record.userId,
            name: user
              ? `${user.firstName} ${user.lastName}`
              : "Unknown user",
            email: user?.email || "",
            phone: user?.phone || "",
            country: user?.country || "",
          },
        };
      }),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats,
    });
  } catch (error) {
    console.error("List identity verifications error:", error);
    return NextResponse.json(
      { error: "Failed to load identity verifications" },
      { status: 500 }
    );
  }
}

