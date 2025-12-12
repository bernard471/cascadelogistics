"use client";

import Image from "next/image";
import { DollarSign, ArrowRight, CheckCircle2, Phone, ChevronDown, ArrowDown, Users, Shield, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function MoneyTransferSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [clickedStep, setClickedStep] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const processSteps = [
    {
      id: 1,
      title: "Contact Our Agent",
      description: "Get in touch with our agent in Ghana via phone, email, or WhatsApp",
      icon: Phone,
      details: [
        "Call: +233 248840661",
        "Email: info@guangzhouswiftlogisticscompany.com",
        "WhatsApp available 24/7"
      ],
      image: "/logisticssection/agent.avif",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      title: "Send Cedis in Ghana",
      description: "Transfer your Ghana Cedis to our designated account or Mobile Money",
      icon: DollarSign,
      details: [
        "Bank Transfer (GHS)",
        "Mobile Money (MTN/Vodafone)",
        "Cash deposit at our office"
      ],
      image: "/logisticssection/cedis.jpg",
      color: "from-green-500 to-green-600"
    },
    {
      id: 3,
      title: "Rate Confirmation",
      description: "We confirm the exchange rate and calculate the RMB amount you'll receive",
      icon: TrendingUp,
      details: [
        "Competitive exchange rates",
        "Transparent pricing",
        "No hidden fees"
      ],
      image: "/logisticssection/convert.jpg",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      title: "Transfer to China",
      description: "We transfer the equivalent RMB amount to your receiver in China",
      icon: ArrowRight,
      details: [
        "Direct bank transfer in China",
        "Fast processing (24-48 hours)",
        "Secure and reliable"
      ],
      image: "/logisticssection/money-transfer.jpg",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      title: "Confirmation & Receipt",
      description: "You receive confirmation and transaction receipt",
      icon: CheckCircle2,
      details: [
        "Transaction confirmation",
        "Digital receipt sent",
        "24/7 support available"
      ],
      image: "/logisticssection/confirm.jpg",
      color: "from-cyan-500 to-cyan-600"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "All transactions are secure and protected"
    },
    {
      icon: Clock,
      title: "Fast Processing",
      description: "24-48 hour processing time"
    },
    {
      icon: TrendingUp,
      title: "Competitive Rates",
      description: "Best exchange rates in the market"
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Dedicated team to assist you"
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

  // Check if device is desktop (lg breakpoint and above)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleStepClick = (stepId: number) => {
    // Only handle clicks on mobile/tablet (non-desktop)
    if (!isDesktop) {
      setClickedStep(clickedStep === stepId ? null : stepId);
    }
  };

  const handleMouseEnter = (stepId: number) => {
    // Only handle hover on desktop
    if (isDesktop) {
      setActiveStep(stepId);
    }
  };

  const handleMouseLeave = () => {
    // Only handle hover on desktop
    if (isDesktop) {
      setActiveStep(null);
    }
  };

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 bg-gradient-to-b from-[#219ebc]/10 to-[#219ebc]/10 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #219ebc 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#219ebc]"></div>
            <span className="px-6 py-2 bg-[#219ebc]/10 border border-[#219ebc]/20 text-[#219ebc] text-sm font-bold uppercase tracking-wider rounded-full">
              Money Transfer Service
            </span>
            <div className="h-px w-16 bg-[#219ebc]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Currency Exchange: <span className="text-[#219ebc]">Cedis to RMB</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Send money to our agents in Ghana, and we&apos;ll transfer RMB to your receiver in China at competitive rates. Simple, secure, and fast.
          </p>
        </div>

        {/* Process Tree Structure */}
        <div className={`mb-16 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="relative">
            {/* Process Steps */}
            <div className="space-y-8">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === processSteps.length - 1;
                
                return (
                  <div key={step.id} className="relative">
                    {/* Step Card */}
                    <div 
                      className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-500 lg:hover:shadow-2xl cursor-pointer lg:cursor-default ${
                        (activeStep === step.id || clickedStep === step.id)
                          ? 'border-[#219ebc] lg:scale-105' 
                          : 'border-gray-200 lg:hover:border-[#219ebc]/50'
                      }`}
                      onMouseEnter={() => handleMouseEnter(step.id)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleStepClick(step.id)}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 lg:p-8">
                        {/* Left: Icon and Number */}
                        <div className="flex items-center gap-4">
                          <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-[#219ebc] font-semibold uppercase tracking-wide mb-1">
                              Step {step.id}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                          </div>
                        </div>

                       {/* Right: Image */}
                       <div className="relative lg:order-2 h-32 lg:h-40 rounded-xl overflow-hidden">
                          <Image
                            src={step.image}
                            alt={step.title}
                            fill
                            className="object-cover"
                          />
                        </div>                        

                        {/* Center: Description */}
                        <div className="flex items-center justify-between">
                          <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{step.description}</p>
                          <ChevronDown className="w-5 h-5 text-[#219ebc] flex-shrink-0 md:hidden" />
                        </div>

 
                      </div>

                      {/* Expandable Details */}
                      <div className={`overflow-hidden transition-all duration-500 ${
                        (activeStep === step.id || clickedStep === step.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-6 lg:px-8 pb-6 border-t border-gray-200 pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {step.details.map((detail, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="w-5 h-5 text-[#219ebc] flex-shrink-0" />
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {!isLast && (
                      <div className="flex justify-center my-4">
                        <div className="w-12 h-12 bg-[#219ebc]/10 rounded-full flex items-center justify-center">
                          <ArrowDown className="w-6 h-6 text-[#219ebc]" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:border-[#219ebc] hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#219ebc]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-[#219ebc]" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h4>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className={`text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-gradient-to-r from-[#219ebc] to-[#023e8a] rounded-2xl p-8 lg:p-12 shadow-xl">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Transfer Money?</h3>
            <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
              Contact our agents in Ghana today and experience fast, secure currency exchange from Cedis to RMB.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/member-register">
                <Button 
                  size="lg"
                  className="bg-white text-[#219ebc] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+233248840661">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300"
                >
                  <Phone className="mr-2 w-5 h-5" />
                  Call Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

