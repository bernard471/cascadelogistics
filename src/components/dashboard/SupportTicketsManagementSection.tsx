"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, Eye, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ViewTicketModal from "@/components/modals/ViewTicketModal";
import UpdateStatusModal from "@/components/modals/UpdateStatusModal";
import { AdminSupportTicket } from "@/types";

// Mapped ticket type for internal component use
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

export default function SupportTicketsManagementSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState<MappedTicket[]>([]);
  const [ticketStats, setTicketStats] = useState<{ total: number; open: number; inProgress: number; resolved: number; closed: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<MappedTicket | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const itemsPerPage = 10;

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery
      });
      
      const response = await fetch(`/api/admin/support-tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        // Map tickets to component format
        const mappedTickets: MappedTicket[] = data.tickets.map((ticket: AdminSupportTicket) => ({
          id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          user: ticket.user || 'Unknown User',
          userEmail: ticket.userEmail,
          priority: ticket.priority === 'low' ? 'Low' :
                   ticket.priority === 'medium' ? 'Medium' :
                   ticket.priority === 'high' ? 'High' : 'Urgent',
          priorityColor: ticket.priority === 'low' ? 'text-blue-600 bg-blue-50' :
                        ticket.priority === 'medium' ? 'text-yellow-600 bg-yellow-50' :
                        ticket.priority === 'high' ? 'text-orange-600 bg-orange-50' :
                        'text-red-600 bg-red-50',
          status: ticket.status === 'open' ? 'Open' :
                 ticket.status === 'in-progress' ? 'In Progress' :
                 ticket.status === 'resolved' ? 'Resolved' : 'Closed',
          statusColor: ticket.status === 'open' ? 'text-green-600 bg-green-50' :
                      ticket.status === 'in-progress' ? 'text-blue-600 bg-blue-50' :
                      ticket.status === 'resolved' ? 'text-purple-600 bg-purple-50' :
                      'text-gray-600 bg-gray-50',
          createdAt: new Date(ticket.createdAt).toLocaleDateString(),
          message: ticket.message.substring(0, 100) + (ticket.message.length > 100 ? '...' : '')
        }));
        
        setTickets(mappedTickets);
        setTicketStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Pagination (client-side since we're filtering server-side)
  const totalPages = Math.ceil(tickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = tickets.slice(startIndex, startIndex + itemsPerPage);

  const handleViewTicket = (id: string) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      setSelectedTicket(ticket);
      setShowViewModal(true);
    }
  };

  const handleUpdateStatus = (id: string) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      setSelectedTicket(ticket);
      setShowUpdateModal(true);
    }
  };

  const handleModalClose = () => {
    setShowViewModal(false);
    setShowUpdateModal(false);
    setSelectedTicket(null);
  };

  const handleUpdateSuccess = () => {
    fetchTickets(); // Refresh the tickets list
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage and respond to customer support requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Tickets</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {ticketStats?.total || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Open</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {ticketStats?.open || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {ticketStats?.inProgress || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Resolved</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {ticketStats?.resolved || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Closed</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">
            {ticketStats?.closed || 0}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket number, subject, or message..."
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#055b8e]"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#055b8e] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No support tickets found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.ticketNumber}</div>
                        <div className="text-sm text-gray-600 mt-1">{ticket.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">{ticket.message}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.user}</div>
                        <div className="text-sm text-gray-600">{ticket.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${ticket.priorityColor}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${ticket.statusColor}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {ticket.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTicket(ticket.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ticket.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Update Status"
                        >
                          <Clock className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && tickets.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, tickets.length)} of {tickets.length} results
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={currentPage === page ? "bg-[#055b8e] hover:bg-[#044a73]" : ""}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showViewModal && selectedTicket && (
        <ViewTicketModal
          ticketId={selectedTicket.id}
          onClose={handleModalClose}
        />
      )}

      {showUpdateModal && selectedTicket && (
        <UpdateStatusModal
          ticket={selectedTicket}
          onClose={handleModalClose}
          onUpdate={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
