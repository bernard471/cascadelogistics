import { get } from "@vercel/blob";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Shipment } from "@/models/Shipment";
import { shipmentPrincipalFromSessionUser } from "@/lib/shipments/principals";
import {
  canAccessPrivateUserResource,
  getTrustedVercelBlobAccessKind,
  safeDownloadFileName,
} from "@/lib/shipments/private-files";

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
      return NextResponse.json({ error: "Invalid shipment" }, { status: 400 });
    }

    const client = await clientPromise;
    const shipment = await client
      .db("guangzhou")
      .collection<Shipment>("shipments")
      .findOne({ _id: new ObjectId(id) as unknown as string });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const principal = shipmentPrincipalFromSessionUser(session.user);
    if (!canAccessPrivateUserResource(principal, shipment.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invoice = shipment.invoice;
    if (!invoice?.url) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const blobAccess = getTrustedVercelBlobAccessKind(invoice.url);
    if (blobAccess === "public") {
      try {
        const publicUrl = new URL(invoice.url);
        return NextResponse.redirect(publicUrl);
      } catch {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
    }
    if (blobAccess !== "private") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const blob = await get(invoice.url, { access: "private" });
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeDownloadFileName(invoice.fileName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET shipment invoice file error:", error);
    return NextResponse.json({ error: "Unable to retrieve invoice" }, { status: 500 });
  }
}
