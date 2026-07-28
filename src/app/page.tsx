import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import PublicTrackShipment from "@/components/PublicTrackShipment";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
// import LogisticsSection from "@/components/LogisticsSection";
import ShippingRoutesSection from "@/components/ShippingRoutesSection";
import InsuranceSection from "@/components/InsuranceSection";
import NeedHelpSection from "@/components/NeedHelpSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
// import TestimonialsSection from "@/components/TestimonialsSection";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      {/* <LogisticsSection /> */}
      <ShippingRoutesSection />
      {/* Public Tracking Section */}
      <section id="public-tracking" className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <PublicTrackShipment />
        </div>
      </section>
      <InsuranceSection />
      <NeedHelpSection />
      <WhyChooseUsSection />
      {/* <TestimonialsSection /> */}
      <GallerySection />
      <Footer />
    </div>
  );
}
