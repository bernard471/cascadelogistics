import crypto from "crypto";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrivateBlobToken } from "@/lib/identity-security";
import { getShipmentOperationBlock } from "@/lib/shipment-operations";
import {
  MAX_SHIPMENT_DOCUMENT_SIZE,
  SHIPMENT_DOCUMENT_CONTENT_TYPES,
} from "@/lib/shipment-documents";

type ShipmentUploadMode = "create" | "submit";

function parseMode(value: string | null): ShipmentUploadMode {
  if (value !== "create" && value !== "submit") {
    throw new Error("Invalid shipment upload mode");
  }
  return value;
}

async function authorizeMode(mode: ShipmentUploadMode) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (
    mode === "create" &&
    !["admin", "staff", "super_admin"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized");
  }

  const operationBlock = await getShipmentOperationBlock(
    mode === "create" ? "create" : "submit",
    session.user.role
  );
  if (operationBlock) {
    throw new Error(
      operationBlock.reason || "Shipment uploads are temporarily paused"
    );
  }

  return session.user;
}

export async function GET(request: Request) {
  try {
    const mode = parseMode(new URL(request.url).searchParams.get("mode"));
    const user = await authorizeMode(mode);
    return NextResponse.json({
      prefix: `shipment-documents/${user.id}/${crypto.randomUUID()}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload unavailable" },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      token: getPrivateBlobToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!clientPayload) throw new Error("Missing upload authorization");
        const parsed = JSON.parse(clientPayload) as {
          mode?: string;
          prefix?: string;
        };
        const mode = parseMode(parsed.mode || null);
        const user = await authorizeMode(mode);
        const expectedRoot = `shipment-documents/${user.id}/`;

        if (
          typeof parsed.prefix !== "string" ||
          !parsed.prefix.startsWith(expectedRoot) ||
          !pathname.startsWith(`${parsed.prefix}/`)
        ) {
          throw new Error("Upload path is not authorized");
        }

        return {
          allowedContentTypes: SHIPMENT_DOCUMENT_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SHIPMENT_DOCUMENT_SIZE,
          validUntil: Date.now() + 15 * 60 * 1000,
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Shipment document upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
