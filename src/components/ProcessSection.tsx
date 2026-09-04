"use client";

import Image from "next/image";
import { ShoppingCart, CheckCircle2, DollarSign, Package, Ship, MapPin, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function ProcessSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    {
      id: 1,
      icon: ShoppingCart,
      title: "Procurement",
      description: "We help you find quality products and negotiate with suppliers in China",
      image: "/logisticssection/logistics-middle.jpg",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      icon: DollarSign,
      title: "Payment",
      description: "We handle payments to your Chinese suppliers securely and efficiently",
      image: "/logisticssection/payment.webp",
      color: "from-green-500 to-green-600"
    },
    {
      id: 3,
      icon: CheckCircle2,
      title: "Quality Check",
      description: "Comprehensive quality inspection of your goods before shipping",
      image: "/logisticssection/quality.avif",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      icon: Package,
      title: "Consolidation",
      description: "We consolidate your goods and prepare them for shipping",
      image: "/logisticssection/consolidation.jpg",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      icon: Ship,
      title: "Shipping",
      description: "Reliable sea or air shipping from anywhere Globally to Ghana",
      image: "/hero/hero2.jpg",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      id: 6,
      icon: MapPin,
      title: "Delivery",
      description: "Safe delivery to your warehouse in Accra or Kumasi",
      image: "/hero/hero1.jpg",
      color: "from-indigo-500 to-indigo-600"
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
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-[#f8f9fa] via-[#e3f2fd] to-[#f8f9fa] overflow-hidden">
      {/* Background Pattern */}
      {/* <div className="absolute inset-0 opacity-5">
       <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(45deg, #219ebc 25%, transparent 25%), linear-gradient(-45deg, #219ebc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #219ebc 75%), linear-gradient(-45deg, transparent 75%, #219ebc 75%)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
        }}></div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#219ebc]"></div>
            <span className="px-6 py-2 bg-[#219ebc]/10 border border-[#219ebc]/20 text-[#219ebc] text-sm font-bold uppercase tracking-wider rounded-full">
              How It Works
            </span>
            <div className="h-px w-16 bg-[#219ebc]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Our <span className="text-[#219ebc]">Process</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From procurement to delivery, we handle every step of your logistics journey with expertise and care.
          </p>
        </div>

        {/* Process Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 1;
            
            return (
              <div
                key={step.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
                  isEven ? 'lg:flex-row-reverse' : ''
                } transition-all duration-1000`}
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
                }}
              >
                {/* Image */}
                <div className={`order-2 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl group">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Step Number Badge */}
                    <div className="absolute top-6 left-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center shadow-xl`}>
                        <span className="text-2xl font-bold text-white">{step.id}</span>
                      </div>
                    </div>

                    {/* Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`order-1 ${isEven ? 'lg:order-1' : 'lg:order-2'} space-y-6`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-[#219ebc] font-semibold uppercase tracking-wide mb-1">
                        Step {step.id}
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {step.description}
                  </p>

                  {index === steps.length - 1 && (
                    <Link href="/member-register">
                      <Button 
                        size="lg"
                        className="bg-[#219ebc] hover:bg-[#023e8a] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        Get Started Today
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

