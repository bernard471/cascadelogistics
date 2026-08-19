import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import AboutPageSectionOne from "@/components/AboutPageSectionOne";
import AboutPageSectionTwo from "@/components/AboutPageSectionTwo";
import AboutPageSectionThree from "@/components/AboutPageSectionThree";
import TeamSection from "@/components/TeamSection";
import GlobalReachSection from "@/components/GlobalReachSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About Our Logistics Company",
  description: "Meet Cascade Logistics, the team connecting China and Ghana through dependable freight forwarding, procurement, warehousing and delivery solutions.",
  path: "/about-us-cascade",
  keywords: ["about Cascade Logistics", "logistics company Ghana", "freight forwarder Accra"],
});

export default function AboutUsCascade() {
    return (
        <div className="min-h-screen">
            <TopBanner />
            <Navigation />
            <BreadcrumbHero 
            title="About Cascade Logistics" 
            crumbs={[{ label: "Home", href: "/" }, 
            { label: "About Us", href: "/about-us-cascade" }]} />
            <AboutPageSectionOne />
            <TeamSection />
          
            <AboutPageSectionThree />           
            <AboutPageSectionTwo />
            <GlobalReachSection />
            <Footer />
        </div>
    );
}
