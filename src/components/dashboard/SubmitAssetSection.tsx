"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, MapPin, 
 // User,
   Calendar, 
  Upload, Plus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { calculateShippingPrice, getServiceInfo, type GoodsType, type ServiceType } from "@/lib/pricing";

export default function SubmitAssetSection() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
  
  const [formData, setFormData] = useState<{
    packageType: string;
    weight: string;
    dimensions: string;
    quantity: string;
    description: string;
    declaredValue: string;
    goodsType: GoodsType;
    serviceType: ServiceType;
    pickupDate: string;
    deliveryDate: string;
    specialInstructions: string;
  }>({
    // Shipment Details
    packageType: "",
    weight: "",
    dimensions: "",
    quantity: "",
    description: "",
    declaredValue: "",
    goodsType: "normal",
    
    // Additional Details
    serviceType: "standard",
    pickupDate: "",
    deliveryDate: "",
    specialInstructions: "",
  });

  // Wholesale purchase entries (array of name + tracking number pairs)
  const [wholesalePurchases, setWholesalePurchases] = useState<Array<{
    name: string;
    trackingNumber: string;
  }>>([]);

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
  const getServiceDisplay = () => {
    return getServiceInfo(formData.serviceType, formData.goodsType);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(""); // Clear errors on input change
  };

  // Handle wholesale purchase entries
  const addWholesalePurchase = () => {
    setWholesalePurchases(prev => [...prev, { name: "", trackingNumber: "" }]);
  };

  const removeWholesalePurchase = (index: number) => {
    setWholesalePurchases(prev => prev.filter((_, i) => i !== index));
  };

  const updateWholesalePurchase = (index: number, field: 'name' | 'trackingNumber', value: string) => {
    setWholesalePurchases(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
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
      const newFiles = fileArray.filter(file => !existing.has(`${file.name}-${file.size}`));
      return newFiles.length ? [...prev, ...newFiles] : prev;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
        declaredValue: formData.declaredValue ? parseFloat(formData.declaredValue) : undefined,
        pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : undefined,
        servicePrice: calculatePrice(),
        goodsType: formData.goodsType,
        // Add wholesale purchases (only non-empty entries)
        wholesalePurchases: wholesalePurchases.filter(p => p.name.trim() || p.trackingNumber.trim()),
      };

      const requestBody = new FormData();
      requestBody.append("payload", JSON.stringify(payload));
      documents.forEach(file => requestBody.append("documents", file));

      const response = await fetch("/api/shipments", {
        method: "POST",
        body: requestBody,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create shipment");
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(`Shipment created successfully! Tracking ID: ${data.trackingId}`);
      setIsLoading(false);
      setDocuments([]);
      setWholesalePurchases([]); // Reset wholesale purchases
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
      
      // Redirect to track shipment after 2 seconds
      setTimeout(() => {
        router.push(`/user-dashboard/track-shipment?id=${data.trackingId}`);
      }, 2000);
      
    } catch (error) {
      console.error("Submission error:", error);
      setError("An error occurred while creating the shipment");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Submit an Asset</h1>
        <p className="text-gray-600 mt-1">Fill in the details below to submit a new shipment request</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Route Information */}
        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-[#055b8e]" />
            <h3 className="text-lg font-bold text-gray-800">Shipment Route</h3>
          </div>
          <p className="text-sm text-gray-700">
            <strong>Origin:</strong> USA Warehouse, USA → <strong>Destination:</strong> Ghana Warehouse, Ghana
          </p>
        </div>

        {/* Shipment Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-[#055b8e]" />
            <h3 className="text-lg font-bold text-gray-800">Shipment Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Type *
              </label>
              <select
                name="packageType"
                value={formData.packageType}
                onChange={handleInputChange}
                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                required
              >
                <option value="">Select package type</option>
                <option value="document">Document</option>
                <option value="parcel">Parcel</option>
                <option value="package">Package</option>
                <option value="fragile">Fragile Item</option>
                <option value="electronics">Electronics</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goods Type *
              </label>
              <select
                name="goodsType"
                value={formData.goodsType}
                onChange={handleInputChange}
                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                required
              >
                <option value="normal">Normal Goods</option>
                <option value="special">Special Goods (Food, Powder, Liquid)</option>
                <option value="battery">Battery Goods</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <Input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="Enter weight in kg"
                className="h-12"
                step="0.1"
                min="0"
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
              {formData.serviceType === 'overnight' && (
                <p className="text-xs text-gray-500 mt-1">
                  Required for sea shipping. Each CBM has a max weight of 500kg.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <Input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                className="h-12"
                min="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Description *
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the contents of your package"
                className="min-h-[100px] resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Declared Value (USD)
              </label>
              <Input
                type="number"
                name="declaredValue"
                value={formData.declaredValue}
                onChange={handleInputChange}
                placeholder="Enter declared value"
                className="h-12"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-[#055b8e]" />
            <h3 className="text-lg font-bold text-gray-800">Service Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                required
              >
                <option value="standard">Air Shipping (7-10 days)</option>
                <option value="overnight">Sea Shipping (35-45 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Pickup Date *
              </label>
              <Input
                type="date"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleInputChange}
                className="h-12"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <Textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                placeholder="Any special handling instructions or notes"
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Wholesale Purchase Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#055b8e]" />
              <h3 className="text-lg font-bold text-gray-800">Purchase Information</h3>
            </div>
            <Button
              type="button"
              onClick={addWholesalePurchase}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            If you purchased goods from shops in USA, China or other countries and are sending them directly to our warehouse, please provide the following information. You can add multiple entries if you purchased from different shops:
          </p>
          
          {wholesalePurchases.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No purchase entries added yet</p>
              <Button
                type="button"
                onClick={addWholesalePurchase}
                variant="outline"
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Purchase Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {wholesalePurchases.map((purchase, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Entry #{index + 1}</h4>
                    {wholesalePurchases.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeWholesalePurchase(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name Used for Purchase
                      </label>
                      <Input
                        type="text"
                        value={purchase.name}
                        onChange={(e) => updateWholesalePurchase(index, 'name', e.target.value)}
                        placeholder="Enter the name you used when purchasing"
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purchase Shop Tracking Number
                      </label>
                      <Input
                        type="text"
                        value={purchase.trackingNumber}
                        onChange={(e) => updateWholesalePurchase(index, 'trackingNumber', e.target.value)}
                        placeholder="Enter tracking number from purchase shop"
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addWholesalePurchase}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Entry
              </Button>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#055b8e]" />
            <h3 className="text-lg font-bold text-gray-800">Asset Summary</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Service Type</div>
              <div className="font-semibold text-gray-800">
                {getServiceDisplay().label}
              </div>
              <div className="text-xs text-gray-500">
                {getServiceDisplay().description}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Weight & Goods Type</div>
              <div className="font-semibold text-gray-800">
                {formData.weight ? `${formData.weight} kg` : '0 kg'}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {formData.goodsType} goods
                {formData.serviceType === 'overnight' && formData.dimensions && ' · CBM calculated'}
              </div>
            </div>
            
            {/* <div className="rounded-lg p-4 border-2 border-[#055b8e] bg-blue-50 md:col-span-2">
              <div className="text-sm text-gray-600 mb-1">Total Estimated Price</div>
              <div className="text-2xl font-bold text-[#055b8e]">
                ${calculatePrice().toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">USD · Final price may vary based on actual measurements</div>
            </div> */}
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5 text-[#055b8e]" />
            <h3 className="text-lg font-bold text-gray-800">Upload Documents (Optional)</h3>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#055b8e] transition-colors cursor-pointer"
            onClick={triggerDocumentSelect}
            onDragOver={handleDocumentDragOver}
            onDrop={handleDocumentDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PDF, PNG, JPG up to 10MB
            </p>
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

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="px-8 py-6 text-gray-700 border-gray-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#055b8e] hover:bg-[#044a73] text-white px-8 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: "10px 0px 10px 0px" }}
          >
            {isLoading ? "Creating Shipment..." : "Submit Asset"}
          </Button>
        </div>
      </form>
    </div>
  );
}

