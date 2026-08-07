import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Shipment } from "@/models/Shipment";
import { canAccessPrivateUserResource } from "@/lib/shipments/private-files";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";

// GET - Fetch invoice for a shipment (User only, for their own shipments)
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
    
    const client = await clientPromise;
    const db = client.db("guangzhou");
    const shipmentsCollection = db.collection<Shipment>("shipments");

    const shipment = await shipmentsCollection.findOne({
      _id: new ObjectId(id) as unknown as string
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    if (!canAccessPrivateUserResource(principal, shipment.userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if invoice exists
    if (!shipment.invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      invoice: {
        ...shipment.invoice,
        url: shipment.invoice.url.includes(".private.blob.vercel-storage.com/")
          ? `/api/shipments/${encodeURIComponent(id)}/invoice/file`
          : shipment.invoice.url,
      }
    });
  } catch (error) {
    console.error("GET invoice error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

