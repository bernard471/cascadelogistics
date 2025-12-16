"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  User, 
  Package, 
  MapPin, 
  List, 
  Bell, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  CreditCard
} from "lucide-react";

interface UserDashboardLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export default function UserDashboardLayout({ children, activePage = "dashboard" }: UserDashboardLayoutProps) {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/member-login" });
  };

  // Fetch user profile image
  useEffect(() => {
    async function fetchProfileImage() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            setProfileImage(data.profileImage || null);
          }
        } catch (error) {
          console.error("Failed to fetch profile image:", error);
        }
      }
    }

    fetchProfileImage();
  }, [session?.user?.id]);

  // Fetch unread notification count
  useEffect(() => {
    async function fetchNotificationCount() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/notifications?filter=unread");
          if (response.ok) {
            const data = await response.json();
            setUnreadNotifications(data.unreadCount || 0);
          }
        } catch (error) {
          console.error("Failed to fetch notification count:", error);
        }
      }
    }

    fetchNotificationCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    // Listen for notification read events
    const handleNotificationRead = () => {
      fetchNotificationCount();
    };
    
    window.addEventListener('notificationRead', handleNotificationRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationRead', handleNotificationRead);
    };
  }, [session?.user?.id]);

  // Get user initials
  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return "U";
  };

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/user-dashboard" },
    { id: "profile", label: "My Profile", icon: User, href: "/user-dashboard/profile" },
    { id: "submit-asset", label: "Submit an Asset", icon: Package, href: "/user-dashboard/submit-asset" },
    { id: "track-shipment", label: "Track Shipment", icon: MapPin, href: "/user-dashboard/track-shipment" },
    { id: "assets-list", label: "My Assets List", icon: List, href: "/user-dashboard/assets-list" },
    { id: "payment-proof", label: "Payment Proof", icon: CreditCard, href: "/user-dashboard/payment-proof" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/user-dashboard/notifications" },
    { id: "support", label: "Info / Support", icon: HelpCircle, href: "/user-dashboard/support" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6">
          {/* Left: Menu Button + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            {/* <h1 className="text-blue-800 text-lg font-medium">Guangzhou Swift Logistics</h1> */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo/casecade-logo.png"
                alt="Cascade Logistics Limited"
                width={180}
                height={60}
                className="h-12 lg:h-18 object-cover"
              />
            </Link>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Link href="/user-dashboard/notifications">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-[#055b8e] rounded-full flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">{getUserInitials()}</span>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">{userName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link href="/user-dashboard/profile">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </button>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-slate-900 text-white w-64 z-40 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 pt-20`}
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <Link key={item.id} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#055b8e] text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#055b8e] rounded-full flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">{getUserInitials()}</span>
              )}
            </div>
            <div>
              <div className="text-sm font-medium">{userName}</div>
              <div className="text-xs text-gray-400">{userEmail}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-20 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

