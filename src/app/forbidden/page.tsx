"use client";

import Link from "next/link";
import { Home, ArrowLeft, Shield, Mail, Phone, LogIn, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] via-white to-[#e3f2fd]">
      <TopBanner />
      <Navigation />
      
      <div className="py-16 lg:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 403 Illustration */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-8">
              <div className="text-9xl lg:text-[12rem] font-bold text-orange-500 opacity-20 leading-none">403</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Shield className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-600 mx-auto mb-6"></div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Access Forbidden
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              You don&apos;t have permission to access this resource. This could be due to insufficient privileges or the resource may be restricted.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/member-login">
              <Button className="bg-gradient-to-r from-[#219ebc] to-[#023e8a] hover:from-[#023e8a] hover:to-[#219ebc] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign In
              </Button>
            </Link>
            
            <Link href="/">
              <Button 
                variant="outline" 
                className="border-2 border-[#219ebc] text-[#219ebc] hover:bg-[#219ebc] hover:text-white px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </Button>
          </div>

          {/* Possible Reasons */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900">Possible reasons:</h3>
            </div>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#219ebc] mt-0.5 flex-shrink-0" />
                <p>You need to sign in to access this page</p>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#219ebc] mt-0.5 flex-shrink-0" />
                <p>Your account doesn&apos;t have the required permissions</p>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#219ebc] mt-0.5 flex-shrink-0" />
                <p>The resource has been moved or deleted</p>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#219ebc] mt-0.5 flex-shrink-0" />
                <p>Your session may have expired</p>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#219ebc] mt-0.5 flex-shrink-0" />
                <p>The page is temporarily restricted</p>
              </div>
            </div>
          </div>

          {/* Quick Access Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link 
              href="/member-login"
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 hover:border-[#219ebc] transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogIn className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Member Login</h3>
                  <p className="text-sm text-gray-600">Sign in to your account</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/member-register"
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 hover:border-[#219ebc] transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Create Account</h3>
                  <p className="text-sm text-gray-600">Register for access</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/user-dashboard/track-shipment"
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 hover:border-[#219ebc] transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Track Shipment</h3>
                  <p className="text-sm text-gray-600">Track your packages</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/contact-us"
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 hover:border-[#219ebc] transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#219ebc] to-[#023e8a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Contact Support</h3>
                  <p className="text-sm text-gray-600">Get help from our team</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-r from-[#219ebc] to-[#023e8a] rounded-2xl p-8 lg:p-12 text-white shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Need Help?</h3>
              <p className="text-white/90">
                If you believe you should have access to this resource, please contact our support team
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a 
                href="tel:+233248840661"
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 hover:bg-white/20 transition-all duration-300"
              >
                <Phone className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Ghana</div>
                  <div className="font-semibold">+233 248840661</div>
                </div>
              </a>
              <a 
                href="tel:+8613260543058"
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 hover:bg-white/20 transition-all duration-300"
              >
                <Phone className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs opacity-80">China</div>
                  <div className="font-semibold">+86 13260543058</div>
                </div>
              </a>
              <a 
                href="mailto:info@guangzhouswiftlogisticscompany.com"
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 hover:bg-white/20 transition-all duration-300"
              >
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Email</div>
                  <div className="font-semibold text-sm">info@guangzhouswift...</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
