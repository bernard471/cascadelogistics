"use client";

import { useEffect, useRef, useState } from "react";
import { X, Save, PackagePlus, User, MapPin, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User as UserType } from "@/types";
import { calculateShippingPrice, 
  // getServiceInfo, 
  type GoodsType, type ServiceType } from "@/lib/pricing";

interface CreateShipmentModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function CreateShipmentModal({ onClose, onSave }: CreateShipmentModalProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [formData, setFormData] = useState({
    userId: "",
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    senderAddress: "",
    senderCity: "",
    senderCountry: "",
    receiverName: "",
    receiverEmail: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverCity: "",
    receiverCountry: "",
    packageType: "parcel",
    weight: "",
    quantity: "1",
    description: "",
    declaredValue: "",
    dimensions: "",
    goodsType: "normal" as GoodsType,
    serviceType: "standard" as ServiceType,
    pickupDate: "",
    specialInstructions: ""
  });

  // Calculate total price using actual pricing structure
  const calculatePrice = () => {
    const weight = parseFloat(formData.weight) || 0;
    const quantity = parseInt(formData.quantity) || 1;
    
    if (weight <= 0) return 0;
    
    return calculateShippingPrice(
      formData.serviceType,
      formData.goodsType,
      weight,
      quantity,
      formData.dimensions,
      formData.description,
      formData.packageType
    );
  };

  // Get service info for display
  // const getServiceDisplay = () => {
  //   return getServiceInfo(formData.serviceType, formData.goodsType);
  // };
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

  // Fetch users for dropdown
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users?limit=100");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleDocumentAdd = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const tooLarge = fileArray.find(file => file.size > MAX_UPLOAD_SIZE);
    if (tooLarge) {
      setError(`"${tooLarge.name}" exceeds the 10MB limit. Please choose a smaller file.`);
      return;
    }

    setDocuments(prev => {
      const existing = new Set(prev.map(file => `${file.name}-${file.size}`));
      const filtered = fileArray.filter(file => !existing.has(`${file.name}-${file.size}`));
      return filtered.length ? [...prev, ...filtered] : prev;
    });
  };

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleDocumentAdd(e.target.files);
      e.target.value = "";
    }
  };

  const handleDocumentRemove = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDocumentDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      handleDocumentAdd(e.dataTransfer.files);
    }
  };

  const handleDocumentDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const triggerDocumentSelect = () => {
    documentInputRef.current?.click();
  };

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUser = users.find(u => u._id === e.target.value);
    if (selectedUser && selectedUser._id) {
      setFormData(prev => ({
        ...prev,
        userId: selectedUser._id!,
        senderName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        senderEmail: selectedUser.email,
        senderPhone: selectedUser.phone || "",
        senderAddress: selectedUser.address || "",
        senderCity: selectedUser.city || "",
        senderCountry: selectedUser.country || ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...formData,
        weight: parseFloat(formData.weight),
        quantity: parseInt(formData.quantity),
        declaredValue: parseFloat(formData.declaredValue),
        pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : undefined,
        servicePrice: calculatePrice(),
        goodsType: formData.goodsType,
      };

      const requestBody = new FormData();
      requestBody.append("payload", JSON.stringify(payload));
      documents.forEach(file => requestBody.append("documents", file));

      const response = await fetch("/api/shipments", {
        method: "POST",
        body: requestBody
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create shipment");
        setIsSaving(false);
        return;
      }

      setSuccess(`Shipment created successfully! Tracking ID: ${data.trackingId}`);
      setIsSaving(false);
      setDocuments([]);
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
      
      // Close after short delay
      setTimeout(() => {
        onSave(); // Refresh the shipment list
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error("Create shipment error:", error);
      setError("An error occurred while creating the shipment");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-[#055b8e]" />
            <h2 className="text-xl font-bold text-gray-800">Create New Shipment</h2>
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

          {/* Select User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User (Auto-fill Sender) *
            </label>
            <select
              onChange={handleUserSelect}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="">Select a user...</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Sender Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#055b8e]" />
              <h3 className="font-bold text-gray-800">Sender Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  name="senderName"
                  value={formData.senderName}
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
                  name="senderEmail"
                  value={formData.senderEmail}
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
                  name="senderPhone"
                  value={formData.senderPhone}
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
                  name="senderCity"
                  value={formData.senderCity}
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
                  name="senderCountry"
                  value={formData.senderCountry}
                  onChange={handleInputChange}
                  className="h-12"
                  required
                />
              </div>
            </div>
          </div>

          {/* Receiver Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#055b8e]" />
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

          {/* Package Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Type *
              </label>
              <select
                name="packageType"
                value={formData.packageType}
                onChange={handleInputChange}
                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                required
              >
                <option value="document">Document</option>
                <option value="parcel">Parcel</option>
                <option value="package">Package</option>
                <option value="fragile">Fragile</option>
                <option value="electronics">Electronics</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <Input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="h-12"
                step="0.1"
                min="0.1"
                required
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goods Type *
              </label>
              <select
                name="goodsType"
                value={formData.goodsType}
                onChange={handleInputChange}
                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                required
              >
                <option value="normal">Normal Goods</option>
                <option value="special">Special Goods (Food, Powder, Liquid)</option>
                <option value="battery">Battery Goods</option>
              </select>
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
              {formData.serviceType === 'overnight' && (
                <p className="text-xs text-gray-500 mt-1">Required for sea shipping</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Declared Value ($) *
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

          {/* Service & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                required
              >
                <option value="standard">Air Shipping (10-14 days)</option>
                <option value="express">Express Air Shipping (2-5 days)</option>
                <option value="overnight">Sea Shipping (35-45 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Date
              </label>
              <Input
                type="date"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleInputChange}
                className="h-12"
              />
            </div>
          </div>

          {/* Pricing Summary */}
          {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <PackagePlus className="w-5 h-5 text-[#055b8e]" />
              <h3 className="text-lg font-bold text-gray-800">Pricing Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Service Type</div>
                <div className="font-semibold text-gray-800">
                  {servicePricing[formData.serviceType as keyof typeof servicePricing]?.label || 'Standard Delivery'}
                </div>
                <div className="text-xs text-gray-500">
                  {servicePricing[formData.serviceType as keyof typeof servicePricing]?.description || '5-7 business days'}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Weight</div>
                <div className="font-semibold text-gray-800">
                  {formData.weight ? `${formData.weight} kg` : '0 kg'}
                </div>
                <div className="text-xs text-gray-500">
                  {formData.weight ? `$${servicePricing[formData.serviceType as keyof typeof servicePricing]?.price || 0} base + $${Math.max(0, Math.ceil((parseFloat(formData.weight) || 0) / 5) - 1) * 5} weight` : 'Enter weight to calculate'}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border-2 border-[#055b8e] bg-blue-50">
                <div className="text-sm text-gray-600 mb-1">Total Price</div>
                <div className="text-xl font-bold text-[#055b8e]">
                  ${calculatePrice().toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">USD</div>
              </div>
            </div>
          </div> */}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Description *
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

          {/* Document Upload */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-[#055b8e]" />
              <h3 className="font-bold text-gray-800">Upload Documents (Optional)</h3>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#055b8e] transition-colors cursor-pointer"
              onClick={triggerDocumentSelect}
              onDragOver={handleDocumentDragOver}
              onDrop={handleDocumentDrop}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
              <input
                ref={documentInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleDocumentInputChange}
              />
            </div>

            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {documents.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "Unknown type"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDocumentRemove(index)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
              {isSaving ? "Creating..." : "Create Shipment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

