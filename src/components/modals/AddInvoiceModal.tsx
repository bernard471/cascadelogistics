"use client";

import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddInvoiceModalProps {
  shipmentId: string;
  trackingId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AddInvoiceModal({ shipmentId, trackingId, onClose, onSave }: AddInvoiceModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only");
      setSelectedFile(null);
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a PDF file to upload");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("invoice", selectedFile);
      formData.append("shipmentId", shipmentId);

      const response = await fetch("/api/admin/shipments/invoice", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to upload invoice");
        setIsUploading(false);
        return;
      }

      setSuccess("Invoice uploaded successfully!");
      
      // Reset form and close after short delay
      setTimeout(() => {
        onSave(); // Refresh the shipment list
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Upload invoice error:", error);
      setError("An error occurred while uploading the invoice");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-[#315694]" />
            <h2 className="text-xl font-bold text-gray-800">Add Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Shipment Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Shipment Tracking ID</p>
            <p className="text-lg font-semibold text-gray-800">{trackingId}</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice PDF *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#315694] transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="invoice-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="invoice-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {selectedFile ? (
                  <>
                    <FileText className="w-12 h-12 text-[#315694]" />
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400" />
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF only (Max. 10MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="bg-[#315694] hover:bg-[#244a73] text-white px-6 flex items-center gap-2"
              style={{ borderRadius: "10px 0px 10px 0px" }}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

