import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import Footer from "@/components/Footer";
import QuoteCalculator from "@/components/QuoteCalculator";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Get a Freight Shipping Quote",
  description: "Request a shipping quote from Cascade Logistics for air freight, sea cargo and logistics services between China and Ghana.",
  path: "/get-quote",
  keywords: ["shippent quote to Ghana", "freight quote Ghana", "air cargo quote", "sea cargo quote"],
});

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
