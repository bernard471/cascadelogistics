import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Export Services from Ghana",
  description: "Export goods from Ghana to international markets with documentation, customs processing, cargo handling and coordinated global transport.",
  path: "/logistics-services/export-services",
  keywords: ["export services Ghana","international shipping from Ghana"],
});

export default function ExportServicesPage() {
  const service = {
    id: 7,
    title: "Export Services",
    description: `Cascade Logistics provides comprehensive export solutions for businesses and individuals looking to ship goods from Ghana to international markets worldwide. We handle all aspects of export logistics to ensure seamless international trade.

Our experienced export team manages export documentation, customs compliance, freight booking, cargo packaging, and international shipping. Whether you are exporting commercial products, agricultural commodities, or personal goods, Cascade Logistics offers tailored export solutions with global reach, reliable handling, and transparent tracking.`,
    image: "/servicesection/service-img1.jpg",
    benefits: [
      {
        icon: "global-reach",
        title: "Global Export Reach",
        description: "Ship your goods from Ghana to destinations worldwide including Europe, North America, Asia, and across Africa with reliable transit routes."
      },
      {
        icon: "documentation",
        title: "Export Documentation",
        description: "We handle all mandatory export permits, certificates of origin, customs declarations, and international shipping compliance documents."
      },
      {
        icon: "efficiency",
        title: "Freight Forwarding",
        description: "Optimized air and sea export cargo forwarding tailored to your timeline, cargo volume, and budget requirements."
      }
    ],
    information: [
      {
        title: "Export Compliance & Documentation",
        description: "We ensure full compliance with Ghana Customs regulations, export promo authorities, and destination country import requirements."
      },
      {
        title: "Cargo Handling & Packaging",
        description: "Professional packing, palletizing, and container loading services designed to protect your goods during international transit."
      },
      {
        title: "End-to-End Tracking",
        description: "Stay informed from port dispatch to final destination delivery with real-time status updates and dedicated export account management."
      }
    ],
    serviceBenefits: [
      {
        title: "Seamless International Access",
        description: "Cascade Logistics opens up global markets for your Ghanaian products, connecting your business to international buyers with efficient shipping schedules."
      },
      {
        title: "Hassle-Free Customs Clearance",
        description: "Our export specialists handle all regulatory filings, export permits, and port procedures, eliminating delays and simplifying the export process."
      },
      {
        title: "Cost-Effective Freight Solutions",
        description: "Benefit from competitive export freight rates for both ocean and air cargo exports tailored to your cargo size."
      },
      {
        title: "Cargo Safety Assurance",
        description: "We enforce strict cargo handling protocols and offer cargo safety support to protect your valuable exports every step of the way."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Export Services" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Export Services"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
