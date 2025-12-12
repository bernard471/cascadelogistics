import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import AboutPageSectionOne from "@/components/AboutPageSectionOne";
import AboutPageSectionTwo from "@/components/AboutPageSectionTwo";
import AboutPageSectionThree from "@/components/AboutPageSectionThree";
import TeamSection from "@/components/TeamSection";
import GlobalReachSection from "@/components/GlobalReachSection";
import Footer from "@/components/Footer";

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