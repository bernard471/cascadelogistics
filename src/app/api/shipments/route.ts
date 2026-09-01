import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Shipment, ShipmentDocument } from "@/models/Shipment";
import { MongoQuery } from "@/types";
import { sendAdminShipmentCreatedNotification } from "@/lib/email";
import { validateUploadedShipmentDocuments } from "@/lib/shipment-documents";
import type { ShipmentCreationPayload } from "@/lib/shipments/factory";
import { getShipmentOperationBlockForPrincipal } from "@/lib/shipments/operation-policy";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import {
  createExistingUserShipment,
  ShipmentServiceError,
} from "@/lib/shipments/service";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

async function fileToShipmentDocument(file: File): Promise<ShipmentDocument> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "application/octet-stream";

  return {
    name: file.name,
    type: mimeType,
    size: file.size,
    data: `data:${mimeType};base64,${base64}`,
    uploadedAt: new Date()
  };
}

// GET - Fetch all shipments for the logged-in user
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    // Build query
    const query: MongoQuery = { userId: session.user.id };
    if (status && status !== "all") {
      query.status = status;
    }

    // Fetch shipments with pagination
    const shipments = await shipmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await shipmentsCollection.countDocuments(query);

    return NextResponse.json({
      shipments: shipments.map(s => ({ ...s, _id: s._id?.toString() })),
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET shipments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

// POST - Create a new shipment
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    const operationBlock = await getShipmentOperationBlockForPrincipal(
      "submit",
      principal,
    );
    if (operationBlock) {
      return NextResponse.json(
        {
          error: operationBlock.reason || "Shipment submissions are temporarily paused",
          code: "SHIPMENT_OPERATION_PAUSED",
          ...operationBlock,
        },
        { status: 423 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};
    let uploadedDocuments: ShipmentDocument[] | undefined;

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
        uploadedDocuments = await Promise.all(files.map(fileToShipmentDocument));
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

    if (!uploadedDocuments?.length) {
      return NextResponse.json(
        { error: "At least one proof of purchase is required" },
        { status: 400 },
      );
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const usersCollection = db.collection("users");

    // Get user info for sender/receiver
    const user = await usersCollection.findOne({
      _id: new ObjectId(session.user.id)
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const shipmentPayload = body as ShipmentCreationPayload;
    const { shipment: newShipment, shipmentId } =
      await createExistingUserShipment({
        db,
        principal,
        source: "customer",
        owner: {
          userId: session.user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
        payload: shipmentPayload,
        documents: uploadedDocuments,
      });
    const trackingId = newShipment.trackingId;

    // Create notification for the user
    const notificationsCollection = db.collection("notifications");
    const userNotification = {
      userId: newShipment.userId,
      title: "Shipment Created",
      message: `Your shipment ${trackingId} has been created successfully and is now being processed.`,
      type: "delivery",
      isRead: false,
      createdAt: new Date()
    };
    await notificationsCollection.insertOne(userNotification);

    // Create notification for admin
    const adminNotification = {
      userId: "admin",
      title: "New Shipment Created",
      message: `A new shipment ${trackingId} has been created by ${user.firstName} ${user.lastName}.`,
      type: "shipment",
      isRead: false,
      relatedShipmentId: shipmentId,
      createdAt: new Date()
    };
    await notificationsCollection.insertOne(adminNotification);

    try {
      await sendAdminShipmentCreatedNotification({
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        trackingId,
        wholesaleTrackingNumbers: (newShipment.wholesalePurchases || [])
          .map((purchase) => purchase.trackingNumber?.trim())
          .filter((number): number is string => Boolean(number)),
      });
    } catch (emailError) {
      console.error("Admin shipment notification email failed:", emailError);
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
    console.error("POST shipment error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
