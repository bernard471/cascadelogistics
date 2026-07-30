"use client";

import Image from "next/image";
import { Quote, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function AboutPageSectionOne() {
  const [, setIsVisible] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showProgressBars, setShowProgressBars] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showLeftImage, setShowLeftImage] = useState(false);
  const [showRightImage, setShowRightImage] = useState(false);
  const [showQuoteCard, setShowQuoteCard] = useState(false);

  // Progress bar animation states
  const [, setRoutesProgress] = useState(0);
  const [serviceProgress, setServiceProgress] = useState(0);
  const [onTimeProgress, setOnTimeProgress] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);

            // Staggered animation sequence
            const timer1 = setTimeout(() => setShowHeader(true), 200);
            const timer2 = setTimeout(() => setShowTitle(true), 400);
            const timer3 = setTimeout(() => setShowCompanyInfo(true), 600);
            const timer4 = setTimeout(() => setShowDescription(true), 800);
            const timer5 = setTimeout(() => setShowProgressBars(true), 1000);
            const timer6 = setTimeout(() => setShowButton(true), 1200);
            const timer7 = setTimeout(() => setShowLeftImage(true), 1400);
            const timer8 = setTimeout(() => setShowRightImage(true), 1600);
            const timer9 = setTimeout(() => setShowQuoteCard(true), 1800);

            // Progress bar animations
            const timer10 = setTimeout(() => {
              // Shipping Routes (4+)
              let current = 0;
              const increment = 4 / 60;
              const interval1 = setInterval(() => {
                current += increment;
                if (current >= 4) {
                  current = 4;
                  clearInterval(interval1);
                }
                setRoutesProgress(current);
              }, 16);

              // Full Service (100%)
              setTimeout(() => {
                let current = 0;
                const increment = 100 / 60;
                const interval2 = setInterval(() => {
                  current += increment;
                  if (current >= 100) {
                    current = 100;
                    clearInterval(interval2);
                  }
                  setServiceProgress(current);
                }, 16);
              }, 200);

              // On-Time Delivery (100%)
              setTimeout(() => {
                let current = 0;
                const increment = 100 / 60;
                const interval3 = setInterval(() => {
                  current += increment;
                  if (current >= 100) {
                    current = 100;
                    clearInterval(interval3);
                  }
                  setOnTimeProgress(current);
                }, 16);
              }, 400);
            }, 1200);

            return () => {
              clearTimeout(timer1);
              clearTimeout(timer2);
              clearTimeout(timer3);
              clearTimeout(timer4);
              clearTimeout(timer5);
              clearTimeout(timer6);
              clearTimeout(timer7);
              clearTimeout(timer8);
              clearTimeout(timer9);
              clearTimeout(timer10);
            };
          }
        });
      },
      { threshold: 0.2 }
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
    <section ref={sectionRef} className="relative py-16 md:py-24 bg-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#315694]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#f7941d]/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Two-column layout: Left text, Right visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left content - Animated */}
          <div className="lg:col-span-6">
            {/* Header - Animated */}
            <div
              className={`mb-4 transition-all duration-800 ease-out ${showHeader
                  ? 'transform translate-x-0 opacity-100'
                  : 'transform -translate-x-8 opacity-0'
                }`}
            >
              <span className="text-[#315694] font-bold tracking-wide uppercase">About Us</span>
              <div
                className={`mb-4 h-0.5 bg-[#f7941d] transition-all duration-1000 ease-out delay-200 ${showHeader
                    ? 'w-14'
                    : 'w-0'
                  }`}
              ></div>
            </div>

            {/* Title - Animated */}
            <h2
              className={`text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6 transition-all duration-1000 ease-out ${showTitle
                  ? 'transform translate-y-0 opacity-100'
                  : 'transform translate-y-8 opacity-0'
                }`}
            >
              Cascade
              <br /> <span className="text-[#315694]">Logistics Limited</span>
            </h2>

            {/* Since line - Animated */}
            <div
              className={`flex items-center gap-3 text-gray-700 font-semibold mb-4 transition-all duration-800 ease-out delay-200 ${showCompanyInfo
                  ? 'transform translate-x-0 opacity-100'
                  : 'transform translate-x-6 opacity-0'
                }`}
            >
              <div
                className={`transition-all duration-600 ease-out delay-300 ${showCompanyInfo
                    ? 'transform rotate-0 scale-100'
                    : 'transform rotate-12 scale-90'
                  }`}
              >
                <Image
                  src="/cascade/casecade-logo.png"
                  alt="Cascade Logistics Logo"
                  width={50}
                  height={50}
                  className="w-10 h-10 lg:w-28 lg:h-12"
                />
              </div>
              <div
                className={`transition-all duration-700 ease-out delay-400 ${showCompanyInfo
                    ? 'transform translate-y-0 opacity-100'
                    : 'transform translate-y-2 opacity-0'
                  }`}
              >
                <div className="text-[#315694] font-bold">GLOBALLY CONNECTING YOU</div>
                <div className="text-sm text-gray-600">Your trusted shipping partner</div>
              </div>
            </div>

            {/* Description - Animated */}
            <p
              className={`text-gray-700 leading-relaxed mb-8 max-w-prose text-base lg:text-lg transition-all duration-800 ease-out ${showDescription
                  ? 'transform translate-y-0 opacity-100'
                  : 'transform translate-y-4 opacity-0'
                }`}
            >
              Cascade Logistics Limited is your one-stop shop for all your shipping and logistics needs. With our unparalleled experience, 
              exceptional service, and cutting-edge technology, we are uniquely positioned to provide the most reliable, efficient, and cost-effective logistics services in Ghana.
              We&apos;re committed to quality, integrity, and customer satisfaction. From air and sea freight to door-to-door services, we have the expertise to handle your logistics requirements with professionalism.
            </p>

            {/* Progress bars - Animated */}
            <div
              className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 transition-all duration-800 ease-out ${showProgressBars
                  ? 'transform translate-y-0 opacity-100'
                  : 'transform translate-y-6 opacity-0'
                }`}
            >
              {/* Shipping Routes - Animated */}
              {/* <div
                className={`transition-all duration-700 ease-out delay-200 ${showProgressBars
                    ? 'transform translate-x-0 opacity-100'
                    : 'transform translate-x-4 opacity-0'
                  }`}
              >
                <div className="flex items-end justify-between text-gray-800 font-semibold mb-1">
                  <div>
                    <div>Shipping</div>
                    <div>Routes</div>
                  </div>
                  <div className="text-[#315694] font-bold transition-all duration-500">
                    {Math.round(routesProgress)}+
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-[#315694] transition-all duration-100 ease-out"
                    style={{ width: `${(routesProgress / 4) * 100}%` }}
                  ></div>
                </div>
              </div> */}

              {/* Full Service - Animated */}
              <div
                className={`transition-all duration-700 ease-out delay-400 ${showProgressBars
                    ? 'transform translate-x-0 opacity-100'
                    : 'transform translate-x-4 opacity-0'
                  }`}
              >
                <div className="flex items-end justify-between text-gray-800 font-semibold mb-1">
                  <div>
                    <div>Full</div>
                    <div>Service</div>
                  </div>
                  <div className="text-[#f7941d] font-bold transition-all duration-500">
                    {Math.round(serviceProgress)}%
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-[#f7941d] transition-all duration-100 ease-out"
                    style={{ width: `${serviceProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* On-Time Delivery - Animated */}
              <div
                className={`transition-all duration-700 ease-out delay-600 ${showProgressBars
                    ? 'transform translate-x-0 opacity-100'
                    : 'transform translate-x-4 opacity-0'
                  }`}
              >
                <div className="flex items-end justify-between text-gray-800 font-semibold mb-1">
                  <div>
                    <div>On-Time</div>
                    <div>Delivery</div>
                  </div>
                  <div className="text-[#315694] font-bold transition-all duration-500">
                    {Math.round(onTimeProgress)}%
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-[#315694] transition-all duration-100 ease-out"
                    style={{ width: `${onTimeProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Button - Animated */}
            <div
              className={`mt-2 transition-all duration-800 ease-out ${showButton
                  ? 'transform translate-y-0 opacity-100 scale-100'
                  : 'transform translate-y-6 opacity-0 scale-95'
                }`}
            >
              <Link href="/logistics-services">
                <button
                  className="px-8 py-3 bg-[#315694] text-white font-semibold shadow-lg hover:bg-[#262262] transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
                >
                  Explore Our Services
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right visuals - Animated */}
          <div className="lg:col-span-6">
            <div className="relative">
              {/* Two main images side-by-side with same height but staggered vertically */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-end">
                {/* Left image - raised higher - Animated */}
                <div
                  className={`relative transition-all duration-1000 ease-out ${showLeftImage
                      ? 'transform translate-y-0 opacity-100 scale-100'
                      : 'transform translate-y-12 opacity-0 scale-95'
                    }`}
                >
                  <div className="relative h-[300px] md:h-[410px] -translate-y-6 md:-translate-y-12 rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/cascade/image_01.jpg"
                      alt="Cascade Logistics operations"
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      sizes="(min-width: 768px) 50vw, 100vw"
                      priority
                    />
                  </div>
                </div>

                {/* Right image - same height, lower position - Animated */}
                <div
                  className={`relative transition-all duration-1000 ease-out delay-200 ${showRightImage
                      ? 'transform translate-y-0 opacity-100 scale-100'
                      : 'transform translate-y-12 opacity-0 scale-95'
                    }`}
                >
                  <div className="relative h-[300px] md:h-[410px] rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src="/cascade/hero-services.jpg"
                      alt="Cascade Logistics services"
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                </div>
              </div>

              {/* Quote card overlay - fixed width, sits under left image - Animated */}
              <div
                className={`hidden md:flex items-start gap-3 absolute left-0 -bottom-20 bg-gradient-to-r from-[#315694] to-[#262262] text-white rounded-xl shadow-2xl px-6 py-5 w-[370px] transition-all duration-1000 ease-out ${showQuoteCard
                    ? 'transform translate-y-0 opacity-100 scale-100'
                    : 'transform translate-y-8 opacity-0 scale-95'
                  }`}
              >
                <div
                  className={`shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all duration-600 ease-out delay-200 ${showQuoteCard
                      ? 'transform rotate-0 scale-100'
                      : 'transform rotate-180 scale-75'
                    }`}
                >
                  <Quote className="w-5 h-5 text-white" />
                </div>
                <div
                  className={`flex-1 transition-all duration-700 ease-out delay-300 ${showQuoteCard
                      ? 'transform translate-x-0 opacity-100'
                      : 'transform translate-x-4 opacity-0'
                    }`}
                >
                  <h6 className="text-lg font-semibold leading-snug">
                    GLOBALLY CONNECTING YOU
                  </h6>
                  <p className="text-sm opacity-80 mt-1">/  Cascade Logistics Limited</p>
                </div>
                <div
                  className={`ml-auto opacity-20 transition-all duration-600 ease-out delay-400 ${showQuoteCard
                      ? 'transform rotate-0 scale-100'
                      : 'transform rotate-12 scale-75'
                    }`}
                >
                  <Quote className="w-10 h-10" />
                </div>
              </div>
            </div>

            {/* Quote card - mobile (stacked below) - Animated */}
            <div
              className={`md:hidden mt-6 bg-gradient-to-r from-[#315694] to-[#262262] text-white rounded-xl shadow-2xl p-5 flex items-start gap-3 transition-all duration-800 ease-out ${showQuoteCard
                  ? 'transform translate-y-0 opacity-100 scale-100'
                  : 'transform translate-y-6 opacity-0 scale-95'
                }`}
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all duration-600 ease-out delay-200 ${showQuoteCard
                    ? 'transform rotate-0 scale-100'
                    : 'transform rotate-180 scale-75'
                  }`}
              >
                <Quote className="w-5 h-5 text-white" />
              </div>
              <div
                className={`flex-1 transition-all duration-700 ease-out delay-300 ${showQuoteCard
                    ? 'transform translate-x-0 opacity-100'
                    : 'transform translate-x-4 opacity-0'
                  }`}
              >
                <h6 className="text-base font-semibold leading-snug">
                  GLOBALLY CONNECTING YOU
                </h6>
                <p className="text-xs opacity-80 mt-1">/  Cascade Logistics Limited</p>
              </div>
              <div
                className={`ml-auto opacity-20 transition-all duration-600 ease-out delay-400 ${showQuoteCard
                    ? 'transform rotate-0 scale-100'
                    : 'transform rotate-12 scale-75'
                  }`}
              >
                <Quote className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
