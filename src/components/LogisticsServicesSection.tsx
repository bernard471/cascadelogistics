"use client";

import Image from "next/image";
import {
  ArrowRight, Plane, Ship, ShoppingCart, CheckCircle, Shield, Globe, Package, Warehouse
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function LogisticsServicesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredService, setHoveredService] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const logisticsServices = [
    {
      id: 1,
      image: "/logisticssection/airshipping.jpg",
      icon: Plane,
      title: "Air Shipments",
      description: "Fast and reliable air cargo services globally to Ghana. Receive your packages in 7-10 days with full freight and custom clearance included.",
      features: ["Multiple Routes", "7-10 Days Delivery", "Full Service", "Custom Clearance"],
      color: "from-blue-500 to-blue-600",
      link: "/logistics-services/air-shipments",
      stats: { time: "7-10 Days", price: "Full Service" }
    },
    {
      id: 2,
      image: "/logisticssection/seashipping.jpeg",
      icon: Ship,
      title: "Sea Shipment",
      description: "Cost-effective sea freight from globally to Ghana. Receive your packages  with freight and custom clearance included.",
      features: ["Turkey to Ghana", "Full Service", "Custom Clearance"],
      color: "from-purple-500 to-purple-600",
      link: "/logistics-services/sea-cargo",
      stats: { time: "35-45 Days", price: "Full Service" }
    },
    {
      id: 3,
      image: "/logisticssection/expressair.jpg",
      icon: CheckCircle,
      title: "Customs Brokerage & Clearance",
      description: "Comprehensive clearing and customs processing services. We handle all documentation and ensure smooth clearance for your shipments.",
      features: ["Custom Clearance", "Documentation", "Compliance", "Expert Handling"],
      color: "from-cyan-500 to-cyan-600",
      link: "/logistics-services/clearing-customs",
      stats: { time: "Expert Service", price: "Full Support" }
    },
    {
      id: 4,
      image: "/logisticssection/logistics-middle.jpg",
      icon: ShoppingCart,
      title: "Haulage Services",
      description: "Professional haulage services for your cargo. We ensure safe and timely transportation of your goods within Ghana.",
      features: ["Safe Transport", "Timely Delivery", "Professional Service", "Reliable"],
      color: "from-green-500 to-green-600",
      link: "/logistics-services/haulage",
      stats: { time: "On-Time", price: "Professional" }
    },
    {
      id: 5,
      image: "/logisticssection/consolidation.jpg",
      icon: CheckCircle,
      title: "Cargo Consolidation",
      description: "Consolidate multiple packages into one shipment to save on costs. We handle consolidation and repackaging efficiently.",
      features: ["Cost Savings", "Efficient Packing", "Multiple Packages", "Repackaging"],
      color: "from-orange-500 to-orange-600",
      link: "/logistics-services/consolidation",
      stats: { time: "Efficient", price: "Cost Savings" }
    },
    {
      id: 6,
      image: "/logisticssection/logistics-middle.jpg",
      icon: ShoppingCart,
      title: "Door to Door Service",
      description: "Buy from USA stores and we ship directly to you in Ghana. Let us handle your purchases and shipping needs.",
      features: ["USA Shopping", "Direct Shipping", "Purchase Handling", "Convenient"],
      color: "from-indigo-500 to-indigo-600",
      link: "/logistics-services/Door to Door",
      stats: { time: "Twice Weekly", price: "USA Routes" }
    },
    {
      id: 7,
      image: "/servicesection/service-img1.jpg",
      icon: Globe,
      title: "Export Services",
      description: "Professional export solutions shipping goods from Ghana to global markets worldwide with full compliance and freight forwarding.",
      features: ["Global Destinations", "Export Compliance", "Custom Clearance", "Freight Forwarding"],
      color: "from-emerald-500 to-emerald-600",
      link: "/logistics-services/export-services",
      stats: { time: "Global Reach", price: "Full Compliance" }
    },
    {
      id: 8,
      image: "/logisticssection/expressair.jpg",
      icon: Package,
      title: "Courier Services",
      description: "Fast, reliable express courier service for urgent documents and parcels with door-to-door pickup and real-time tracking.",
      features: ["Express Shipping", "Door-to-Door", "Live Tracking", "Proof of Delivery"],
      color: "from-amber-500 to-amber-600",
      link: "/logistics-services/courier-services",
      stats: { time: "1-3 Days", price: "Express Service" }
    },
    {
      id: 9,
      image: "/servicesection/service-img5.jpg",
      icon: Warehouse,
      title: "Warehousing",
      description: "Modern, secure warehousing and distribution in Ghana with inventory management, cross-docking, and order fulfillment.",
      features: ["Secure Storage", "Inventory Tracking", "Cross-Docking", "Order Fulfillment"],
      color: "from-teal-500 to-teal-600",
      link: "/logistics-services/warehousing",
      stats: { time: "24/7 Security", price: "Flexible Storage" }
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
    <section ref={sectionRef} className="relative py-16 lg:py-32 bg-gradient-to-br from-[#f8f9fa] via-white to-[#e3f2fd] overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#315694]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#f7941d]/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Our Services
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Comprehensive <span className="text-[#315694]">Logistics Solutions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From air shipments and Sea Shipment to clearing, customs processing, and haulage - we provide complete shipping solutions
            globally to Ghana with excellence and reliability.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {logisticsServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.id}
                href={service.link}
                className="group block"
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <div className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col ${hoveredService === service.id ? 'scale-105' : 'scale-100'
                  } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}>
                  {/* Image Section */}
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className={`object-cover transition-transform duration-700 ${hoveredService === service.id ? 'scale-110' : 'scale-100'
                        }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Icon Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center shadow-xl border-2 border-white`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Stats Overlay */}
                    {/* <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">{service.stats.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-semibold">{service.stats.price}</span>
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#315694] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4 flex-1">
                      {service.description}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {service.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${service.color}`}></div>
                          <span className="text-gray-700 text-xs">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Read More Link */}
                    <div className="flex items-center gap-2 text-[#315694] font-semibold mt-auto pt-4 border-t border-gray-100">
                      <span>Learn More</span>
                      <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${hoveredService === service.id ? 'translate-x-2' : 'translate-x-0'
                        }`} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className={`text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="bg-gradient-to-r from-[#315694] to-[#262262] rounded-3xl p-8 lg:p-12 shadow-2xl text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '30px 30px'
              }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-8 h-8" />
                <h3 className="text-3xl lg:text-4xl font-bold">Ready to Ship?</h3>
              </div>
              <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
                Get a free quote for your shipping needs. Our expert team will help you choose the best logistics solution.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/get-quote">
                  <button className="px-8 py-4 bg-white text-[#315694] hover:bg-gray-100 font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2">
                    Get Free Quote
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/contact-us">
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 font-semibold rounded-lg transition-all duration-300">
                    Contact Us
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
