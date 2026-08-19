import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Land Freight Services",
  description: "Plan dependable road freight for local and cross-border cargo with flexible vehicles, route coordination and professional shipment handling.",
  path: "/logistics-services/land-freight",
  keywords: ["land freight Ghana","road cargo transport"],
});

export default function LandFreightPage() {
  const service = {
    id: 3,
    title: "Land Freight",
    description: `We provide comprehensive land freight services to our clients. We will help you assess your land freight needs and work with you to develop a comprehensive logistics plan to meet your transportation objectives. At Nivamore Courier Services, we understand the importance of reliable ground transportation for domestic and regional distribution.

Our land freight services include trucking, rail transport, intermodal solutions, and last-mile delivery. We work with customers to identify logistics needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for land transportation and regulatory compliance.`,
    image: "/servicesection/service-img3.jpg",
    benefits: [
      {
        icon: "flexibility",
        title: "Route Flexibility",
        description: "Land freight offers flexible routing options and can access locations not served by air or ocean transport, providing comprehensive coverage for regional distribution."
      },
      {
        icon: "door-to-door",
        title: "Door-to-Door Service",
        description: "Our land freight services provide true door-to-door delivery, picking up from your location and delivering directly to the final destination."
      },
      {
        icon: "cost-efficient",
        title: "Cost Efficient",
        description: "Land freight provides an economical solution for medium-distance shipments, offering competitive rates for regional and domestic transportation."
      }
    ],
    information: [
      {
        title: "Vehicle Types",
        description: "We operate various vehicle types including standard trucks, refrigerated vehicles, flatbed trucks, and specialized equipment for different cargo requirements."
      },
      {
        title: "Route Optimization",
        description: "Our advanced route optimization software ensures efficient delivery routes, reducing transit times and fuel consumption while improving service reliability."
      },
      {
        title: "Real-time Tracking",
        description: "We provide real-time GPS tracking for all land freight shipments, giving you complete visibility of your cargo throughout the transportation process."
      }
    ],
    serviceBenefits: [
      {
        title: "Regional Coverage",
        description: "Our land freight network covers extensive regional routes, providing reliable transportation services across multiple states and neighboring countries."
      },
      {
        title: "Intermodal Solutions",
        description: "We offer intermodal transportation combining truck, rail, and other modes to optimize cost and delivery time for long-distance shipments."
      },
      {
        title: "Last Mile Delivery",
        description: "Our specialized last-mile delivery services ensure your goods reach their final destination efficiently, even in remote or hard-to-access locations."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "LOGISTICS SERVICES", href: "/logistics-services" },
    { label: "LAND FREIGHT" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Land Freight"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
