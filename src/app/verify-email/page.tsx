import { Suspense } from "react";
import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import VerifyEmailSection from "@/components/VerifyEmailSection";
import Footer from "@/components/Footer";

export default function VerifyEmail() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero 
            title="Verify Your Email" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "Verify Email", href: "/verify-email" }]} />
            <Suspense fallback={
                <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-[600px] flex items-center">
                    <div className="max-w-2xl mx-auto px-4 w-full">
                        <div className="bg-white p-8 lg:p-12 border border-gray-200 rounded-2xl shadow-xl text-center">
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    </div>
                </section>
            }>
                <VerifyEmailSection />
            </Suspense>
            <Footer />
        </div>
    );
}

