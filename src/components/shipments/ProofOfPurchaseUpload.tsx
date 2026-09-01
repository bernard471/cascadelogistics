"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_SHIPMENT_DOCUMENTS_PER_SHIPMENT,
  uploadShipmentDocuments,
} from "@/lib/shipment-document-upload";
import type { ShipmentDocument } from "@/types";

interface ProofOfPurchaseUploadProps {
  shipmentId: string;
  trackingId: string;
  existingProofCount?: number;
  onUploaded?: (documents: ShipmentDocument[]) => void | Promise<void>;
}

export default function ProofOfPurchaseUpload({
  shipmentId,
  trackingId,
  existingProofCount = 0,
  onUploaded,
}: ProofOfPurchaseUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const remaining = Math.max(
    0,
    MAX_SHIPMENT_DOCUMENTS_PER_SHIPMENT - existingProofCount,
  );

  const addFiles = (selectedFiles: FileList | File[]) => {
    const incoming = Array.from(selectedFiles);
    const tooLarge = incoming.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      setError(`"${tooLarge.name}" exceeds the 10MB limit.`);
      return;
    }

    setFiles((current) => {
      const existing = new Set(
        current.map((file) => `${file.name}-${file.size}`),
      );
      const unique = incoming.filter(
        (file) => !existing.has(`${file.name}-${file.size}`),
      );
      if (current.length + unique.length > remaining) {
        setError(
          `You can add ${remaining} more proof-of-purchase file${remaining === 1 ? "" : "s"} to this shipment.`,
        );
        return current;
      }
      setError("");
      setSuccess("");
      return [...current, ...unique];
    });
  };

  const submitProof = async () => {
    if (files.length === 0) {
      setError("Select at least one proof-of-purchase file.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const documents = await uploadShipmentDocuments(
        files,
        "submit",
        (current, total, fileName) =>
          setProgress(`Uploading ${current} of ${total}: ${fileName}`),
      );
      setProgress("Saving proof of purchase...");
      const response = await fetch(
        `/api/shipments/${encodeURIComponent(shipmentId)}/proof-of-purchase`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documents }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit proof of purchase");
      }

      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      setSuccess(
        `Proof of purchase submitted for shipment ${trackingId}. Our team has been notified.`,
      );
      await onUploaded?.(data.documents || []);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to submit proof of purchase",
      );
    } finally {
      setProgress("");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-5 w-5 text-amber-700" />
        <h3 className="font-bold text-gray-800">Submit Proof of Purchase</h3>
      </div>
      <p className="mb-4 text-sm text-gray-700">
        Upload one or more receipts, invoices, or order confirmations. You can
        add multiple files when this shipment contains multiple Purchase Shop
        Tracking Numbers.
      </p>

      {remaining > 0 ? (
        <div
          className="cursor-pointer rounded-lg border-2 border-dashed border-amber-300 bg-white p-5 text-center transition-colors hover:border-amber-500"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
          }}
        >
          <Upload className="mx-auto mb-2 h-8 w-8 text-amber-600" />
          <p className="text-sm font-medium text-gray-700">
            Click to select or drag and drop files
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PDF, Word, PNG, JPG or WebP · 10MB each · {remaining} remaining
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      ) : (
        <p className="rounded-md bg-white p-3 text-sm text-gray-700">
          The maximum number of proof-of-purchase files has been submitted.
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between rounded-md border border-amber-200 bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate pr-3 text-gray-800">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFiles((current) =>
                    current.filter((_, fileIndex) => fileIndex !== index),
                  )
                }
                aria-label={`Remove ${file.name}`}
                className="text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-700">{success}</p>}
      {progress && <p className="mt-3 text-sm text-[#055b8e]">{progress}</p>}

      {files.length > 0 && (
        <Button
          type="button"
          onClick={submitProof}
          disabled={isSubmitting}
          className="mt-4 bg-[#055b8e] text-white hover:bg-[#044a73]"
        >
          {isSubmitting ? "Submitting..." : "Submit proof of purchase"}
        </Button>
      )}
    </div>
  );
}
