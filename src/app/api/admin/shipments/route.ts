import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import type { Shipment, ShipmentDocument } from "@/models/Shipment";
import { sendShipmentUpdateEmail } from "@/lib/email";
import { validateUploadedShipmentDocuments } from "@/lib/shipment-documents";
import {
  generateTrackingId,
  type ShipmentCreationPayload,
} from "@/lib/shipments/factory";
import { getShipmentOperationBlockForPrincipal } from "@/lib/shipments/operation-policy";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import {
  createExistingUserShipment,
  ShipmentServiceError,
} from "@/lib/shipments/service";
import {
  buildAdminShipmentFilter,
  enrichAdminShipments,
  listAdminPartnerOptions,
} from "@/lib/shipments/admin-integration";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/** Upload a file to Vercel Blob and return a document record with url (no base64 stored in DB). */
async function uploadDocumentToBlob(file: File, trackingId: string): Promise<ShipmentDocument & { url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const blob = await put(
    `shipment-documents/${trackingId}/${Date.now()}-${file.name}`,
    buffer,
    { access: "private", contentType: mimeType, addRandomSuffix: true }
  );
  return {
    name: file.name,
    type: mimeType,
    size: file.size,
    data: "", // legacy field; new docs use url
    uploadedAt: new Date(),
    url: blob.url
  };
}

// GET - Fetch all shipments (Admin only)
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const source = searchParams.get("source");
    const partner = searchParams.get("partner");
    const externalReference = searchParams.get("externalReference");
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "100", 10);
    const requestedSkip = Number.parseInt(searchParams.get("skip") || "0", 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 100;
    const skip = Number.isFinite(requestedSkip)
      ? Math.max(requestedSkip, 0)
      : 0;

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
    const query = await buildAdminShipmentFilter(db, {
      status,
      search,
      source,
      partnerPublicId: partner,
      externalReference,
    });

    // Fetch shipments
    const shipments = await shipmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const [shipmentsWithUsers, partnerOrganizations] = await Promise.all([
      enrichAdminShipments(db, shipments),
      listAdminPartnerOptions(db),
    ]);

    const [total, filteredTotal, inTransit, delivered, pending, cancelled] =
      await Promise.all([
        shipmentsCollection.countDocuments({}),
        shipmentsCollection.countDocuments(query),
        shipmentsCollection.countDocuments({ status: "in-transit" }),
        shipmentsCollection.countDocuments({ status: "delivered" }),
        shipmentsCollection.countDocuments({
          status: {
            $in: ["pending", "arrived-at-warehouse-pending-proof"],
          },
        }),
        shipmentsCollection.countDocuments({ status: "cancelled" }),
      ]);

    return NextResponse.json({
      shipments: shipmentsWithUsers,
      stats: {
        total,
        inTransit,
        delivered,
        pending,
        cancelled
      },
      partnerOrganizations,
      total: filteredTotal,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(filteredTotal / limit)
    });
  } catch (error) {
    console.error("GET admin shipments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

// POST - Create a new shipment for a user (Admin/Staff only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    const operationBlock = await getShipmentOperationBlockForPrincipal(
      "create",
      principal,
    );
    if (operationBlock) {
      return NextResponse.json(
        {
          error: operationBlock.reason || "Shipment creation is temporarily paused",
          code: "SHIPMENT_OPERATION_PAUSED",
          ...operationBlock,
        },
        { status: 423 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};
    let uploadedDocuments: (ShipmentDocument & { url?: string })[] | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const payload = formData.get("payload");

      if (typeof payload === "string" && payload.trim()) {
        body = JSON.parse(payload);
      }

      const files = formData.getAll("documents") as File[];
      if (files.length > 0) {
        for (const file of files) {
          if (file.size > MAX_DOCUMENT_SIZE) {
            return NextResponse.json(
              { error: `Document "${file.name}" exceeds the 10MB limit` },
              { status: 400 }
            );
          }
        }
        // Generate trackingId once for Blob path (will be reused when creating shipment below)
        const trackingIdForBlob = generateTrackingId();
        uploadedDocuments = await Promise.all(
          files.map((file) => uploadDocumentToBlob(file, trackingIdForBlob))
        );
        (body as Record<string, unknown>).__trackingIdFromBlob = trackingIdForBlob;
      }
    } else {
      body = await request.json();

      if (Array.isArray(body.documents)) {
        try {
          uploadedDocuments = await validateUploadedShipmentDocuments(
            body.documents,
            session.user.id
          );
        } catch (uploadError) {
          return NextResponse.json(
            {
              error:
                uploadError instanceof Error
                  ? uploadError.message
                  : "Invalid uploaded documents",
            },
            { status: 400 }
          );
        }
      }
    }

    if ("documents" in body) {
      delete body.documents;
    }

    // Validate userId is provided
    if (!body.userId || typeof body.userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection("users");

    // Verify user exists
    const user = await usersCollection.findOne({
      _id: new ObjectId(body.userId as string)
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate tracking ID (reuse the one from Blob upload if we uploaded documents)
    const trackingId =
      typeof (body as Record<string, unknown>).__trackingIdFromBlob === "string"
        ? ((body as Record<string, unknown>).__trackingIdFromBlob as string)
        : generateTrackingId();
    delete (body as Record<string, unknown>).__trackingIdFromBlob;

    const shipmentPayload = body as ShipmentCreationPayload;
    const { shipment: newShipment, shipmentId } =
      await createExistingUserShipment({
        db,
        principal,
        source: "admin",
        owner: {
          userId: body.userId as string,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
        payload: shipmentPayload,
        documents: uploadedDocuments,
        trackingId,
      });

    // Create notification for the user
    const notificationsCollection = db.collection("notifications");
    const userNotification = {
      userId: newShipment.userId,
      title: "Shipment Created",
      message: `Your shipment ${trackingId} has arrived at the warehouse and is awaiting proof of purchase.`,
      type: "delivery",
      isRead: false,
      createdAt: new Date()
    };
    await notificationsCollection.insertOne(userNotification);

    try {
      await sendShipmentUpdateEmail({
        firstName: user.firstName,
        email: user.email,
        trackingId,
        status: newShipment.status,
        currentLocation: newShipment.currentLocation || "USA Warehouse, USA",
        estimatedDelivery: newShipment.estimatedDelivery,
      });
    } catch (emailError) {
      console.error("Shipment creation email failed:", emailError);
    }

    return NextResponse.json(
      { 
        message: "Shipment created successfully",
        shipmentId,
        trackingId
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    console.error("POST admin shipment error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
