"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Lock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { User as UserType } from "@/types";

export default function MyProfileSection() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileData, setProfileData] = useState<UserType | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    bio: "",
    profileImage: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            country: data.country || "",
            postalCode: data.postalCode || "",
            bio: data.bio || "",
            profileImage: data.profileImage || ""
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchProfile();
    }
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Image size must be less than 2MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          profileImage: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to update profile");
        setIsSaving(false);
        return;
      }
      
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      setError("An error occurred while updating your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to change password");
        setIsSaving(false);
        return;
      }
      
      setSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowChangePassword(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Password change error:", error);
      setError("An error occurred while changing your password");
    } finally {
      setIsSaving(false);
    }
  };

  const getUserInitials = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName[0]}${profileData.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-1">Loading your profile...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-1 pb-3 md:pb-0">Manage your personal information and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowChangePassword(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Change Password
          </Button>
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="bg-[#055b8e] hover:bg-[#044a73] text-white flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Save className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            {/* Avatar */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              {formData.profileImage ? (
                <Image
                  src={formData.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#055b8e]"
                  width={128}
                  height={128}
                />
              ) : (
                <div className="w-32 h-32 bg-[#055b8e] rounded-full flex items-center justify-center border-4 border-[#055b8e]">
                  <span className="text-white text-4xl font-bold">{getUserInitials()}</span>
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border-2 border-[#055b8e] flex items-center justify-center hover:bg-gray-50 cursor-pointer">
                  <Camera className="w-4 h-4 text-[#055b8e]" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-gray-800">{formData.firstName} {formData.lastName}</h2>
            <p className="text-gray-600 text-sm mt-1">{formData.email}</p>

            {/* Member Since */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Member since {profileData?.memberSince ? formatDate(profileData.memberSince.toString()) : 'N/A'}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-[#055b8e]">{profileData?.totalShipments || 0}</div>
                <div className="text-xs text-gray-600">Total Shipments</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-[#055b8e]">{profileData?.deliveredShipments || 0}</div>
                <div className="text-xs text-gray-600">Delivered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Personal Information</h3>
          
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* City, Country, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <Input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <Input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="h-12"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="min-h-[100px] resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Account Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive updates about your shipments via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">SMS Notifications</h4>
              <p className="text-sm text-gray-600">Get text messages for important updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Marketing Communications</h4>
              <p className="text-sm text-gray-600">Receive promotional offers and news</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#055b8e]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Change Password</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="pl-10 h-12"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="pl-10 h-12"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="pl-10 h-12"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowChangePassword(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="flex-1 bg-[#055b8e] hover:bg-[#044a73] text-white disabled:opacity-50"
              >
                {isSaving ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}