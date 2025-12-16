"use client";

import { X, User, Mail, Phone, Calendar, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MappedStaff } from "./types";

interface ViewStaffModalProps {
  staff: MappedStaff;
  onClose: () => void;
}

export default function ViewStaffModal({ staff, onClose }: ViewStaffModalProps) {
  const getStatusIcon = () => {
    switch (staff.status) {
      case "Active":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Suspended":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Pending":
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (staff.status) {
      case "Active":
        return "text-green-600 bg-green-50 border-green-200";
      case "Suspended":
        return "text-red-600 bg-red-50 border-red-200";
      case "Pending":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-[#315694]" />
            <h2 className="text-xl font-bold text-gray-800">Staff Member Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#315694] to-[#262262] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {staff.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{staff.name}</h3>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="font-semibold">{staff.status}</span>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Personal Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-gray-900">{staff.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
                    <p className="text-sm font-medium text-gray-900">{staff.username}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{staff.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Account Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                    <p className="text-sm font-medium text-gray-900">Staff</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Join Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {staff.joinDate && staff.joinDate !== 'N/A' 
                        ? new Date(staff.joinDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : staff.joinDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Account Status</p>
                    <p className="text-sm font-medium text-gray-900">{staff.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Access Information */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Access Permissions</h4>
            <p className="text-sm text-blue-800">
              This staff member has access to: Dashboard, Shipment Management, Support Tickets, and Contact Submissions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

