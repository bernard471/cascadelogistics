import type { ShipmentPrincipal } from "./principals.ts";
import { canAccessUserOwnedResource } from "./policies.ts";
import type { Shipment } from "../../models/Shipment";

export type VercelBlobAccessKind = "private" | "public";

export function safeDownloadFileName(fileName: string): string {
  return fileName.replace(/[\r\n"]/g, "_");
}

function safePathSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 180) || "file";
}

export function buildPrivateShipmentFilePath(input: {
  shipment: Shipment;
  organizationPublicId?: string;
  category: "invoices" | "shipment-updates";
  fileName: string;
  now?: Date;
}): string {
  const now = input.now || new Date();
  const fileName = `${now.getTime()}-${safePathSegment(input.fileName)}`;
  if (
    input.shipment.createdVia === "partner_api" &&
    input.shipment.publicId &&
    input.shipment.environment &&
    input.organizationPublicId
  ) {
    return `partner-files/${input.shipment.environment}/${safePathSegment(input.organizationPublicId)}/${safePathSegment(input.shipment.publicId)}/${input.category}/${fileName}`;
  }
  return `${input.category}/${safePathSegment(input.shipment.trackingId)}/${fileName}`;
}

export function getTrustedVercelBlobAccessKind(
  value: string,
): VercelBlobAccessKind | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname.endsWith(".private.blob.vercel-storage.com")) {
      return "private";
    }
    if (url.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return "public";
    }
    return null;
  } catch {
    return null;
  }
}

export function canAccessPrivateUserResource(
  principal: ShipmentPrincipal,
  ownerUserId?: string,
): boolean {
  return canAccessUserOwnedResource(principal, ownerUserId);
}
