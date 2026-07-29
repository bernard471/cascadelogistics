import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import type { Shipment, ShipmentDocument } from "@/models/Shipment";
import { MongoQuery } from "@/types";
import { sendShipmentUpdateEmail } from "@/lib/email";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/** Upload a file to Vercel Blob and return a document record with url (no base64 stored in DB). */
async function uploadDocumentToBlob(file: File, trackingId: string): Promise<ShipmentDocument & { url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const blob = await put(
    `shipment-documents/${trackingId}/${Date.now()}-${file.name}`,
    buffer,
    { access: "public", contentType: mimeType }
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
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = parseInt(searchParams.get("skip") || "0");

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
    const usersCollection = db.collection("users");

    // Build query
    const query: MongoQuery = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } },
        { receiverName: { $regex: search, $options: 'i' } },
        { senderCity: { $regex: search, $options: 'i' } },
        { receiverCity: { $regex: search, $options: 'i' } },
        { deltaNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch shipments
    const shipments = await shipmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Enrich with user data
    const shipmentsWithUsers = await Promise.all(
      shipments.map(async (shipment) => {
        const user = await usersCollection.findOne(
          { _id: new ObjectId(shipment.userId) },
          { projection: { firstName: 1, lastName: 1, email: 1 } }
        );
        
        return {
          ...shipment,
          _id: shipment._id?.toString(),
          customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          customerEmail: user?.email || ''
        };
      })
    );

    // Get stats
    const total = await shipmentsCollection.countDocuments({});
    const inTransit = await shipmentsCollection.countDocuments({ status: 'in-transit' });
    const delivered = await shipmentsCollection.countDocuments({ status: 'delivered' });
    const pending = await shipmentsCollection.countDocuments({ status: 'pending' });
    const cancelled = await shipmentsCollection.countDocuments({ status: 'cancelled' });

    return NextResponse.json({
      shipments: shipmentsWithUsers,
      stats: {
        total,
        inTransit,
        delivered,
        pending,
        cancelled
      },
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
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
        const ts = Date.now().toString().slice(-6);
        const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
        const trackingIdForBlob = `CLL${ts}${rnd}`;
        uploadedDocuments = await Promise.all(
          files.map((file) => uploadDocumentToBlob(file, trackingIdForBlob))
        );
        (body as Record<string, unknown>).__trackingIdFromBlob = trackingIdForBlob;
      }
    } else {
      body = await request.json();

      if (Array.isArray(body.documents)) {
        uploadedDocuments = body.documents as (ShipmentDocument & { url?: string })[];
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
    const shipmentsCollection = db.collection<Shipment>("shipments");
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
        : (() => {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
            return `CLL${timestamp}${random}`;
          })();
    delete (body as Record<string, unknown>).__trackingIdFromBlob;

    // Create new shipment
    type ShipmentCreationPayload = Omit<
      Shipment,
      '_id' | 'trackingId' | 'userId' | 'status' | 'timeline' | 'createdAt' | 'updatedAt' | 'documents' | 'senderName' | 'senderEmail' | 'senderPhone' | 'senderAddress' | 'senderCity' | 'senderCountry' | 'receiverName' | 'receiverEmail' | 'receiverPhone' | 'receiverAddress' | 'receiverCity' | 'receiverCountry'
    >;

    const shipmentPayload = body as ShipmentCreationPayload;

    // Ensure goodsType defaults to 'normal' if not provided
    const goodsType = shipmentPayload.goodsType || 'normal';

    // Get DELTA number if provided (optional, admin/staff only)
    const deltaNumber = shipmentPayload.deltaNumber?.trim() || undefined;

    // Set standard route: USA Warehouse, USA → Ghana Warehouse, Ghana
    const newShipment: Omit<Shipment, '_id'> = {
      ...shipmentPayload,
      declaredValue: Number((shipmentPayload as Record<string, unknown>).declaredValue) || 0,
      goodsType,
      trackingId,
      userId: body.userId as string,
      status: 'arrived-at-warehouse', // Admin/staff creates with arrived-at-warehouse status
      deltaNumber,
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
          status: 'Arrived at Warehouse',
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
      message: `Your shipment ${trackingId} has been created and has arrived at the warehouse.`,
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
        shipmentId: result.insertedId.toString(),
        trackingId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST admin shipment error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
