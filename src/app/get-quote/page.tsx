import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import Footer from "@/components/Footer";
import QuoteCalculator from "@/components/QuoteCalculator";

export default function GetQuotePage() {
  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero title="Get a Quote" crumbs={[{ label: "Home", href: "/" }, { label: "Get a Quote", href: "/get-quote" }]} />
      <QuoteCalculator />
      <Footer />
    </div>
  );
}

