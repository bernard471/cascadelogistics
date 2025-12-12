import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServicesSection from "@/components/SecurityServicesSection";
import Footer from "@/components/Footer";

export default function SecurityServices() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero
            title="Security Services"
            crumbs={[{ label: "Home", href: "/" },
            { label: "Security Services", href: "/security-services" }]} />
            <SecurityServicesSection />
            <Footer />
        </div>
    );
}