import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import MemberRegisterSection from "@/components/MemberRegisterSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Create a Member Account",
  description: "Register for a Cascade Logistics member account to create and manage shipments securely.",
  path: "/member-register",
  noIndex: true,
});

export default function MemberRegister() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero 
            title="Member Registration" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "Member Registration", href: "/member-register" }]} />
            <MemberRegisterSection />
            <Footer />
        </div>
    );
}
