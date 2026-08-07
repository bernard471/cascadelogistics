import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getShipmentOperationBlockForPrincipal } from "@/lib/shipments/operation-policy";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import { customerShipmentUpdateSchema } from "@/lib/shipments/schemas";
import {
  deleteCustomerShipment,
  getShipmentByIdForPrincipal,
  ShipmentServiceError,
  updateCustomerShipment,
} from "@/lib/shipments/service";

// GET - Fetch single shipment by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shipment ID" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const principal = shipmentPrincipalFromSessionUser(session.user);
    const shipment = await getShipmentByIdForPrincipal(db, id, principal);

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ ...shipment, _id: shipment._id?.toString() });
  } catch (error) {
    console.error("GET shipment by ID error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 }
    );
  }
}

// PUT - Update shipment by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
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

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shipment ID" }, { status: 400 });
    }
    const parsed = customerShipmentUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid shipment details" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    await updateCustomerShipment({
      db,
      id,
      principal,
      data: parsed.data,
    });

    return NextResponse.json({ message: "Shipment updated successfully" });
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    console.error("PUT shipment error:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipment by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid shipment ID" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const principal = shipmentPrincipalFromSessionUser(session.user);
    await deleteCustomerShipment({ db, id, principal });

    return NextResponse.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    console.error("DELETE shipment error:", error);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}
