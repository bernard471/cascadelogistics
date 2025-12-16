"use client";

import { useState, useEffect } from "react";
import { X, Save, User, 
  // Mail, Phone, 
  AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MappedStaff } from "./types";

interface EditStaffModalProps {
  staff: MappedStaff;
  onClose: () => void;
  onSave: () => void;
}

export default function EditStaffModal({ staff, onClose, onSave }: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    status: "active" as "active" | "suspended" | "pending"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize form data from staff prop
  useEffect(() => {
    const nameParts = staff.name.split(' ');
    setFormData({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(' ') || "",
      email: staff.email,
      username: staff.username,
      phone: staff.phone === 'N/A' ? "" : staff.phone,
      status: staff.status.toLowerCase() as "active" | "suspended" | "pending"
    });
  }, [staff]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/users/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          phone: formData.phone,
          status: formData.status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update staff member");
        setIsSaving(false);
        return;
      }

      setSuccess("Staff member updated successfully!");
      
      // Refresh and close after short delay
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Update staff error:", error);
      setError("An error occurred while updating the staff member");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-[#315694]" />
            <h2 className="text-xl font-bold text-gray-800">Edit Staff Member</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">Note</p>
            <p>You can update staff member information. Password changes must be done by the staff member using the forgot password feature.</p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="h-12"
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="h-12"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Email & Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="h-12"
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="h-12"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="h-12"
                placeholder="+233 XX XXX XXXX"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#315694]"
                required
                disabled={isSaving}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white px-6 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


