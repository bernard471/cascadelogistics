"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MemberLoginSection() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        setError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Fetch session to check user role
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        
        // Redirect based on role
        if (session?.user?.role === "admin") {
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
    <section className="py-16 lg:py-24 bg-gray-100 min-h-[600px] flex items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* Login Form Card */}
        <div className="bg-white p-8 border border-gray-200">
          {/* Title */}
          <h1 className="text-2xl font-bold text-blue-800 text-center mb-8 border-b-2 border-gray-200 pb-4">
            Login To Your Account
          </h1>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
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
                className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                required
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
                className="w-full h-12 border-gray-300 focus:border-[#055b8e] focus:ring-[#055b8e]"
                required
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
                className="w-4 h-4 text-[#055b8e] border-gray-300 rounded focus:ring-[#055b8e]"
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
                className="w-full bg-blue-800 hover:bg-blue-700 text-white p-8 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{borderRadius: '10px 0px 10px 0px'}}
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
                  <Link href="/forgot-password" className="text-blue-500 hover:underline">
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
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 font-medium"
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
