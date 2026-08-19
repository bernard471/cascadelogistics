import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import ContactUsSection from "@/components/ContactUsSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact Our Logistics Team",
  description: "Contact Cascade Logistics in Accra for help with China-to-Ghana shipping, freight quotes, customs clearance, procurement and shipment support.",
  path: "/contact-us",
  keywords: ["contact Cascade Logistics", "logistics company Accra", "Ghana freight support"],
});

export default function ContactUs() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero title="Contact Us" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "Contact Us", href: "/contact-us" }]} />
            <ContactUsSection />
            <Footer />
        </div>
    );
}
