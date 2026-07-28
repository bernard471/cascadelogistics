import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function WarehouseAndDistributionPage() {
  const service = {
    id: 5,
    title: "Warehouse and Distribution",
    description: `We provide warehouse and distribution services to our clients. We will help you assess your warehouse and distribution needs and work with you to develop a comprehensive logistics plan to meet your storage and fulfillment objectives. At Cascade Logistics, we understand the critical role of efficient warehousing in modern supply chains.

Our warehouse and distribution services include storage, inventory management, order fulfillment, cross-docking, and value-added services. We work with customers to identify logistics needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for warehouse operations and safety regulations.`,
    image: "/servicesection/service-img5.jpg",
    benefits: [
      {
        icon: "storage",
        title: "Secure Storage",
        description: "Our modern warehouses provide secure, climate-controlled storage facilities with advanced security systems to protect your inventory and valuable goods."
      },
      {
        icon: "inventory",
        title: "Inventory Management",
        description: "We offer comprehensive inventory management services including real-time tracking, cycle counting, and automated replenishment systems."
      },
      {
        icon: "fulfillment",
        title: "Order Fulfillment",
        description: "Our efficient order fulfillment services ensure accurate picking, packing, and shipping of orders to meet customer delivery expectations."
      }
    ],
    information: [
      {
        title: "Facility Features",
        description: "Our warehouses feature modern amenities including climate control, security systems, loading docks, and specialized storage areas for different product types."
      },
      {
        title: "Technology Integration",
        description: "We utilize advanced warehouse management systems (WMS) and inventory tracking technology to provide real-time visibility and control over your inventory."
      },
      {
        title: "Value-Added Services",
        description: "We offer value-added services including labeling, kitting, assembly, quality control, and packaging customization to meet specific client requirements."
      }
    ],
    serviceBenefits: [
      {
        title: "Scalable Solutions",
        description: "Our warehouse and distribution services can scale up or down based on your business needs, providing flexibility during peak seasons or business growth."
      },
      {
        title: "Cross-Docking",
        description: "We provide cross-docking services to minimize storage time and reduce costs by transferring goods directly from inbound to outbound transportation."
      },
      {
        title: "Distribution Network",
        description: "Our strategic distribution network ensures efficient delivery to your customers with optimized routes and multiple fulfillment centers for faster service."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "LOGISTICS SERVICES", href: "/logistics-services" },
    { label: "WAREHOUSE AND DISTRIBUTION" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Warehouse and Distribution"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
