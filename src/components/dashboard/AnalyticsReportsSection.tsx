"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, TrendingUp, Users, Package,
  // DollarSign,
  Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { AnalyticsData, DeltaReportRow } from "@/types";

const MONTHS_OPTIONS = [3, 6, 12] as const;

export default function AnalyticsReportsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [months, setMonths] = useState<number>(6);
  const [deltaNumbersInput, setDeltaNumbersInput] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?months=${months}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  const handleExportReport = async (format: "pdf" | "excel") => {
    const deltaNumbers = deltaNumbersInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    if (deltaNumbers.length === 0) {
      setExportError("Enter at least one DELTA number (e.g. DELTA85720). Multiple: comma-separated.");
      return;
    }
    setExportError("");
    setExportLoading(true);
    try {
      const params = new URLSearchParams({ deltaNumbers: deltaNumbers.join(",") });
      const response = await fetch(`/api/admin/reports/delta?${params}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch report data");
      }
      const { rows } = await response.json() as { rows: DeltaReportRow[] };

      if (format === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Delta Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`DELTA: ${deltaNumbers.join(", ")}`, 14, 28);
        const tableBody = rows.map((r) => [
          r.customerName,
          r.wholesaleTrackingNumbers.join(", ") || "-",
          (r.description || "").slice(0, 40) + (r.description && r.description.length > 40 ? "…" : ""),
          String(r.quantity),
          `${r.totalWeightKg} kg`
        ]);
        autoTable(doc, {
          startY: 34,
          head: [["Customer", "Wholesale Tracking Numbers", "Description", "Quantity", "Total Weight"]],
          body: tableBody,
          theme: "grid",
          headStyles: { fillColor: [5, 91, 142] }
        });
        doc.save(`delta-report-${deltaNumbers.join("-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        const header = "Customer,Wholesale Tracking Numbers,Description,Quantity,Total Weight (kg)\n";
        const csvRows = rows.map(
          (r) =>
            `"${(r.customerName || "").replace(/"/g, '""')}","${(r.wholesaleTrackingNumbers.join(", ") || "").replace(/"/g, '""')}","${(r.description || "").replace(/"/g, '""')}",${r.quantity},${r.totalWeightKg}`
        );
        const csv = header + csvRows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `delta-report-${deltaNumbers.join("-")}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            {MONTHS_OPTIONS.map((m) => (
              <Button
                key={m}
                variant={months === m ? "default" : "outline"}
                size="sm"
                className={months === m ? "bg-[#055b8e] hover:bg-[#044a73]" : ""}
                onClick={() => setMonths(m)}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Last {m} Months
              </Button>
            ))}
          </div>
        </div>

        {/* Export by DELTA */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Export report by DELTA number(s)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Report includes: customer name, wholesale/purchase tracking numbers (not shipment ID), description, quantity, and total weight per shipment for the selected DELTA.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Input
                placeholder="e.g. DELTA85720 or DELTA1, DELTA2"
                value={deltaNumbersInput}
                onChange={(e) => {
                  setDeltaNumbersInput(e.target.value);
                  setExportError("");
                }}
                className="h-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                disabled={exportLoading}
                className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
                style={{ borderRadius: "10px 0px 10px 0px" }}
                onClick={() => handleExportReport("pdf")}
              >
                <Download className="w-4 h-4" />
                {exportLoading ? "Generating…" : "Export PDF"}
              </Button>
              <Button
                variant="outline"
                disabled={exportLoading}
                className="flex items-center gap-2"
                onClick={() => handleExportReport("excel")}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
          {exportError && (
            <p className="text-sm text-red-600 mt-2">{exportError}</p>
          )}
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


