"use client";

import { DollarSign, TrendingUp, CreditCard, Wallet, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RevenueManagementSection() {
  const monthlyRevenue = [
    { month: 'Jan', revenue: 45000, expenses: 28000, profit: 17000 },
    { month: 'Feb', revenue: 52000, expenses: 30000, profit: 22000 },
    { month: 'Mar', revenue: 48000, expenses: 29000, profit: 19000 },
    { month: 'Apr', revenue: 61000, expenses: 32000, profit: 29000 },
    { month: 'May', revenue: 55000, expenses: 31000, profit: 24000 },
    { month: 'Jun', revenue: 67000, expenses: 35000, profit: 32000 },
  ];

  const revenueByService = [
    { service: 'Express', revenue: 168000, percentage: 51 },
    { service: 'Standard', revenue: 94500, percentage: 29 },
    { service: 'Overnight', revenue: 57000, percentage: 17 },
    { service: 'Economy', revenue: 16250, percentage: 5 },
  ];

  const recentTransactions = [
    {
      id: "TXN001234",
      customer: "John Doe",
      shipmentId: "NSC001234",
      amount: "$150",
      method: "Credit Card",
      date: "2025-10-20",
      status: "Completed",
      statusColor: "text-green-600 bg-green-50"
    },
    {
      id: "TXN001235",
      customer: "Jane Smith",
      shipmentId: "NSC001235",
      amount: "$50",
      method: "PayPal",
      date: "2025-10-20",
      status: "Completed",
      statusColor: "text-green-600 bg-green-50"
    },
    {
      id: "TXN001236",
      customer: "Michael Johnson",
      shipmentId: "NSC001236",
      amount: "$300",
      method: "Bank Transfer",
      date: "2025-10-21",
      status: "Pending",
      statusColor: "text-yellow-600 bg-yellow-50"
    },
    {
      id: "TXN001237",
      customer: "Sarah Williams",
      shipmentId: "NSC001237",
      amount: "$500",
      method: "Credit Card",
      date: "2025-10-19",
      status: "Completed",
      statusColor: "text-green-600 bg-green-50"
    },
  ];

  const stats = [
    {
      label: "Total Revenue",
      value: "$328,000",
      change: "+15.3%",
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      label: "Total Profit",
      value: "$143,000",
      change: "+18.2%",
      icon: TrendingUp,
      color: "bg-blue-500"
    },
    {
      label: "Pending Payments",
      value: "$12,500",
      change: "-5.4%",
      icon: CreditCard,
      color: "bg-orange-500"
    },
    {
      label: "Avg. Transaction",
      value: "$366",
      change: "+4.8%",
      icon: Wallet,
      color: "bg-purple-500"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Revenue Management</h1>
          <p className="text-gray-600 mt-1">Track financial performance and transactions</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue vs Profit Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue vs Profit Analysis</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#055b8e" name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            <Bar dataKey="profit" fill="#10b981" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue by Service Type</h3>
          <div className="space-y-4">
            {revenueByService.map((service, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{service.service}</span>
                  <span className="text-sm font-bold text-gray-900">${service.revenue.toLocaleString()}</span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#055b8e] rounded-full transition-all duration-500"
                    style={{ width: `${service.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">{service.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Payment Methods Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-800">Credit Card</span>
              </div>
              <span className="text-lg font-bold text-gray-900">45%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-800">PayPal</span>
              </div>
              <span className="text-lg font-bold text-gray-900">30%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-800">Bank Transfer</span>
              </div>
              <span className="text-lg font-bold text-gray-900">25%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#055b8e]">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.shipmentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {transaction.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${transaction.statusColor}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


