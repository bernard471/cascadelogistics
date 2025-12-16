"use client";

import { useState } from "react";
import { X, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateStaffModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function CreateStaffModal({ onClose, onSave }: CreateStaffModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const generateDefaultPassword = () => {
    // Generate a random 8-character password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const generatedPassword = generateDefaultPassword();
    setFormData(prev => ({ ...prev, password: generatedPassword }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "staff",
          status: "active"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create staff member");
        setIsSaving(false);
        return;
      }

      setSuccess("Staff member created successfully!");
      
      // Reset form and close after short delay
      setTimeout(() => {
        onSave(); // Refresh the staff list
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Create staff error:", error);
      setError("An error occurred while creating the staff member");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#315694]" />
            <h2 className="text-xl font-bold text-gray-800">Add New Staff Member</h2>
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
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">Staff Account Information</p>
            <p>Staff members will be created with the &quot;staff&quot; role and can access Dashboard, Shipments, Support Tickets, and Contact Submissions. They can change their password later using the forgot password feature.</p>
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
              />
            </div>
          </div>

          {/* Password & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Password *
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="h-12 flex-1"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  onClick={handleGeneratePassword}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Staff can change this later via forgot password</p>
            </div>

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
              />
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
              {isSaving ? "Creating..." : "Create Staff Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


