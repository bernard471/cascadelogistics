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
            <MemberLoginSection />
            <Footer />
        </div>
    );
}