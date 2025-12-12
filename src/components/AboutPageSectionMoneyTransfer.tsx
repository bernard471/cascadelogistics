"use client";

import Image from "next/image";
import { DollarSign, ArrowRight, CheckCircle2, Shield, TrendingUp, Smartphone, Banknote, Globe2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPageSectionMoneyTransfer() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  const features = [
    {
      icon: Banknote,
      title: "Bank Transfer",
      description: "Secure bank-to-bank transfers from Ghana to China",
      image: "/logisticssection/cedis.jpg"
    },
    {
      icon: Smartphone,
      title: "Mobile Money",
      description: "Convenient Momo transfers for quick transactions",
      image: "/logisticssection/money-transfer.jpg"
    },
    {
      icon: TrendingUp,
      title: "Competitive Rates",
      description: "Best exchange rates from Cedis to RMB",
      image: "/logisticssection/convert.jpg"
    },
    {
      icon: Shield,
      title: "Secure & Safe",
      description: "Protected transactions with full verification",
      image: "/logisticssection/confirm.jpg"
    }
  ];

  const benefits = [
    "Fast processing (24-48 hours)",
    "Transparent exchange rates",
    "No hidden fees",
    "24/7 customer support",
    "Secure transaction channels",
    "Instant confirmation"
  ];

  return (
    <section 
      ref={sectionRef} 
      className="relative py-16 lg:py-32 bg-gradient-to-br from-[#f8f9fa] via-white to-[#e3f2fd] overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#219ebc]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#023e8a]/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Secure <span className="text-[#219ebc]">Currency Exchange</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Reliable and fast money transfer service from Ghana Cedis to Chinese Yuan (RMB). 
            Trusted by hundreds of clients for seamless cross-border transactions.
          </p>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">
          {/* Left Side - Image & Info */}
          <div className={`space-y-6 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            {/* Main Image */}
            <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
              <Image
                src="/logisticssection/money-transfer.jpg"
                alt="Money transfer service"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Floating Stats Card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-[#219ebc] mb-1">500+</div>
                    <div className="text-sm text-gray-600">Successful Transfers</div>
                  </div>
                  <div className="w-12 h-12 bg-[#219ebc] rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Process Overview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe2 className="w-6 h-6 text-[#219ebc]" />
                How It Works
              </h3>
              <div className="space-y-3">
                {[
                  "Contact our agents in Ghana",
                  "Send Cedis via Bank or Mobile Money",
                  "We exchange at competitive rates",
                  "RMB transferred to receiver in China",
                  "Instant confirmation for both parties"
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#219ebc] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

              {/* CTA Button */}
              <div className="pt-4">
              <Link href="tel:+233248840661">
                <Button className="w-full lg:w-auto px-8 py-6 bg-[#219ebc] hover:bg-[#023e8a] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg">
                  Make the call
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className={`space-y-8 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {/* Service Description */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#219ebc]/10 rounded-full">
                <DollarSign className="w-5 h-5 text-[#219ebc]" />
                <span className="text-sm font-semibold text-[#219ebc]">Trusted Service</span>
              </div>
              
              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Seamless Cedis to RMB Transfers
              </h3>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                Guangzhou Swift Logistics offers a comprehensive money transfer service designed to make 
                cross-border transactions between Ghana and China simple, secure, and cost-effective. 
                Whether you&apos;re paying suppliers, sending money to family, or conducting business transactions, 
                we provide reliable currency exchange solutions.
              </p>

              <p className="text-lg text-gray-700 leading-relaxed">
                Our service connects you with our trusted agents in Ghana who facilitate the transfer process. 
                You can send money through bank transfers or mobile money (Momo), and we ensure your funds 
                reach your designated receiver in China quickly and securely at competitive exchange rates.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#219ebc] flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Key Features */}
            <div className="bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-2xl p-6 text-white">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Why Choose Our Service?
              </h4>
              <ul className="space-y-2">
                {[
                  "Competitive exchange rates with no hidden fees",
                  "Fast processing time (24-48 hours)",
                  "Multiple payment options (Bank & Mobile Money)",
                  "Secure and verified transaction channels",
                  "Dedicated support throughout the process"
                ].map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-white/90">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

          
          </div>
        </div>

        {/* Features Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {features.map((feature, index) => {
            // const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Background Image on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                {/* <div className="relative p-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div> */}
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        {/* <div className={`mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-800 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {[
            { number: "500+", label: "Transactions", icon: DollarSign },
            { number: "24-48h", label: "Processing Time", icon: Clock },
            { number: "99%", label: "Success Rate", icon: TrendingUp },
            { number: "24/7", label: "Support", icon: Users }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-2xl p-6 text-center text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.number}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            );
          })}
        </div> */}
      </div>
    </section>
  );
}

