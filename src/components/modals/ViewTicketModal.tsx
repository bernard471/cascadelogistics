"use client";

import { useState, useEffect, useCallback } from "react";
import { X, User, Calendar, MessageSquare, AlertCircle, Clock, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketResponse, AdminSupportTicket } from "@/types";

interface ViewTicketModalProps {
  ticketId: string;
  onClose: () => void;
}

export default function ViewTicketModal({ ticketId, onClose }: ViewTicketModalProps) {
  const [ticket, setTicket] = useState<AdminSupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTicketDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        setError("Failed to fetch ticket details");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      setError("Failed to fetch ticket details");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'resolved': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="animate-spin w-8 h-8 border-4 border-[#055b8e] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-center text-gray-600">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error || "Ticket not found"}</p>
            <Button onClick={onClose} className="bg-[#055b8e] hover:bg-[#044a73] text-white">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#055b8e]" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Support Ticket Details</h2>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-800 font-medium">{ticket.subject}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityIcon(ticket.priority)}
                    <span className="font-medium capitalize">{ticket.priority}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(ticket.status)}`}>
                    {ticket.status === 'open' && <CheckCircle className="w-4 h-4" />}
                    {ticket.status === 'in-progress' && <Clock className="w-4 h-4" />}
                    {ticket.status === 'resolved' && <CheckCircle className="w-4 h-4" />}
                    {ticket.status === 'closed' && <X className="w-4 h-4" />}
                    <span className="font-medium capitalize">{ticket.status.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#055b8e] rounded-full flex items-center justify-center text-white font-medium">
                        {ticket.user ? ticket.user.split(' ').map((n: string) => n[0]).join('') : 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{ticket.user || 'Unknown User'}</p>
                        <p className="text-sm text-gray-600">{ticket.userEmail || 'No email'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-800">
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {ticket.relatedShipmentId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related Shipment</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-800 font-mono">{ticket.relatedShipmentId}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <div className="p-4 bg-gray-50 rounded-lg border min-h-[150px]">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
              </div>
            </div>

            {/* Responses */}
            {ticket.responses && ticket.responses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Responses</label>
                <div className="space-y-3">
                  {ticket.responses.map((response: TicketResponse, index: number) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-800">{response.respondedBy}</span>
                          {response.isStaff && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Staff
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-blue-600">
                          {new Date(response.respondedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-blue-800 whitespace-pre-wrap">{response.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
}
