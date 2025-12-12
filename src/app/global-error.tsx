"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertTriangle, Mail, Phone, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] via-white to-[#e3f2fd]">
          <TopBanner />
          <Navigation />
          
          <div className="py-16 lg:py-24 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Error Icon */}
              <div className="text-center mb-12">
                <div className="relative inline-block mb-8">
                  <div className="text-9xl lg:text-[12rem] font-bold text-red-500 opacity-20 leading-none">500</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                      <AlertTriangle className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
                <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto mb-6"></div>
              </div>

              {/* Error Message */}
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Something Went Wrong
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  We&apos;re experiencing technical difficulties. Our team has been notified and is working to resolve the issue. Please try again in a few moments.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button 
                  onClick={reset}
                  className="bg-gradient-to-r from-[#219ebc] to-[#023e8a] hover:from-[#023e8a] hover:to-[#219ebc] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </Button>
                
                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="border-2 border-[#219ebc] text-[#219ebc] hover:bg-[#219ebc] hover:text-white px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    Go Home
                  </Button>
                </Link>
              </div>

              {/* Error Details Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Wrench className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-bold text-gray-900">Technical Details</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-600 mb-2">
                    <strong>Error ID:</strong> {error.digest || 'N/A'}
                  </div>
                  <div className="text-gray-600">
                    <strong>Time:</strong> {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-gradient-to-r from-[#219ebc] to-[#023e8a] rounded-2xl p-8 lg:p-12 text-white shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Need Immediate Assistance?</h3>
                  <p className="text-white/90">
                    Contact our technical support team for immediate help
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
                <p className="text-center text-sm mt-6 opacity-80">
                  24/7 Emergency Support Available
                </p>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </body>
    </html>
  );
}
