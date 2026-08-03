import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import {
  getShipmentOperations,
  shipmentOperationNames,
} from "@/lib/shipment-operations";

const updateSchema = z.object({
  action: z.enum(shipmentOperationNames),
  pausedUntil: z.string().datetime().nullable(),
  reason: z.string().trim().max(250).optional(),
});

interface SystemControlDocument {
  _id: string;
  [key: string]: unknown;
}

async function requireSuperAdmin() {
  const session = await auth();
  return session?.user?.role === "super_admin" ? session : null;
}

export async function GET() {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { operations: await getShipmentOperations() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET shipment operation controls error:", error);
    return NextResponse.json(
      { error: "Failed to load operation controls" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid control update" },
        { status: 400 }
      );
    }

    const { action, pausedUntil: pausedUntilText, reason } = parsed.data;
    const pausedUntil = pausedUntilText ? new Date(pausedUntilText) : null;

    if (pausedUntil && pausedUntil.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "The pause end time must be in the future" },
        { status: 400 }
      );
    }

    const maximumPause = Date.now() + 366 * 24 * 60 * 60 * 1000;
    if (pausedUntil && pausedUntil.getTime() > maximumPause) {
      return NextResponse.json(
        { error: "A pause cannot be scheduled for more than one year" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("guangzhou");
    const now = new Date();
    const operationState = {
      pausedUntil,
      reason: pausedUntil ? reason?.trim() || null : null,
    };

    await db.collection<SystemControlDocument>("system_controls").updateOne(
      { _id: "shipment_operations" },
      {
        $set: {
          [`operations.${action}`]: operationState,
          updatedAt: now,
          updatedBy: session.user.id,
        },
      },
      { upsert: true }
    );

    await db.collection("super_admin_audit_logs").insertOne({
      actorId: session.user.id,
      actorUsername: session.user.username,
      action: pausedUntil ? "shipment_operation_paused" : "shipment_operation_resumed",
      operation: action,
      pausedUntil,
      reason: operationState.reason,
      createdAt: now,
    });

    return NextResponse.json({
      message: pausedUntil ? "Operation paused successfully" : "Operation resumed successfully",
      operations: await getShipmentOperations(),
    });
  } catch (error) {
    console.error("PATCH shipment operation controls error:", error);
    return NextResponse.json(
      { error: "Failed to update operation controls" },
      { status: 500 }
    );
  }
}
