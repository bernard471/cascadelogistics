"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, RefreshCw, AlertTriangle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo/Afamase-main-logo-01.png"
            alt="Nivamore Courier Services"
            width={200}
            height={60}
            className="mx-auto"
          />
        </div>

        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div className="text-6xl font-bold text-red-600 mb-4">500</div>
          <div className="w-32 h-1 bg-red-600 mx-auto mb-6"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
            Internal Server Error
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Oops! Something went wrong on our end. We&apos;re working to fix this issue. Please try again in a few moments.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-mono">
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            onClick={reset}
            className="bg-[#055b8e] hover:bg-[#044a73] text-white px-8 py-3 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button 
              variant="outline" 
              className="border-[#055b8e] text-[#055b8e] hover:bg-[#055b8e] hover:text-white px-8 py-3 flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* What to do next */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">What you can do:</h3>
          <div className="text-left space-y-2 text-gray-600">
            <p>• Refresh the page and try again</p>
            <p>• Check your internet connection</p>
            <p>• Clear your browser cache and cookies</p>
            <p>• Try accessing the page from a different browser</p>
            <p>• Contact our support team if the problem persists</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-[#055b8e] text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Still having trouble?</h3>
          <p className="text-sm mb-4">
            Our technical team has been notified of this error. If you continue to experience issues, please contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+971 52 549 3462</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>nivamorecourierservices@hotmail.com</span>
            </div>
          </div>
          <p className="text-xs mt-4 opacity-80">
            Error ID: {error.digest || 'N/A'} | Time: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
