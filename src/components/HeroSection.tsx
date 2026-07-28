"use client";

import Image from "next/image";
import { ArrowRight, Ship, Plane, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from 'next/link';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const slides = [
    {
      id: 1,
      background: "/hero/background-01.jpg",
      badge: "Your Trusted Partner",
      title: "Global Shipping to Ghana",
      subtitle: "Seamless Shipping Solutions",
      description: "Experience reliable logistics services globally to Ghana. Fast delivery, complete transparency, and full service including clearing and customs.",
      stats: [
        { label: "Routes", value: "4+", icon: Ship },
        { label: "Delivery Days", value: "7-45", icon: Plane },
        { label: "Full Service", value: "100%", icon: TrendingUp }
      ]
    },
    {
      id: 2,
      background: "/hero/hero2.jpg",
      badge: "Fast & Reliable",
      title: "Air Cargo Services",
      subtitle: "7-10 Days Delivery",
      description: "Get your packages delivered fast with our air cargo services. All packages include freight and custom clearance. Transparent tracking and on-time delivery guaranteed.",
      stats: [
        { label: "Air Routes", value: "4+", icon: Plane },
        { label: "Delivery Days", value: "7-10", icon: TrendingUp },
        { label: "On-Time Rate", value: "100%", icon: Shield }
      ]
    },
    // {
    //   id: 3,
    //   background: "/hero/hero3.jpg",
    //   badge: "USA Shipping",
    //   title: "Twice Weekly Service",
    //   subtitle: "Shipments Every Thu & Sun",
    //   description: "Now shipping twice a week from USA to Ghana! Shipments every Thursday & Sunday, pickups in Ghana every Tuesday & Friday. Guaranteed pickup within 1 week.",
    //   stats: [
    //     { label: "USA Routes", value: "2x", icon: Ship },
    //     { label: "Pickup Time", value: "1 Week", icon: Shield },
    //     { label: "Transparent", value: "100%", icon: TrendingUp }
    //   ]
    // }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="relative h-[90vh] min-h-[700px] lg:h-[90vh] overflow-hidden">
      {/* Background Images with Parallax Effect */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.background}
            alt={`Hero slide ${slide.id}`}
            fill
            className="object-cover scale-105 transition-transform duration-[10000ms] ease-out"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="absolute inset-0 bg-[#315694]/20"></div>
        </div>
      ))}

      {/* Animated Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(49, 86, 148, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(49, 86, 148, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className={`space-y-8 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              {/* Modern Badge */}
              <div className="inline-flex items-center gap-3">
                <div className="h-px w-12 bg-[#f7941d]"></div>
                <span className="px-4 py-2 bg-[#315694]/20 backdrop-blur-sm border border-[#219ebc]/30 text-[#f7941d] text-xs font-semibold uppercase tracking-wider rounded-full">
                  {slides[currentSlide].badge}
                </span>
                <div className="h-px w-12 bg-[#f7941d]"></div>
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                {/* <p className="text-[#f7941d] text-lg lg:text-xl font-medium tracking-wide">
                  {slides[currentSlide].subtitle}
                </p> */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                  {slides[currentSlide].title}
                </h1>
              </div>

              {/* Description */}
              <p className="text-white/90 text-lg lg:text-xl leading-relaxed max-w-xl">
                {slides[currentSlide].description}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link href="/logistics-services">
                  <Button 
                    size="lg"
                    className="group bg-[#315694] hover:bg-[#262262] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl shadow-[#315694]/30 hover:shadow-[#315694]/50 transition-all duration-300 hover:scale-105"
                  >
                    Explore Services
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/contact-us">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300"
                  >
                    Get Quote
                  </Button>
                </Link>
              </div>

              {/* Stats Grid */}
              {/* <div className="grid grid-cols-3 gap-6 pt-8">
                {slides[currentSlide].stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div 
                      key={index}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
                    >
                      <Icon className="w-6 h-6 text-[#219ebc] mb-2" />
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-white/70 uppercase tracking-wide">{stat.label}</div>
                    </div>
                  );
                })}
              </div> */}
            </div>

            {/* Right Column - Visual Element */}
            <div className={`hidden lg:block transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              <div className="relative">
                {/* Floating Cards */}
                {/* <div className="absolute -top-10 -left-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl animate-float">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#315694] rounded-lg flex items-center justify-center">
                      <Ship className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#f7941d]">4+</div>
                      <div className="text-sm text-[#f7941d]/70">Shipping Routes</div>
                    </div>
                  </div>
                </div> */}

                {/* <div className="absolute -bottom-10 -right-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl animate-float-delayed">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f7941d] rounded-lg flex items-center justify-center">
                      <Plane className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">7-10</div>
                      <div className="text-sm text-white/70">Days (Air)</div>
                    </div>
                  </div>
                </div> */}

                {/* Main Visual Circle */}
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#315694]/30 to-[#262262]/30 rounded-full blur-3xl"></div>
                  <div className="relative w-full h-full bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 bg-[#315694] rounded-full flex items-center justify-center mx-auto shadow-xl">
                        <Ship className="w-12 h-12 text-white" />
                      </div>
                      <div className="text-[#f7941d] font-bold text-xl">Global → Ghana</div>
                      <div className="text-[#f7941d]/70 text-sm">UK, China, USA, Turkey, Etc.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative transition-all duration-300 ${
              index === currentSlide 
                ? 'w-12' 
                : 'w-3 hover:w-6'
            }`}
          >
            <div className={`h-1 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-[#315694] shadow-lg shadow-[#315694]/50' 
                : 'bg-white/40 hover:bg-white/60'
            }`}></div>
          </button>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="hidden lg:flex absolute left-8 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 group"
      >
        <ArrowRight className="w-6 h-6 text-white rotate-180 group-hover:translate-x-[-2px] transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        className="hidden lg:flex absolute right-8 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 group"
      >
        <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-[2px] transition-transform" />
      </button>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 3s;
        }
      `}</style>
    </section>
  );
}
