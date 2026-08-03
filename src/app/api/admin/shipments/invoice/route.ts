import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import type { Shipment } from "@/models/Shipment";
import { getShipmentOperationBlock } from "@/lib/shipment-operations";

const MAX_INVOICE_SIZE = 10 * 1024 * 1024; // 10MB

// POST - Upload invoice for a shipment (Admin/Staff only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const operationBlock = await getShipmentOperationBlock("update", session.user.role);
    if (operationBlock) {
      return NextResponse.json(
        {
          error: operationBlock.reason || "Shipment updates are temporarily paused",
          code: "SHIPMENT_OPERATION_PAUSED",
          ...operationBlock,
        },
        { status: 423 }
      );
    }

    const formData = await request.formData();
    const invoiceFile = formData.get("invoice") as File | null;
    const shipmentId = formData.get("shipmentId") as string | null;

    if (!invoiceFile || !shipmentId) {
      return NextResponse.json(
        { error: "Invoice file and shipment ID are required" },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (invoiceFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (invoiceFile.size > MAX_INVOICE_SIZE) {
      return NextResponse.json(
        { error: "Invoice file exceeds the 10MB limit" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    // Find the shipment
    const shipment = await shipmentsCollection.findOne({
      _id: new ObjectId(shipmentId) as unknown as string
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Upload invoice to Vercel Blob Storage
    const invoiceBuffer = Buffer.from(await invoiceFile.arrayBuffer());
    const invoiceBlob = await put(
      `invoices/${shipment.trackingId}/${Date.now()}-${invoiceFile.name}`,
      invoiceBuffer,
      {
        access: 'public',
        contentType: 'application/pdf',
      }
    );

    // Update shipment with invoice information
    const invoiceData = {
      url: invoiceBlob.url,
      fileName: invoiceFile.name,
      uploadedAt: new Date(),
      uploadedBy: session.user.id || ""
    };

    await shipmentsCollection.updateOne(
      { _id: new ObjectId(shipmentId) as unknown as string },
      {
        $set: {
          invoice: invoiceData,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      message: "Invoice uploaded successfully",
      invoice: invoiceData
    });
  } catch (error) {
    console.error("Upload invoice error:", error);
    return NextResponse.json(
      { error: "Failed to upload invoice" },
      { status: 500 }
    );
  }
}

