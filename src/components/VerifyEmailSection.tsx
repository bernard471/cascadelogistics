"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";

export default function VerifyEmailSection() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const verifyEmail = useCallback(async (verificationToken: string) => {
    setIsVerifying(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Email verification failed");
        setIsVerifying(false);
        return;
      }

      setIsVerified(true);
      setMessage("Your email has been verified successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/member-login?message=Email verified successfully! You can now log in.");
      }, 3000);
    } catch (error) {
      console.error("Verify email error:", error);
      setError("An error occurred while verifying your email. Please try again.");
      setIsVerifying(false);
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setError("Invalid verification link. No token provided.");
    }
  }, [token, verifyEmail]);

  const resendVerificationEmail = async () => {
    // This would need the user's email - for now, redirect to a page where they can enter it
    router.push("/member-login?message=Please contact support to resend verification email");
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-[600px] flex items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        <div className="bg-white p-8 lg:p-12 border border-gray-200 rounded-2xl shadow-xl">
          {isVerifying && !isVerified && !error && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-[#315694] animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          )}

          {isVerified && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verified Successfully!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">Redirecting to login page...</p>
              <Link href="/member-login">
                <Button className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105">
                  Go to Login
                </Button>
              </Link>
            </div>
          )}

          {error && !isVerifying && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  The verification link may have expired or is invalid. Verification links expire after 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/member-login">
                    <Button variant="outline" className="border-[#315694] text-[#315694] hover:bg-[#315694] hover:text-white px-6 py-3">
                      Go to Login
                    </Button>
                  </Link>
                  <Button
                    onClick={resendVerificationEmail}
                    className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white px-6 py-3"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Request New Link
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!token && !isVerifying && (
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">No Verification Token</h1>
              <p className="text-gray-600 mb-6">
                Please use the verification link sent to your email address.
              </p>
              <Link href="/member-login">
                <Button className="bg-gradient-to-r from-[#315694] to-[#262262] hover:from-[#262262] hover:to-[#315694] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105">
                  Go to Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

