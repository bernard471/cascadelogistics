"use client";

import Image from "next/image";
import { Plane, Ship, MapPin, Clock, CheckCircle2, ArrowRight, Calendar, Navigation } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function ShippingRoutesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const routes = [
    {
      id: 1,
      origin: "Turkey",
      destination: "Ghana",
      type: "Air Cargo",
      deliveryTime: "7-10 Days",
      icon: Plane,
      image: "/logisticssection/airshipping.jpg",
      features: [
        "All packages include freight and custom clearance",
        "Fast and reliable service",
        "Transparent tracking"
      ],
      gradient: "from-[#315694] to-[#262262]"
    },
    {
      id: 2,
      origin: "Turkey",
      destination: "Ghana",
      type: "Sea Cargo",
      deliveryTime: "35-45 Days",
      icon: Ship,
      image: "/logisticssection/seashipping.jpeg",
      features: [
        "All packages include freight and custom clearance",
        "Cost-effective shipping",
        "Heavy cargo support"
      ],
      gradient: "from-[#f7941d]/40 to-[#f7941d]/10"
    },
    {
      id: 3,
      origin: "USA",
      destination: "Ghana",
      type: "Air Cargo",
      deliveryTime: "1 Week Pickup",
      icon: Plane,
      image: "/logisticssection/expressair.jpg",
      features: [
        "Shipments every Thursday & Sunday",
        "Pickups in Ghana every Tuesday & Friday",
        "Guaranteed pickup within 1 week",
        "Package consolidation available"
      ],
      gradient: "from-[#315694] to-[#262262]",
      special: true
    },
    {
      id: 4,
      origin: "UK",
      destination: "Ghana",
      type: "Air Cargo",
      deliveryTime: "7-10 Days",
      icon: Plane,
      image: "/cascade/airshipping.jpg",
      features: [
        "Regular air cargo services",
        "Full service included",
        "Reliable delivery"
      ],
      gradient: "from-[#f7941d]/10 via-[#f7941d]/70 to-[#f7941d]/10"
    },
    {
      id: 5,
      origin: "China",
      destination: "Ghana",
      type: "Air Cargo",
      deliveryTime: "7-10 Days",
      icon: Plane,
      image: "/logisticssection/airshipping.jpg",
      features: [
        "Reliable shipping routes",
        "Full service included",
        "Transparent process"
      ],
      gradient: "from-[#315694] to-[#262262]"
    }
  ];

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

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-32 overflow-hidden bg-white">
      {/* Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#315694]/5 via-[#262262]/5 to-[#f7941d]/5"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#315694]/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-[#315694]/30 rounded-full blur-3xl"></div>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(49, 86, 148, 0.1) 25%, rgba(49, 86, 148, 0.1) 26%, transparent 27%, transparent 74%, rgba(247, 148, 29, 0.1) 75%, rgba(247, 148, 29, 0.1) 76%, transparent 77%, transparent)`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className={`mb-20 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-4">
                <Navigation className="w-5 h-5 text-[#f7941d]" />
                <span className="px-4 py-1.5 bg-[#f7941d] text-white text-xs font-bold uppercase tracking-wider rounded-full">
                  Our Routes
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 leading-tight">
                Global Shipping
                <span className="block text-[#315694]">Routes to Ghana</span>
              </h2>
              <div className="w-20 h-1 bg-[#f7941d] mb-6"></div>
              <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                We connect UK, China, USA, and Turkey to Ghana with reliable air and sea cargo services. All packages include freight and custom clearance.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 lg:flex lg:flex-col">
              <div className="bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl p-6 text-white shadow-xl">
                <div className="text-3xl font-bold mb-1">4+</div>
                <div className="text-sm opacity-90">Countries</div>
              </div>
              <div className="bg-gradient-to-br from-[#f7941d] to-[#f7941d]/80 rounded-2xl p-6 text-white shadow-xl">
                <div className="text-3xl font-bold mb-1">7-45</div>
                <div className="text-sm opacity-90">Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Routes - Asymmetric Layout */}
        <div className="space-y-8 mb-16">
          {/* USA Route - Special Large Card */}
          {routes.filter(r => r.special).map((route, index) => {
            const Icon = route.icon;
            return (
              <div
                key={route.id}
                className={`group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative h-[500px] lg:h-[600px]">
                  <Image
                    src={route.image}
                    alt={`${route.origin} to ${route.destination}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#262262]/95 via-[#315694]/90 to-[#262262]/80"></div>
                  
                  <div className="absolute inset-0 flex flex-col lg:flex-row items-center">
                    {/* Left Side - Content */}
                    <div className="flex-1 p-8 lg:p-12 text-white z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${route.gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="px-3 py-1 bg-[#f7941d] rounded-full text-xs font-bold uppercase">
                            Featured Route
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-4xl lg:text-6xl font-bold mb-4">
                        {route.origin} → {route.destination}
                      </h3>
                      <p className="text-xl text-white/90 mb-6">{route.type}</p>
                      
                      <div className="flex items-center gap-6 mb-8">
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 text-[#f7941d]" />
                          <div>
                            <div className="text-sm text-white/80">Delivery Time</div>
                            <div className="text-2xl font-bold">{route.deliveryTime}</div>
                          </div>
                        </div>
                        <div className="h-12 w-px bg-white/30"></div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-6 h-6 text-[#f7941d]" />
                          <div>
                            <div className="text-sm text-white/80">Frequency</div>
                            <div className="text-2xl font-bold">2x Weekly</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {route.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#f7941d] flex-shrink-0" />
                            <span className="text-white/90">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Link href="/get-quote">
                        <Button 
                          size="lg"
                          className="bg-[#f7941d] hover:bg-[#f7941d]/90 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          Get Quote for USA Route
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Other Routes - Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {routes.filter(r => !r.special).map((route, index) => {
              const Icon = route.icon;
              return (
                <div
                  key={route.id}
                  className={`group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="relative h-[400px]">
                    <Image
                      src={route.image}
                      alt={`${route.origin} to ${route.destination}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${route.gradient} opacity-90`}></div>
                    
                    <div className="absolute inset-0 p-8 flex flex-col justify-between text-white z-10">
                      {/* Top Section */}
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold mb-1">
                              {route.origin} → {route.destination}
                            </h3>
                            <p className="text-white/80">{route.type}</p>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-white/80" />
                          <span className="text-xl font-semibold">{route.deliveryTime}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {route.features.slice(0, 2).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-white/90">
                              <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <Link href="/get-quote">
                        <Button 
                          variant="ghost"
                          className="w-full group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white transition-all duration-300"
                        >
                          Get Quote
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className={`relative overflow-hidden  transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#315694] via-[#262262] to-[#315694]"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          <div className="relative p-8 lg:p-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#f7941d]" />
              <span className="text-[#f7941d] font-semibold uppercase tracking-wide">Ready to Ship?</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Choose Your Route Today
            </h3>
            <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
              Contact us for a personalized quote. We'll help you choose the best shipping route for your needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/get-quote">
                <Button 
                  size="lg"
                  className="bg-[#f7941d] hover:bg-[#f7941d]/90 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Get a Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact-us">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
