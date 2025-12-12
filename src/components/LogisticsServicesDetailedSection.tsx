"use client";

import Image from "next/image";
import { ChevronDown, CheckCircle2, ArrowRight, Clock, Shield, TrendingUp, Package, Globe } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LogisticsServiceDetailsProps {
  service: {
    id: number;
    title: string;
    description: string;
    image: string;
    benefits: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    information: Array<{
      title: string;
      description: string;
    }>;
    serviceBenefits: Array<{
      title: string;
      description: string;
    }>;
  };
}

export default function LogisticsServiceDetailsSection({ service }: LogisticsServiceDetailsProps) {
  const [openBenefit, setOpenBenefit] = useState<number | null>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Gallery images - using available logistics images
  const galleryImages = [
    service.image,
    "/logisticssection/logistics-middle.jpg",
    "/logisticssection/shipping.jpeg",
    "/logisticssection/Cargo-handling.png",
    "/logisticssection/logistics1.png",
    "/logisticssection/logistics2.png"
  ];

  const toggleBenefit = (index: number) => {
    setOpenBenefit(openBenefit === index ? null : index);
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

  // Auto-rotate gallery images
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, galleryImages.length]);

  const stats = [
    { icon: Clock, label: "Delivery Time", value: "7-10 Days", color: "from-[#315694] to-[#262262]" },
    { icon: Shield, label: "Full Service", value: "100%", color: "from-[#f7941d] to-[#f7941d]/80" },
    { icon: TrendingUp, label: "Reliable", value: "100%", color: "from-[#315694] to-[#262262]" },
    { icon: Package, label: "Routes", value: "4+", color: "from-[#f7941d] to-[#f7941d]/80" }
  ];

  return (
    <section ref={sectionRef} className="relative py-0 lg:py-0 bg-gradient-to-br from-[#f8f9fa] via-white to-[#e3f2fd] overflow-hidden">
      {/* Hero Section with Large Image */}
      <div className="relative h-[500px] lg:h-[600px] overflow-hidden">
        <Image
          src={service.image}
          alt={service.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div>
        
        {/* Content Overlay */}
        <div className="relative z-10 h-full flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
            <div className={`max-w-3xl transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-px w-16 bg-[#f7941d]"></div>
                <span className="px-4 py-2 bg-[#315694]/20 border border-[#315694]/40 text-white text-sm font-bold uppercase tracking-wider rounded-full">
                  Service Details
                </span>
                <div className="h-px w-16 bg-[#f7941d]"></div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                {service.title}
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                {service.description.split('\n\n')[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Floating Stats Cards */}
        <div className="absolute bottom-8 right-8 hidden lg:grid grid-cols-2 gap-4 max-w-md">
          {stats.slice(0, 4).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 lg:mt-32 relative z-20 mb-20">
        {/* Main Content Card */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
          {/* Description Section */}
          <div className="p-8 lg:p-12 bg-gradient-to-br from-white to-gray-50">
            <div className={`max-w-4xl transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Service</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                {service.description.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 lg:p-12">
            {/* Left Column - Image Gallery & Service Benefits */}
            <div className="lg:col-span-2 space-y-8">
              {/* Rotating Image Gallery */}
              <div className={`transition-all duration-1000 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}>
                <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl group">
                  <Image
                    src={galleryImages[currentImageIndex]}
                    alt={`${service.title} gallery ${currentImageIndex + 1}`}
                    fill
                    className="object-cover transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1">
                      {galleryImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentImageIndex ? 'bg-[#315694] w-6' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 ml-2">
                      {currentImageIndex + 1} / {galleryImages.length}
                    </span>
                  </div>

                  {/* Thumbnail Navigation */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {galleryImages.slice(0, 4).map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === index 
                            ? 'border-[#315694] scale-110' 
                            : 'border-white/50 hover:border-white'
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Benefits Accordion */}
              <div className={`transition-all duration-1000 delay-600 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-12 bg-gradient-to-b from-[#315694] to-[#262262] rounded-full"></div>
                  <h2 className="text-3xl font-bold text-gray-900">Service Benefits</h2>
                </div>
                
                <div className="space-y-4">
                  {service.serviceBenefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleBenefit(index)}
                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br from-[#315694] to-[#262262] rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 text-left">
                            {benefit.title}
                          </h3>
                        </div>
                        <ChevronDown
                          className={`w-6 h-6 text-[#315694] transition-transform duration-300 flex-shrink-0 ${
                            openBenefit === index ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        openBenefit === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-6 pb-6 pl-20">
                          <div className="pl-4 border-l-4 border-[#315694]">
                            <p className="text-gray-700 leading-relaxed">
                              {benefit.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               {/* Information Section */}
               <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white transition-all duration-1000 delay-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-6 h-6 text-[#f7941d]" />
                  <h2 className="text-2xl font-bold">Functionalities</h2>
                </div>
                
                <div className="space-y-4">
                  {service.information.map((info, index) => (
                    <div key={index} className="border-l-4 border-[#f7941d] pl-4">
                      <h4 className="font-bold text-lg mb-2">{info.title}</h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Benefits & Information */}
            <div className="space-y-8">
              {/* Key Benefits */}
              <div className={`transition-all duration-1000 delay-500 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-12 bg-gradient-to-b from-[#315694] to-[#262262] rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Key Benefits</h2>
                </div>
                
                <div className="space-y-4">
                  {service.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-[#315694]/5 to-[#262262]/5 rounded-xl p-6 border border-[#315694]/20 hover:border-[#315694] hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#315694] to-[#262262] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {benefit.title}
                          </h3>
                          <p className="text-gray-700 leading-relaxed text-sm">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

             

              {/* CTA Card */}
              <div className={`bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl p-6 text-white shadow-xl transition-all duration-1000 delay-800 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}>
                <Package className="w-8 h-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
                <p className="text-white/90 text-sm mb-6">
                  Contact us today for a free quote and consultation
                </p>
                <Link href="/get-quote">
                  <Button className="w-full bg-white text-[#315694] hover:bg-gray-100 font-semibold rounded-lg transition-all duration-300 hover:scale-105">
                    Get Free Quote
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {/* <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 transition-all duration-1000 delay-900 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${900 + index * 100}ms` }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div> */}
      </div>
    </section>
  );
}
