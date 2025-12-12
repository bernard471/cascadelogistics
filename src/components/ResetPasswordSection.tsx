"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordSection() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  // Check if token is valid
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
      setIsCheckingToken(false);
      return;
    }

    // You could add a token validation API call here if needed
    setIsValidToken(true);
    setIsCheckingToken(false);
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    }
    setError(""); // Clear error on input change
    setMessage(""); // Clear message on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token,
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      setMessage("Password reset successfully! Redirecting to login...");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/member-login");
      }, 3000);

    } catch (error) {
      console.error("Reset password error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <section className="py-16 lg:py-24 bg-gray-200 min-h-[600px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#055b8e] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset token...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!isValidToken) {
    return (
      <section className="py-16 lg:py-24 bg-gray-200 min-h-[600px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/forgot-password">
              <Button className="bg-[#055b8e] hover:bg-[#044a73] text-white">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-gray-200 min-h-[600px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full">
        {/* Reset Password Form Card */}
        <p className="text-gray-700 mb-8">
          Enter your new password below. Make sure it&apos;s at least 6 characters long.
        </p>
        <div className="bg-white border border-gray-200 p-8">
          {/* Reset Password Form */}
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

            {/* New Password Field */}
            <div>
              <label className="block text-gray-400 mb-2">
                New Password
              </label>
              <Input
                type="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                className="w-full h-15 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                required
                disabled={isLoading}
                placeholder="Enter your new password"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-400 mb-2">
                Confirm New Password
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                className="w-full h-15 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                required
                disabled={isLoading}
                placeholder="Confirm your new password"
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
                {isLoading ? "RESETTING..." : "RESET PASSWORD"}
              </Button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link href="/member-login" className="text-blue-800 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
