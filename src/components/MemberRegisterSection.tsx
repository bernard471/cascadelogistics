"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import emailjs from '@emailjs/browser';

export default function MemberRegisterSection() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(""); // Clear errors on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms and Conditions");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Success - send welcome email and redirect to login
      setSuccess("Registration successful! Sending welcome email...");
      
      // Send welcome email via EmailJS
      try {
        const emailParams = {
          to_email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          user_email: formData.email,
          login_url: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3001'}/member-login`
        };

        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
          emailParams
        );

        setSuccess("Registration successful! Welcome email sent! Redirecting to login...");
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        setSuccess("Registration successful! (Email sending failed, but account created) Redirecting to login...");
      }

      setTimeout(() => {
        router.push("/member-login");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration");
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-100 min-h-[600px] flex items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* Registration Form Card */}
        <div className="bg-white p-8 border border-gray-200">
          {/* Title */}
          <h1 className="text-2xl font-bold text-blue-800 text-center mb-8 border-b-2 border-gray-200 pb-4">
            Create Your Account
          </h1>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  First Name *
                </label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Last Name *
                </label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                required
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Username *
              </label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                required
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                  required
                />
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#055b8e] border-gray-300 rounded focus:ring-[#055b8e] mt-1"
                required
              />
              <label htmlFor="agreeToTerms" className="ml-2 text-gray-600 text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-[#055b8e] hover:underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#055b8e] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Register Button */}
            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-800 hover:bg-blue-700 text-white p-8 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{borderRadius: '10px 0px 10px 0px'}}
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </div>

            {/* Login Link Section */}
            <div className="text-center space-y-4">
              <div>
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link href="/member-login" className="text-blue-800 hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
