"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Upload, DollarSign, X, CheckCircle, XCircle, Clock, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentProof } from "@/types";
import type { Shipment } from "@/types";

export default function SubmitPaymentProofSection() {
  const [trackingId, setTrackingId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [searchError, setSearchError] = useState("");

  // Form state
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentProof['paymentMethod']>("mobile-money");
  const [paymentMethodDetails, setPaymentMethodDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Payment proofs list state
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's payment proofs
  const fetchPaymentProofs = useCallback(async () => {
    setIsLoadingProofs(true);
    try {
      const response = await fetch("/api/payments");
      if (response.ok) {
        const data = await response.json();
        setPaymentProofs(data.payments || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment proofs:", error);
    } finally {
      setIsLoadingProofs(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentProofs();
  }, [fetchPaymentProofs]);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      setSearchError("Please enter a tracking ID");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setShipment(null);

    try {
      const response = await fetch(`/api/shipments/track/${trackingId}`);
      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.error || "Shipment not found");
        return;
      }

      setShipment(data);
      setSearchError("");
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Failed to search for shipment");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("Image exceeds 10MB limit");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSubmitError("Invalid image type. Only JPEG, PNG, and WebP are allowed");
      return;
    }

    setProofImage(file);
    setSubmitError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    setProofImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!shipment) {
      setSubmitError("Please search and find a shipment first");
      return;
    }

    if (!amount || !paymentMethod || !proofImage) {
      setSubmitError("Amount, payment method, and proof image are required");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSubmitError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("trackingId", shipment.trackingId);
      formData.append("amount", amount);
      formData.append("paymentMethod", paymentMethod);
      if (paymentMethodDetails) {
        formData.append("paymentMethodDetails", paymentMethodDetails);
      }
      if (notes) {
        formData.append("notes", notes);
      }
      formData.append("proofImage", proofImage);

      const response = await fetch("/api/payments", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || "Failed to submit payment proof");
        setIsSubmitting(false);
        return;
      }

      setSubmitSuccess(`Payment proof submitted successfully! Payment ID: ${data.paymentId}`);
      
      // Refresh payment proofs list
      await fetchPaymentProofs();
      
      // Reset form
      setAmount("");
      setPaymentMethod("mobile-money");
      setPaymentMethodDetails("");
      setNotes("");
      setProofImage(null);
      setProofImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      // Reset shipment after 3 seconds
      setTimeout(() => {
        setShipment(null);
        setTrackingId("");
        setSubmitSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("An error occurred while submitting payment proof");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'verified':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Payment Proof</h1>
        <p className="text-gray-600 mt-1">Submit payment proofs and track their verification status</p>
      </div>

      {/* Submit New Payment Proof Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Submit New Payment Proof</h2>
          <p className="text-sm text-gray-600 mt-1">Search for your shipment and submit proof of payment</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking ID
            </label>
            <Input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              placeholder="Enter tracking ID (e.g., NSC123456)"
              className="h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !trackingId.trim()}
              className="bg-[#055b8e] hover:bg-[#044a73] text-white px-8 py-6 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: "10px 0px 10px 0px" }}
            >
              {isSearching ? "Searching..." : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {searchError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {searchError}
          </div>
        )}

        {shipment && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Shipment Found</h3>
                <p className="text-sm text-gray-600 mt-1">Tracking ID: {shipment.trackingId}</p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(shipment.status)}
                  <span className="text-gray-600">Service Price:</span>
                  <span className="font-semibold text-[#055b8e]">
                    ${shipment.servicePrice?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Payment Form */}
        {shipment && (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Error/Success Messages */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {submitSuccess}
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-[#055b8e]" />
              <h3 className="text-lg font-bold text-gray-800">Payment Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid (USD) *
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-12"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentProof['paymentMethod'])}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                  required
                >
                  <option value="mobile-money">Mobile Money</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {paymentMethod === 'mobile-money' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Money Provider (e.g., MTN, Vodafone, AirtelTigo)
                  </label>
                  <Input
                    type="text"
                    value={paymentMethodDetails}
                    onChange={(e) => setPaymentMethodDetails(e.target.value)}
                    placeholder="Enter provider name"
                    className="h-12"
                  />
                </div>
              )}

              {paymentMethod === 'bank-transfer' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <Input
                    type="text"
                    value={paymentMethodDetails}
                    onChange={(e) => setPaymentMethodDetails(e.target.value)}
                    placeholder="Enter bank name"
                    className="h-12"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about the payment"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Proof Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Upload className="w-5 h-5 text-[#055b8e]" />
              <h3 className="text-lg font-bold text-gray-800">Payment Proof Image *</h3>
            </div>

            {!proofImagePreview ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#055b8e] transition-colors cursor-pointer"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload payment screenshot
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
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofImagePreview}
                    alt="Payment proof preview"
                    className="max-w-full max-h-96 mx-auto rounded-lg"
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

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="px-8 py-6 text-gray-700 border-gray-300"
              onClick={() => {
                setShipment(null);
                setTrackingId("");
                setAmount("");
                setPaymentMethod("mobile-money");
                setPaymentMethodDetails("");
                setNotes("");
                setProofImage(null);
                setProofImagePreview(null);
                setSubmitError("");
                setSubmitSuccess("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#055b8e] hover:bg-[#044a73] text-white px-8 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: "10px 0px 10px 0px" }}
            >
              {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
            </Button>
          </div>
        </form>
      )}
      </div>

      {/* My Payment Proofs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Payment Proofs</h2>
            <p className="text-sm text-gray-600 mt-1">View the status of all your submitted payment proofs</p>
          </div>
        </div>

        {isLoadingProofs ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Loading payment proofs...</p>
          </div>
        ) : paymentProofs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">No payment proofs submitted yet</p>
            <p className="text-sm text-gray-500 mt-1">Submit your first payment proof below</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentProofs.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.paymentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#055b8e] font-medium">
                      {payment.trackingId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#055b8e]">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace('-', ' ')}
                      {payment.paymentMethodDetails && (
                        <div className="text-xs text-gray-500">({payment.paymentMethodDetails})</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payment.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowViewModal(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Payment Modal */}
      {showViewModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Payment Proof Details</h2>
                <p className="text-sm text-gray-600 mt-1">Payment ID: {selectedPayment.paymentId}</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedPayment(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Tracking ID</div>
                  <div className="font-semibold text-gray-800">{selectedPayment.trackingId}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Amount</div>
                  <div className="font-semibold text-[#055b8e] text-xl">${selectedPayment.amount.toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                  <div className="font-semibold text-gray-800 capitalize">
                    {selectedPayment.paymentMethod.replace('-', ' ')}
                    {selectedPayment.paymentMethodDetails && ` (${selectedPayment.paymentMethodDetails})`}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Submitted</div>
                  <div className="font-semibold text-gray-800">
                    {new Date(selectedPayment.submittedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                {selectedPayment.verifiedAt && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Verified At</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(selectedPayment.verifiedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason</div>
                  <div className="text-sm text-red-700">{selectedPayment.rejectionReason}</div>
                </div>
              )}

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-800 mb-1">Notes</div>
                  <div className="text-sm text-blue-700">{selectedPayment.notes}</div>
                </div>
              )}

              {/* Proof Image */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Proof Image</h3>
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPayment.proofImageUrl}
                    alt="Payment proof"
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                  />
                </div>
                <div className="mt-2 flex justify-center">
                  <a
                    href={`${selectedPayment.proofImageUrl}${selectedPayment.proofImageUrl.includes('?') ? '&' : '?'}download=1`}
                    download={selectedPayment.proofImageName}
                    className="text-sm text-[#055b8e] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download Image
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedPayment(null);
                }}
                className="px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
