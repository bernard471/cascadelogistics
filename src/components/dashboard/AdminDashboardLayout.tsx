"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
    // DollarSign, 
    UserCog,
  Bell, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  MessageCircle,
  Mail,
  Newspaper,
  CreditCard,
  ShieldCheck
} from "lucide-react";
import AdminNotificationDropdown from "@/components/modals/AdminNotificationDropdown";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export default function AdminDashboardLayout({ children, activePage = "dashboard" }: AdminDashboardLayoutProps) {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  
  // Show loading state while session is being fetched
  const isLoading = status === "loading";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/member-login" });
  };

  // Fetch unread notification count for admin
  useEffect(() => {
    async function fetchAdminNotificationCount() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/admin/notifications?filter=unread");
          if (response.ok) {
            const data = await response.json();
            setUnreadNotifications(data.unreadCount || 0);
          }
        } catch (error) {
          console.error("Failed to fetch admin notification count:", error);
        }
      }
    }

    fetchAdminNotificationCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAdminNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Handle notification read events
  const handleNotificationRead = () => {
    // Refresh notification count
    async function fetchNotificationCount() {
      try {
        const response = await fetch("/api/admin/notifications?filter=unread");
        if (response.ok) {
          const data = await response.json();
          setUnreadNotifications(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch admin notification count:", error);
      }
    }
    fetchNotificationCount();
  };

  // Get admin initials
  const getAdminInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return "AD";
  };

  const adminName = session?.user?.name || "Admin User";
  const adminEmail = session?.user?.email || "admin@cascadelogistics.com";
  const userRole = session?.user?.role || "user";

  // All navigation items
  const allNavigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard" },
    { id: "users", label: "User Management", icon: Users, href: "/admin-dashboard/users" },
    { id: "identity-verifications", label: "Identity Verification", icon: ShieldCheck, href: "/admin-dashboard/identity-verifications" },
    { id: "shipments", label: "Shipment Management", icon: Package, href: "/admin-dashboard/shipments" },
    { id: "payments", label: "Payment Verification", icon: CreditCard, href: "/admin-dashboard/payments" },
    { id: "support-tickets", label: "Support Tickets", icon: MessageCircle, href: "/admin-dashboard/support-tickets" },
    { id: "contact-submissions", label: "Contact Submissions", icon: Mail, href: "/admin-dashboard/contact-submissions" },
    { id: "newsletter-subscriptions", label: "Newsletter Subscriptions", icon: Newspaper, href: "/admin-dashboard/newsletter-subscriptions" },
    { id: "analytics", label: "Analytics & Reports", icon: BarChart3, href: "/admin-dashboard/analytics" },
    // { id: "revenue", label: "Revenue Management", icon: DollarSign, href: "/admin-dashboard/revenue" },
    { id: "staff", label: "Staff Management", icon: UserCog, href: "/admin-dashboard/staff" },
    { id: "settings", label: "Settings", icon: Settings, href: "/admin-dashboard/settings" },
  ];

  // Filter navigation items based on role
  // Staff can see: Dashboard, Shipments, Support Tickets, Contact Submissions, Analytics & Reports
  const navigationItems = isLoading
    ? [] // Empty array while loading to prevent flash
    : userRole === "staff" 
      ? allNavigationItems.filter(item => 
          ["dashboard", "shipments", "support-tickets", "contact-submissions", "analytics"].includes(item.id)
        )
      : allNavigationItems;

  // Show loading skeleton while session is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header Skeleton */}
        <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Sidebar Skeleton */}
        <aside className="fixed top-0 left-0 h-full bg-slate-900 w-64 z-40 pt-20">
          <nav className="px-4 py-6 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-white/10 rounded-lg animate-pulse"></div>
            ))}
          </nav>
        </aside>

        {/* Main Content Skeleton */}
        <main className="lg:ml-64 pt-20 min-h-screen">
          <div className="p-4 lg:p-6">
            <div className="space-y-6">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left: Menu Button + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo/casecade-logo.png"
                alt="Cascade Logistics Limited"
                width={180}
                height={60}
                className="h-12 lg:h-18 object-cover"
              />
            </Link>
            
            {/* Role Badge */}
            <span className={`hidden md:inline-flex px-3 py-1 text-white text-xs font-bold rounded-full ${
              userRole === "admin" ? "bg-blue-500" : "bg-[#f7941d]"
            }`}>
              {userRole === "admin" ? "ADMIN" : "STAFF"}
            </span>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              <AdminNotificationDropdown
                isOpen={isNotificationDropdownOpen}
                onClose={() => setIsNotificationDropdownOpen(false)}
                onNotificationRead={handleNotificationRead}
              />
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{getAdminInitials()}</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">{adminName}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link href="/admin-dashboard/settings">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 flex items-center gap-2"
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
                      ? "bg-blue-500 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Admin Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{getAdminInitials()}</span>
            </div>
            <div>
              <div className="text-sm font-medium">{adminName}</div>
              <div className="text-xs text-gray-400">{adminEmail}</div>
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
