"use client";

import {
  Phone,
  Mail,
  MessageCircle,
  User,
  FolderOpen,
  Clock,
  Send,
  MapPin,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function ContactUsSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [error, setError] = useState("");
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSubmitMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: 'contact-page'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit your message");
        setIsSubmitting(false);
        return;
      }

      setSubmitMessage("Thank you! Your message has been submitted successfully. We'll get back to you within 2 hours.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      
      setTimeout(() => setSubmitMessage(""), 5000);

    } catch (error) {
      console.error("Contact submission error:", error);
      setError("An error occurred while submitting your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone",
      details: [
        { label: "Ghana", value: "+233 24 189 3393", link: "tel:+233241893393" }
      ],
      color: "from-[#315694] to-[#262262]"
    },
    {
      icon: Mail,
      title: "Email",
      details: [
        { label: "Primary", value: "info@cascadelogistics.co", link: "mailto:info@cascadelogistics.co" }
      ],
      color: "from-[#f7941d] to-[#e6851a]"
    },
    {
      icon: MapPin,
      title: "Address",
      details: [
        { label: "Office", value: "No. 25 Sir Arku Korsah Road, Airport Residential Area Accra", link: "#" }
      ],
      color: "from-[#315694] to-[#262262]"
    }
  ];

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#315694]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#f7941d]/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16 bg-[#315694]"></div>
            <span className="px-6 py-2 bg-[#315694]/10 border border-[#315694]/20 text-[#315694] text-sm font-bold uppercase tracking-wider rounded-full">
              Get In Touch
            </span>
            <div className="h-px w-16 bg-[#315694]"></div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Contact <span className="text-[#315694]">Cascade Logistics</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions about our shipping services? We&apos;re here to help! Reach out to us through any of the methods below, 
            or fill out the form and we&apos;ll get back to you within 2 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column - Contact Methods */}
          <div className={`lg:col-span-1 space-y-6 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{method.title}</h3>
                  <div className="space-y-3">
                    {method.details.map((detail, idx) => (
                      <div key={idx}>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{detail.label}</div>
                        {method.title === "Address" ? (
                          <p className="text-[#315694] font-semibold leading-relaxed">{detail.value}</p>
                        ) : (
                          <Link
                            href={detail.link}
                            className="text-[#315694] hover:text-[#f7941d] font-semibold transition-colors flex items-center gap-2 group"
                          >
                            <span>{detail.value}</span>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Office Hours */}
            <div className="bg-gradient-to-br from-[#315694] to-[#262262] rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6" />
                <h3 className="text-xl font-bold">Office Hours</h3>
              </div>
              <div className="space-y-2 text-white/90">
                <div className="flex justify-between">
                  <span>Monday - Saturday</span>
                  <span className="font-semibold">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-semibold">Closed</span>
                </div>
                <div className="pt-3 mt-3 border-t border-white/20">
                  <p className="text-sm">Get in Touch: 24/7 Mon - Sat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className={`lg:col-span-2 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#315694] to-[#262262] rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Send Us a Message</h2>
                  <p className="text-gray-600 text-sm">Fill out the form below and we&apos;ll respond within 2 hours</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <span className="text-red-500">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Message */}
                {submitMessage && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>{submitMessage}</span>
                  </div>
                )}

                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                      <User className="w-4 h-4 text-[#315694]" />
                      Your Name
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full h-12 bg-gray-50 border-gray-300 focus:border-[#315694] focus:ring-[#315694] rounded-lg"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                      <Mail className="w-4 h-4 text-[#315694]" />
                      Your Email
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="w-full h-12 bg-gray-50 border-gray-300 focus:border-[#315694] focus:ring-[#315694] rounded-lg"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Phone and Subject Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                      <Phone className="w-4 h-4 text-[#315694]" />
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full h-12 bg-gray-50 border-gray-300 focus:border-[#315694] focus:ring-[#315694] rounded-lg"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                      <FolderOpen className="w-4 h-4 text-[#315694]" />
                      Subject
                    </label>
                    <Input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is this regarding?"
                      className="w-full h-12 bg-gray-50 border-gray-300 focus:border-[#315694] focus:ring-[#315694] rounded-lg"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                    <MessageCircle className="w-4 h-4 text-[#315694]" />
                    Your Message
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your shipping needs, questions, or how we can help you..."
                    className="w-full bg-gray-50 border-gray-300 focus:border-[#315694] focus:ring-[#315694] rounded-lg min-h-[150px] resize-y"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { icon: Clock, title: "Response Time", value: "Within 2 Hours", color: "from-[#315694] to-[#262262]" },
                { icon: CheckCircle2, title: "Support", value: "24/7 Available", color: "from-[#f7941d] to-[#e6851a]" },
                { icon: MapPin, title: "Location", value: "Accra, Ghana", color: "from-[#315694] to-[#262262]" }
              ].map((info, index) => {
                const Icon = info.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 text-center"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{info.title}</h4>
                    <p className="text-sm text-gray-600">{info.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

