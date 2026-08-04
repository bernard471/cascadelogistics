"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, Eye, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentProof } from "@/types";

interface MappedPayment {
  id: string;
  _id: string;
  paymentId: string;
  trackingId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  paymentMethodDetails?: string;
  status: 'pending' | 'verified' | 'rejected';
  proofImageUrl: string;
  proofImageName: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export default function PaymentVerificationSection() {
  const [payments, setPayments] = useState<MappedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<MappedPayment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'rejected'>('verified');
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { trackingId: searchQuery }),
      });

      const response = await fetch(`/api/admin/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        const mappedPayments: MappedPayment[] = data.payments.map((payment: PaymentProof & { userName?: string; userEmail?: string }) => ({
          id: payment._id || '',
          _id: payment._id || '',
          paymentId: payment.paymentId,
          trackingId: payment.trackingId,
          userName: payment.userName || 'Unknown',
          userEmail: payment.userEmail || 'Unknown',
          amount: payment.amount,
          paymentMethod: payment.paymentMethod === 'mobile-money' ? 'Mobile Money' :
                        payment.paymentMethod === 'bank-transfer' ? 'Bank Transfer' :
                        payment.paymentMethod === 'cash' ? 'Cash' : 'Other',
          paymentMethodDetails: payment.paymentMethodDetails,
          status: payment.status,
          proofImageUrl: payment.proofImageUrl,
          proofImageName: payment.proofImageName,
          submittedAt: new Date(payment.submittedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          verifiedAt: payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : undefined,
          verifiedBy: payment.verifiedBy,
          rejectionReason: payment.rejectionReason,
          notes: payment.notes,
        }));

        setPayments(mappedPayments);
        setStats(data.stats || { total: 0, pending: 0, verified: 0, rejected: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async () => {
    if (!selectedPayment) return;

    if (verificationStatus === 'rejected' && !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch(`/api/admin/payments/${selectedPayment._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: verificationStatus,
          rejectionReason: verificationStatus === 'rejected' ? rejectionReason : undefined,
          notes: adminNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to verify payment");
        setIsVerifying(false);
        return;
      }

      // Refresh payments list
      await fetchPayments();
      
      // Close modal
      setShowViewModal(false);
      setSelectedPayment(null);
      setVerificationStatus('verified');
      setRejectionReason("");
      setAdminNotes("");
    } catch (error) {
      console.error("Verify error:", error);
      alert("An error occurred while verifying payment");
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'verified':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
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
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Payment Verification</h1>
        <p className="text-gray-600 mt-1">View and verify payment proofs submitted by users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Payments</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Verified</div>
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by tracking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payments found</div>
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
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
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
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.paymentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.trackingId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        <div className="font-medium">{payment.userName}</div>
                        <div className="text-xs text-gray-500">{payment.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#055b8e]">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.paymentMethod}
                      {payment.paymentMethodDetails && (
                        <div className="text-xs text-gray-500">({payment.paymentMethodDetails})</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.submittedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowViewModal(true);
                          setVerificationStatus(payment.status === 'pending' ? 'verified' : payment.status);
                          setRejectionReason(payment.rejectionReason || "");
                          setAdminNotes(payment.notes || "");
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

      {/* View/Verify Modal */}
      {showViewModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
                <p className="text-sm text-gray-600 mt-1">Payment ID: {selectedPayment.paymentId}</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedPayment(null);
                  setVerificationStatus('verified');
                  setRejectionReason("");
                  setAdminNotes("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-600" />
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
                  <div className="text-sm text-gray-600 mb-1">User</div>
                  <div className="font-semibold text-gray-800">{selectedPayment.userName}</div>
                  <div className="text-xs text-gray-500">{selectedPayment.userEmail}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Amount</div>
                  <div className="font-semibold text-[#055b8e] text-xl">${selectedPayment.amount.toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                  <div className="font-semibold text-gray-800">
                    {selectedPayment.paymentMethod}
                    {selectedPayment.paymentMethodDetails && ` (${selectedPayment.paymentMethodDetails})`}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Submitted</div>
                  <div className="font-semibold text-gray-800">{selectedPayment.submittedAt}</div>
                </div>
              </div>

              {/* Proof Image */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Proof</h3>
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

              {/* Rejection Reason (if rejected) */}
              {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason</div>
                  <div className="text-sm text-red-700">{selectedPayment.rejectionReason}</div>
                </div>
              )}

              {/* Verification Form (if pending) */}
              {selectedPayment.status === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Verify Payment</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Status *
                    </label>
                    <select
                      value={verificationStatus}
                      onChange={(e) => setVerificationStatus(e.target.value as 'verified' | 'rejected')}
                      className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                    >
                      <option value="verified">Verify</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>

                  {verificationStatus === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why this payment is being rejected..."
                        className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any additional notes..."
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedPayment(null);
                        setVerificationStatus('verified');
                        setRejectionReason("");
                        setAdminNotes("");
                      }}
                      disabled={isVerifying}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleVerify}
                      disabled={isVerifying || (verificationStatus === 'rejected' && !rejectionReason.trim())}
                      className="bg-[#055b8e] hover:bg-[#044a73] text-white"
                      style={{ borderRadius: "10px 0px 10px 0px" }}
                    >
                      {isVerifying ? "Processing..." : verificationStatus === 'verified' ? "Verify Payment" : "Reject Payment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
