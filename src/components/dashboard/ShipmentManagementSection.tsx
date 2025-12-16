"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Edit2, Trash2, Upload, MapPin, ChevronLeft, ChevronRight, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ViewShipmentModal from "@/components/modals/ViewShipmentModal";
import EditShipmentModal from "@/components/modals/EditShipmentModal";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";
import AddInvoiceModal from "@/components/modals/AddInvoiceModal";
import { Shipment, ShipmentsResponse } from "@/types";

// Internal type for mapped shipment data in this component
interface MappedShipment {
  id: string;
  _id: string;
  customer: string;
  origin: string;
  destination: string;
  status: string;
  statusColor: string;
  date: string;
  estimatedDelivery: string;
  packageType: string;
  weight: string;
  value: string;
  service: string;
  servicePrice?: number;
  documents?: Shipment["documents"];
  wholesalePurchases?: Array<{
    name: string;
    trackingNumber: string;
  }>;
  shippingMarkName?: string;
  shippingMark?: string;
}

export default function ShipmentManagementSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [shipments, setShipments] = useState<MappedShipment[]>([]);
  const [shipmentStats, setShipmentStats] = useState<ShipmentsResponse['stats'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<MappedShipment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const itemsPerPage = 10;

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
        limit: "100"
      });
      
      const response = await fetch(`/api/admin/shipments?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        // Helper function to map status to display name and color
        const getStatusDisplay = (status: string) => {
          const statusMap: Record<string, { display: string; color: string }> = {
            'pending': { display: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
            'arrived-at-warehouse': { display: 'Arrived at Warehouse ', color: 'text-blue-600 bg-blue-50' },
            'ready-for-shipment': { display: 'Ready for Shipment', color: 'text-purple-600 bg-purple-50' },
            'in-transit': { display: 'In Transit', color: 'text-orange-600 bg-orange-50' },
            'arrived-at-warehouse-ghana': { display: 'Arrived at Warehouse (Ghana)', color: 'text-indigo-600 bg-indigo-50' },
            'ready-for-pickup': { display: 'Ready for Pickup', color: 'text-cyan-600 bg-cyan-50' },
            'delivered': { display: 'Delivered', color: 'text-green-600 bg-green-50' },
            'cancelled': { display: 'Cancelled', color: 'text-red-600 bg-red-50' },
            'on-hold': { display: 'On Hold', color: 'text-gray-600 bg-gray-50' }
          };
          return statusMap[status] || { display: status, color: 'text-gray-600 bg-gray-50' };
        };

        // Map shipments to component format
        const mappedShipments: MappedShipment[] = data.shipments.map((shipment: Shipment) => {
          const statusInfo = getStatusDisplay(shipment.status);
          return {
            id: shipment.trackingId,
            _id: shipment._id,
            customer: shipment.customer,
            origin: `${shipment.senderCity}, ${shipment.senderCountry}`,
            destination: `${shipment.receiverCity}, ${shipment.receiverCountry}`,
            status: statusInfo.display,
            statusColor: statusInfo.color,
          date: new Date(shipment.createdAt).toISOString().split('T')[0],
          estimatedDelivery: shipment.estimatedDelivery ?
            new Date(shipment.estimatedDelivery).toISOString().split('T')[0] : '-',
          packageType: shipment.packageType.charAt(0).toUpperCase() + shipment.packageType.slice(1),
          weight: `${shipment.weight} kg`,
          value: `$${shipment.declaredValue}`,
          service: shipment.serviceType === 'express' ? 'Express' :
                  shipment.serviceType === 'standard' ? 'Standard' :
                  shipment.serviceType === 'overnight' ? 'Overnight' : 'Economy',
          servicePrice: shipment.servicePrice,
          documents: shipment.documents,
          wholesalePurchases: shipment.wholesalePurchases,
          shippingMarkName: shipment.shippingMarkName,
          shippingMark: shipment.shippingMark
          };
        });
        
        setShipments(mappedShipments);
        setShipmentStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Pagination
  const totalPages = Math.ceil(shipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = shipments.slice(startIndex, startIndex + itemsPerPage);

  const handleViewShipment = (id: string) => {
    const shipment = shipments.find(s => s.id === id);
    setSelectedShipment(shipment || null);
    setShowViewModal(true);
  };

  const handleEditShipment = (id: string) => {
    const shipment = shipments.find(s => s.id === id);
    setSelectedShipment(shipment || null);
    setShowEditModal(true);
  };

  const handleDeleteShipment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipment?")) return;
    
    try {
      const response = await fetch(`/api/admin/shipments/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchShipments();
      }
    } catch (error) {
      console.error("Failed to delete shipment:", error);
    }
  };

  const handleAddInvoice = (id: string) => {
    const shipment = shipments.find(s => s._id === id);
    setSelectedShipment(shipment || null);
    setShowAddInvoiceModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Shipment Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all shipments</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
          style={{ borderRadius: "10px 0px 10px 0px" }}
        >
          <PackagePlus className="w-4 h-4" />
          Create Shipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Shipments</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{shipmentStats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">In Transit</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {shipmentStats?.inTransit || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Delivered</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {shipmentStats?.delivered || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {shipmentStats?.pending || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Cancelled</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {shipmentStats?.cancelled || 0}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tracking ID, customer, origin, or destination..."
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
              <option value="pending">Pending</option>
              <option value="arrived-at-warehouse">Arrived at Warehouse</option>
              <option value="ready-for-shipment">Ready for Shipment</option>
              <option value="in-transit">In Transit</option>
              <option value="arrived-at-warehouse-ghana">Arrived at Warehouse (Ghana)</option>
              <option value="ready-for-pickup">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#055b8e] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center">
            <PackagePlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No shipments found</h3>
            <p className="text-gray-600">No shipments match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Delivery
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-[#055b8e]">
                      {shipment.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{shipment.customer}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div>{shipment.origin}</div>
                        <div className="text-xs text-gray-500">→ {shipment.destination}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shipment.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${shipment.statusColor}`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {shipment.estimatedDelivery}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewShipment(shipment.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleEditShipment(shipment.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Shipment"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleAddInvoice(shipment._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Add Invoice"
                      >
                        <Upload className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteShipment(shipment._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Delete Shipment"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
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
        {!isLoading && shipments.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, shipments.length)} of {shipments.length} results
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
      {showViewModal && selectedShipment && (
        <ViewShipmentModal
          shipment={selectedShipment}
          onClose={() => {
            setShowViewModal(false);
            setSelectedShipment(null);
          }}
        />
      )}

      {showEditModal && selectedShipment && (
        <EditShipmentModal
          shipment={selectedShipment}
          onClose={() => {
            setShowEditModal(false);
            setSelectedShipment(null);
          }}
          onSave={() => {
            fetchShipments();
            setShowEditModal(false);
            setSelectedShipment(null);
          }}
        />
      )}

      {showCreateModal && (
        <CreateShipmentModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            fetchShipments();
            setShowCreateModal(false);
          }}
        />
      )}

      {showAddInvoiceModal && selectedShipment && (
        <AddInvoiceModal
          shipmentId={selectedShipment._id}
          trackingId={selectedShipment.id}
          onClose={() => {
            setShowAddInvoiceModal(false);
            setSelectedShipment(null);
          }}
          onSave={() => {
            fetchShipments();
            setShowAddInvoiceModal(false);
            setSelectedShipment(null);
          }}
        />
      )}
    </div>
  );
}


