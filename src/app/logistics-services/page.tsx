import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesSection from "@/components/LogisticsServicesSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Freight & Logistics Services",
  description: "Explore air freight, sea cargo, customs clearance, consolidation, procurement, warehousing and delivery services from China to Ghana.",
  path: "/logistics-services",
  keywords: ["logistics services Ghana", "freight forwarding services", "shipping China to Ghana", "customs clearance Ghana"],
});

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
