import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesSection from "@/components/LogisticsServicesSection";
import Footer from "@/components/Footer";

export default function LogisticsServices() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero
            title="Logistics Services"
            crumbs={[{ label: "Home", href: "/" },
            { label: "Logistics Services", href: "/logistics-services" }]} />
            <LogisticsServicesSection />
            <Footer />
        </div>
    );
}