"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";

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

      // Success - show message about email verification
      setSuccess("Registration successful! Please check your email to verify your account before logging in.");
      
      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false
      });

      // Optionally redirect to login after showing message
      setTimeout(() => {
        router.push("/member-login?message=Please verify your email to complete registration");
      }, 5000);
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration");
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-[600px] flex items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* Registration Form Card */}
        <div className="bg-white p-8 lg:p-12 border border-gray-200 rounded-2xl shadow-xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">Join Cascade Logistics and start shipping today</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Registration Successful!</p>
                  <p>{success}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>Check your inbox for the verification email</span>
                  </div>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  First Name *
                </label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Last Name *
                </label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                required
                disabled={isLoading}
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Username *
              </label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                  required
                  disabled={isLoading}
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
                className="w-4 h-4 text-[#315694] border-gray-300 rounded focus:ring-[#315694] mt-1"
                required
                disabled={isLoading}
              />
              <label htmlFor="agreeToTerms" className="ml-2 text-gray-600 text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-[#315694] hover:underline font-semibold">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#315694] hover:underline font-semibold">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Register Button */}
            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white p-6 text-lg font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </div>

            {/* Login Link Section */}
            <div className="text-center space-y-4">
              <div>
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link href="/member-login" className="text-[#315694] hover:underline font-semibold">
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
