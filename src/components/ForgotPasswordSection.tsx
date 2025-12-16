"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordSection() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      // Call API to generate reset token and send email
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

      // Success message (API handles email sending)
      setMessage("If an account with that email exists, we've sent a password reset link. Please check your inbox and follow the instructions.");

    } catch (error) {
      console.error("Forgot password error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-[600px] flex items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* Forgot Password Form Card */}
        <div className="bg-white p-8 lg:p-12 border border-gray-200 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Forgot Your Password?
            </h1>
            <p className="text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Email Sent!</p>
                  <p>{message}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>Check your inbox for the reset link</span>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                required
                disabled={isLoading}
                placeholder="Enter your email address"
              />
            </div>

            {/* Reset Password Button */}
            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white p-6 text-lg font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                {isLoading ? "SENDING..." : "SEND RESET LINK"}
              </Button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Remember your password?{" "}
                <a href="/member-login" className="text-[#315694] hover:underline font-semibold">
                  Sign in here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
