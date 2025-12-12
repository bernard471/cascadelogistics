"use client";

import Image from "next/image";
import { Ship, Plane, ShoppingCart, DollarSign, CheckCircle, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function ServicesSection() {
  const [hoveredService, setHoveredService] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const services = [
    {
      id: 1,
      image: "/logisticssection/airshipping.jpg",
      icon: Plane,
      title: "Air Shipments",
      description: "Fast and reliable air cargo services from UK, China, USA, and Turkey to Ghana. Receive your packages in 7-10 days with full freight and custom clearance included.",
      features: ["Multiple Routes", "7-10 Days Delivery", "Full Service", "Custom Clearance"],
      color: "from-blue-500 to-blue-600",
      link: "/logistics-services/air-shipments"
    },
    {
      id: 2,
      image: "/logisticssection/seashipping.jpeg",
      icon: Ship,
      title: "Sea Cargo",
      description: "Cost-effective sea freight from Turkey to Ghana. Receive your packages in 35-45 days with freight and custom clearance included.",
      features: ["Turkey to Ghana", "35-45 Days", "Full Service", "Custom Clearance"],
      color: "from-purple-500 to-purple-600",
      link: "/logistics-services/sea-cargo"
    },
    {
      id: 3,
      image: "/logisticssection/expressair.jpg",
      icon: CheckCircle,
      title: "Clearing & Customs",
      description: "Comprehensive clearing and customs processing services. We handle all documentation and ensure smooth clearance for your shipments.",
      features: ["Custom Clearance", "Documentation", "Compliance", "Expert Handling"],
      color: "from-cyan-500 to-cyan-600",
      link: "/logistics-services/clearing-customs"
    },
    {
      id: 4,
      image: "/logisticssection/logistics-middle.jpg",
      icon: ShoppingCart,
      title: "Haulage Services",
      description: "Professional haulage services for your cargo. We ensure safe and timely transportation of your goods within Ghana.",
      features: ["Safe Transport", "Timely Delivery", "Professional Service", "Reliable"],
      color: "from-green-500 to-green-600",
      link: "/logistics-services/haulage"
    },
    {
      id: 5,
      image: "/logisticssection/consolidation.jpg",
      icon: CheckCircle,
      title: "Package Consolidation",
      description: "Consolidate multiple packages into one shipment to save on costs. We handle consolidation and repackaging efficiently.",
      features: ["Cost Savings", "Efficient Packing", "Multiple Packages", "Repackaging"],
      color: "from-orange-500 to-orange-600",
      link: "/logistics-services/consolidation"
    },
    {
      id: 6,
      image: "/logisticssection/logistics-middle.jpg",
      icon: ShoppingCart,
      title: "Proxy-Buy Service",
      description: "Buy from USA stores and we ship directly to you in Ghana. Let us handle your purchases and shipping needs.",
      features: ["USA Shopping", "Direct Shipping", "Purchase Handling", "Convenient"],
      color: "from-indigo-500 to-indigo-600",
      link: "/logistics-services/proxy-buy"
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
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-gray-100 via-white to-gray-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #315694 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Our Services
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Comprehensive <span className="text-[#315694]">Logistics Solutions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From air shipments and sea cargo to clearing, customs processing, and haulage - we provide complete shipping solutions from UK, China, USA, and Turkey to Ghana.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className={`object-cover transition-transform duration-700 ${
                      hoveredService === service.id ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-500 ${
                    hoveredService === service.id ? 'opacity-100' : 'opacity-80'
                  }`}></div>
                  
                  {/* Icon Badge */}
                  <div className={`absolute top-6 left-6 w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center shadow-xl transition-transform duration-300 ${
                    hoveredService === service.id ? 'scale-110 rotate-6' : 'scale-100'
                  }`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{service.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color}`}></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link href={service.link}>
                    <Button 
                      variant="ghost"
                      className="w-full group mt-4 text-[#315694] hover:text-white bg-[#315694]/10 hover:bg-[#315694] transition-all duration-300"
                    >
                      Learn More
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

                  {/* Hover Effect Border */}
                <div className={`absolute inset-0 border-2 border-[#315694] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
                  hoveredService === service.id ? 'opacity-100' : ''
                }`}></div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        {/* <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-block bg-gradient-to-r from-[#315694] to-[#262262] rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-4">Need a Custom Solution?</h3>
            <p className="text-white/90 mb-6">Contact us for personalized logistics services tailored to your shipping needs.</p>
            <Link href="/get-quote">
              <Button 
                size="lg"
                className="bg-white text-[#315694] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
              >
                Get Custom Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div> */}
      </div>
    </section>
  );
}
