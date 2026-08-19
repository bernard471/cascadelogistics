import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServicesSection from "@/components/SecurityServicesSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cargo & Security Services",
  description: "Protect cargo, facilities and valuable assets with Cascade Logistics security, surveillance, safe-keeping and cargo-handling services in Ghana.",
  path: "/security-services",
  keywords: ["cargo security Ghana", "logistics security services", "CCTV security Ghana", "secure cargo handling"],
});

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
