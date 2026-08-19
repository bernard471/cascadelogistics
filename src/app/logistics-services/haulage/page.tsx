import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cargo Haulage Services in Ghana",
  description: "Transport cargo safely across Ghana with professional haulage from ports and airports, suitable vehicles, transit cover and timely delivery.",
  path: "/logistics-services/haulage",
  keywords: ["haulage services Ghana","cargo transport Accra"],
});

export default function HaulagePage() {
  const service = {
    id: 4,
    title: "Haulage Services",
    description: `Cascade Logistics provides professional haulage services for your cargo within Ghana. Our haulage solutions ensure safe and timely transportation of your goods from ports and airports to your desired location.

We offer comprehensive haulage services with professional drivers, well-maintained vehicles, and reliable service. Our experienced team ensures your goods are transported safely and delivered on time to your warehouse, business location, or home. We handle all types of cargo with appropriate vehicles and equipment, ensuring your goods arrive in perfect condition.`,
    image: "/logisticssection/logistics-middle.jpg",
    benefits: [
      {
        icon: "safety",
        title: "Safe Transport",
        description: "Our professional haulage service ensures safe transportation of your goods with well-maintained vehicles, experienced drivers, and proper cargo handling procedures."
      },
      {
        icon: "reliability",
        title: "Timely Delivery",
        description: "We guarantee on-time delivery to your specified location, ensuring your goods arrive when you need them with reliable and professional service."
      },
      {
        icon: "professional",
        title: "Professional Service",
        description: "Our experienced team provides professional haulage services with proper equipment, appropriate vehicles, and expert handling for all cargo types."
      }
    ],
    information: [
      {
        title: "Service Coverage",
        description: "We provide haulage services throughout Ghana, transporting goods from ports and airports to your warehouse, business location, or home with reliable and professional service."
      },
      {
        title: "Vehicle Fleet",
        description: "Our fleet includes various vehicle types suitable for different cargo sizes and types, ensuring we have the right equipment for your specific haulage needs."
      },
      {
        title: "Cargo Handling",
        description: "We handle all types of cargo with appropriate vehicles and equipment, ensuring your goods are transported safely and arrive in perfect condition."
      },
      {
        title: "Transit Cover",
        description: "Cover is a safeguard for our customer's cargo against any accidental loss or damages whiles in transit. Goods In Transit cover to the tune of USD 200,000.00."
      }
    ],
    serviceBenefits: [
      {
        title: "Safe and Secure Transport",
        description: "Our professional haulage service ensures safe transportation of your goods with well-maintained vehicles, experienced drivers, and proper cargo handling procedures throughout Ghana."
      },
      {
        title: "On-Time Delivery",
        description: "We guarantee timely delivery to your specified location, ensuring your goods arrive when you need them with reliable scheduling and professional service."
      },
      {
        title: "Professional Equipment",
        description: "Our fleet includes various vehicle types suitable for different cargo sizes and types, ensuring we have the right equipment for your specific haulage requirements."
      },
      {
        title: "Complete Coverage",
        description: "We provide haulage services throughout Ghana, transporting goods from ports and airports to your warehouse, business location, or home with comprehensive coverage."
      },
      {
        title: "Goods in Transit Cover",
        description: "Cover is a safeguard for our customer's cargo against any accidental loss or damages whiles in transit. We provide Goods In Transit cover to the tune of USD 200,000.00."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Haulage Services" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Haulage Services"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}

