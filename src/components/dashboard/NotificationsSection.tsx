"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Package, CheckCircle, AlertCircle, Clock, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notification } from "@/types";

// Mapped notification type for internal component use
interface MappedNotification {
  id: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export default function NotificationsSection() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState<MappedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      const response = await fetch(`/api/notifications?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Map notifications to component format
        const mappedNotifications: MappedNotification[] = data.notifications.map((notif: Notification) => {
          const getIcon = (type: string) => {
            switch(type) {
              case 'delivery': return CheckCircle;
              case 'update': return Package;
              case 'alert': return AlertCircle;
              case 'pending': return Clock;
              default: return Package;
            }
          };
          
          const getIconColor = (type: string) => {
            switch(type) {
              case 'delivery': return 'text-green-500 bg-green-50';
              case 'update': return 'text-blue-500 bg-blue-50';
              case 'alert': return 'text-orange-500 bg-orange-50';
              case 'pending': return 'text-yellow-500 bg-yellow-50';
              default: return 'text-gray-500 bg-gray-50';
            }
          };
          
          const getTimeAgo = (date: string) => {
            const now = new Date();
            const created = new Date(date);
            const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
            
            if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
            if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
            return `${Math.floor(diffInMinutes / 1440)} days ago`;
          };
          
          return {
            id: notif._id,
            type: notif.type,
            icon: getIcon(notif.type),
            iconColor: getIconColor(notif.type),
            title: notif.title,
            message: notif.message,
            time: getTimeAgo(notif.createdAt.toString()),
            isRead: notif.isRead
          };
        });
        
        setNotifications(mappedNotifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true })
      });
      
      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
        // Trigger a custom event to update header notification count
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST"
      });
      
      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
        // Trigger a custom event to update header notification count
        window.dispatchEvent(new CustomEvent('notificationRead'));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600 mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 && 's'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-[#055b8e] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "unread"
                ? "bg-[#055b8e] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "read"
                ? "bg-[#055b8e] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
          const Icon = notification.icon;
          
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border transition-all ${
                notification.isRead
                  ? "border-gray-200"
                  : "border-[#055b8e] bg-blue-50/30"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-base font-bold ${
                        notification.isRead ? "text-gray-800" : "text-gray-900"
                      }`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                        {notification.time}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed mb-4 ${
                      notification.isRead ? "text-gray-600" : "text-gray-700"
                    }`}>
                      {notification.message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-[#055b8e] hover:text-[#044a73] font-medium flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notifications.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">No notifications</h3>
          <p className="text-gray-600">You&apos;re all caught up! No {filter !== "all" && filter} notifications at the moment.</p>
        </div>
      )}
    </div>
  );
}

