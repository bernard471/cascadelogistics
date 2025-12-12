import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import FAQSection from "@/components/FAQSection";
import FAQContactSection from "@/components/FAQContactSection";
import Footer from "@/components/Footer";

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

