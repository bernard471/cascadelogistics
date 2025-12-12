"use client";

import { Shield, CheckCircle2, DollarSign, FileText, ArrowRight, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function InsuranceSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const benefits = [
    {
      icon: Shield,
      title: "Loss Coverage",
      description: "Protection against loss of your packages during transit"
    },
    {
      icon: AlertCircle,
      title: "Damage Coverage",
      description: "Coverage for damage to your items during shipping"
    },
    {
      icon: FileText,
      title: "Easy Claims Process",
      description: "Simple and straightforward claims process when needed"
    },
    {
      icon: DollarSign,
      title: "Affordable Rates",
      description: "Competitive rates starting from $1.10 per $100 value"
    }
  ];

  const features = [
    {
      title: "Minimum Coverage",
      value: "$10",
      description: "Minimum insurance amount required"
    },
    {
      title: "Rate",
      value: "$1.10",
      description: "Per $100 of package value"
    },
    {
      title: "Coverage",
      value: "Full",
      description: "Loss or damage protection"
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
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-blue-100 via-white to-blue-100 overflow-hidden">
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
              Package Insurance
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Need Peace of Mind <span className="text-[#315694]">When Shipping?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We now offer insurance for your packages! Protect your valuable shipments with our comprehensive insurance coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Main Content */}
          <div className={`space-y-8 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl flex items-center justify-center shadow-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Protect Your Shipments</h3>
                  <p className="text-gray-600">Comprehensive coverage for loss or damage</p>
                </div>
              </div>

              <p className="text-lg text-gray-600 leading-relaxed">
                Shipping valuable items? Get peace of mind with our package insurance service. We offer affordable rates and easy claims processing to protect your shipments.
              </p>

              {/* Pricing Info */}
              <div className="bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6" />
                  <h4 className="text-xl font-bold">Insurance Rates</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Rate</span>
                    <span className="text-2xl font-bold">$1.10 per $100 value</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/20 pt-3">
                    <span className="text-white/90">Minimum</span>
                    <span className="text-xl font-semibold">$10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#315694]/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-[#315694]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#315694]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href="/get-quote">
              <Button 
                size="lg"
                className="group bg-[#315694] hover:bg-[#262262] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl shadow-[#315694]/30 hover:shadow-[#315694]/50 transition-all duration-300 hover:scale-105"
              >
                Get Insurance Quote
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right Column - Features */}
          <div className={`space-y-6 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Insurance Details</h3>
              
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{feature.title}</div>
                      <div className="text-2xl font-bold text-[#315694]">{feature.value}</div>
                    </div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-[#f7941d]/10 border border-[#f7941d]/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#f7941d] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Great for High-Value Items</h4>
                    <p className="text-sm text-gray-600">
                      Our insurance is perfect for protecting valuable shipments like electronics, jewelry, and other high-value items.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-gradient-to-br from-[#f7941d] to-[#f7941d]/80 rounded-2xl p-6 text-white">
              <h4 className="text-xl font-bold mb-3">Easy Claims Process</h4>
              <p className="text-white/90 text-sm leading-relaxed">
                If you need to file a claim, our process is simple and straightforward. We're here to help you through every step.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {/* <div className={`text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-gradient-to-r from-[#315694] to-[#262262] rounded-2xl p-8 lg:p-12 shadow-xl">
            <h3 className="text-3xl font-bold text-white mb-4">Protect Your Shipments Today</h3>
            <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
              Add insurance to your next shipment and ship with confidence. Contact us to learn more about our insurance options.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/get-quote">
                <Button 
                  size="lg"
                  className="bg-white text-[#315694] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Get Insurance Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact-us">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}

