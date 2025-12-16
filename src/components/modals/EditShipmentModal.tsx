"use client";

import { useState, useRef } from "react";
import { X, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
}

interface EditShipmentModalProps {
  shipment: MappedShipment;
  onClose: () => void;
  onSave: () => void;
}

export default function EditShipmentModal({ shipment, onClose, onSave }: EditShipmentModalProps) {
  const [formData, setFormData] = useState({
    status: shipment.status.toLowerCase().replace(' ', '-') || "pending",
    currentLocation: "",
    estimatedDelivery: shipment.estimatedDelivery || "",
    specialInstructions: ""
  });
  const [updateImage, setUpdateImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image exceeds 10MB limit");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Invalid image type. Only JPEG, PNG, and WebP are allowed");
      return;
    }

    setUpdateImage(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUpdateImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("status", formData.status);
      if (formData.currentLocation) {
        formDataToSend.append("currentLocation", formData.currentLocation);
      }
      if (formData.estimatedDelivery) {
        formDataToSend.append("estimatedDelivery", formData.estimatedDelivery);
      }
      if (formData.specialInstructions) {
        formDataToSend.append("specialInstructions", formData.specialInstructions);
      }
      if (updateImage) {
        formDataToSend.append("updateImage", updateImage);
      }

      const response = await fetch(`/api/admin/shipments/${shipment._id}`, {
        method: "PATCH",
        body: formDataToSend
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update shipment");
        setIsSaving(false);
        return;
      }

      onSave(); // Refresh the shipment list
      onClose();
    } catch (error) {
      console.error("Update shipment error:", error);
      setError("An error occurred while updating the shipment");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Shipment</h2>
            <p className="text-sm text-gray-600 mt-1">Tracking ID: {shipment.id}</p>
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
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Current Info Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium text-gray-800">{shipment.customer}</span>
              </div>
              <div>
                <span className="text-gray-600">Package:</span>
                <span className="ml-2 font-medium text-gray-800">{shipment.packageType}</span>
              </div>
              <div>
                <span className="text-gray-600">Origin:</span>
                <span className="ml-2 font-medium text-gray-800">{shipment.origin}</span>
              </div>
              <div>
                <span className="text-gray-600">Destination:</span>
                <span className="ml-2 font-medium text-gray-800">{shipment.destination}</span>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipment Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
              required
            >
              <option value="pending">Pending</option>
              <option value="arrived-at-warehouse">Arrived at Warehouse</option>
              <option value="ready-for-shipment">Ready for Shipment</option>
              <option value="in-transit">In Transit</option>
              <option value="arrived-at-warehouse-ghana">Arrived at Warehouse (Ghana)</option>
              <option value="ready-for-pickup">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Location
            </label>
            <Input
              type="text"
              name="currentLocation"
              value={formData.currentLocation}
              onChange={handleInputChange}
              placeholder="e.g., Doha, Qatar"
              className="h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Delivery Date
            </label>
            <Input
              type="date"
              name="estimatedDelivery"
              value={formData.estimatedDelivery}
              onChange={handleInputChange}
              className="h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <Textarea
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              placeholder="Any special handling instructions..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Update Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Image (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Add an image to show users when they track this shipment update
            </p>
            
            {!imagePreview ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#055b8e] transition-colors cursor-pointer"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload update image
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP up to 10MB
                </p>
                <input
                  ref={imageInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                />
              </div>
            ) : (
              <div className="relative">
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Update preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#055b8e] hover:bg-[#044a73] text-white px-6 flex items-center gap-2"
              style={{ borderRadius: "10px 0px 10px 0px" }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

