import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Shipment, ShipmentDocument } from "@/models/Shipment";
import { MongoQuery } from "@/types";
import { sendAdminShipmentCreatedNotification } from "@/lib/email";

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
        uploadedDocuments = body.documents as ShipmentDocument[];
      }
    }

    if ("documents" in body) {
      delete body.documents;
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
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

    // Generate tracking ID
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const trackingId = `CLL${timestamp}${random}`;

    // Create new shipment
    type ShipmentCreationPayload = Omit<
      Shipment,
      '_id' | 'trackingId' | 'userId' | 'status' | 'timeline' | 'createdAt' | 'updatedAt' | 'documents' | 'senderName' | 'senderEmail' | 'senderPhone' | 'senderAddress' | 'senderCity' | 'senderCountry' | 'receiverName' | 'receiverEmail' | 'receiverPhone' | 'receiverAddress' | 'receiverCity' | 'receiverCountry'
    >;

    const shipmentPayload = body as ShipmentCreationPayload;

    // Ensure goodsType defaults to 'normal' if not provided (for backward compatibility)
    const goodsType = shipmentPayload.goodsType || 'normal';

    // Set standard route: USA Warehouse, USA → Ghana Warehouse, Ghana
    const newShipment: Omit<Shipment, '_id'> = {
      ...shipmentPayload,
      goodsType,
      trackingId,
      userId: session.user.id,
      status: 'pending', // User creates with pending status
      documents: uploadedDocuments?.length ? uploadedDocuments : undefined,
      // Standard sender info (USA Warehouse)
      senderName: `${user.firstName} ${user.lastName}`,
      senderEmail: user.email,
      senderPhone: user.phone || '',
      senderAddress: 'USA Warehouse',
      senderCity: 'USA Warehouse',
      senderCountry: 'USA',
      // Standard receiver info (Ghana Warehouse)
      receiverName: `${user.firstName} ${user.lastName}`,
      receiverEmail: user.email,
      receiverPhone: user.phone || '',
      receiverAddress: 'Ghana Warehouse',
      receiverCity: 'Ghana Warehouse',
      receiverCountry: 'Ghana',
      timeline: [
        {
          status: 'Order Placed',
          location: 'USA Warehouse, USA',
          date: new Date(),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          completed: true
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await shipmentsCollection.insertOne(newShipment);

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
      relatedShipmentId: result.insertedId.toString(),
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
        shipmentId: result.insertedId.toString(),
        trackingId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST shipment error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
