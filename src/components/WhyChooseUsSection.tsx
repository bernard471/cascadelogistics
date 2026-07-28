"use client";

import {
  CheckCircle2, TrendingUp, Shield, Clock,
  // DollarSign, 
  Globe, ArrowRight
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function WhyChooseUsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const reasons = [
    {
      id: 1,
      icon: Globe,
      title: "Multiple Routes",
      description: "We ship globally to Ghana. Choose the route that works best for your needs with reliable service.",
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      id: 2,
      icon: Clock,
      title: "Fast & Reliable",
      description: "Air cargo in 7-10 days, Sea Shipment with reliable service. USA shipping twice weekly with guaranteed 1-week pickup in Ghana.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      id: 3,
      icon: Shield,
      title: "Full Service Included",
      description: "All packages include freight and custom clearance. We handle clearing, customs processing, and haulage - everything you need.",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      id: 4,
      icon: CheckCircle2,
      title: "Transparent Process",
      description: "Get photos of items received, packed, and tracking sent before flight. Complete transparency throughout your shipment journey.",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      id: 5,
      icon: TrendingUp,
      title: "Additional Services",
      description: "Cargo Consolidation, Door to Door service, and insurance options available. We offer comprehensive solutions for all your shipping needs.",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200"
    },
    {
      id: 6,
      icon: Shield,
      title: "On-Time Delivery",
      description: "Reliable, transparent, and on-time service. We guarantee pickup in Ghana within 1 week of delivery to our warehouse for USA shipments.",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200"
    }
  ];

  // const stats = [
  //   { number: "99%", label: "Success Rate", icon: TrendingUp },
  //   { number: "500+", label: "Happy Clients", icon: CheckCircle2 },
  //   { number: "10+", label: "Years Experience", icon: Shield },
  //   { number: "24/7", label: "Support", icon: Clock }
  // ];

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
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(45deg,rgba(49, 86, 148, 0.22) 25%, transparent 25%), linear-gradient(-45deg,rgba(49, 86, 148, 0.25) 25%, transparent 25%), linear-gradient(45deg, transparent 75%,rgba(49, 86, 148, 0.32) 75%), linear-gradient(-45deg, transparent 75%, #315694 75%)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Why Choose Us
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Your Trusted <span className="text-[#315694]">Shipping Partner</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We combine reliable service, fast delivery, and transparent processes to make your global shipping to Ghana seamless and successful.
          </p>
        </div>

        {/* Stats Bar */}
        {/* <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="w-12 h-12 bg-[#219ebc]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-[#219ebc]" />
                </div>
                <div className="text-4xl font-bold text-[#219ebc] mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">{stat.label}</div>
              </div>
            );
          })}
        </div> */}

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.id}
                className={`group relative bg-white rounded-2xl p-8 border-2 ${reason.borderColor} hover:border-[#315694] transition-all duration-500 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCard(reason.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${reason.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform duration-300 ${hoveredCard === reason.id ? 'scale-110 rotate-6' : 'scale-100'
                  }`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{reason.title}</h3>
                <p className="text-gray-600 leading-relaxed">{reason.description}</p>

                {/* Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${reason.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="inline-block bg-gradient-to-r from-[#315694] to-[#262262] p-8 shadow-xl">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h3>
            <p className="text-white/90 mb-6 text-lg">Join satisfied clients who trust us with their shipping needs from around the world to Ghana.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/get-quote">
                <Button
                  size="lg"
                  className="bg-white text-[#315694] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Get a Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/logistics-services">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300"
                >
                  View All Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
