"use client";

import { useState } from "react";
import { X, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Mapped ticket type for modal use
interface MappedTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  user: string;
  userEmail: string;
  priority: string;
  priorityColor: string;
  status: string;
  statusColor: string;
  createdAt: string;
  message: string;
}

interface UpdateStatusModalProps {
  ticket: MappedTicket;
  onClose: () => void;
  onUpdate: () => void;
}

export default function UpdateStatusModal({ ticket, onClose, onUpdate }: UpdateStatusModalProps) {
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [responseMessage, setResponseMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const statusOptions = [
    { value: 'open', label: 'Open', icon: CheckCircle, color: 'text-green-600' },
    { value: 'in-progress', label: 'In Progress', icon: Clock, color: 'text-blue-600' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-purple-600' },
    { value: 'closed', label: 'Closed', icon: X, color: 'text-gray-600' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/support-tickets/${ticket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          response: responseMessage.trim() || undefined
        }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update ticket status");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      setError("Failed to update ticket status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // const getStatusIcon = (status: string) => {
  //   const option = statusOptions.find(opt => opt.value === status);
  //   if (!option) return <Clock className="w-4 h-4" />;
  //   const Icon = option.icon;
  //   return <Icon className={`w-4 h-4 ${option.color}`} />;
  // };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#055b8e]" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Update Ticket Status</h2>
              <p className="text-sm text-gray-600">Ticket #{ticket.ticketNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Current Ticket Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Ticket Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Subject:</span>
                <span className="ml-2 font-medium">{ticket.subject}</span>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium">{ticket.user}</span>
              </div>
              <div>
                <span className="text-gray-600">Priority:</span>
                <span className="ml-2 font-medium capitalize">{ticket.priority}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Status:</span>
                <span className="ml-2 font-medium capitalize">{ticket.status.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Update Status *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = newStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNewStatus(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[#055b8e] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${option.color}`} />
                      <span className="font-medium text-gray-800">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Response Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Response (Optional)
            </label>
            <Textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Add a response message for the customer..."
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be sent to the customer as a response to their ticket.
            </p>
          </div>

          {/* Status Change Preview */}
          {newStatus !== ticket.status && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Status Change Preview</span>
              </div>
              <p className="text-sm text-blue-700">
                Status will change from <span className="font-medium capitalize">{ticket.status.replace('-', ' ')}</span> to{' '}
                <span className="font-medium capitalize">{newStatus.replace('-', ' ')}</span>
                {responseMessage && ' with a response message to the customer.'}
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || newStatus === ticket.status}
            className="bg-[#055b8e] hover:bg-[#044a73] text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </div>
    </div>
  );
}
