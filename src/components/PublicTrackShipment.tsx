"use client";

import { useState } from "react";
import { Search, Package, MapPin, Clock, CheckCircle, Truck, Plane, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineEvent } from "@/types";

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

export default function PublicTrackShipment() {
  const [trackingId, setTrackingId] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<MappedTrackingData | null>(null);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      setError("Please enter a Cascade or wholesale tracking number");
      return;
    }
    
    setError("");
    setIsTracking(true);
    setShowResults(false);
    
    try {
      const response = await fetch(
        `/api/shipments/track/${encodeURIComponent(trackingId.trim())}`
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
        origin: data.origin,
        destination: data.destination,
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
      setShowResults(true);
      
    } catch (error) {
      console.error("Track shipment error:", error);
      setError("Failed to track shipment. Please try again.");
      setTrackingData(null);
    } finally {
      setIsTracking(false);
    }
  };

  const handleReset = () => {
    setTrackingId("");
    setTrackingData(null);
    setError("");
    setShowResults(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 lg:p-8 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Track Your Shipment</h2>
          <p className="text-gray-600">Enter your Cascade tracking ID or a wholesale tracking number</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              value={trackingId}
              onChange={(e) => {
                setTrackingId(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTrack();
                }
              }}
              placeholder="Cascade ID or wholesale tracking number"
              className="h-14 text-lg border-2 border-gray-200 focus:border-[#219ebc]"
            />
          </div>
          <Button
            onClick={handleTrack}
            disabled={isTracking}
            className="bg-gradient-to-r from-[#219ebc] to-[#023e8a] hover:from-[#023e8a] hover:to-[#219ebc] text-white px-8 h-14 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {isTracking ? "Tracking..." : "Track"}
          </Button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tracking Results */}
      {showResults && trackingData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Shipment Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-1">Tracking ID</div>
              <div className="text-xl font-bold">{trackingData.trackingId}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className={`text-xl font-bold ${trackingData.statusColor}`}>
                {trackingData.status}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Current Location</div>
              <div className="text-lg font-bold text-gray-800">{trackingData.currentLocation}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Est. Delivery</div>
              <div className="text-lg font-bold text-gray-800">{trackingData.estimatedDelivery}</div>
            </div>
          </div>

          {/* DELTA Number Display */}
          {trackingData.deltaNumber && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">DELTA Number</h3>
              </div>
              <div className="text-lg font-bold text-[#055b8e]">{trackingData.deltaNumber}</div>
            </div>
          )}

          {trackingData.wholesaleTrackingNumbers.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Package className="h-5 w-5 text-[#055b8e]" />
                <h3 className="font-bold text-gray-800">Wholesale tracking numbers</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trackingData.wholesaleTrackingNumbers.map((number) => (
                  <span
                    key={number}
                    className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#055b8e]"
                  >
                    {number}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Route Visualization */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Shipment Route</h3>
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <div className="w-16 h-16 bg-[#219ebc] rounded-full flex items-center justify-center shadow-xl mx-auto mb-2">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-bold text-gray-800">{trackingData.origin}</div>
                  <div className="text-xs text-gray-600 mt-1">Origin</div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="h-1 bg-gradient-to-r from-[#219ebc] to-[#023e8a] flex-1 my-auto"></div>
                  {trackingData.status === 'In Transit' && (
                    <Truck className="w-8 h-8 text-orange-500 mx-2 animate-pulse" />
                  )}
                  {(trackingData.status === 'Ready for Pickup' || trackingData.status === 'Arrived at Warehouse (Ghana)') && (
                    <Package className="w-8 h-8 text-cyan-500 mx-2 animate-pulse" />
                  )}
                  {(trackingData.status === 'Ready for Shipment' || trackingData.status === 'Arrived at Warehouse') && (
                    <Package className="w-8 h-8 text-blue-500 mx-2" />
                  )}
                  {trackingData.status === 'Delivered' && (
                    <CheckCircle className="w-8 h-8 text-green-500 mx-2" />
                  )}
                  {(trackingData.status === 'Pending' || trackingData.status === 'On Hold') && (
                    <Clock className="w-8 h-8 text-gray-400 mx-2" />
                  )}
                  <div className="h-1 bg-gradient-to-r from-[#219ebc] to-[#023e8a] flex-1 my-auto"></div>
                </div>
                <div className="text-center flex-1">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl mx-auto mb-2 ${
                    trackingData.status === 'Delivered' 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                  }`}>
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-bold text-gray-800">{trackingData.destination}</div>
                  <div className="text-xs text-gray-600 mt-1">Destination</div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Tracking Timeline</h3>
            
            {trackingData.timeline && trackingData.timeline.length > 0 ? (
              <div className="space-y-4">
                {trackingData.timeline.map((item: MappedTimelineEvent, index: number) => {
                const Icon = item.icon;
                const isLast = index === trackingData.timeline.length - 1;
                
                return (
                  <div key={item.id} className="relative">
                    <div className="flex gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          item.completed 
                            ? 'bg-gradient-to-br from-[#219ebc] to-[#023e8a] text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        {!isLast && (
                          <div className={`absolute left-1/2 top-12 w-0.5 h-12 -ml-px ${
                            item.completed ? 'bg-gradient-to-b from-[#219ebc] to-[#023e8a]' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </div>
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
                                  className="flex items-center gap-2 text-sm text-[#219ebc] hover:text-[#023e8a] transition-colors"
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

          {/* Reset Button */}
          <div className="text-center">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-2 border-[#219ebc] text-[#219ebc] hover:bg-[#219ebc] hover:text-white px-8 py-3"
            >
              Track Another Shipment
            </Button>
          </div>
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
