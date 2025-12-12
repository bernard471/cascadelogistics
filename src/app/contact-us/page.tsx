import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import ContactUsSection from "@/components/ContactUsSection";
import Footer from "@/components/Footer";

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