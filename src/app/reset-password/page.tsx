import { Suspense } from "react";
import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import ResetPasswordSection from "@/components/ResetPasswordSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Reset Password",
  description: "Choose a new password for your Cascade Logistics member account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPassword() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero 
            title="Reset Your Password" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "Reset Password", href: "/reset-password" }]} />
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-600">Loading...</div></div>}>
                <ResetPasswordSection />
            </Suspense>
            <Footer />
        </div>
    );
}
