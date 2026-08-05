import { head } from "@vercel/blob";
import type { ShipmentDocument } from "@/models/Shipment";
import { getPrivateBlobToken } from "@/lib/identity-security";

export const MAX_SHIPMENT_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const MAX_SHIPMENT_DOCUMENTS = 20;

export const SHIPMENT_DOCUMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type UploadedDocumentInput = Partial<ShipmentDocument> & {
  pathname?: unknown;
};

export async function validateUploadedShipmentDocuments(
  value: unknown,
  uploaderId: string
): Promise<ShipmentDocument[]> {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_SHIPMENT_DOCUMENTS) {
    throw new Error(`You can upload up to ${MAX_SHIPMENT_DOCUMENTS} documents`);
  }

  const expectedPrefix = `shipment-documents/${uploaderId}/`;

  return Promise.all(
    value.map(async (rawValue, index) => {
      if (!rawValue || typeof rawValue !== "object") {
        throw new Error(`Document ${index + 1} is invalid`);
      }

      const input = rawValue as UploadedDocumentInput;
      if (
        typeof input.pathname !== "string" ||
        !input.pathname.startsWith(expectedPrefix)
      ) {
        throw new Error(`Document ${index + 1} was not uploaded by this account`);
      }

      const blob = await head(input.pathname, { token: getPrivateBlobToken() });
      if (!blob.pathname.startsWith(expectedPrefix)) {
        throw new Error(`Document ${index + 1} has an invalid storage path`);
      }
      if (blob.size > MAX_SHIPMENT_DOCUMENT_SIZE) {
        throw new Error(`Document ${index + 1} exceeds the 10MB limit`);
      }
      if (!SHIPMENT_DOCUMENT_CONTENT_TYPES.includes(blob.contentType)) {
        throw new Error(`Document ${index + 1} has an unsupported file type`);
      }

      const submittedName =
        typeof input.name === "string" && input.name.trim()
          ? input.name.trim()
          : blob.pathname.split("/").pop() || `Document ${index + 1}`;

      return {
        name: submittedName.replace(/[\r\n"]/g, "_").slice(0, 180),
        type: blob.contentType,
        size: blob.size,
        data: "",
        uploadedAt: blob.uploadedAt,
        url: blob.url,
        pathname: blob.pathname,
      };
    })
  );
}
