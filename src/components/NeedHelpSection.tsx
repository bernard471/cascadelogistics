"use client";

import Image from "next/image";
import { Phone, Mail, MapPin, ArrowRight, Send, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function NeedHelpSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our team",
      contact: "+233 24 189 3393",
      contact2: "",
      gradient: "from-[#315694] to-[#262262]"
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us your inquiry",
      contact: "info@cascadelogistics.co",
      contact2: "",
      gradient: "from-[#f7941d] to-[#f7941d]/80"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Our office location",
      contact: "No. 25 Sir Arku Korsah Road",
      contact2: "Airport Residential Area, Accra",
      gradient: "from-[#315694] to-[#262262]"
    }
  ];

  const quickActions = [
    { label: "Get Quote", href: "/get-quote" },
    { label: "Track Shipment", href: "/#public-tracking" },
    { label: "View Services", href: "/logistics-services" },
    { label: "Contact Us", href: "/contact-us" }
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
    <section ref={sectionRef} className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/cascade/backgroundimage.png"
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* Left Side - Main Content */}
          <div className={`lg:col-span-3 space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            {/* Badge */}
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#f7941d] text-white text-sm font-bold uppercase tracking-wider rounded-full">
                <HelpCircle className="w-4 h-4" />
                Need Help?
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                We&apos;re Here to
                <span className="block text-[#f7941d] mt-2">Help You</span>
              </h2>
              <div className="w-24 h-1 bg-[#f7941d]"></div>
            </div>

            {/* Description */}
            <p className="text-lg text-white/90 leading-relaxed">
              Our expert team is ready to assist you with all your logistics needs. From shipping inquiries to custom solutions, we provide comprehensive support tailored to your business requirements.
            </p>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{action.label}</span>
                      <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <Link href="/contact-us">
              <Button 
                size="lg"
                className="group bg-[#f7941d] hover:bg-[#f7941d]/90 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-xl shadow-[#f7941d]/30 hover:shadow-[#f7941d]/50 transition-all duration-300 hover:scale-105"
              >
                Contact Us Now
                <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right Side - Contact Cards */}
          <div className={`lg:col-span-2 space-y-6 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${method.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{method.title}</h3>
                      <p className="text-white/70 mb-3 text-sm">{method.description}</p>
                      <div className="space-y-1">
                        {method.icon === Phone ? (
                          <a 
                            href={`tel:${method.contact}`}
                            className="block text-white hover:text-[#f7941d] transition-colors font-medium"
                          >
                            {method.contact}
                          </a>
                        ) : method.icon === Mail ? (
                          <a 
                            href={`mailto:${method.contact}`}
                            className="block text-white hover:text-[#f7941d] transition-colors font-medium"
                          >
                            {method.contact}
                          </a>
                        ) : (
                          <div className="text-white font-medium">
                            {method.contact}
                          </div>
                        )}
                        {method.contact2 && (
                          <div className="block text-white/80 text-sm mt-1">
                            {method.contact2}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
