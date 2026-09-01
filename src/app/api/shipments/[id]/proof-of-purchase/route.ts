import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { sendAdminProofOfPurchaseNotification } from "@/lib/email";
import { validateUploadedShipmentDocuments } from "@/lib/shipment-documents";
import { getShipmentOperationBlockForPrincipal } from "@/lib/shipments/operation-policy";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import {
  ShipmentServiceError,
  submitCustomerProofOfPurchase,
} from "@/lib/shipments/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    if (principal.kind !== "customer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const operationBlock = await getShipmentOperationBlockForPrincipal(
      "update",
      principal,
    );
    if (operationBlock) {
      return NextResponse.json(
        {
          error:
            operationBlock.reason ||
            "Proof-of-purchase submissions are temporarily paused",
          code: "SHIPMENT_OPERATION_PAUSED",
          ...operationBlock,
        },
        { status: 423 },
      );
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shipment ID" }, { status: 400 });
    }
    let documents;
    try {
      const body = (await request.json()) as { documents?: unknown };
      documents = await validateUploadedShipmentDocuments(
        body.documents,
        session.user.id,
      );
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : "Invalid proof-of-purchase files",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const result = await submitCustomerProofOfPurchase({
      db,
      id,
      principal,
      documents,
    });

    await db.collection("notifications").insertOne({
      userId: "admin",
      title: "Proof of Purchase Submitted",
      message: `${result.shipment.senderName} uploaded proof of purchase for shipment ${result.shipment.trackingId}.`,
      type: "shipment",
      isRead: false,
      relatedShipmentId: id,
      createdAt: new Date(),
    });

    try {
      await sendAdminProofOfPurchaseNotification({
        customerName: result.shipment.senderName,
        customerEmail: result.shipment.senderEmail,
        trackingId: result.shipment.trackingId,
        proofCount: result.proofDocuments.length,
      });
    } catch (emailError) {
      console.error("Admin proof-of-purchase email failed:", emailError);
    }

    return NextResponse.json({
      message: "Proof of purchase submitted successfully",
      documents: result.proofDocuments,
      proofCount: result.proofCount,
    });
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    console.error("Proof-of-purchase submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit proof of purchase" },
      { status: 500 },
    );
  }
}
