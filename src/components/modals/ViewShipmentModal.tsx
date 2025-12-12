"use client";

import { useState, useEffect } from "react";
import { X, Package, MapPin, User, Truck, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShipmentDocument } from "@/types";

// Mapped shipment type for modal use
interface MappedShipment {
  id: string;
  _id: string;
  customer: string;
  origin: string;
  destination: string;
  status: string;
  statusColor: string;
  date: string;
  estimatedDelivery: string;
  packageType: string;
  weight: string;
  value: string;
  service: string;
  servicePrice?: number;
  documents?: (ShipmentDocument | string)[];
  wholesalePurchases?: Array<{
    name: string;
    trackingNumber: string;
  }>;
  shippingMarkName?: string;
  shippingMark?: string;
}

interface ViewShipmentModalProps {
  shipment: MappedShipment;
  onClose: () => void;
}

// Helper function to check if document is an image
function isImageDocument(doc: ShipmentDocument | string): boolean {
  if (typeof doc === "string") {
    return /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(doc) || doc.startsWith("data:image/");
  }
  const mimeType = doc.type || "";
  return mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(doc.name);
}

export default function ViewShipmentModal({ shipment, onClose }: ViewShipmentModalProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewingImage) {
        setViewingImage(null);
      }
    };

    if (viewingImage) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when image modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [viewingImage]);

  if (!shipment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Shipment Details</h2>
            <p className="text-sm text-gray-600 mt-1">Tracking ID: {shipment.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${shipment.statusColor}`}>
              {shipment.status}
            </span>
            <span className="text-sm text-gray-600">Created: {shipment.date}</span>
            <span className="text-sm text-gray-600">Est. Delivery: {shipment.estimatedDelivery}</span>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sender Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">Sender Information</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 text-gray-800 font-medium">{shipment.customer}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 text-gray-800 font-medium">{shipment.origin}</span>
                </div>
              </div>
            </div>

            {/* Receiver Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">Receiver Information</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Destination:</span>
                  <span className="ml-2 text-gray-800 font-medium">{shipment.destination}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#055b8e]" />
              <h3 className="font-bold text-gray-800">Shipment Details</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 block">Package Type</span>
                <span className="text-gray-800 font-medium">{shipment.packageType}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Weight</span>
                <span className="text-gray-800 font-medium">{shipment.weight}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Service</span>
                <span className="text-gray-800 font-medium">{shipment.service}</span>
              </div>
              {/* <div>
                <span className="text-gray-600 block">Service Price</span>
                <span className="text-gray-800 font-medium">
                  {shipment.servicePrice ? `$${shipment.servicePrice.toFixed(2)}` : 'N/A'}
                </span>
              </div> */}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-600 block text-sm">Declared Value</span>
                  <span className="text-gray-800 font-medium">{shipment.value}</span>
                </div>
                {/* <div className="text-right">
                  <span className="text-gray-600 block text-sm">Total Cost</span>
                  <span className="text-lg font-bold text-[#055b8e]">
                    {shipment.servicePrice ? `$${shipment.servicePrice.toFixed(2)}` : 'N/A'}
                  </span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Wholesale Purchase Information */}
          {shipment.wholesalePurchases && shipment.wholesalePurchases.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">Wholesale Purchase Information</h3>
              </div>
              <div className="space-y-3">
                {shipment.wholesalePurchases.map((purchase, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Entry #{index + 1}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {purchase.name && (
                        <div>
                          <span className="text-gray-600 block">Purchase Name:</span>
                          <span className="text-gray-800 font-medium">{purchase.name}</span>
                        </div>
                      )}
                      {purchase.trackingNumber && (
                        <div>
                          <span className="text-gray-600 block">Wholesale Tracking Number:</span>
                          <span className="text-gray-800 font-medium">{purchase.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Mark */}
          {shipment.shippingMark && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">Shipping Mark</h3>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 block mb-1">Your shipping mark:</span>
                <span className="text-lg font-bold text-[#055b8e]">{shipment.shippingMark}</span>
              </div>
            </div>
          )}

          {/* Route Visualization */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#055b8e] rounded-full flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-800">{shipment.origin}</div>
                <div className="text-xs text-gray-600">Origin</div>
              </div>

              <div className="flex-1 px-4">
                <div className="relative">
                  <div className="h-1 bg-gray-300 rounded"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full border-2 border-[#055b8e]">
                    <Truck className="w-5 h-5 text-[#055b8e]" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-800">{shipment.destination}</div>
                <div className="text-xs text-gray-600">Destination</div>
              </div>
            </div>
          </div>

          {/* Documents */}
          {shipment.documents && shipment.documents.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">Attached Documents</h3>
              </div>
              <div className="space-y-3">
                {shipment.documents.map((doc, index) => {
                  const normalized =
                    typeof doc === "string"
                      ? { name: `Document ${index + 1}`, size: 0, type: "file", data: doc }
                      : doc;
                  
                  const isImage = isImageDocument(doc);

                  return (
                    <div
                      key={`${normalized.name}-${index}`}
                      className="flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isImage && (
                          <div className="flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={normalized.data}
                              alt={normalized.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setViewingImage(normalized.data)}
                              onError={(e) => {
                                // Fallback if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {!isImage && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{normalized.name}</p>
                          <p className="text-xs text-gray-500">
                            {normalized.type || "Document"}{" "}
                            {normalized.size ? `· ${(normalized.size / 1024).toFixed(1)} KB` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:ml-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto"
                          asChild
                        >
                          <a href={normalized.data} download={normalized.name}>
                            Download
                          </a>
                        </Button>
                        {isImage && (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#055b8e] text-white hover:bg-[#044a73] w-full md:w-auto"
                            onClick={() => setViewingImage(normalized.data)}
                          >
                            View
                          </Button>
                        )}
                        {!isImage && (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#055b8e] text-white hover:bg-[#044a73] w-full md:w-auto"
                            asChild
                          >
                            <a href={normalized.data} target="_blank" rel="noreferrer">
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Image View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              aria-label="Close image"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingImage}
              alt="Full size document"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

