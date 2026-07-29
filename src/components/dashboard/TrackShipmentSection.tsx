"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Package, MapPin, Clock, CheckCircle, Truck, Plane, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shipment, TimelineEvent } from "@/types";

// Mapped timeline event type for internal component use
interface MappedTimelineEvent {
  id: number;
  status: string;
  location: string;
  date: string;
  time: string;
  completed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  imageUrl?: string;
  imageName?: string;
}

// Mapped tracking data type for internal component use
interface MappedTrackingData {
  trackingId: string;
  wholesaleTrackingNumbers: string[];
  status: string;
  statusColor: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  currentLocation: string;
  packageType: string;
  weight: string;
  service: string;
  timeline: MappedTimelineEvent[];
  deltaNumber?: string;
}

export default function TrackShipmentSection() {
  const searchParams = useSearchParams();
  const urlTrackingId = searchParams.get("id");
  
  const [trackingId, setTrackingId] = useState(urlTrackingId || "");
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<MappedTrackingData | null>(null);
  const [error, setError] = useState("");
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const handleTrack = useCallback(async (idToTrack?: string) => {
    const trackId = idToTrack || trackingId;
    if (!trackId.trim()) {
      setError("Please enter a Cascade or wholesale tracking number");
      return;
    }
    
    setError("");
    setIsTracking(true);
    
    try {
      const response = await fetch(
        `/api/shipments/track/${encodeURIComponent(trackId.trim())}`
      );
      
      if (!response.ok) {
        setError("Shipment not found. Please check the tracking number.");
        setTrackingData(null);
        setIsTracking(false);
        return;
      }
      
      const data = await response.json();
      
      // Ensure timeline exists and is an array
      const timeline = Array.isArray(data.timeline) ? data.timeline : [];
      
      // Map timeline items to include icons
      const timelineWithIcons: MappedTimelineEvent[] = timeline.map((item: TimelineEvent, index: number) => {
        // Handle date parsing - support both Date objects and strings
        let dateStr = '';
        try {
          const dateObj = item.date instanceof Date ? item.date : new Date(item.date);
          if (!isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } else {
            dateStr = typeof item.date === 'string' ? item.date : 'N/A';
          }
        } catch {
          dateStr = typeof item.date === 'string' ? item.date : 'N/A';
        }
        
        // Map status to appropriate icon
        const getTimelineIcon = (status: string) => {
          const statusLower = status.toLowerCase();
          if (statusLower.includes('picked')) return Truck;
          if (statusLower.includes('transit') || statusLower.includes('air')) return Plane;
          if (statusLower.includes('warehouse') || statusLower.includes('china') || statusLower.includes('ghana')) return Package;
          if (statusLower.includes('ready for shipment') || statusLower.includes('ready for pickup')) return Package;
          if (statusLower.includes('customs') || statusLower.includes('clearance')) return CheckCircle;
          if (statusLower.includes('delivery') && !statusLower.includes('delivered')) return Truck;
          if (statusLower.includes('delivered')) return CheckCircle;
          if (statusLower.includes('order placed')) return Package;
          return Package; // Default icon
        };

        return {
          ...item,
          id: index + 1,
          icon: getTimelineIcon(item.status),
          date: dateStr,
          time: item.time || 'N/A',
          imageUrl: item.imageUrl,
          imageName: item.imageName
        };
      });
      
      // Helper function to map status to display name and color
      const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { display: string; color: string }> = {
          'pending': { display: 'Pending', color: 'text-yellow-600' },
          'arrived-at-warehouse': { display: 'Arrived at Warehouse', color: 'text-blue-600' },
          'ready-for-shipment': { display: 'Ready for Shipment', color: 'text-purple-600' },
          'in-transit': { display: 'In Transit', color: 'text-orange-600' },
          'arrived-at-warehouse-ghana': { display: 'Arrived at Warehouse (Ghana)', color: 'text-indigo-600' },
          'ready-for-pickup': { display: 'Ready for Pickup', color: 'text-cyan-600' },
          'delivered': { display: 'Delivered', color: 'text-green-600' },
          'cancelled': { display: 'Cancelled', color: 'text-red-600' },
          'on-hold': { display: 'On Hold', color: 'text-gray-600' }
        };
        return statusMap[status] || { display: status, color: 'text-gray-600' };
      };

      const statusInfo = getStatusDisplay(data.status);
      
      const mappedTrackingData: MappedTrackingData = {
        trackingId: data.trackingId,
        wholesaleTrackingNumbers: Array.isArray(data.wholesaleTrackingNumbers)
          ? data.wholesaleTrackingNumbers
          : [],
        status: statusInfo.display,
        statusColor: statusInfo.color,
        origin: 'From client/sender',
        destination: 'Warehouse(Ghana)',
        estimatedDelivery: data.estimatedDelivery ? 
          new Date(data.estimatedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 
          'TBD',
        currentLocation: data.currentLocation || data.origin,
        packageType: data.packageType.charAt(0).toUpperCase() + data.packageType.slice(1),
        weight: `${data.weight} kg`,
        service: data.serviceType === 'express' ? 'Express Delivery' :
                data.serviceType === 'standard' ? 'Standard Delivery' :
                data.serviceType === 'overnight' ? 'Overnight Delivery' :
                'Economy Delivery',
        timeline: timelineWithIcons,
        deltaNumber: data.deltaNumber
      };
      
      setTrackingData(mappedTrackingData);
      
    } catch (error) {
      console.error("Track shipment error:", error);
      setError("Failed to track shipment. Please try again.");
      setTrackingData(null);
    } finally {
      setIsTracking(false);
    }
  }, [trackingId]);

  // Fetch recent shipments for quick access
  useEffect(() => {
    async function fetchRecentShipments() {
      try {
        const response = await fetch("/api/shipments?limit=5");
        if (response.ok) {
          const data = await response.json();
          setRecentShipments(data.shipments || []);
        }
      } catch (error) {
        console.error("Failed to fetch recent shipments:", error);
      }
    }
    fetchRecentShipments();
  }, []);

  // Auto-track if tracking ID in URL
  useEffect(() => {
    if (urlTrackingId) {
      handleTrack(urlTrackingId);
    }
  }, [urlTrackingId, handleTrack]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Track Shipment</h1>
        <p className="text-gray-600 mt-1">Enter your Cascade tracking ID or a wholesale tracking number to get real-time updates</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              value={trackingId}
              onChange={(e) => {
                setTrackingId(e.target.value);
                setError("");
              }}
              placeholder="Cascade ID or wholesale tracking number"
              className="h-12 text-lg"
            />
          </div>
          <Button
            onClick={() => handleTrack()}
            disabled={isTracking}
            className="bg-[#055b8e] hover:bg-[#044a73] text-white px-8 h-12 flex items-center gap-2 disabled:opacity-50"
            style={{ borderRadius: "10px 0px 10px 0px" }}
          >
            <Search className="w-5 h-5" />
            {isTracking ? "Tracking..." : "Track Shipment"}
          </Button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Tracking Results */}
      {trackingData && (
        <div className="space-y-6">
          {/* Shipment Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Tracking ID</div>
                <div className="text-lg font-bold text-gray-800">{trackingData.trackingId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div className={`text-lg font-bold ${trackingData.statusColor}`}>
                  {trackingData.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Current Location</div>
                <div className="text-lg font-bold text-gray-800">{trackingData.currentLocation}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Est. Delivery</div>
                <div className="text-lg font-bold text-gray-800">{trackingData.estimatedDelivery}</div>
              </div>
            </div>
            {trackingData.deltaNumber && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-[#055b8e]" />
                  <span className="text-sm text-gray-600">DELTA Number:</span>
                </div>
                <div className="text-lg font-bold text-[#055b8e]">{trackingData.deltaNumber}</div>
              </div>
            )}
            {trackingData.wholesaleTrackingNumbers.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#055b8e]" />
                  <span className="text-sm text-gray-600">Wholesale tracking numbers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trackingData.wholesaleTrackingNumbers.map((number) => (
                    <span
                      key={number}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[#055b8e]"
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Route Map - Enhanced Curved Path Visualization */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Shipment Route</h3>
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-lg p-8">
              <div className="relative h-80">
                {/* Curved Path Background */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet">
                  {/* Gray background path */}
                  <path
                    d="M 80 200 Q 220 80, 400 160 Q 580 240, 720 120"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Animated gradient path */}
                  <path
                    d="M 80 200 Q 220 80, 400 160 Q 580 240, 720 120"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="1200"
                    strokeDashoffset={
                      trackingData.status === 'Delivered' ? '0' :
                      trackingData.status === 'Ready for Pickup' ? '200' :
                      trackingData.status === 'Arrived at Warehouse (Ghana)' ? '400' :
                      trackingData.status === 'In Transit' ? '900' :
                      trackingData.status === 'Ready for Shipment' ? '1000' :
                      trackingData.status === 'Arrived at Warehouse' ? '1050' :
                      '1100'
                    }
                    style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
                  />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#055b8e', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Road markers/dashes for effect */}
                  <path
                    d="M 80 200 Q 220 80, 400 160 Q 580 240, 720 120"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="15 15"
                    opacity="0.4"
                  />
                  
                  {/* Moving dots on path (for extra effect when in transit) */}
                  {trackingData.status === 'In Transit' && (
                    <>
                      <circle r="4" fill="#f59e0b" opacity="0.6">
                        <animateMotion dur="3s" repeatCount="indefinite">
                          <mpath href="#motionPath"/>
                        </animateMotion>
                      </circle>
                      <circle r="4" fill="#3b82f6" opacity="0.6">
                        <animateMotion dur="3s" begin="1s" repeatCount="indefinite">
                          <mpath href="#motionPath"/>
                        </animateMotion>
                      </circle>
                      <path id="motionPath" d="M 80 200 Q 220 80, 400 160 Q 580 240, 720 120" fill="none" />
                    </>
                  )}
                </svg>

                {/* Route Visualization Points - Positioned ON the curve */}
                <div className="relative h-full">
                  {/* Origin - ON curve start point (10%, 71.4% of height) */}
                  <div className="absolute left-[10%] top-[71.4%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className="w-20 h-20 bg-[#055b8e] rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-100 animate-pulse">
                          <MapPin className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-800 mt-3 max-w-[120px]">{trackingData.origin}</div>
                      <div className="text-xs text-gray-600 mt-1">Origin</div>
                      <div className="text-xs text-green-600 font-medium mt-1">✓ Picked up</div>
                    </div>
                  </div>

                  {/* Current Location / In Transit - ON curve peak (50%, 57% of height) */}
                  <div className="absolute left-1/2 top-[57%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-center">
                      <div className="relative inline-block">
                        {trackingData.status === 'In Transit' ? (
                          <>
                            {/* Animated Truck */}
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-xl ring-4 ring-orange-100 animate-bounce">
                              <Truck className="w-10 h-10 text-white" />
                            </div>
                            {/* Pulse Effect */}
                            <div className="absolute inset-0 w-20 h-20 bg-orange-500 rounded-full animate-ping opacity-20"></div>
                            {/* Speed lines effect */}
                            <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
                              <div className="flex flex-col gap-1">
                                <div className="w-6 h-0.5 bg-orange-300 rounded animate-pulse"></div>
                                <div className="w-4 h-0.5 bg-orange-300 rounded animate-pulse delay-75"></div>
                                <div className="w-5 h-0.5 bg-orange-300 rounded animate-pulse delay-150"></div>
                              </div>
                            </div>
                          </>
                        ) : trackingData.status === 'Delivered' ? (
                          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl ring-4 ring-green-100">
                            <CheckCircle className="w-10 h-10 text-white" />
                          </div>
                        ) : trackingData.status === 'Ready for Pickup' || trackingData.status === 'Arrived at Warehouse (Ghana)' ? (
                          <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center shadow-xl ring-4 ring-cyan-100 animate-pulse">
                            <Package className="w-10 h-10 text-white" />
                          </div>
                        ) : trackingData.status === 'Ready for Shipment' || trackingData.status === 'Arrived at Warehouse' ? (
                          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-100">
                            <Package className="w-10 h-10 text-white" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center shadow-xl">
                            <Clock className="w-10 h-10 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-gray-800 mt-3 max-w-[140px]">{trackingData.currentLocation}</div>
                      <div className="text-xs text-gray-600 mt-1">Current Location</div>
                      {trackingData.status === 'In Transit' && (
                        <div className="text-xs text-orange-600 font-medium flex items-center justify-center gap-1 mt-1">
                          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                          In Transit
                        </div>
                      )}
                      {(trackingData.status === 'Ready for Pickup' || trackingData.status === 'Arrived at Warehouse (Ghana)') && (
                        <div className="text-xs text-cyan-600 font-medium flex items-center justify-center gap-1 mt-1">
                          <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                          {trackingData.status}
                        </div>
                      )}
                      {(trackingData.status === 'Ready for Shipment' || trackingData.status === 'Arrived at Warehouse') && (
                        <div className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1 mt-1">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          {trackingData.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destination - ON curve end (90%, 42.8% of height) */}
                  <div className="absolute right-[10%] top-[42.8%] transform translate-x-1/2 -translate-y-1/2">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl ${
                          trackingData.status === 'Delivered' 
                            ? 'bg-green-500 ring-4 ring-green-100 animate-pulse' 
                            : 'bg-gray-300'
                        }`}>
                          <MapPin className="w-10 h-10 text-white" />
                        </div>
                        {trackingData.status === 'Delivered' && (
                          <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-gray-800 mt-3 max-w-[120px]">{trackingData.destination}</div>
                      <div className="text-xs text-gray-600 mt-1">Destination</div>
                      {trackingData.status === 'Delivered' ? (
                        <div className="text-xs text-green-600 font-medium mt-1">✓ Delivered</div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">Awaiting delivery</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Floating Status Badge */}
                {trackingData.status === 'In Transit' && (
                  <div className="hidden md:block absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg border-2 border-orange-200">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">Package in transit to {trackingData.destination}</span>
                      <Plane className="w-5 h-5 text-blue-500 animate-bounce" />
                    </div>
                  </div>
                )}

                {(trackingData.status === 'Ready for Pickup' || trackingData.status === 'Arrived at Warehouse (Ghana)') && (
                  <div className="hidden md:block absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg border-2 border-cyan-200">
                      <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">{trackingData.status}</span>
                      <Package className="w-5 h-5 text-cyan-500" />
                    </div>
                  </div>
                )}

                {(trackingData.status === 'Ready for Shipment' || trackingData.status === 'Arrived at Warehouse (China)') && (
                  <div className="hidden md:block absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg border-2 border-blue-200">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">{trackingData.status}</span>
                      <Package className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                )}

                {trackingData.status === 'Delivered' && (
                  <div className="hidden md:block absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl animate-pulse">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-sm font-bold">Successfully Delivered!</span>
                      <span className="text-xl">🎉</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Shipment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Package Type</div>
                <div className="text-base font-medium text-gray-800">{trackingData.packageType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Weight</div>
                <div className="text-base font-medium text-gray-800">{trackingData.weight}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Service Type</div>
                <div className="text-base font-medium text-gray-800">{trackingData.service}</div>
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Tracking Timeline</h3>
            
            {trackingData.timeline && trackingData.timeline.length > 0 ? (
              <div className="space-y-4">
                {trackingData.timeline.map((item: MappedTimelineEvent, index: number) => {
                const Icon = item.icon;
                const isLast = index === trackingData.timeline.length - 1;
                
                return (
                  <div key={item.id} className="relative">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          item.completed 
                            ? 'bg-[#055b8e] text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        {/* Connecting Line */}
                        {!isLast && (
                          <div className={`absolute left-1/2 top-12 w-0.5 h-12 -ml-px ${
                            item.completed ? 'bg-[#055b8e]' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-base font-bold ${
                              item.completed ? 'text-gray-800' : 'text-gray-400'
                            }`}>
                              {item.status}
                            </h4>
                            <p className={`text-sm ${
                              item.completed ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {item.location}
                            </p>
                            {/* Update Image */}
                            {item.imageUrl && (
                              <div className="mt-3">
                                <button
                                  onClick={() => setViewingImage(item.imageUrl!)}
                                  className="flex items-center gap-2 text-sm text-[#055b8e] hover:text-[#044a73] transition-colors"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  <span>View update image</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className={`text-right ${
                            item.completed ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            <div className="text-sm font-medium">{item.date}</div>
                            <div className="text-xs">{item.time}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No timeline events available yet.</p>
                <p className="text-sm mt-1">Timeline will update as your shipment progresses.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Shipments - Show when no tracking data is displayed */}
      {!trackingData && recentShipments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Recent Shipments</h3>
          <div className="space-y-3">
            {recentShipments.map((shipment) => (
              <button
                key={shipment.trackingId}
                onClick={() => {
                  setTrackingId(shipment.trackingId);
                  handleTrack(shipment.trackingId);
                }}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#055b8e] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-800">{shipment.trackingId}</div>
                    {shipment.wholesalePurchases?.some((purchase) => purchase.trackingNumber?.trim()) && (
                      <div className="mt-1 text-xs text-[#055b8e]">
                        Wholesale: {shipment.wholesalePurchases
                          .map((purchase) => purchase.trackingNumber?.trim())
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      USA Warehouse, USA → Ghana Warehouse, Ghana
                    </div>
                  </div>
                </div>
                <span className="text-sm text-[#055b8e]">Track →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button - Show when tracking data is displayed */}
      {trackingData && (
        <div className="text-center">
          <Button
            onClick={() => {
              setTrackingData(null);
              setTrackingId("");
              setError("");
            }}
            variant="outline"
            className="border-2 border-[#055b8e] text-[#055b8e] hover:bg-[#055b8e] hover:text-white px-8 py-3"
          >
            Track Another Shipment
          </Button>
        </div>
      )}

      {/* Image View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              aria-label="Close image"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingImage}
              alt="Shipment update"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
