"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import emailjs from '@emailjs/browser';

export default function ForgotPasswordSection() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(""); // Clear error on input change
    setMessage(""); // Clear message on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Call API to generate reset token
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        setIsLoading(false);
        return;
      }

      // Send password reset email via EmailJS
      try {
        const emailParams = {
          to_email: email,
          first_name: data.user?.firstName || "User",
          user_email: email,
          reset_url: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3001'}/reset-password?token=${data.resetToken}`
        };

        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
          process.env.NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE_ID || '',
          emailParams
        );

        setMessage("Password reset email sent! Please check your inbox and follow the instructions.");
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        setError("Account found but failed to send email. Please try again or contact support.");
      }

    } catch (error) {
      console.error("Forgot password error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-200 min-h-[600px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full">
        {/* Forgot Password Form Card */}
        <p className="text-gray-700 mb-8">
            Enter your email address and we&apos;ll send you a link you can use to pick a new password.
          </p>
        <div className="bg-white border border-gray-200 p-8">
          {/* Instructional Text */}
         

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-gray-400 mb-2">
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                className="w-full h-15 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                required
                disabled={isLoading}
              />
            </div>

            {/* Reset Password Button */}
            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-800 hover:bg-blue-700 text-white p-8 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '10px 0px 10px 0px' }}
              >
                {isLoading ? "SENDING..." : "RESET PASSWORD"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
