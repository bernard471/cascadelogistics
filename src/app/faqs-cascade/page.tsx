import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import FAQSection from "@/components/FAQSection";
import FAQContactSection from "@/components/FAQContactSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Shipping & Logistics FAQs",
  description: "Find answers about Cascade Logistics shipping times, air and sea freight, customs clearance, pricing, tracking and deliveries globally to Ghana.",
  path: "/faqs-cascade",
  keywords: ["shipping FAQ Ghana", "Global to Ghana shipping time", "freight questions"],
});

export default function FaqsCascade() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero title="FAQs" crumbs={[{ label: "Home", href: "/" }, 
            { label: "FAQs", href: "/faqs-cascade" }]} />
            <FAQSection />
            <FAQContactSection />
            <Footer />
        </div>
    );
}
