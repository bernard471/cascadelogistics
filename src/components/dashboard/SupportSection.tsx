"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Phone, Mail, HelpCircle, Send, Clock, Copy, Check, Plane,
   // Ship, 
   Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { SupportTicket } from "@/types";

export default function SupportSection() {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "medium"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Support tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          category: "general"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitMessage(`Support ticket created successfully! Ticket number: ${data.ticketNumber}`);
        setFormData({ subject: "", message: "", priority: "medium" });
        handleSubmitSuccess(); // Refresh tickets list
      } else {
        const errorData = await response.json();
        setSubmitMessage(`Error: ${errorData.error || "Failed to create support ticket"}`);
      }
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      setSubmitMessage("Error: Failed to submit support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactAction = (method: { actionType: string; phoneNumber?: string; email?: string }) => {
    if (method.actionType === "phone") {
      // Open phone dialer
      window.open(`tel:${method.phoneNumber}`, '_self');
    } else if (method.actionType === "email") {
      // Open email client
      const subject = encodeURIComponent("Support Request - Cascade Logistics Limited");
      const body = encodeURIComponent(`Hello,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nThank you.`);
      window.open(`mailto:${method.email}?subject=${subject}&body=${body}`, '_self');
    }
    // For disabled actions, do nothing
  };

  const handleCopyAddress = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Fetch user's support tickets
  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/support-tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Refresh tickets after submission
  const handleSubmitSuccess = () => {
    fetchTickets();
  };

  const faqs = [
    {
      id: 1,
      question: "How do I track my shipment?",
      answer: "You can track your shipment by entering your tracking ID on the Track Shipment page or clicking on any shipment in your Assets List."
    },
    {
      id: 2,
      question: "What are the different service types available?",
      answer: "We offer Standard Delivery, Express Delivery, Overnight Delivery, and Economy Delivery options to suit your needs."
    },
    {
      id: 3,
      question: "How do I submit a new shipment?",
      answer: "Navigate to the 'Submit an Asset' page from the dashboard menu and fill in the required information about sender, receiver, and package details."
    },
    {
      id: 4,
      question: "What payment methods do you accept?",
      answer: "We accept credit cards, debit cards, PayPal, and bank transfers for all shipment payments."
    },
    {
      id: 5,
      question: "How can I cancel a shipment?",
      answer: "Contact our support team immediately with your tracking ID. Cancellations are subject to the shipment's current status."
    },
  ];

  const contactMethods = [
    {
      id: 1,
      icon: Phone,
      iconColor: "text-blue-500 bg-blue-50",
      title: "Phone Support",
      description: "+233 24 189 3393",
      subtitle: "24/7 Available",
      action: "Call Now",
      actionType: "phone",
      phoneNumber: "+233241893393"
    },
    {
      id: 2,
      icon: Mail,
      iconColor: "text-green-500 bg-green-50",
      title: "Email Support",
      description: "info@cascadelogistics.co",
      subtitle: "Response in 24 hours",
      action: "Send Email",
      actionType: "email",
      email: "info@cascadelogistics.co"
    },
    {
      id: 3,
      icon: MessageCircle,
      iconColor: "text-gray-400 bg-gray-100",
      title: "Live Chat",
      description: "Chat with our team",
      subtitle: "Available 9 AM - 6 PM",
      action: "Coming Soon",
      actionType: "disabled",
      badge: "Coming Soon"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Open
          </span>
        );
      case 'in-progress':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const warehouses = [
    {
      id: "air",
      type: "Air Shipping",
      icon: Plane,
      iconColor: "text-blue-500 bg-blue-50",
      english: "No. 255 Tangge North Road, Baiyun Lake Street, Baiyun District, New York City, Guangdong Province 888/GSL000",
      chinese: "广东省广州市白云区白云湖街道唐阁北路255号888/GSL000",
      phoneNumber: "+132 605 43058 (China)"
    },
    // {
    //   id: "sea",
    //   type: "Sea Shipping",
    //   icon: Ship,
    //   iconColor: "text-green-500 bg-green-50",
    //   english: "Room 4015, 4th Floor, No. 66 Guangyuan West Road, Yuexiu District, Guangzhou City, Guangdong Province (GSL000)",
    //   chinese: "广东省广州市越秀区广园西路66号四楼4015室GSL000",
    //   phoneNumber: "+18620065346 (China)"
    // }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Support Center</h1>
        <p className="text-gray-600 mt-1">We&apos;re here to help you with any questions or concerns</p>
      </div>

      {/* Warehouse Addresses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Warehouse Addresses</h2>
          <p className="text-sm text-gray-600">Send your packages to the appropriate warehouse based on your shipping method</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map((warehouse) => {
            const Icon = warehouse.icon;
            const fullAddress = `${warehouse.english}\n${warehouse.chinese}`;
            const isCopied = copiedAddress === warehouse.id;

            return (
              <div key={warehouse.id} className="border border-gray-200 rounded-lg p-5 hover:border-[#055b8e] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${warehouse.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{warehouse.type}</h3>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">English Address:</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{warehouse.english}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Chinese Address (中文地址):</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{warehouse.chinese}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Phone Number:</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{warehouse.phoneNumber}</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleCopyAddress(fullAddress, warehouse.id)}
                  className="w-full bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center justify-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Address
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div key={method.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow ${
              method.actionType === "disabled" 
                ? "opacity-60 cursor-not-allowed" 
                : "hover:shadow-md"
            }`}>
              <div className='flex items-center justify-between'>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${method.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-end">
                {method.badge && (
                <Badge className="bg-yellow-500 text-white px-2 py-1 text-xs rounded-full">
                  {method.badge}
                </Badge>
              )}
              </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{method.title}</h3>
              <p className="text-gray-800 font-medium mb-1">{method.description}</p>
              <p className="text-sm text-gray-600 mb-4">{method.subtitle}</p>
            
              <Button
                onClick={() => handleContactAction(method)}
                disabled={method.actionType === "disabled"}
                className={`w-full ${
                  method.actionType === "disabled" 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-[#055b8e] hover:bg-[#044a73] text-white"
                }`}
                style={{ borderRadius: "10px 0px 10px 0px" }}
              >
                {method.action}
              </Button>
            </div>
          );
        })}
      </div>

 
      {/* Submit a Support Request */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Send className="w-5 h-5 text-[#055b8e]" />
          <h3 className="text-lg font-bold text-gray-800">Submit a Support Request</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Message */}
          {submitMessage && (
            <div className={`p-4 rounded-lg ${
              submitMessage.includes("successfully") 
                ? "bg-green-50 border border-green-200 text-green-700" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {submitMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter subject of your query"
                className="h-12"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
                required
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Describe your issue or question in detail..."
              className="min-h-[150px] resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#055b8e] hover:bg-[#044a73] text-white px-8 py-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: "10px 0px 10px 0px" }}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>

           {/* My Support Tickets */}
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Support Tickets</h2>
            <p className="text-sm text-gray-600 mt-1">View the status and responses for your support tickets</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e] text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {isLoadingTickets ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">No support tickets found</p>
            <p className="text-sm text-gray-500 mt-1">Submit your first support ticket below</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#055b8e]">
                      {ticket.ticketNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(ticket.updatedAt).toLocaleDateString('en-US', {
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
                          setSelectedTicket(ticket);
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

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-[#055b8e]" />
          <h3 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.id} className="group border border-gray-200 rounded-lg p-4 hover:border-[#055b8e] transition-colors">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium text-gray-800">{faq.question}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-gradient-to-r from-[#055b8e] to-[#044a73] rounded-lg p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Support Operating Hours</h3>
            <div className="space-y-1 text-white/90">
              <p>Monday - Friday: 9:00 AM - 6:00 PM (GST)</p>
              <p>Saturday: 10:00 AM - 4:00 PM (GST)</p>
              <p>Sunday: Closed</p>
              <p className="mt-3 text-sm">Emergency support available 24/7 via phone</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Ticket Modal */}
      {showViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Support Ticket Details</h2>
                <p className="text-sm text-gray-600 mt-1">Ticket Number: {selectedTicket.ticketNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTicket(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Subject</div>
                  <div className="font-semibold text-gray-800">{selectedTicket.subject}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Priority</div>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Created</div>
                  <div className="font-semibold text-gray-800">
                    {new Date(selectedTicket.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                {selectedTicket.resolvedAt && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Resolved</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(selectedTicket.resolvedAt).toLocaleString('en-US', {
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

              {/* Original Message */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Your Message</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Sent on {new Date(selectedTicket.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Updates & Responses {selectedTicket.responses && selectedTicket.responses.length > 0 && `(${selectedTicket.responses.length})`}
                </h3>
                {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                  <div className="space-y-4">
                    {selectedTicket.responses.map((response, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${
                          response.isStaff
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {response.isStaff ? '👤 Admin' : 'You'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {response.respondedBy}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(response.respondedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                          {response.message}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No responses yet. Our team will respond soon.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTicket(null);
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

