"use client";

import Image from "next/image";
import { Phone, Mail, MessageCircle, Clock, Send, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FAQContactSection() {
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

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our team",
      contact: "+233 24 189 3393",
      link: "tel:+233241893393",
      color: "from-[#315694] to-[#262262]"
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us a detailed message",
      contact: "info@cascadelogistics.co",
      link: "mailto:info@cascadelogistics.co",
      color: "from-[#f7941d] to-[#e6851a]"
    },
    {
      icon: MessageCircle,
      title: "Visit Us",
      description: "Get instant support",
      contact: "No. 25 Sir Arku Korsah Road, Airport Residential Area Accra",
      link: "/contact-us",
      color: "from-[#315694] to-[#262262]"
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="relative py-16 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #315694 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#f7941d]"></div>
            <span className="px-6 py-2 bg-[#f7941d]/20 border border-[#f7941d]/40 text-[#f7941d] text-sm font-bold uppercase tracking-wider rounded-full">
              Get In Touch
            </span>
            <div className="h-px w-16 bg-[#f7941d]"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Still Have <span className="text-[#f7941d]">Questions?</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Our friendly support team is ready to help you with any questions about our services
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Side - Contact Methods */}
          <div className={`space-y-6 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Link
                  key={index}
                  href={method.link}
                  className="group block"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#f7941d] transition-all duration-300 hover:scale-105">
                    <div className="items-start gap-4">
                     <div className="flex items-center justify-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{method.title}</h3>
                        <p className="text-gray-400 text-sm mb-2">{method.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#f7941d] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <p className="text-[#f7941d] font-semibold mt-3">{method.contact}</p>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Office Hours */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-[#f7941d]" />
                <h3 className="text-xl font-bold text-white">Office Hours</h3>
              </div>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span>Monday - Saturday</span>
                  <span className="text-white font-semibold">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-white font-semibold">Closed</span>
                </div>
                <div className="pt-2 mt-2 border-t border-white/10">
                  <p className="text-sm text-gray-400">Get in Touch: 24/7 Mon - Sat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image & CTA */}
          <div className={`space-y-6 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {/* Main Image */}
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl group">
              <Image
                src="/cascade/hero-services.jpg"
                alt="Cascade Logistics support"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              
              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Expert Support Team</h3>
                <p className="text-white/90 mb-4">
                  Our experienced team is here to assist you with all your shipping and logistics needs
                </p>
              </div>
            </div>

            {/* Quick Contact Form Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Send className="w-6 h-6 text-[#f7941d]" />
                <h3 className="text-xl font-bold text-white">Quick Contact</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Fill out our contact form and we&apos;ll get back to you within 2 hours
              </p>
              <Link href="/contact-us">
                <Button className="w-full bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105">
                  Go to Contact Form
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { number: "4+", label: "Routes" },
                { number: "24/7", label: "Support" },
                { number: "2hr", label: "Response" }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center"
                >
                  <div className="text-2xl font-bold text-[#f7941d] mb-1">{stat.number}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
