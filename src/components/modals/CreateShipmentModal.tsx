"use client";

import { useEffect, useRef, useState } from "react";
import { X, Save, PackagePlus, User,
 //  MapPin, 
   Upload, Plus, Search, ChevronDown } from "lucide-react";
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
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    userId: "",
    packageType: "parcel",
    weight: "",
    quantity: "",
    description: "",
    declaredValue: "",
    dimensions: "",
    goodsType: "normal" as GoodsType,
    serviceType: "standard" as ServiceType,
    pickupDate: "",
    specialInstructions: "",
    shippingMarkName: ""
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

  // Generate shipping mark based on service type
  const generateShippingMark = (serviceType: ServiceType, shippingMarkName: string): string => {
    if (!shippingMarkName.trim()) return '';
    
    const name = shippingMarkName.trim();
    if (serviceType === 'overnight') {
      // Sea shipping: CLL000/[NAME]-(888)
      return `CLL000/${name}-(888)`;
    } else {
      // Air shipping (standard, express): CLL000/[NAME]-air
      return `CLL000/${name}-air`;
    }
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

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const searchLower = userSearchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find(u => u._id === userId);
    if (selectedUser && selectedUser._id) {
      setFormData(prev => ({
        ...prev,
        userId: selectedUser._id!
      }));
      setUserSearchQuery(`${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`);
      setShowUserDropdown(false);
    }
  };

  // Get selected user display name
  const getSelectedUserDisplay = () => {
    if (!formData.userId) return "";
    const selectedUser = users.find(u => u._id === formData.userId);
    if (selectedUser) {
      return `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`;
    }
    return "";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    // Validate user is selected
    if (!formData.userId) {
      setError("Please select a user");
      setIsSaving(false);
      return;
    }

    try {
      // Generate shipping mark
      const shippingMark = generateShippingMark(formData.serviceType, formData.shippingMarkName);
      
      const payload = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
        declaredValue: formData.declaredValue ? parseFloat(formData.declaredValue) : undefined,
        pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : undefined,
        servicePrice: calculatePrice(),
        goodsType: formData.goodsType,
        shippingMark, // Add generated shipping mark
        // Add wholesale purchases (only non-empty entries)
        wholesalePurchases: wholesalePurchases.filter(p => p.name.trim() || p.trackingNumber.trim()),
      };

      const requestBody = new FormData();
      requestBody.append("payload", JSON.stringify(payload));
      documents.forEach(file => requestBody.append("documents", file));

      const response = await fetch("/api/admin/shipments", {
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
      setWholesalePurchases([]); // Reset wholesale purchases
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

          {/* Select User - Searchable */}
          <div className="relative" ref={userDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User *
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setShowUserDropdown(true);
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, userId: "" }));
                    }
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="Search by name or email..."
                  className="h-12 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {/* Dropdown */}
              {showUserDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    <ul className="py-1">
                      {filteredUsers.map(user => (
                        <li
                          key={user._id}
                          onClick={() => handleUserSelect(user._id!)}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            formData.userId === user._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                            {formData.userId === user._id && (
                              <div className="ml-auto text-[#055b8e]">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.userId && (
              <p className="text-xs text-green-600 mt-1">
                Selected: {getSelectedUserDisplay()}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Route: USA Warehouse, USA → Ghana Warehouse, Ghana
            </p>
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
                Weight (kg)
              </label>
              <Input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="h-12"
                step="0.1"
                min="0"
              />
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
                className="h-12"
                min="1"
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
              Declared Value ($)
            </label>
            <Input
              type="number"
              name="declaredValue"
              value={formData.declaredValue}
              onChange={handleInputChange}
              className="h-12"
              step="0.01"
              min="0"
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

          {/* Wholesale Purchase Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">Purchase Information</h3>
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
                <PackagePlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
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

          {/* Shipping Mark */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <PackagePlus className="w-5 h-5 text-[#055b8e]" />
              <h3 className="font-bold text-gray-800">Shipping Mark</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enter a name for your shipping mark. This will be used to identify your package at the warehouse.
              {formData.serviceType === 'overnight' && (
                <span className="block mt-1">Format: <strong>CLL000/[Your Name]-(888)</strong></span>
              )}
              {(formData.serviceType === 'standard' || formData.serviceType === 'express') && (
                <span className="block mt-1">Format: <strong>CLL000/[Your Name]-air</strong></span>
              )}
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Mark Name
              </label>
              <Input
                type="text"
                name="shippingMarkName"
                value={formData.shippingMarkName}
                onChange={handleInputChange}
                placeholder="Enter name for shipping mark (e.g., Cyber, John, ABC)"
                className="h-12"
              />
              {formData.shippingMarkName && (
                <p className="text-xs text-gray-500 mt-2">
                  Your shipping mark will be: <strong className="text-[#055b8e]">
                    CLL000/{formData.shippingMarkName}
                    {formData.serviceType === 'overnight' ? '-(888)' : '-air'}
                  </strong>
                </p>
              )}
            </div>
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

