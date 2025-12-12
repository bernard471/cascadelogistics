"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(""); // Clear error on input change
    setSubmitMessage(""); // Clear message on input change
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
          source: 'contact-modal'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit your message");
        setIsSubmitting(false);
        return;
      }

      setSubmitMessage("Thank you! Your message has been submitted successfully.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
        setSubmitMessage("");
      }, 3000);

    } catch (error) {
      console.error("Contact submission error:", error);
      setError("An error occurred while submitting your message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f0f3f9]/40 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-[#e4e7eecb] shadow-xl max-w-5xl w-full max-h-[95vh] relative"
        style={{
          borderRadius: '10px 0px 10px 0px'
        }}
      >
        {/* Close Button - Badge at vertex */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center hover:bg-[#055b8e] transition-colors z-10 shadow-lg"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="">
          <div className="grid grid-cols-12 gap-8">
            {/* Contact Form Section - LEFT */}
            <div className="bg-white rounded-lg p-8 col-span-5">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {submitMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {submitMessage}
                  </div>
                )}

                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    YOUR NAME
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter your name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    YOUR EMAIL
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter your email"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                    SUBJECT
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter subject"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    YOUR MESSAGE (OPTIONAL)
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1 min-h-[120px]"
                    placeholder="Enter your message"
                    disabled={isSubmitting}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full text-white py-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#193cb8',
                    borderRadius: '10px 0px 10px 0px'
                  }}
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
                </Button>
              </form>
            </div>

            {/* Company Info & Latest News Section - RIGHT */}
            <div className="bg-[#e4e7eecb] p-8 col-span-7">
              {/* Company Header */}
              <div className="mb-8 border-b  border-gray-400/10 pb-4">
                <Image
                  src="/logo/Afamase-main-logo-01.png"
                  alt="Nivamore Courier Services Logo"
                  width={130}
                  height={80}
                  className="mb-4"
                />
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  Nivamore Courier Services is a fully Licensed, Bonded and Insured Private Security Company and a leader in high quality and effective security. Our physical security services are designed to fully integrate with your requirements, likewise to provide the Zenithimum protection for your workers and assets.
                </p>
                <a href="#" className="text-blue-800 underline text-sm font-bold hover:text-blue-700">
                  READ MORE
                </a>
              </div>

              {/* Latest News Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Latest News</h3>
                <div className="flex gap-2">
                  {/* Placeholder for news images - user will add these later */}
                  <Image src="/popup/popup1.jpg" alt="News Image 1" width={100} height={100} className="rounded-lg" />
                  <Image src="/popup/popup2.jpg" alt="News Image 2" width={100} height={100} className="rounded-lg" />
                  <Image src="/popup/popup3.jpg" alt="News Image 3" width={100} height={100} className="rounded-lg" />
                  <Image src="/popup/popup4.jpg" alt="News Image 4" width={100} height={100} className="rounded-lg" />
                </div>

                  {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-400/10 text-center">
            <p className="text-gray-600 text-sm">
              © 2021 Nivamore Courier Services. All Rights Reserved.
            </p>
          </div>
              </div>
            </div>
          </div>

        
        </div>
      </div>
    </div>
  );
}
