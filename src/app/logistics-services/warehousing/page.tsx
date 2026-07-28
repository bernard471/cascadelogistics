import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function WarehousingPage() {
  const service = {
    id: 9,
    title: "Warehousing",
    description: `Cascade Logistics provides modern, secure, and flexible warehousing and distribution solutions designed to optimize your supply chain in Ghana and key international transit hubs.

We offer short-term and long-term storage facilities equipped with advanced security systems, real-time inventory management, order fulfillment, cross-docking, and repackaging services. Whether you need temporary cargo holding or full-scale distribution management, Cascade Logistics keeps your inventory safe, organized, and ready for dispatch.`,
    image: "/servicesection/service-img5.jpg",
    benefits: [
      {
        icon: "storage",
        title: "Secure Storage Facilities",
        description: "24/7 monitored, climate-controlled warehousing equipped with surveillance and fire protection systems to secure your goods."
      },
      {
        icon: "inventory",
        title: "Inventory Management",
        description: "Comprehensive stock tracking, cycle counting, and real-time inventory visibility to streamline your supply chain operations."
      },
      {
        icon: "fulfillment",
        title: "Order Fulfillment & Distribution",
        description: "Accurate picking, packing, kitting, and distribution services connecting your warehouse stock directly to customers across Ghana."
      }
    ],
    information: [
      {
        title: "Modern Storage Facilities",
        description: "Clean, spacious, and strategically located warehouses in Ghana equipped with loading docks and equipment for seamless handling."
      },
      {
        title: "Cross-Docking & Repackaging",
        description: "Efficient cross-docking services to minimize storage times and lower handling costs for high-turnover cargo."
      },
      {
        title: "Value-Added Logistics Services",
        description: "Custom labeling, order consolidation, quality checks, and protective repacking customized to your business standards."
      }
    ],
    serviceBenefits: [
      {
        title: "Flexible & Scalable Storage",
        description: "Scale your storage space up or down according to seasonal demands without heavy capital investment or long-term lease burdens."
      },
      {
        title: "Enhanced Inventory Visibility",
        description: "Gain clear control over your stock levels with structured inventory reports and real-time tracking of incoming and outgoing goods."
      },
      {
        title: "Reduced Operational Costs",
        description: "Optimize shipping schedules and reduce transport overhead by staging inventory closer to major ports and distribution centers."
      },
      {
        title: "Integrated Logistics Network",
        description: "Seamlessly combine warehousing with Cascade Logistics air, sea, haulage, and courier services for a complete end-to-end solution."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Warehousing" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Warehousing"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
