"use client";

import Image from "next/image";
import { Ship, Package, Globe, CheckCircle2, ArrowRight, TrendingUp, Shield, Clock, Users, Plane } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function AboutPageSectionTwo() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const imageGallery = [
    "/cascade/airshipping.jpg",
    "/cascade/card_image_03.jpg",
    "/cascade/image_single_service_01.jpg",
    "/cascade/image_single_service_03.jpg",
    "/logisticssection/Cargo-handling.png",
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

  // Auto-rotate images
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageGallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isVisible, imageGallery.length]);

  const advantages = [
    {
      icon: Plane,
      title: "Air Shipments",
      description: "Fast air cargo from UK, China, USA, and Turkey to Ghana",
      image: "/cascade/airshipping.jpg"
    },
    {
      icon: Package,
      title: "Package Consolidation",
      description: "Combine multiple packages for cost-effective shipping",
      image: "/cascade/card_image_03.jpg"
    },
    {
      icon: TrendingUp,
      title: "Twice Weekly USA Service",
      description: "Shipments every Thursday & Sunday, pickups Tuesday & Friday",
      image: "/cascade/image_single_service_01.jpg"
    },
    {
      icon: Shield,
      title: "Insurance Service",
      description: "Protect your valuable shipments with comprehensive coverage",
      image: "/cascade/image_single_service_03.jpg"
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-16 md:py-24 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#315694]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#f7941d]/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#315694]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Why Choose Us
            </span>
            <div className="h-px w-16 bg-[#315694]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Why Choose <span className="text-[#315694]">Cascade Logistics</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the difference of working with a trusted logistics partner dedicated to your success
          </p>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">
          {/* Left Side - Image Gallery */}
          <div className={`relative transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            {/* Main Rotating Image */}
            <div className="relative h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
              <Image
                src={imageGallery[currentImageIndex]}
                alt="Cascade Logistics operations"
                fill
                className="object-cover transition-all duration-1000"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              {/* Image Counter */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1">
                  {imageGallery.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? 'bg-[#315694] w-6' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700 ml-2">
                  {currentImageIndex + 1} / {imageGallery.length}
                </span>
              </div>
            </div>

            {/* Small Image Grid Below */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {imageGallery.slice(0, 3).map((img, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative h-32 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                    currentImageIndex === index 
                      ? 'ring-4 ring-[#315694] scale-105' 
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Content */}
          <div className={`space-y-8 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {/* Main Description */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#315694]/10 rounded-full">
                <Globe className="w-5 h-5 text-[#315694]" />
                <span className="text-sm font-semibold text-[#315694]">Trusted Logistics Partner</span>
              </div>
              
              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Excellence in Every Shipment
              </h3>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                Cascade Logistics Limited stands as a premier shipping and logistics provider, connecting 
                UK, China, USA, and Turkey with Ghana through reliable air cargo services. Our comprehensive 
                services cover everything from clearing and customs processing to haulage and final delivery, 
                ensuring your goods reach their destination safely and on time.
              </p>

              <p className="text-lg text-gray-700 leading-relaxed">
                With our USA service shipping twice weekly (Thursday & Sunday shipments, Tuesday & Friday pickups), 
                we offer faster delivery times than ever before. Our team of logistics experts works tirelessly 
                to streamline your shipping process and provide peace of mind with transparent tracking and insurance options.
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-4">
              {[
                "4+ shipping routes (UK, China, USA, Turkey to Ghana)",
                "Twice-weekly USA service for faster delivery",
                "Comprehensive clearing and customs processing",
                "Package consolidation and proxy-buy services",
                "Insurance coverage for valuable shipments"
              ].map((point, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-[#315694] rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{point}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            {/* <div className="pt-4">
              <Link href="/logistics-services">
                <button className="w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-[#315694] to-[#262262] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                  Get Started Today
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div> */}
          </div>
        </div>

        {/* Advantages Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Background Image */}
                <div className="absolute inset-0 opacity-20 transition-opacity duration-500">
                  <Image
                    src={advantage.image}
                    alt={advantage.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="relative p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#315694] to-[#262262] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{advantage.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{advantage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        {/* <div className={`mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-800 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {[
            { number: "4+", label: "Shipping Routes", icon: Plane },
            { number: "100%", label: "Full Service", icon: Shield },
            { number: "2x", label: "Weekly USA Service", icon: Clock },
            { number: "24/7", label: "Support Available", icon: Users }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl p-6 text-center text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            );
          })}
        </div> */}
      </div>
    </section>
  );
}
