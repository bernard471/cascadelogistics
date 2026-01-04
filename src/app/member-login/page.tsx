import { Suspense } from "react";
import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import MemberLoginSection from "@/components/MemberLoginSection";
import Footer from "@/components/Footer";

export default function MemberLogin() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero title="Member Login" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "Member Login", href: "/member-login" }]} />
            <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
                <MemberLoginSection />
            </Suspense>
            <Footer />
        </div>
    );
}