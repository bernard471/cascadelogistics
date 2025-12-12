"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Mail, 
  Search, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewsletterSubscription {
  _id: string;
  email: string;
  source: 'footer-top' | 'footer-gallery';
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  topSource: number;
  gallerySource: number;
}

export default function NewsletterSubscriptionsSection() {
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [stats, setStats] = useState<NewsletterStats>({
    total: 0,
    active: 0,
    unsubscribed: 0,
    topSource: 0,
    gallerySource: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<NewsletterSubscription | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(sourceFilter !== "all" && { source: sourceFilter })
      });

      const response = await fetch(`/api/newsletter-subscriptions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch newsletter subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleStatusChange = async (id: string, newStatus: 'active' | 'unsubscribed') => {
    try {
      const response = await fetch(`/api/newsletter-subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Failed to update subscription status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      const response = await fetch(`/api/newsletter-subscriptions/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Failed to delete subscription:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceLabel = (source: string) => {
    return source === 'footer-top' ? 'Footer Top' : 'Footer Gallery';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Unsubscribed
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Newsletter Subscriptions</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Newsletter Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage newsletter subscriptions from both footer forms</p>
        </div>
        <Button
          onClick={fetchSubscriptions}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Footer Top Form</p>
              <p className="text-2xl font-bold text-blue-600">{stats.topSource}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Footer Gallery Form</p>
              <p className="text-2xl font-bold text-purple-600">{stats.gallerySource}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="footer-top">Footer Top</option>
              <option value="footer-gallery">Footer Gallery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No newsletter subscriptions found</p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getSourceLabel(subscription.source)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(subscription.subscribedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {subscription.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(subscription._id, 'unsubscribed')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(subscription._id, 'active')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(subscription._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Subscription Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{selectedSubscription.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Source</label>
                <p className="text-gray-900">{getSourceLabel(selectedSubscription.source)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Subscribed At</label>
                <p className="text-gray-900">{formatDate(selectedSubscription.subscribedAt)}</p>
              </div>
              
              {selectedSubscription.unsubscribedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Unsubscribed At</label>
                  <p className="text-gray-900">{formatDate(selectedSubscription.unsubscribedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
