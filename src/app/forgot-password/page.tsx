import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import ForgotPasswordSection from "@/components/ForgotPasswordSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Forgot Password",
  description: "Request a password-reset link for your Cascade Logistics member account.",
  path: "/forgot-password",
  noIndex: true,
});

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
