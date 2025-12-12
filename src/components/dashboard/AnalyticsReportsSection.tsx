"use client";

import { useState, useEffect } from "react";
import { Download, TrendingUp, Users, Package, 
  // DollarSign, 
  Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { AnalyticsData } from "@/types";

export default function AnalyticsReportsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/analytics?months=6");
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading || !analyticsData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Loading analytics data...</p>
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

  const revenueTrendsData = analyticsData.revenueTrends || [];
  const customerGrowthData = analyticsData.customerGrowth || [];
  const servicePerformanceData = analyticsData.servicePerformance || [];

  const totalRevenue = revenueTrendsData.reduce((sum, item) => sum + item.revenue, 0);
  const totalShipments = analyticsData.totals?.shipments || 0;
  const activeUsers = analyticsData.totals?.activeUsers || 0;

  const avgShipmentValue = totalShipments > 0 ? Math.floor(totalRevenue / totalShipments) : 0;

  const quickStats = [
    // {
    //   label: "Total Revenue (6 months)",
    //   value: `$${totalRevenue.toLocaleString()}`,
    //   change: "+15.3%",
    //   icon: DollarSign,
    //   color: "text-green-600",
    //   bgColor: "bg-green-50"
    // },
    {
      label: "Total Shipments",
      value: totalShipments.toLocaleString(),
      change: "+12.8%",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Active Customers",
      value: activeUsers.toLocaleString(),
      change: "+18.5%",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Avg. Shipment Value",
      value: `$${avgShipmentValue}`,
      change: "+5.2%",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Last 6 Months
          </Button>
          <Button
            className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
            style={{ borderRadius: "10px 0px 10px 0px" }}
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-sm font-medium ${stat.color}`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue & Shipment Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue & Shipment Trends</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={revenueTrendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#055b8e" strokeWidth={2} name="Revenue ($)" />
            <Line yAxisId="right" type="monotone" dataKey="shipments" stroke="#10b981" strokeWidth={2} name="Shipments" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={customerGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="newCustomers" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="New Customers" />
              <Area type="monotone" dataKey="activeCustomers" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" name="Active Customers" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Service Type Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="shipments" fill="#055b8e" name="Shipments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


