"use client";

import { useState, useEffect } from "react";
import { X, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewInvoiceModalProps {
  shipmentId: string;
  trackingId: string;
  onClose: () => void;
}

interface InvoiceData {
  url: string;
  fileName: string;
  uploadedAt: string;
}

export default function ViewInvoiceModal({ shipmentId, trackingId, onClose }: ViewInvoiceModalProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/shipments/${shipmentId}/invoice`);
        
        if (response.status === 404) {
          setInvoice(null);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch invoice");
        }

        const data = await response.json();
        setInvoice(data.invoice);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        setError("Failed to load invoice information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [shipmentId]);

  const handleDownload = () => {
    if (invoice?.url) {
      const separator = invoice.url.includes("?") ? "&" : "?";
      window.open(`${invoice.url}${separator}download=1`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#315694]" />
            <h2 className="text-xl font-bold text-gray-800">Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Shipment Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-1">Shipment Tracking ID</p>
            <p className="text-lg font-semibold text-gray-800">{trackingId}</p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-[#315694] animate-spin mb-4" />
              <p className="text-gray-600">Loading invoice information...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* No Invoice State */}
          {!isLoading && !error && !invoice && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Invoice Not Uploaded Yet</h3>
              <p className="text-gray-600 text-center max-w-md">
                The invoice for this shipment has not been uploaded yet. Please check back later or contact support if you believe this is an error.
              </p>
            </div>
          )}

          {/* Invoice Available State */}
          {!isLoading && !error && invoice && (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">Invoice Available</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">File Name: </span>
                    <span className="font-medium text-gray-800">{invoice.fileName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Uploaded: </span>
                    <span className="font-medium text-gray-800">
                      {new Date(invoice.uploadedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* PDF Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={invoice.url}
                  className="w-full h-96"
                  title="Invoice Preview"
                />
              </div>

              {/* Download Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleDownload}
                  className="bg-[#315694] hover:bg-[#244a73] text-white px-6 flex items-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  <Download className="w-4 h-4" />
                  Download Invoice
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

