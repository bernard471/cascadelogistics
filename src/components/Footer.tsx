"use client";

import { Mail, Phone, ChevronUp, MessageCircle, Newspaper, Clock, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from 'next/link';
import WhatsAppModal from "@/components/modals/WhatsAppModal";

export default function Footer() {
  const [email, setEmail] = useState("");
  // const [contactForm, setContactForm] = useState({
  //   name: "",
  //   email: "",
  //   subject: ""
  // });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: 'footer'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to subscribe to newsletter");
        setIsSubmitting(false);
        return;
      }

      setMessage(data.message || "Successfully subscribed!");
      setEmail("");
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setError("An error occurred while subscribing");
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleContactSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log("Contact form:", contactForm);
  //   setContactForm({ name: "", email: "", subject: "" });
  // };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { label: "About Us", href: "/about-us-cascade" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Track Shipment", href: "/#public-tracking" },
    { label: "Contact Us", href: "/contact-us" }
  ];

  const services = [
    { label: "Air Shipments", href: "/logistics-services/air-shipments" },
    { label: "Sea Cargo", href: "/logistics-services/sea-cargo" },
    { label: "Clearing & Customs", href: "/logistics-services/clearing-customs" },
    { label: "Haulage Services", href: "/logistics-services/haulage" }
  ];

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-24 md:right-28 w-14 h-14 bg-gradient-to-br from-[#315694] to-[#262262] rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-xl shadow-[#315694]/30 z-40 group"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-6 h-6 text-white group-hover:-translate-y-1 transition-transform" />
      </button>

      {/* WhatsApp Button */}
      <button
        onClick={() => setShowWhatsAppModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-xl shadow-green-500/30 z-50 group"
        title="Contact us on WhatsApp"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <WhatsAppModal onClose={() => setShowWhatsAppModal(false)} />
      )}

      {/* Newsletter Section */}
      <div className="relative py-16 bg-gradient-to-r from-[#315694] to-[#262262] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Newspaper className="w-8 h-8 text-white" />
              <h2 className="text-3xl font-bold text-white">Stay Updated</h2>
            </div>
            <p className="text-white/90 text-lg mb-8">Get the latest updates on our services, shipping rates, and special offers.</p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-14 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/60 rounded-lg"
                required
                disabled={isSubmitting}
              />
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="h-14 bg-white text-[#315694] hover:bg-gray-100 px-8 font-semibold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
                <Send className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Cascade Logistics Limited</h3>
                <p className="text-gray-400 leading-relaxed">
                  Connecting Possibilities, Delivering Excellence. Your trusted partner for seamless global shipping to Ghana from UK, China, USA, and Turkey.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href}
                      className="text-gray-400 hover:text-[#f7941d] transition-colors flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Our Services</h4>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <li key={index}>
                    <Link 
                      href={service.href}
                      className="text-gray-400 hover:text-[#f7941d] transition-colors flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{service.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#f7941d] mt-1 flex-shrink-0" />
                  <div className="text-gray-400">
                    <a href="tel:+233241893393" className="hover:text-[#f7941d] transition-colors block">+233 24 189 3393</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#f7941d] mt-1 flex-shrink-0" />
                  <div className="text-gray-400">
                    <a href="mailto:info@cascadelogistics.co" className="hover:text-[#f7941d] transition-colors block text-sm">
                      info@cascadelogistics.co
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#f7941d] mt-1 flex-shrink-0" />
                  <div className="text-gray-400">
                    <p>No. 25 Sir Arku Korsah Road</p>
                    <p className="text-sm">Airport Residential Area, Accra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Cascade Logistics Limited. All Rights Reserved.
            </p>
            <p className="text-gray-400 text-sm">
              <span className="text-[#f7941d]">Connecting Possibilities, Delivering Excellence</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
