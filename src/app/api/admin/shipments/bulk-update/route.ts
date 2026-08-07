import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Shipment } from "@/models/Shipment";
import { sendShipmentUpdateEmail } from "@/lib/email";
import { getShipmentOperationBlockForPrincipal } from "@/lib/shipments/operation-policy";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import {
  appendUniqueBulkStatusTimelineEvent,
  createBulkStatusTimelineEvent,
} from "@/lib/shipments/timeline";
import {
  appendInternalPartnerShipmentEvent,
  getShipmentCustomerEmailMode,
} from "@/lib/shipments/admin-integration";

// POST - Bulk update shipments (Admin/Staff only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    if (principal.kind !== "internal") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

    const body = await request.json();
    const { shipmentIds, status, estimatedDelivery, deltaNumber } = body;

    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json(
        { error: "Shipment IDs array is required" },
        { status: 400 }
      );
    }

    if (!status && deltaNumber === undefined) {
      return NextResponse.json(
        { error: "At least one of status or deltaNumber is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");
    const notificationsCollection = db.collection("notifications");

    // Convert string IDs to ObjectId
    const objectIds = shipmentIds.map((id: string) => new ObjectId(id) as unknown as string);

    // Get all shipments that match the IDs
    const shipments = await shipmentsCollection.find({
      _id: { $in: objectIds }
    }).toArray();

    if (shipments.length === 0) {
      return NextResponse.json(
        { error: "No shipments found with the provided IDs" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateNow = new Date();
    const updateData: Partial<Shipment> & { updatedAt: Date } = {
      updatedAt: updateNow
    };

    if (status) {
      updateData.status = status as Shipment['status'];
    }
    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }
    if (deltaNumber !== undefined) {
      updateData.deltaNumber = typeof deltaNumber === "string" && deltaNumber.trim() ? deltaNumber.trim() : undefined;
    }

    // Update all shipments
    const result = await shipmentsCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    // For each shipment, add timeline event if status changed
    const bulkOperations = shipments.map(async (shipment) => {
      const changedFields: string[] = [];
      if (status && shipment.status !== status) changedFields.push("status");
      if (estimatedDelivery) {
        const previous = shipment.estimatedDelivery
          ? new Date(shipment.estimatedDelivery).toISOString()
          : "";
        const next = new Date(estimatedDelivery).toISOString();
        if (previous !== next) changedFields.push("estimatedDelivery");
      }
      if (deltaNumber !== undefined) {
        const nextDelta =
          typeof deltaNumber === "string" ? deltaNumber.trim() : "";
        if ((shipment.deltaNumber || "") !== nextDelta) {
          changedFields.push("deltaNumber");
        }
      }

      if (status && shipment.status !== status) {
        const timelineEvent = createBulkStatusTimelineEvent(
          shipment,
          status,
          updateNow,
        );
        const previousTimelineLength = shipment.timeline?.length || 0;
        const timeline = appendUniqueBulkStatusTimelineEvent(
          shipment,
          timelineEvent,
        );

        if (timeline.length > previousTimelineLength) {
          await shipmentsCollection.updateOne(
            { _id: shipment._id },
            { $set: { timeline } },
          );

          if (shipment.userId) {
            await notificationsCollection.insertOne({
              userId: shipment.userId,
              title: "Shipment Update",
              message: `Your shipment ${shipment.trackingId} has been updated. Status: ${timelineEvent.status}`,
              type: "update",
              isRead: false,
              relatedShipmentId: shipment._id?.toString(),
              createdAt: updateNow,
            });
          }
        }
      }

      if (changedFields.length > 0) {
        await appendInternalPartnerShipmentEvent({
          db,
          shipment,
          principal,
          type: "shipment.updated",
          payload: {
            changedFields,
            ...(status ? { status } : {}),
          },
          now: updateNow,
        });
      }

      const customerEmailMode = await getShipmentCustomerEmailMode(db, shipment);
      if (changedFields.length > 0 && customerEmailMode === "cascade") {
        try {
          await sendShipmentUpdateEmail({
            firstName: shipment.senderName.split(/\s+/)[0] || "Customer",
            email: shipment.senderEmail,
            trackingId: shipment.trackingId,
            status: status || shipment.status,
            currentLocation: shipment.currentLocation,
            estimatedDelivery:
              estimatedDelivery || shipment.estimatedDelivery,
          });
        } catch (emailError) {
          console.error(
            `Shipment update email failed for ${shipment.trackingId}:`,
            emailError
          );
        }
      }
    });

    await Promise.all(bulkOperations);

    return NextResponse.json({
      message: `Successfully updated ${result.modifiedCount} shipment(s)`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk update shipments error:", error);
    return NextResponse.json(
      { error: "Failed to update shipments" },
      { status: 500 }
    );
  }
}

