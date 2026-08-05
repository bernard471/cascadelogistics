"use client";

import { upload } from "@vercel/blob/client";
import type { ShipmentDocument } from "@/types";

type ShipmentUploadMode = "create" | "submit";
export const MAX_SHIPMENT_DOCUMENTS_PER_SHIPMENT = 20;

function safePathFileName(fileName: string) {
  return (
    fileName
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "document"
  );
}

export async function uploadShipmentDocuments(
  files: File[],
  mode: ShipmentUploadMode,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<ShipmentDocument[]> {
  if (files.length === 0) return [];

  const sessionResponse = await fetch(
    `/api/shipments/upload?mode=${encodeURIComponent(mode)}`,
    { cache: "no-store" }
  );
  const sessionData = await sessionResponse.json();
  if (!sessionResponse.ok || typeof sessionData.prefix !== "string") {
    throw new Error(sessionData.error || "Unable to start document upload");
  }

  const uploadedDocuments: ShipmentDocument[] = [];

  for (const [index, file] of files.entries()) {
    onProgress?.(index + 1, files.length, file.name);
    const blob = await upload(
      `${sessionData.prefix}/${safePathFileName(file.name)}`,
      file,
      {
        access: "private",
        handleUploadUrl: "/api/shipments/upload",
        clientPayload: JSON.stringify({ mode, prefix: sessionData.prefix }),
        contentType: file.type || "application/octet-stream",
        multipart: file.size > 4 * 1024 * 1024,
      }
    );

    uploadedDocuments.push({
      name: file.name,
      type: blob.contentType || file.type || "application/octet-stream",
      size: file.size,
      data: "",
      uploadedAt: new Date().toISOString(),
      url: blob.url,
      pathname: blob.pathname,
    });
  }

  return uploadedDocuments;
}
