"use client";

import { useState,  } from "react";
import { X, Save, Package, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shipment } from "@/types";
import { calculateShippingPrice, getServiceInfo, type GoodsType, type ServiceType } from "@/lib/pricing";

interface EditAssetModalProps {
  shipment: Shipment;
  onClose: () => void;
  onSave: () => void;
}

export default function EditAssetModal({ shipment, onClose, onSave }: EditAssetModalProps) {
  const [formData, setFormData] = useState({
    // Receiver Information
    receiverName: shipment.receiverName || "",
    receiverEmail: shipment.receiverEmail || "",
    receiverPhone: shipment.receiverPhone || "",
    receiverAddress: shipment.receiverAddress || "",
    receiverCity: shipment.receiverCity || "",
    receiverCountry: shipment.receiverCountry || "",
    
    // Shipment Details
    description: shipment.description || "",
    dimensions: shipment.dimensions || "",
    quantity: shipment.quantity?.toString() || "1",
    declaredValue: shipment.declaredValue?.toString() || "",
    goodsType: (shipment.goodsType || 'normal') as GoodsType,
    serviceType: shipment.serviceType as ServiceType,
    
    // Service Details
    pickupDate: shipment.pickupDate ? new Date(shipment.pickupDate).toISOString().split('T')[0] : "",
    specialInstructions: shipment.specialInstructions || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Calculate updated price
  const calculatePrice = () => {
    const weight = shipment.weight || 0;
    const quantity = parseInt(formData.quantity) || 1;
    
    if (weight <= 0) return shipment.servicePrice || 0;
    
    return calculateShippingPrice(
      formData.serviceType,
      formData.goodsType,
      weight,
      quantity,
      formData.dimensions,
      formData.description,
      shipment.packageType
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (shipment.status !== 'pending') {
      setError("Only pending shipments can be edited");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const updateData = {
        // Receiver Information
        receiverName: formData.receiverName,
        receiverEmail: formData.receiverEmail,
        receiverPhone: formData.receiverPhone,
        receiverAddress: formData.receiverAddress,
        receiverCity: formData.receiverCity,
        receiverCountry: formData.receiverCountry,
        
        // Shipment Details
        description: formData.description,
        dimensions: formData.dimensions,
        quantity: parseInt(formData.quantity) || 1,
        declaredValue: parseFloat(formData.declaredValue) || 0,
        goodsType: formData.goodsType,
        serviceType: formData.serviceType,
        servicePrice: calculatePrice(),
        
        // Service Details
        pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : undefined,
        specialInstructions: formData.specialInstructions,
      };

      const response = await fetch(`/api/shipments/${shipment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update shipment");
        setIsSaving(false);
        return;
      }

      setSuccess("Shipment updated successfully!");
      setIsSaving(false);
      
      // Refresh and close after short delay
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Update shipment error:", error);
      setError("An error occurred while updating the shipment");
      setIsSaving(false);
    }
  };

  // Get service info for display
  const getServiceDisplay = () => {
    return getServiceInfo(formData.serviceType, formData.goodsType);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Shipment</h2>
            <p className="text-sm text-gray-600 mt-1">Tracking ID: {shipment.trackingId}</p>
            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Only pending shipments can be edited
            </p>
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

          {/* Current Info Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-gray-800 capitalize">{shipment.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Package Type:</span>
                <span className="ml-2 font-medium text-gray-800 capitalize">{shipment.packageType}</span>
              </div>
              <div>
                <span className="text-gray-600">Weight:</span>
                <span className="ml-2 font-medium text-gray-800">{shipment.weight} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Origin:</span>
                <span className="ml-2 font-medium text-gray-800">{shipment.senderCity}, {shipment.senderCountry}</span>
              </div>
            </div>
          </div>

          {/* Receiver Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#219ebc]" />
              <h3 className="font-bold text-gray-800">Receiver Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleInputChange}
                  className="h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  name="receiverEmail"
                  value={formData.receiverEmail}
                  onChange={handleInputChange}
                  className="h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <Input
                  type="tel"
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleInputChange}
                  className="h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <Input
                  type="text"
                  name="receiverCity"
                  value={formData.receiverCity}
                  onChange={handleInputChange}
                  className="h-12"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <Input
                  type="text"
                  name="receiverAddress"
                  value={formData.receiverAddress}
                  onChange={handleInputChange}
                  className="h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <Input
                  type="text"
                  name="receiverCountry"
                  value={formData.receiverCountry}
                  onChange={handleInputChange}
                  className="h-12"
                  required
                />
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#219ebc]" />
              <h3 className="font-bold text-gray-800">Shipment Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the package contents..."
                  className="min-h-[80px] resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (L x W x H cm) {formData.serviceType === 'overnight' && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="e.g., 30 x 20 x 15"
                  className="h-12"
                  required={formData.serviceType === 'overnight'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <Input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="h-12"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Declared Value (USD) *
                </label>
                <Input
                  type="number"
                  name="declaredValue"
                  value={formData.declaredValue}
                  onChange={handleInputChange}
                  className="h-12"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goods Type *
                </label>
                <select
                  name="goodsType"
                  value={formData.goodsType}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#219ebc]"
                  required
                >
                  <option value="normal">Normal Goods</option>
                  <option value="special">Special Goods (Food, Powder, Liquid)</option>
                  <option value="battery">Battery Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#219ebc]"
                  required
                >
                  <option value="standard">Air Shipping (10-14 days)</option>
                  <option value="express">Express Air Shipping (2-5 days)</option>
                  <option value="overnight">Sea Shipping (35-45 days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Pickup Date
                </label>
                <Input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
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
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Service</div>
                <div className="font-semibold text-gray-800">{getServiceDisplay().label}</div>
                <div className="text-xs text-gray-500">{getServiceDisplay().description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Updated Price</div>
                <div className="text-2xl font-bold text-[#219ebc]">
                  ${calculatePrice().toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">USD</div>
              </div>
            </div>
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
              disabled={isSaving || shipment.status !== 'pending'}
              className="bg-gradient-to-r from-[#219ebc] to-[#023e8a] hover:from-[#023e8a] hover:to-[#219ebc] text-white px-6 flex items-center gap-2"
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

