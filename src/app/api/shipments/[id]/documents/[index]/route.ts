import { get } from "@vercel/blob";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Shipment } from "@/models/Shipment";

function safeFileName(fileName: string): string {
  return fileName.replace(/[\r\n"]/g, "_");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, index } = await params;
    const documentIndex = Number(index);
    if (!ObjectId.isValid(id) || !Number.isInteger(documentIndex) || documentIndex < 0) {
      return NextResponse.json({ error: "Invalid document" }, { status: 400 });
    }

    const client = await clientPromise;
    const shipment = await client
      .db("guangzhou")
      .collection<Shipment>("shipments")
      .findOne({ _id: new ObjectId(id) as unknown as string });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const canViewAnyShipment = ["admin", "staff", "super_admin"].includes(
      session.user.role
    );
    if (!canViewAnyShipment && shipment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const document = shipment.documents?.[documentIndex];
    const documentUrl = document?.url || document?.data;
    if (!document || !documentUrl) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!documentUrl.includes(".private.blob.vercel-storage.com/")) {
      try {
        const publicUrl = new URL(documentUrl);
        if (!publicUrl.hostname.endsWith(".public.blob.vercel-storage.com")) {
          throw new Error("Untrusted document URL");
        }
        return NextResponse.redirect(publicUrl);
      } catch {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
    }

    const blob = await get(documentUrl, { access: "private" });
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || document.type || "application/octet-stream",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeFileName(document.name)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET shipment document error:", error);
    return NextResponse.json({ error: "Unable to retrieve document" }, { status: 500 });
  }
}
