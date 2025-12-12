"use client";

import { useState } from "react";
import { Save, Mail, Bell, Shield, Globe, DollarSign, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminSettingsSection() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "email", label: "Email", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "shipping", label: "Shipping", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[#055b8e] border-b-2 border-[#055b8e] bg-blue-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    defaultValue="Guangzhou Swift Logistics"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email
                  </label>
                  <Input
                    type="email"
                    defaultValue="info@guangzhouswiftlogistics.com"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Phone
                  </label>
                  <Input
                    type="tel"
                    defaultValue="+86 132 605 43058"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select className="w-full h-12 px-4 border border-gray-300 rounded-md">
                    <option>GMT+8 (Guangzhou)</option>
                    {/* <option>GMT+0 (London)</option>
                    <option>GMT-5 (New York)</option> */}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <Textarea
                    defaultValue="123 Guangzhou, China"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === "email" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Email Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <Input
                    type="text"
                    placeholder="smtp.example.com"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <Input
                    type="number"
                    placeholder="587"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username
                  </label>
                  <Input
                    type="text"
                    placeholder="username@example.com"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">New User Registration</h4>
                    <p className="text-sm text-gray-600">Receive notifications when new users register</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">New Shipment Created</h4>
                    <p className="text-sm text-gray-600">Get notified when users create new shipments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Payment Received</h4>
                    <p className="text-sm text-gray-600">Receive alerts for successful payments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">System Alerts</h4>
                    <p className="text-sm text-gray-600">Important system notifications and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Security Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    className="h-12"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  <Save className="w-4 h-4" />
                  Update Security
                </Button>
              </div>
            </div>
          )}

          {/* Pricing Settings */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Service Pricing</h3>
              
              <div className="space-y-4">
                {[
                  { service: "Express Delivery", basePrice: "40" },
                  { service: "Standard Delivery", basePrice: "25" },
                  { service: "Overnight Delivery", basePrice: "60" },
                  { service: "Economy Delivery", basePrice: "15" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-800">{item.service}</h4>
                      <p className="text-sm text-gray-600">Base price per kg</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">$</span>
                      <Input
                        type="number"
                        defaultValue={item.basePrice}
                        className="w-24 h-10"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  <Save className="w-4 h-4" />
                  Update Pricing
                </Button>
              </div>
            </div>
          )}

          {/* Shipping Settings */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Shipping Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Weight Unit
                  </label>
                  <select className="w-full h-12 px-4 border border-gray-300 rounded-md">
                    <option>Kilograms (kg)</option>
                    <option>Pounds (lb)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select className="w-full h-12 px-4 border border-gray-300 rounded-md">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                    <option>AED (د.إ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Package Weight (kg)
                  </label>
                  <Input
                    type="number"
                    defaultValue="50"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking ID Prefix
                  </label>
                  <Input
                    type="text"
                    defaultValue="NSC"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2"
                  style={{ borderRadius: "10px 0px 10px 0px" }}
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


