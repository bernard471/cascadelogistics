"use client";

import { Package, MapPin, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RecentShipment, Activity } from "@/types";

// Internal types for mapped data in this component
interface MappedRecentShipment {
  id: string;
  _id: string;
  destination: string;
  status: string;
  statusColor: string;
  estimatedDelivery: string;
  createdAt: string;
  deltaNumber?: string;
}

interface MappedActivity {
  id: string;
  action: string;
  time: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  createdAt: string;
}

export default function DashboardOverview() {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || "User";
  
  const [stats, setStats] = useState([
    {
      id: 1,
      label: "Total Shipments",
      value: "0",
      icon: Package,
      color: "bg-blue-500",
      trend: "+12%",
      trendUp: true
    },
    {
      id: 2,
      label: "In Transit",
      value: "0",
      icon: MapPin,
      color: "bg-orange-500",
      trend: "+5%",
      trendUp: true
    },
    {
      id: 3,
      label: "Pending",
      value: "0",
      icon: Clock,
      color: "bg-yellow-500",
      trend: "-2%",
      trendUp: false
    },
    {
      id: 4,
      label: "Delivered",
      value: "0",
      icon: CheckCircle,
      color: "bg-green-500",
      trend: "+8%",
      trendUp: true
    },
  ]);

  const [recentShipments, setRecentShipments] = useState<MappedRecentShipment[]>([]);
  const [recentActivities, setRecentActivities] = useState<MappedActivity[]>([]);
  const [allTrackingNumbers, setAllTrackingNumbers] = useState<Array<{ trackingNumber: string; shipmentTrackingId: string; dateAdded: string; status: string }>>([]);
  const [trackingTablePage, setTrackingTablePage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const TRACKING_PAGE_SIZE = 10;
  const trackingTotalPages = Math.ceil(allTrackingNumbers.length / TRACKING_PAGE_SIZE);
  const trackingStart = (trackingTablePage - 1) * TRACKING_PAGE_SIZE;
  const paginatedTrackingNumbers = allTrackingNumbers.slice(trackingStart, trackingStart + TRACKING_PAGE_SIZE);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/user/stats");
        if (response.ok) {
          const data = await response.json();
          
          // Update stats
          setStats([
            {
              id: 1,
              label: "Total Shipments",
              value: data.shipments.total.toString(),
              icon: Package,
              color: "bg-blue-500",
              trend: "+12%",
              trendUp: true
            },
            {
              id: 2,
              label: "In Transit",
              value: data.shipments.inTransit.toString(),
              icon: MapPin,
              color: "bg-orange-500",
              trend: "+5%",
              trendUp: true
            },
            {
              id: 3,
              label: "Pending",
              value: data.shipments.pending.toString(),
              icon: Clock,
              color: "bg-yellow-500",
              trend: "-2%",
              trendUp: false
            },
            {
              id: 4,
              label: "Delivered",
              value: data.shipments.delivered.toString(),
              icon: CheckCircle,
              color: "bg-green-500",
              trend: "+8%",
              trendUp: true
            },
          ]);

          // Update recent shipments - map them to match the component format
          const mappedShipments: MappedRecentShipment[] = (data.recentShipments || []).map((shipment: RecentShipment) => ({
            id: shipment.trackingId,
            _id: shipment._id,
            destination: shipment.destination,
            status: shipment.status === 'in-transit' ? 'In Transit' : 
                    shipment.status === 'pending' ? 'Pending' :
                    shipment.status === 'delivered' ? 'Delivered' : shipment.status,
            statusColor: shipment.status === 'in-transit' ? 'text-orange-600 bg-orange-50' :
                        shipment.status === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                        shipment.status === 'delivered' ? 'text-green-600 bg-green-50' : 
                        'text-gray-600 bg-gray-50',
            estimatedDelivery: shipment.estimatedDelivery ? 
              new Date(shipment.estimatedDelivery).toISOString().split('T')[0] : 'TBD',
            createdAt: new Date(shipment.createdAt).toISOString().split('T')[0],
            deltaNumber: shipment.deltaNumber
          }));
          
          setRecentShipments(mappedShipments);

          setAllTrackingNumbers(data.allTrackingNumbers || []);
          setTrackingTablePage(1);

          // Map recent activities
          const mappedActivities: MappedActivity[] = (data.recentActivities || []).map((activity: Activity, index: number) => {
            const getIcon = (type: string) => {
              switch(type) {
                case 'delivery': return CheckCircle;
                case 'update': return Package;
                case 'pending': return AlertCircle;
                case 'alert': return AlertCircle;
                default: return Package;
              }
            };
            
            const getIconColor = (type: string) => {
              switch(type) {
                case 'delivery': return 'text-green-500';
                case 'update': return 'text-blue-500';
                case 'pending': return 'text-yellow-500';
                case 'alert': return 'text-orange-500';
                default: return 'text-gray-500';
              }
            };
            
            return {
              id: (index + 1).toString(),
              action: activity.action,
              time: activity.time,
              type: activity.type,
              icon: getIcon(activity.type),
              iconColor: getIconColor(activity.type),
              createdAt: new Date(activity.createdAt).toISOString().split('T')[0]
            };
          });
          
          setRecentActivities(mappedActivities);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Loading your dashboard...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back, {userName}! Here&apos;s what&apos;s happening with your shipments.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {/* <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`w-4 h-4 ${!stat.trendUp && 'rotate-180'}`} />
                  <span className="font-medium">{stat.trend}</span>
                </div> */}
                <div className="text-3xl font-bold text-[#055b8e]">{stat.value}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Your Tracking Numbers - All statuses, with pagination */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Your Tracking Numbers</h2>
          <p className="text-sm text-gray-500 mt-1">
            All purchase shop tracking numbers linked to your shipments, the shipment they belong to, and current status.
          </p>
        </div>
        <div className="overflow-x-auto">
          {allTrackingNumbers.length > 0 ? (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tracking Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shipment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTrackingNumbers.map((row, index) => (
                    <tr key={`${row.trackingNumber}-${row.shipmentTrackingId}-${trackingStart + index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-[#055b8e]">{row.trackingNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/user-dashboard/track-shipment?id=${row.shipmentTrackingId}`}>
                          <span className="text-sm text-gray-900 hover:text-[#055b8e] hover:underline">
                            {row.shipmentTrackingId}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.dateAdded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {trackingTotalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {trackingStart + 1} to {Math.min(trackingStart + TRACKING_PAGE_SIZE, allTrackingNumbers.length)} of {allTrackingNumbers.length} tracking numbers
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setTrackingTablePage((p) => Math.max(1, p - 1))}
                      disabled={trackingTablePage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-2">
                      Page {trackingTablePage} of {trackingTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setTrackingTablePage((p) => Math.min(trackingTotalPages, p + 1))}
                      disabled={trackingTablePage === trackingTotalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">No tracking numbers yet</h3>
              <p className="text-gray-600">When you add purchase shop tracking numbers to your shipments, they will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Shipments */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Recent Shipments</h2>
              <Link href="/user-dashboard/assets-list">
                <button className="text-sm text-[#055b8e] hover:text-[#044a73] font-medium">
                  View All
                </button>
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            {recentShipments.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DELTA Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Delivery
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/user-dashboard/track-shipment?id=${shipment.id}`}>
                          <span className="text-sm font-medium text-[#055b8e] hover:underline">
                            {shipment.id}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {shipment.deltaNumber || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">Ghana Warehouse, Ghana</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${shipment.statusColor}`}>
                          {shipment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {shipment.estimatedDelivery}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">No shipments yet</h3>
                <p className="text-gray-600 mb-4">Create your first shipment to get started</p>
                <Link href="/user-dashboard/submit-asset">
                  <button className="bg-[#055b8e] hover:bg-[#044a73] text-white px-6 py-2 rounded-lg font-medium">
                    Submit New Asset
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${activity.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/user-dashboard/submit-asset">
            <button className="w-full bg-[#055b8e] hover:bg-[#044a73] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              Submit New Asset
            </button>
          </Link>
          <Link href="/user-dashboard/track-shipment">
            <button className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />
              Track Shipment
            </button>
          </Link>
          <Link href="/user-dashboard/support">
            <button className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Contact Support
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

