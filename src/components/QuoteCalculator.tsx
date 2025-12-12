"use client";

import { useState } from "react";
import { Calculator, Package, MapPin, Weight, Ruler, Calendar, DollarSign, Plane, Ship, Info, CheckCircle, ArrowRight, Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface QuoteResult {
  serviceType: string;
  estimatedCost: string;
  estimatedDelivery: string;
  currency: string;
}

export default function QuoteCalculator() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    origin: "Turkey",
    destination: "Ghana",
    originCity: "",
    destinationCity: "",
    packageType: "parcel",
    weight: "",
    length: "",
    width: "",
    height: "",
    quantity: "1",
    goodsType: "normal",
    serviceType: "air",
    description: "",
  });

  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"turkey" | "other">("turkey");

  // Turkey to Ghana pricing
  const turkeyPricing = {
    air: {
      rate: 132,
      currency: "GHC",
      unit: "KG",
      days: "7-10",
      label: "Air Cargo"
    },
    sea: {
      rate: 3660,
      currency: "GH",
      unit: "CBM",
      days: "35-45",
      label: "Sea Cargo"
    }
  };

  const calculateTurkeyQuote = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = "Weight is required";
    }
    if (formData.serviceType === "sea") {
      if (!formData.length || !formData.width || !formData.height) {
        newErrors.dimensions = "Dimensions are required for sea shipping";
      }
    }
    if (!formData.originCity) {
      newErrors.originCity = "Origin city is required";
    }
    if (!formData.destinationCity) {
      newErrors.destinationCity = "Destination city is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const weight = parseFloat(formData.weight) || 0;
    const quantity = parseInt(formData.quantity) || 1;
    let result: QuoteResult;

    if (formData.serviceType === "sea") {
      const length = parseFloat(formData.length) || 0;
      const width = parseFloat(formData.width) || 0;
      const height = parseFloat(formData.height) || 0;
      
      // Calculate CBM (convert cm to meters)
      const lengthM = length / 100;
      const widthM = width / 100;
      const heightM = height / 100;
      const volumeCBM = lengthM * widthM * heightM * quantity;
      
      const totalCost = volumeCBM * turkeyPricing.sea.rate;
      const formattedCost = new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 2
      }).format(totalCost);

      result = {
        serviceType: `${turkeyPricing.sea.label} - Turkey to Ghana`,
        estimatedCost: formattedCost,
        estimatedDelivery: `${turkeyPricing.sea.days} Days`,
        currency: turkeyPricing.sea.currency,
      };
    } else {
      // Air shipping
      const totalCost = weight * turkeyPricing.air.rate;
      const formattedCost = new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 2
      }).format(totalCost);

      result = {
        serviceType: `${turkeyPricing.air.label} - Turkey to Ghana`,
        estimatedCost: formattedCost,
        estimatedDelivery: `${turkeyPricing.air.days} Days`,
        currency: turkeyPricing.air.currency,
      };
    }

    setQuoteResult(result);
  };

  const submitQuoteRequest = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = "Weight is required";
    }
    if (formData.serviceType === "sea" && (!formData.length || !formData.width || !formData.height)) {
      newErrors.dimensions = "Dimensions are required for sea shipping";
    }
    if (!formData.originCity) newErrors.originCity = "Origin city is required";
    if (!formData.destinationCity) newErrors.destinationCity = "Destination city is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const dimensions = formData.serviceType === "sea" 
        ? `${formData.length}cm x ${formData.width}cm x ${formData.height}cm`
        : null;

      const response = await fetch("/api/quote-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          origin: formData.origin,
          destination: formData.destination,
          originCity: formData.originCity,
          destinationCity: formData.destinationCity,
          serviceType: formData.serviceType,
          goodsType: formData.goodsType,
          packageType: formData.packageType,
          weight: formData.weight,
          dimensions,
          quantity: formData.quantity,
          description: formData.description,
          estimatedCost: quoteResult?.estimatedCost || null,
          isTurkeyRoute: activeTab === "turkey",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quote request");
      }

      setIsSubmitted(true);
      setQuoteResult(null);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          origin: activeTab === "turkey" ? "Turkey" : "",
          destination: "Ghana",
          originCity: "",
          destinationCity: "",
          packageType: "parcel",
          weight: "",
          length: "",
          width: "",
          height: "",
          quantity: "1",
          goodsType: "normal",
          serviceType: "air",
          description: "",
        });
      }, 3000);
    } catch (error) {
      console.error("Error submitting quote:", error);
      setErrors({ submit: error instanceof Error ? error.message : "Failed to submit quote request" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 lg:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl mb-6 shadow-xl">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Get a Shipping Quote
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get an instant estimate for Turkey to Ghana routes, or request a custom quote for other services
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-xl p-1 shadow-lg border border-gray-200">
            <button
              onClick={() => {
                setActiveTab("turkey");
                setQuoteResult(null);
                setFormData(prev => ({ ...prev, origin: "Turkey" }));
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === "turkey"
                  ? "bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-md"
                  : "text-gray-600 hover:text-[#315694]"
              }`}
            >
              Turkey → Ghana (Pricing Available)
            </button>
            <button
              onClick={() => {
                setActiveTab("other");
                setQuoteResult(null);
                setFormData(prev => ({ ...prev, origin: "" }));
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === "other"
                  ? "bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-md"
                  : "text-gray-600 hover:text-[#315694]"
              }`}
            >
              Other Routes (Request Quote)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quote Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Package className="w-6 h-6 text-[#315694]" />
                {activeTab === "turkey" ? "Shipment Details" : "Quote Request Form"}
              </h2>

              <div className="space-y-6">
                {/* Contact Information (for other routes) */}
                {activeTab === "other" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="John Doe"
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@example.com"
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+233 XX XXX XXXX"
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Origin & Destination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Origin Country
                    </label>
                    {activeTab === "turkey" ? (
                      <Input value="Turkey" disabled className="bg-gray-50" />
                    ) : (
                      <select
                        value={formData.origin}
                        onChange={(e) => handleInputChange("origin", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#315694] focus:border-transparent"
                      >
                        <option value="">Select Origin</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="China">China</option>
                        <option value="United States">United States</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Destination Country
                    </label>
                    <Input value="Ghana" disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Origin City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.originCity}
                      onChange={(e) => handleInputChange("originCity", e.target.value)}
                      placeholder="e.g., Istanbul"
                      className={errors.originCity ? "border-red-500" : ""}
                    />
                    {errors.originCity && (
                      <p className="text-red-500 text-xs mt-1">{errors.originCity}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Destination City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.destinationCity}
                      onChange={(e) => handleInputChange("destinationCity", e.target.value)}
                      placeholder="e.g., Accra"
                      className={errors.destinationCity ? "border-red-500" : ""}
                    />
                    {errors.destinationCity && (
                      <p className="text-red-500 text-xs mt-1">{errors.destinationCity}</p>
                    )}
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { value: "sea", label: "Sea Shipping", icon: Ship, desc: activeTab === "turkey" ? "35-45 days" : "Varies" },
                      { value: "air", label: "Air Shipping", icon: Plane, desc: activeTab === "turkey" ? "7-10 days" : "Varies" },
                    ].map((service) => {
                      const Icon = service.icon;
                      return (
                        <button
                          key={service.value}
                          type="button"
                          onClick={() => handleInputChange("serviceType", service.value)}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            formData.serviceType === service.value
                              ? "border-[#315694] bg-[#315694]/10"
                              : "border-gray-200 hover:border-[#315694]"
                          }`}
                        >
                          <Icon className={`w-6 h-6 mb-2 ${
                            formData.serviceType === service.value ? "text-[#315694]" : "text-gray-400"
                          }`} />
                          <div className="font-semibold text-gray-900">{service.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{service.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Package Type & Goods Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Package Type
                    </label>
                    <select
                      value={formData.packageType}
                      onChange={(e) => handleInputChange("packageType", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#315694] focus:border-transparent"
                    >
                      <option value="parcel">Parcel</option>
                      <option value="package">Package</option>
                      <option value="document">Document</option>
                      <option value="electronics">Electronics</option>
                      <option value="battery">Battery Goods</option>
                      <option value="accessories">Accessories</option>
                      <option value="fragile">Fragile</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Goods Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.goodsType}
                      onChange={(e) => handleInputChange("goodsType", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#315694] focus:border-transparent"
                    >
                      <option value="normal">Normal Goods</option>
                      <option value="special">Special Goods (Food, Powder, Liquid)</option>
                      <option value="battery">Battery Goods</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                {/* Weight & Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Weight className="w-4 h-4 inline mr-1" />
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      placeholder="e.g., 10"
                      min="0"
                      step="0.1"
                      className={errors.weight ? "border-red-500" : ""}
                    />
                    {errors.weight && (
                      <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="e.g., 1"
                      min="1"
                    />
                  </div>
                </div>

                {/* Dimensions (for sea shipping) */}
                {formData.serviceType === "sea" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Ruler className="w-4 h-4 inline mr-1" />
                      Dimensions (cm) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Input
                          type="number"
                          value={formData.length}
                          onChange={(e) => handleInputChange("length", e.target.value)}
                          placeholder="Length"
                          min="0"
                          className={errors.dimensions ? "border-red-500" : ""}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={formData.width}
                          onChange={(e) => handleInputChange("width", e.target.value)}
                          placeholder="Width"
                          min="0"
                          className={errors.dimensions ? "border-red-500" : ""}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={formData.height}
                          onChange={(e) => handleInputChange("height", e.target.value)}
                          placeholder="Height"
                          min="0"
                          className={errors.dimensions ? "border-red-500" : ""}
                        />
                      </div>
                    </div>
                    {errors.dimensions && (
                      <p className="text-red-500 text-xs mt-1">{errors.dimensions}</p>
                    )}
                    {activeTab === "turkey" && (
                      <p className="text-xs text-gray-500 mt-2">
                        Note: Each CBM is charged at GH: 3,660. All packages include freight and custom clearance.
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your goods in detail..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                {activeTab === "turkey" ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={calculateTurkeyQuote}
                      className="flex-1 bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      Calculate Quote
                    </Button>
                    {quoteResult && (
                      <Button
                        onClick={submitQuoteRequest}
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-[#f7941d] to-[#e6851a] hover:from-[#e6851a] hover:to-[#f7941d] text-white py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Request Quote
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={submitQuoteRequest}
                    disabled={isSubmitting || isSubmitted}
                    className="w-full bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Submitting...
                      </>
                    ) : isSubmitted ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Quote Request Submitted!
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Quote Request
                      </>
                    )}
                  </Button>
                )}

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {errors.submit}
                  </div>
                )}

                {isSubmitted && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Your quote request has been submitted successfully! We'll get back to you soon via email.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quote Result Sidebar */}
          <div className="lg:col-span-1">
            {quoteResult && activeTab === "turkey" ? (
              <div className="bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl shadow-xl p-6 lg:p-8 text-white sticky top-8">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-2xl font-bold">Your Quote</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Service Type</div>
                    <div className="text-lg font-semibold">{quoteResult.serviceType}</div>
                  </div>

                  <div>
                    <div className="text-sm opacity-90 mb-1">Estimated Delivery</div>
                    <div className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {quoteResult.estimatedDelivery}
                    </div>
                  </div>

                  <div className="border-t border-white/20 pt-6">
                    <div className="text-sm opacity-90 mb-2">Estimated Cost</div>
                    <div className="text-4xl font-bold flex items-center gap-2">
                      {quoteResult.estimatedCost}
                    </div>
                    <div className="text-sm opacity-80 mt-2">
                      All packages include freight and custom clearance
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm">
                    <Info className="w-4 h-4 inline mr-1" />
                    <p className="opacity-90">
                      This is an estimate. Click "Request Quote" to submit your request and receive a confirmed quote via email.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 lg:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {activeTab === "turkey" ? "Quote Information" : "Quote Request Info"}
                </h3>
                <div className="space-y-4 text-sm text-gray-600">
                  {activeTab === "turkey" ? (
                    <>
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#315694] mt-0.5 flex-shrink-0" />
                        <p>Fill in the form to get an instant quote for Turkey to Ghana shipping.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#315694] mt-0.5 flex-shrink-0" />
                        <p><strong>Air Cargo:</strong> GHC 132 per KG (7-10 days)</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#315694] mt-0.5 flex-shrink-0" />
                        <p><strong>Sea Cargo:</strong> GH: 3,660 per CBM (35-45 days)</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#315694] mt-0.5 flex-shrink-0" />
                        <p>All packages include freight and custom clearance.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#315694] mt-0.5 flex-shrink-0" />
                        <p>Fill in the form to request a custom quote for your shipping needs.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#315694] mt-0.5 flex-shrink-0" />
                        <p>We'll review your request and send you a detailed quote via email within 24 hours.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#315694] mt-0.5 flex-shrink-0" />
                        <p>For urgent requests, please call us at <strong>+233 24 189 3393</strong></p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
