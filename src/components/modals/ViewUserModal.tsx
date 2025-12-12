"use client";

import { X, User, Mail, Phone, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mapped user type for modal use
interface MappedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalShipments: number;
  registeredDate: string;
  status: string;
  statusColor: string;
}

interface ViewUserModalProps {
  user: MappedUser;
  onClose: () => void;
}

export default function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">User Details</h2>
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
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#055b8e] rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-2 ${user.statusColor}`}>
                {user.status}
              </span>
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-gray-800">{user.email}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <p className="text-gray-800">{user.phone}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  Registered Date
                </label>
                <p className="text-gray-800">{user.registeredDate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <Package className="w-4 h-4" />
                  Total Shipments
                </label>
                <p className="text-2xl font-bold text-[#055b8e]">{user.totalShipments}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  Account Status
                </label>
                <p className="text-gray-800">{user.status}</p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Quick Stats</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">{user.totalShipments}</div>
                <div className="text-xs text-gray-600">Total Shipments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(user.totalShipments * 0.7)}
                </div>
                <div className="text-xs text-gray-600">Delivered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.ceil(user.totalShipments * 0.3)}
                </div>
                <div className="text-xs text-gray-600">In Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

