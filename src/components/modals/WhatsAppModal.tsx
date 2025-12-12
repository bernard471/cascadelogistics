"use client";

import { useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface WhatsAppModalProps {
  onClose: () => void;
}

export default function WhatsAppModal({ onClose }: WhatsAppModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
  });

  const [error, setError] = useState("");

  // WhatsApp phone number (Ghana number from company info)
  const whatsappNumber = "233248840661"; // +233 248840661 without + and spaces

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.message.trim()) {
      setError("Please enter a message");
      return;
    }

    // Format message with name
    const formattedMessage = `Hello, my name is ${formData.name}.\n\n${formData.message}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(formattedMessage);
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // Close modal after opening WhatsApp
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Chat Widget - Bottom Right */}
      <div className="fixed bottom-24 right-4 sm:right-8 z-50 w-[calc(100%-2rem)] sm:w-full max-w-sm animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">WhatsApp Support</h3>
                <p className="text-white/90 text-xs">We&apos;re here to help!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-gray-50">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Your Name *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="h-10 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Message *
              </label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Type your message here..."
                className="min-h-[100px] resize-none text-sm"
                required
              />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 bg-green-500 hover:bg-green-600 text-white text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center pt-2">
              Opens WhatsApp with your message
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

