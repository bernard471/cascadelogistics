"use client";

import Image from "next/image";
import { ArrowRight, Globe, Users, Award, TrendingUp, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';

export default function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const stats = [
    // { icon: Globe, value: "4+", label: "Shipping Routes", color: "from-[#315694] to-[#262262]" },
    // { icon: Clock, value: "7-45", label: "Days Delivery", color: "from-[#f7941d] to-[#f7941d]/80" },
    { icon: Shield, value: "100%", label: "Full Service", color: "from-[#315694] to-[#262262]" },
    { icon: Award, value: "24/7", label: "Support", color: "from-[#f7941d] to-[#f7941d]/80" }
  ];

  const features = [
    {
      icon: Globe,
      title: "Global Network",
      description: "Connecting UK, China, USA, and Turkey to Ghana with reliable shipping routes",
      gradient: "from-[#315694] to-[#262262]"
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Experienced professionals handling your logistics and customs needs",
      gradient: "from-[#f7941d] to-[#f7941d]/80"
    },
    {
      icon: Award,
      title: "Quality Assured",
      description: "Comprehensive clearing and customs processing for all shipments",
      gradient: "from-[#315694] to-[#262262]"
    },
    {
      icon: TrendingUp,
      title: "Reliable Service",
      description: "Transparent process with tracking and on-time delivery guarantee",
      gradient: "from-[#f7941d] to-[#f7941d]/80"
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
    <section ref={sectionRef} className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background with Image Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/footer/footer4.jpg"
          alt="Cascade Logistics"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#262262]/95 via-[#315694]/90 to-[#262262]/95"></div>
        <div className="absolute inset-0 bg-[#f7941d]/5"></div>
      </div>

      {/* Geometric Pattern Overlay */}
      {/* <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(45deg, transparent 48%, rgba(247, 148, 29, 0.3) 49%, rgba(247, 148, 29, 0.3) 51%, transparent 52%),
                            linear-gradient(-45deg, transparent 48%, rgba(247, 148, 29, 0.3) 49%, rgba(247, 148, 29, 0.3) 51%, transparent 52%)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* Left Side - Main Text Content */}
          <div className={`lg:col-span-3 space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            {/* Badge */}
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#f7941d] text-white text-sm font-bold uppercase tracking-wider rounded-full">
                <MapPin className="w-4 h-4" />
                About Cascade Logistics
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                Your Gateway to
                <span className="block text-[#f7941d] mt-2">Global Shipping</span>
              </h2>
              <div className="w-24 h-1 bg-[#f7941d]"></div>
            </div>

            {/* Description */}
            <div className="space-y-4 text-lg text-white/90 leading-relaxed">
              <p>
                Cascade Logistics Limited is your one-stop shop for all your shipping and logistics needs. With our unparalleled experience, exceptional service, and cutting-edge technology, we are uniquely positioned to provide the most reliable, efficient, and cost-effective logistics services in Ghana.              </p>
              <p>
                We&apos;re committed to quality, integrity, and customer satisfaction. From air and sea freight to door-to-door services, we have the expertise to handle your logistics requirements with professionalism.              
              </p>
             
            </div>

            {/* CTA Button */}
            <Link href="/about-us-cascade">
              <Button 
                size="lg"
                className="group bg-[#f7941d] hover:bg-[#f7941d]/90 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl shadow-[#f7941d]/30 hover:shadow-[#f7941d]/50 transition-all duration-300 hover:scale-105"
              >
                Learn More About Us
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right Side - Stats Cards */}
          <div className={`lg:col-span-2 space-y-6 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-white/80 uppercase tracking-wide">{stat.label}</div>
                    </div>
                  </div>
                </div>
              );
            })} 
             <p className="text-white/80 leading-relaxed mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                Cascade Logistics is a leading logistics company in Ghana known for its excellent services. It has been recognized with several awards, including Ghana&apos;s Most Respected CEO in the Freight Forwarding category and the Best Logistics Management Company of the Year. You can trust us to deliver your goods safely and on time, every time.
              </p>
          </div>
           
        </div>

        {/* Features Grid - Below Main Content */}
        <div className={`mt-20 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:border-[#f7941d]/50"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Gradient Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <div className="space-y-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-white/80 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div className={`mt-16 flex justify-center transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#f7941d] to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
