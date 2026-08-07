import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { del, put } from "@vercel/blob";
import type { OrganizationDocument } from "@/lib/partner-platform/types";
import { getPrivateBlobToken } from "@/lib/identity-security";
import { buildPrivateShipmentFilePath } from "@/lib/shipments/private-files";
import { getShipmentOperationBlockForPrincipal } from "@/lib/shipments/operation-policy";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import {
  getShipmentByIdForPrincipal,
  setInternalShipmentInvoice,
  ShipmentServiceError,
} from "@/lib/shipments/service";

const MAX_INVOICE_SIZE = 10 * 1024 * 1024; // 10MB

// POST - Upload invoice for a shipment (Admin/Staff only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    const operationBlock = await getShipmentOperationBlockForPrincipal(
      "update",
      principal,
    );
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

    // Find the shipment
    const shipment = await getShipmentByIdForPrincipal(
      db,
      shipmentId,
      principal,
    );

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Upload invoice to Vercel Blob Storage
    const organization = shipment.organizationId
      ? await db.collection<OrganizationDocument>("organizations").findOne({
          _id: shipment.organizationId,
        })
      : null;
    const invoiceBuffer = Buffer.from(await invoiceFile.arrayBuffer());
    const pathname = buildPrivateShipmentFilePath({
      shipment,
      organizationPublicId: organization?.publicId,
      category: "invoices",
      fileName: invoiceFile.name,
    });
    const invoiceBlob = await put(
      pathname,
      invoiceBuffer,
      {
        access: 'private',
        contentType: 'application/pdf',
        addRandomSuffix: true,
      }
    );

    // Update shipment with invoice information
    const invoiceData = {
      url: invoiceBlob.url,
      fileName: invoiceFile.name,
      uploadedAt: new Date(),
      uploadedBy: session.user.id || "",
      pathname: invoiceBlob.pathname,
    };

    const { previousInvoice } = await setInternalShipmentInvoice({
      db,
      id: shipmentId,
      principal,
      invoice: invoiceData,
    });

    if (previousInvoice?.url && previousInvoice.url !== invoiceBlob.url) {
      try {
        await del(previousInvoice.pathname || previousInvoice.url, {
          token: getPrivateBlobToken(),
        });
      } catch (cleanupError) {
        console.error("Previous invoice cleanup failed", cleanupError);
        await db.collection("orphaned_blobs").insertOne({
          pathname: previousInvoice.pathname,
          url: previousInvoice.url,
          reason: "invoice_replaced",
          shipmentId,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      message: "Invoice uploaded successfully",
      invoice: invoiceData
    });
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    console.error("Upload invoice error:", error);
    return NextResponse.json(
      { error: "Failed to upload invoice" },
      { status: 500 }
    );
  }
}

