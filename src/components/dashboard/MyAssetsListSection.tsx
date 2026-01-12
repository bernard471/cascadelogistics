"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, Eye, Package, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Shipment } from "@/types";
import ViewShipmentModal from "@/components/modals/ViewShipmentModal";
import EditAssetModal from "@/components/modals/EditAssetModal";
import ViewInvoiceModal from "@/components/modals/ViewInvoiceModal";

// Internal type for mapped asset data in this component
interface MappedAsset {
  id: string;
  destination: string;
  origin: string;
  status: string;
  statusColor: string;
  date: string;
  estimatedDelivery: string;
  packageType: string;
  weight: string;
  value: string;
  trackingId: string;
  deltaNumber?: string;
}

export default function MyAssetsListSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [assets, setAssets] = useState<MappedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Shipment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>("");
  const itemsPerPage = 10;

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: "100" // Fetch all, we'll paginate client-side
      });
      
      const response = await fetch(`/api/shipments?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        // Helper function to map status to display name and color
        const getStatusDisplay = (status: string) => {
          const statusMap: Record<string, { display: string; color: string }> = {
            'pending': { display: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
            'arrived-at-warehouse': { display: 'Arrived at Warehouse', color: 'text-blue-600 bg-blue-50' },
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

        // Map API data to component format
        const mappedAssets: MappedAsset[] = data.shipments.map((shipment: Shipment) => {
          const statusInfo = getStatusDisplay(shipment.status);
          return {
            id: shipment.trackingId,
            destination: 'Ghana Warehouse, Ghana',
            origin: 'USA Warehouse, USA',
            status: statusInfo.display,
            statusColor: statusInfo.color,
          date: new Date(shipment.createdAt).toISOString().split('T')[0],
          estimatedDelivery: shipment.estimatedDelivery ? 
            new Date(shipment.estimatedDelivery).toISOString().split('T')[0] : '-',
          packageType: shipment.packageType.charAt(0).toUpperCase() + shipment.packageType.slice(1),
          weight: `${shipment.weight} kg`,
          value: `$${shipment.declaredValue}`,
          trackingId: shipment.trackingId,
          deltaNumber: shipment.deltaNumber
          };
        });
        
        setAssets(mappedAssets);
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleViewAsset = async (asset: MappedAsset) => {
    try {
      const response = await fetch(`/api/shipments`);
      if (!response.ok) throw new Error('Failed to fetch shipment details');
      
      const data = await response.json();
      const fullShipment = data.shipments.find((s: Shipment) => s.trackingId === asset.trackingId);
      
      if (!fullShipment) {
        throw new Error('Shipment not found');
      }
      
      setSelectedAsset(fullShipment);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      alert('Failed to load shipment details. Please try again.');
    }
  };

  const handleEditAsset = async (asset: MappedAsset) => {
    try {
      const response = await fetch(`/api/shipments`);
      if (!response.ok) throw new Error('Failed to fetch shipment details');
      
      const data = await response.json();
      const fullShipment = data.shipments.find((s: Shipment) => s.trackingId === asset.trackingId);
      
      if (!fullShipment) {
        throw new Error('Shipment not found');
      }
      
      if (fullShipment.status !== 'pending') {
        alert('Only pending shipments can be edited');
        return;
      }
      
      setSelectedAsset(fullShipment);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      alert('Failed to load shipment details. Please try again.');
    }
  };

  // Filter assets based on search (status filtering happens server-side via API)
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.origin.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  const handleViewInvoice = async (asset: MappedAsset) => {
    try {
      const response = await fetch(`/api/shipments`);
      if (!response.ok) throw new Error('Failed to fetch shipment details');
      
      const data = await response.json();
      const fullShipment = data.shipments.find((s: Shipment) => s.trackingId === asset.trackingId);
      
      if (!fullShipment || !fullShipment._id) {
        alert('Shipment not found');
        return;
      }
      
      setSelectedShipmentId(fullShipment._id);
      setSelectedTrackingId(asset.trackingId);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      alert('Failed to load invoice. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">My Assets List</h1>
        <p className="text-gray-600 mt-1">View and manage all your shipments</p>
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
                placeholder="Search by tracking ID, origin, or destination..."
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total Assets</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{assets.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">In Transit</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {assets.filter(a => a.status === "In Transit").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Delivered</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {assets.filter(a => a.status === "Delivered").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {assets.filter(a => a.status === "Pending").length}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading your assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No assets found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Create your first shipment to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link href="/user-dashboard/submit-asset">
                <button className="bg-[#055b8e] hover:bg-[#044a73] text-white px-6 py-2 rounded-lg font-medium">
                  Submit New Asset
                </button>
              </Link>
            )}
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
                  DELTA Number
                </th>
                <th className="px-16 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origin → Destination
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {paginatedAssets.map((asset) => (
                <tr key={asset.trackingId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/user-dashboard/track-shipment?id=${asset.trackingId}`}>
                      <span className="text-sm font-medium text-[#055b8e] hover:underline">
                        {asset.trackingId}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {asset.deltaNumber || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {asset.origin} → {asset.destination}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{asset.packageType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${asset.statusColor}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {asset.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {asset.estimatedDelivery}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewAsset(asset)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      {asset.status === "Pending" && (
                        <button
                          onClick={() => handleEditAsset(asset)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Shipment"
                        >
                          <Edit2 className="w-4 h-4 text-[#219ebc]" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewInvoice(asset)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                        title="View Invoice"
                      >
                        <FileText className="w-4 h-4 text-[#315694]" />
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
        {!isLoading && filteredAssets.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssets.length)} of {filteredAssets.length} results
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

      {/* View Modal */}
      {showViewModal && selectedAsset && (
        <ViewShipmentModal
          shipment={{
            id: selectedAsset.trackingId,
            _id: selectedAsset._id || '',
            customer: `${selectedAsset.senderName}`,
            origin: 'USA Warehouse, USA',
            destination: 'Ghana Warehouse, Ghana',
            status: selectedAsset.status === 'in-transit' ? 'In Transit' :
                    selectedAsset.status === 'pending' ? 'Pending' :
                    selectedAsset.status === 'delivered' ? 'Delivered' :
                    selectedAsset.status === 'cancelled' ? 'Cancelled' : selectedAsset.status,
            statusColor: selectedAsset.status === 'in-transit' ? 'text-orange-600 bg-orange-50' :
                        selectedAsset.status === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                        selectedAsset.status === 'delivered' ? 'text-green-600 bg-green-50' :
                        selectedAsset.status === 'cancelled' ? 'text-red-600 bg-red-50' : 
                        'text-gray-600 bg-gray-50',
            date: new Date(selectedAsset.createdAt).toISOString().split('T')[0],
            estimatedDelivery: selectedAsset.estimatedDelivery ? 
              new Date(selectedAsset.estimatedDelivery).toISOString().split('T')[0] : '-',
            packageType: selectedAsset.packageType.charAt(0).toUpperCase() + selectedAsset.packageType.slice(1),
            weight: `${selectedAsset.weight} kg`,
            value: `$${selectedAsset.declaredValue}`,
            service: selectedAsset.serviceType === 'express' ? 'Express' :
                    selectedAsset.serviceType === 'standard' ? 'Standard' :
                    selectedAsset.serviceType === 'overnight' ? 'Overnight' : 'Economy',
            servicePrice: selectedAsset.servicePrice,
            documents: selectedAsset.documents,
            wholesalePurchases: selectedAsset.wholesalePurchases,
            deltaNumber: selectedAsset.deltaNumber
          }}
          onClose={() => {
            setShowViewModal(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAsset && (
        <EditAssetModal
          shipment={selectedAsset}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAsset(null);
          }}
          onSave={() => {
            fetchAssets();
            setShowEditModal(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedShipmentId && selectedTrackingId && (
        <ViewInvoiceModal
          shipmentId={selectedShipmentId}
          trackingId={selectedTrackingId}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedShipmentId("");
            setSelectedTrackingId("");
          }}
        />
      )}
    </div>
  );
}

