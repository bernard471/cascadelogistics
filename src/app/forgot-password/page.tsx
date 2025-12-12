import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import ForgotPasswordSection from "@/components/ForgotPasswordSection";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero 
            title="Forgot Your Password?" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "Forgot Password", href: "/forgot-password" }]} />
            <ForgotPasswordSection />
            <Footer />
        </div>
    );
}
