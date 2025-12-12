"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Package, 
  MessageSquare, 
  X, 
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types";

interface AdminNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead: () => void;
}

export default function AdminNotificationDropdown({ 
  isOpen, 
  onClose, 
  onNotificationRead 
}: AdminNotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/notifications?filter=unread&limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch admin notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await fetch(`/api/admin/notifications/${notification._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true })
      });

      // Navigate based on notification type
      if (notification.type === 'shipment') {
        router.push("/admin-dashboard/shipments");
      } else if (notification.type === 'support') {
        router.push("/admin-dashboard/support-tickets");
      }

      // Close dropdown and refresh count
      onClose();
      onNotificationRead();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications/mark-all-read", {
        method: "POST"
      });
      onNotificationRead();
      onClose();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'support':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'shipment':
        return 'border-l-blue-500 bg-blue-50';
      case 'support':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-l-4 ${
                  notification.isRead 
                    ? 'border-l-gray-300 bg-white' 
                    : getNotificationColor(notification.type)
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      notification.isRead ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {notification.type === 'shipment' ? 'Shipment' : 'Support Ticket'}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {/* {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={() => {
              router.push("/admin-dashboard/notifications");
              onClose();
            }}
            variant="outline"
            className="w-full text-sm"
          >
            View all notifications
          </Button>
        </div>
      )} */}
    </div>
  );
}
