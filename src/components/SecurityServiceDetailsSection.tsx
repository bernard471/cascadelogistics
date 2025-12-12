"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SecurityServiceDetailsProps {
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

export default function SecurityServiceDetailsSection({ service }: SecurityServiceDetailsProps) {
  const [openBenefit, setOpenBenefit] = useState(0); // First benefit open by default
  const [, setIsVisible] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showLeftImage, setShowLeftImage] = useState(false);
  const [showRightBenefits, setShowRightBenefits] = useState(false);
  const [showServiceBenefits, setShowServiceBenefits] = useState(false);
  const [showInformation, setShowInformation] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);

  const toggleBenefit = (index: number) => {
    setOpenBenefit(openBenefit === index ? -1 : index);
  };

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Staggered animation sequence
            const timer1 = setTimeout(() => setShowSubtitle(true), 200);
            const timer2 = setTimeout(() => setShowTitle(true), 400);
            const timer3 = setTimeout(() => setShowDescription(true), 600);
            const timer4 = setTimeout(() => setShowLeftImage(true), 800);
            const timer5 = setTimeout(() => setShowRightBenefits(true), 1000);
            const timer6 = setTimeout(() => setShowServiceBenefits(true), 1200);
            const timer7 = setTimeout(() => setShowInformation(true), 1400);

            return () => {
              clearTimeout(timer1);
              clearTimeout(timer2);
              clearTimeout(timer3);
              clearTimeout(timer4);
              clearTimeout(timer5);
              clearTimeout(timer6);
              clearTimeout(timer7);
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
    <section ref={sectionRef} className="py-16 lg:py-24 bg-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section - Animated */}
        <div className=" mb-16">
          {/* Subtitle - Animated */}
          <div 
            className={`mb-4 transition-all duration-800 ease-out ${
              showSubtitle 
                ? 'transform translate-x-0 opacity-100' 
                : 'transform -translate-x-8 opacity-0'
            }`}
          >
            <h2 className="text-blue-800 text-lg font-bold uppercase tracking-wide relative inline-block">
              Security Services
              <div 
                className={`absolute -bottom-1 left-0 h-0.5 bg-blue-800 transition-all duration-1000 ease-out delay-200 ${
                  showSubtitle 
                    ? 'w-full' 
                    : 'w-0'
                }`}
              ></div>
            </h2>
          </div>

          {/* Main Title - Animated */}
          <h1 
            className={`text-4xl lg:text-5xl font-bold text-blue-800 mb-6 transition-all duration-1000 ease-out ${
              showTitle 
                ? 'transform translate-y-0 opacity-100' 
                : 'transform translate-y-8 opacity-0'
            }`}
          >
            {service.title}
          </h1>

          {/* Description - Animated */}
          <div 
            className={`max-w-7xl transition-all duration-800 ease-out ${
              showDescription 
                ? 'transform translate-y-0 opacity-100' 
                : 'transform translate-y-6 opacity-0'
            }`}
          >
            <div className="text-gray-600 text-base lg:text-lg leading-relaxed space-y-4">
              {service.description.split('\n\n').map((paragraph, index) => (
                <p 
                  key={index}
                  className={`transition-all duration-600 ease-out ${
                    showDescription 
                      ? 'transform translate-x-0 opacity-100' 
                      : 'transform translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Image - Animated */}
          <div className="order-2 lg:order-1">
            <div 
              className={`relative transition-all duration-1000 ease-out ${
                showLeftImage 
                  ? 'transform translate-y-0 opacity-100 scale-100' 
                  : 'transform translate-y-12 opacity-0 scale-95'
              }`}
            >
              <Image
                src={service.image}
                alt={service.title}
                width={600}
                height={400}
                className="w-full h-[500px] object-cover rounded-lg shadow-lg transition-transform duration-700 hover:scale-105"
              />
            </div>
            
            {/* Service Benefits Section - Animated */}
            <div 
              className={`mt-16 transition-all duration-800 ease-out ${
                showServiceBenefits 
                  ? 'transform translate-y-0 opacity-100' 
                  : 'transform translate-y-8 opacity-0'
              }`}
            >
              <h2 
                className={`text-2xl font-bold text-blue-800 mb-8 transition-all duration-700 ease-out delay-200 ${
                  showServiceBenefits 
                    ? 'transform translate-x-0 opacity-100' 
                    : 'transform translate-x-6 opacity-0'
                }`}
              >
                Service Benefits
              </h2>
              
              <div className="space-y-4">
                {service.serviceBenefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-600 ease-out ${
                      showServiceBenefits 
                        ? 'transform translate-x-0 opacity-100' 
                        : 'transform translate-x-8 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <button
                      onClick={() => toggleBenefit(index)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-100 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <h3 
                        className={`text-lg font-bold text-blue-800 text-left transition-all duration-300 ${
                          openBenefit === index ? 'text-[#055b8e]' : 'text-gray-800'
                        }`}
                      >
                        {benefit.title}
                      </h3>
                      <div 
                        className={`w-8 h-8 bg-blue-800 rounded flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 ${
                          openBenefit === index ? 'rotate-90' : 'rotate-0'
                        }`}
                      >
                        <Play className="w-4 h-4 text-white transition-transform duration-300" />
                      </div>
                    </button>
                    
                    {/* Expandable Content - Enhanced Animation */}
                    <div className={`overflow-hidden transition-all bg-gray-200 duration-500 ease-in-out ${
                      openBenefit === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className={`px-6 p-6 transition-all duration-500 ease-in-out ${
                        openBenefit === index ? 'translate-y-0' : '-translate-y-4'
                      }`}>
                        <p 
                          className={`text-gray-600 font-medium leading-relaxed transition-all duration-400 ${
                            openBenefit === index ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'
                          }`}
                        >
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Benefits and Information - Animated */}
          <div 
            className={`order-1 lg:order-2 space-y-8 transition-all duration-800 ease-out ${
              showRightBenefits 
                ? 'transform translate-y-0 opacity-100' 
                : 'transform translate-y-8 opacity-0'
            }`}
          >
            {/* Benefit Cards - Animated */}
            <div className="space-y-6">
              {service.benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className={`bg-gray-100 p-6 rounded-lg transition-all duration-600 ease-out hover:shadow-lg hover:scale-[1.02] ${
                    showRightBenefits 
                      ? 'transform translate-x-0 opacity-100' 
                      : 'transform translate-x-6 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="flex items-start gap-4">
                     {/* Bullet Image Icon - Animated */}
                     <div 
                       className={`w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-out delay-200 ${
                         showRightBenefits 
                           ? 'transform rotate-0 scale-100' 
                           : 'transform rotate-180 scale-75'
                       }`}
                     >
                       <Image
                         src="/servicesection/bullet image.png"
                         alt="Check bullet"
                         width={40}
                         height={40}
                         className="w-10 h-10 transition-transform duration-300 hover:scale-110"
                       />
                     </div>
                    
                    {/* Content - Animated */}
                    <div 
                      className={`transition-all duration-600 ease-out delay-300 ${
                        showRightBenefits 
                          ? 'transform translate-x-0 opacity-100' 
                          : 'transform translate-x-4 opacity-0'
                      }`}
                    >
                      <h3 
                        className={`text-lg font-bold text-gray-800 mb-2 transition-all duration-400 ${
                          showRightBenefits 
                            ? 'transform translate-y-0 opacity-100' 
                            : 'transform translate-y-2 opacity-0'
                        }`}
                      >
                        {benefit.title}
                      </h3>
                      <p 
                        className={`text-gray-600 text-lg leading-relaxed transition-all duration-500 delay-100 ${
                          showRightBenefits 
                            ? 'transform translate-y-0 opacity-100' 
                            : 'transform translate-y-2 opacity-0'
                        }`}
                      >
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Information Sections - Animated */}
            <div 
              className={`space-y-6 transition-all duration-800 ease-out ${
                showInformation 
                  ? 'transform translate-y-0 opacity-100' 
                  : 'transform translate-y-8 opacity-0'
              }`}
            >
              {service.information.map((info, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-4 transition-all duration-600 ease-out ${
                    showInformation 
                      ? 'transform translate-x-0 opacity-100' 
                      : 'transform translate-x-6 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Blue Square Icon - Animated */}
                  <div 
                    className={`w-4 h-4 bg-blue-800 rounded flex-shrink-0 mt-1 transition-all duration-500 ease-out delay-200 ${
                      showInformation 
                        ? 'transform scale-100' 
                        : 'transform scale-0'
                    }`}
                  ></div>
                  
                  {/* Content - Animated */}
                  <div 
                    className={`transition-all duration-600 ease-out delay-300 ${
                      showInformation 
                        ? 'transform translate-x-0 opacity-100' 
                        : 'transform translate-x-4 opacity-0'
                    }`}
                  >
                    <h4 
                      className={`text-lg font-bold text-gray-800 mb-2 transition-all duration-400 ${
                        showInformation 
                          ? 'transform translate-y-0 opacity-100' 
                          : 'transform translate-y-2 opacity-0'
                      }`}
                    >
                      {info.title}
                    </h4>
                    <p 
                      className={`text-gray-600 text-sm leading-relaxed transition-all duration-500 delay-100 ${
                        showInformation 
                          ? 'transform translate-y-0 opacity-100' 
                          : 'transform translate-y-2 opacity-0'
                      }`}
                    >
                      {info.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
