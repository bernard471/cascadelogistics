"use client";

import { Plane, Ship, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function LogisticsSection() {
  const [activeTab, setActiveTab] = useState<'air' | 'sea' | 'usa'>('air');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const airShipping = {
    title: "Air Cargo",
    subtitle: "Fast Air Freight Services",
    deliveryTime: "7-10 Days",
    icon: Plane,
    routes: [
      { origin: "Turkey", destination: "Ghana", note: "All packages include freight and custom clearance" },
      { origin: "UK", destination: "Ghana", note: "Regular air cargo services" },
      { origin: "China", destination: "Ghana", note: "Reliable shipping routes" },
      { origin: "USA", destination: "Ghana", note: "Twice weekly shipments (Thu & Sun)" }
    ],
    features: [
      "Multiple Routes",
      "Fast Delivery",
      "Custom Clearance Included",
      "Real-time Tracking"
    ]
  };

  const seaShipping = {
    title: "Sea Cargo",
    subtitle: "Cost-Effective Sea Freight",
    deliveryTime: "35-45 Days",
    icon: Ship,
    routes: [
      { origin: "Turkey", destination: "Ghana", note: "All packages include freight and custom clearance" }
    ],
    features: [
      "Cost-Effective",
      "Custom Clearance Included",
      "Heavy Cargo Support",
      "Consolidation Services"
    ]
  };

  const usaShipping = {
    title: "USA Shipping",
    subtitle: "Twice Weekly Service",
    deliveryTime: "1 Week Pickup",
    icon: Plane,
    routes: [
      { origin: "USA", destination: "Ghana", note: "Shipments every Thursday & Sunday" },
      { origin: "USA Warehouse", destination: "Ghana", note: "Pickups in Ghana every Tuesday & Friday" }
    ],
    features: [
      "Twice Weekly Shipments",
      "Guaranteed 1 Week Pickup",
      "Transparent Process",
      "Package Consolidation Available"
    ]
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const currentShipping = activeTab === 'air' ? airShipping : activeTab === 'sea' ? seaShipping : usaShipping;
  const CurrentIcon = currentShipping.icon;

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-white via-[#219ebc]/5 to-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#315694]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-[#f7941d]/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Shipping Services
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Global Shipping <span className="text-[#315694]">to Ghana</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Reliable air and sea cargo services from UK, China, USA, and Turkey to Ghana. All packages include freight and custom clearance.
          </p>
        </div>

        {/* Tab Selector */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="w-full max-w-4xl">
            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-xl border border-gray-200 min-w-max">
                <button
                  onClick={() => setActiveTab('air')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-sm ${
                    activeTab === 'air'
                      ? 'bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#315694]'
                  }`}
                >
                  <Plane className="w-4 h-4 flex-shrink-0" />
                  <span>Air Cargo</span>
                </button>
                <button
                  onClick={() => setActiveTab('sea')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-sm ${
                    activeTab === 'sea'
                      ? 'bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#315694]'
                  }`}
                >
                  <Ship className="w-4 h-4 flex-shrink-0" />
                  <span>Sea Cargo</span>
                </button>
                <button
                  onClick={() => setActiveTab('usa')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-sm ${
                    activeTab === 'usa'
                      ? 'bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#315694]'
                  }`}
                >
                  <Plane className="w-4 h-4 flex-shrink-0" />
                  <span>USA Service</span>
                </button>
              </div>
            </div>
            
            {/* Desktop: Normal Layout */}
            <div className="hidden md:flex justify-center">
              <div className="inline-flex bg-white rounded-2xl p-2 shadow-xl border border-gray-200">
                <button
                  onClick={() => setActiveTab('air')}
                  className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 text-sm md:text-base ${
                    activeTab === 'air'
                      ? 'bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#315694]'
                  }`}
                >
                  <Plane className="w-5 h-5" />
                  Air Cargo
                </button>
                <button
                  onClick={() => setActiveTab('sea')}
                  className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 text-sm md:text-base ${
                    activeTab === 'sea'
                      ? 'bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#315694]'
                  }`}
                >
                  <Ship className="w-5 h-5" />
                  Sea Cargo
                </button>
                <button
                  onClick={() => setActiveTab('usa')}
                  className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 text-sm md:text-base ${
                    activeTab === 'usa'
                      ? 'bg-gradient-to-r from-[#315694] to-[#262262] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#315694]'
                  }`}
                >
                  <Plane className="w-5 h-5" />
                  USA Shipping
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info Card */}
          <div className={`lg:col-span-1 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <div className="bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl p-8 text-white shadow-2xl h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CurrentIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{currentShipping.title}</h3>
                  <p className="text-white/80">{currentShipping.subtitle}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-white/80" />
                  <div>
                    <div className="text-sm text-white/70">Delivery Time</div>
                    <div className="text-xl font-bold">{currentShipping.deliveryTime}</div>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <div className="text-sm font-semibold mb-4 uppercase tracking-wide">Key Features</div>
                  <div className="space-y-3">
                    {currentShipping.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" />
                        <span className="text-white/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pricing Table */}
          <div className={`lg:col-span-2 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Shipping Routes</h3>
                <p className="text-gray-600 mt-1">Reliable routes with full service included</p>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentShipping.routes.map((route, index) => (
                    <div 
                      key={index}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#315694] hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{route.origin} → {route.destination}</h4>
                          <p className="text-sm text-gray-600 mt-1">{route.note}</p>
                        </div>
                        <Plane className="w-6 h-6 text-[#315694] flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-[#315694]/5 rounded-lg border border-[#315694]/20">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> All packages include freight and custom clearance. Contact us for a personalized quote based on your shipment details.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <Link href="/get-quote">
                  <Button className="w-full bg-[#315694] hover:bg-[#262262] text-white py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105">
                    Get a Custom Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
