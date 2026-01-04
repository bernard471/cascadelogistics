"use client";

import { useState, useEffect } from "react";
import { Users, Package, 
  DollarSign, 
  TrendingUp
  
} from "lucide-react";
import { 
  // BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { AdminStats, Activity, StatusData, 
  // RouteData 
  } from "@/types";

export default function AdminDashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminStats | null>(null);

  useEffect(() => {
    async function fetchAdminStats() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAdminStats();
  }, []);

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Loading dashboard data...</p>
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

  const stats = [
    {
      id: 1,
      label: "Total Revenue",
      value: `$${(dashboardData.stats.totalRevenue || 0).toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      id: 2,
      label: "Total Users",
      value: (dashboardData.stats.totalUsers || 0).toLocaleString(),
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "bg-blue-500"
    },
    {
      id: 3,
      label: "Total Shipments",
      value: (dashboardData.stats.totalShipments || 0).toLocaleString(),
      change: "+15.3%",
      trend: "up",
      icon: Package,
      color: "bg-purple-500"
    },
    {
      id: 4,
      label: "Active Shipments",
      value: (dashboardData.stats.activeShipments || 0).toLocaleString(),
      change: "-2.4%",
      trend: "down",
      icon: TrendingUp,
      color: "bg-orange-500"
    },
  ];

  // Status mapping (matching ShipmentManagementSection)
  const statusMap: Record<string, { display: string; color: string }> = {
    'pending': { display: 'Pending', color: '#eab308' }, // yellow-600
    'arrived-at-warehouse': { display: 'Arrived at Warehouse', color: '#2563eb' }, // blue-600
    'ready-for-shipment': { display: 'Ready for Shipment', color: '#9333ea' }, // purple-600
    'in-transit': { display: 'In Transit', color: '#ea580c' }, // orange-600
    'arrived-at-warehouse-ghana': { display: 'Arrived at Warehouse (Ghana)', color: '#4f46e5' }, // indigo-600
    'ready-for-pickup': { display: 'Ready for Pickup', color: '#0891b2' }, // cyan-600
    'delivered': { display: 'Delivered', color: '#16a34a' }, // green-600
    'cancelled': { display: 'Cancelled', color: '#dc2626' }, // red-600
    'on-hold': { display: 'On Hold', color: '#4b5563' } // gray-600
  };

  // Helper function to get status display info
  // const getStatusDisplay = (status: string) => {
  //   return statusMap[status] || { display: status, color: '#6b7280' }; // gray-500 fallback
  // };

  // Map shipment status data to use proper display names and colors
  const shipmentStatusWithColors = (dashboardData.shipmentStatusData || []).map((item: StatusData) => {
    // Normalize the status name - convert to lowercase and replace spaces with hyphens
    const normalizedStatus = item.name.toLowerCase().replace(/\s+/g, '-');
    
    // Check if normalized status exists as a key in our map
    let statusInfo = statusMap[normalizedStatus];
    
    // If not found by key, try to find by display name (reverse lookup)
    if (!statusInfo) {
      for (const [key, value] of Object.entries(statusMap)) {
        console.log(key, value);
        if (value.display === item.name) {
          statusInfo = value;
          break;
        }
      }
    }
    
    // Fallback if still not found
    if (!statusInfo) {
      statusInfo = { display: item.name, color: '#6b7280' };
    }
    
    return {
      ...item,
      name: statusInfo.display,
      color: statusInfo.color
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s an overview of your business.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          // const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <div key={stat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {/* <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>{stat.change}</span>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activities</h3>
          {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivities.map((activity: Activity, index: number) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'payment' ? 'bg-green-500' :
                    activity.type === 'user' ? 'bg-blue-500' :
                    activity.type === 'delivery' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No recent activities
            </div>
          )}
        </div>

        {/* Shipment Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Shipment Status Distribution</h3>
          {shipmentStatusWithColors.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shipmentStatusWithColors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {shipmentStatusWithColors.map((entry: StatusData & { color: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No shipment data available
            </div>
          )}
        </div>
      </div>

      {/* Top Routes and Recent Activities */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
        {/* Top Performing Routes */}
        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Top Performing Routes</h3>
          {dashboardData.topRoutes && dashboardData.topRoutes.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.topRoutes.map((route: RouteData, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#055b8e] rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{route.route}</div>
                      <div className="text-sm text-gray-600">{route.shipments} shipments</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-[#055b8e]">{route.revenue}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No route data available yet
            </div>
          )}
        </div> */}

        {/* Recent Activities */}
        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activities</h3>
          {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentActivities.map((activity: Activity, index: number) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'payment' ? 'bg-green-500' :
                    activity.type === 'user' ? 'bg-blue-500' :
                    activity.type === 'delivery' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No recent activities
            </div>
          )}
        </div> */}
      {/* </div> */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Avg. Delivery Time</p>
              <p className="text-3xl font-bold">3.5 Days</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-75" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Success Rate</p>
              <p className="text-3xl font-bold">98.5%</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-75" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Customer Satisfaction</p>
              <p className="text-3xl font-bold">4.8/5</p>
            </div>
            <Users className="w-8 h-8 opacity-75" />
          </div>
        </div>
      </div>
    </div>
  );
}

