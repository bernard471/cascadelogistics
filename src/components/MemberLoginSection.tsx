"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";

export default function MemberLoginSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageParam = searchParams.get('message');
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check for message from query params
  useEffect(() => {
    if (messageParam) {
      setMessage(messageParam);
    }
  }, [messageParam]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Check for specific error messages from auth
        if (result.error.includes("verify your email")) {
          setError("Please verify your email address before logging in. Check your inbox for the verification link.");
        } else if (result.error.includes("suspended") || result.error.includes("pending")) {
          setError("Your account is suspended or pending activation. Please contact support.");
        } else {
          setError("Invalid username or password");
        }
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Fetch session to check user role
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        
        // Redirect based on role
        if (session?.user?.role === "admin" || session?.user?.role === "staff") {
          router.push("/admin-dashboard");
        } else {
          router.push("/user-dashboard");
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-[600px] flex items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* Login Form Card */}
        <div className="bg-white p-8 lg:p-12 border border-gray-200 rounded-2xl shadow-xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Login To Your Account
            </h1>
            <p className="text-gray-600">Welcome back to Cascade Logistics</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {message && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
                {error.includes("verify your email") && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm mb-2">Need a new verification email?</p>
                    <button
                      type="button"
                      onClick={async () => {
                        // Extract email from username (could be email or username)
                        const email = formData.username.includes('@') ? formData.username : '';
                        if (email) {
                          try {
                            const response = await fetch("/api/auth/resend-verification", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email }),
                            });
                            const data = await response.json();
                            if (response.ok) {
                              setMessage("Verification email sent! Please check your inbox.");
                              setError("");
                            } else {
                              setError(data.error || "Failed to resend verification email");
                            }
                          } catch {
                            setError("Failed to resend verification email");
                          }
                        } else {
                          setMessage("Please enter your email address in the username field to resend verification email.");
                        }
                      }}
                      className="text-[#315694] hover:underline text-sm font-semibold"
                    >
                      <Mail className="w-4 h-4 inline mr-1" />
                      Resend verification email
                    </button>
                  </div>
                )}
              </div>
            )}

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
                  className="w-full h-12 border-gray-300 focus:border-[#315694] focus:ring-[#315694]"
                  required
                  disabled={isLoading}
                />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
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

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#315694] border-gray-300 rounded focus:ring-[#315694]"
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-600">
                Remember Me
              </label>
            </div>

            {/* Sign In Button */}
            <div className="text-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white p-6 text-lg font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
              </Button>
            </div>

            {/* Forgot Password / Register Section */}
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-gray-800 text-2xl font-bold mb-2">
                  Forget your Password ?
                </h3>
                <p className="text-gray-600 text-sm">
                  no worries,{" "}
                  <Link href="/forgot-password" className="text-[#315694] hover:underline font-semibold">
                    click here
                  </Link>{" "}
                  to reset your password.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <span className="text-gray-600">OR</span>
                <Link href="/member-register">
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white px-6 py-3 font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
