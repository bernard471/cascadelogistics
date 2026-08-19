import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sea Shipping from China to Ghana",
  description: "Send large shipments from China to Ghana with affordable sea freight, groupage and full-container options, customs support and reliable delivery.",
  path: "/logistics-services/sea-shipping",
  keywords: ["sea shipping China to Ghana","container shipping Ghana"],
});

export default function SeaShippingPage() {
  const service = {
    id: 2,
    title: "Sea Shipping",
    description: `Guangzhou Swift Logistics offers cost-effective sea freight services from China to Ghana. Our sea shipping solutions are ideal for larger shipments and businesses looking for economical transportation options.

We provide comprehensive sea shipping services including full container options, group shipping (consolidation), and specialized handling for various cargo types. Normal goods are shipped at $240 per CBM to Accra warehouse and $260 per CBM to Kumasi. Special goods (food, powder, liquid) are $260 per CBM, and battery goods are $280 per CBM to Accra. Each CBM has a maximum weight of 500kg. Sea shipping typically takes 35-45 days for arrival, making it the most cost-effective option for non-urgent shipments.`,
    image: "/logisticssection/seashipping.jpeg",
    benefits: [
      {
        icon: "cost-effective",
        title: "Cost-Effective",
        description: "Sea shipping offers the most economical transportation option, with rates starting from $240 per CBM, making it ideal for large shipments and bulk cargo."
      },
      {
        icon: "capacity",
        title: "Large Capacity",
        description: "Sea freight can handle large volumes and heavy cargo, with each CBM supporting up to 500kg, perfect for bulk shipments and oversized items."
      },
      {
        icon: "flexibility",
        title: "Flexible Options",
        description: "We offer both full container and group shipping options, allowing you to choose the most cost-effective solution based on your shipment size."
      }
    ],
    information: [
      {
        title: "Pricing Structure",
        description: "Normal goods: $240/CBM to Accra, $260/CBM to Kumasi. Special goods (food, powder, liquid): $260/CBM. Battery goods: $280/CBM to Accra. Each CBM has a maximum weight of 500kg."
      },
      {
        title: "Delivery Time",
        description: "Sea shipping takes 35-45 days for arrival in Ghana, making it perfect for non-urgent shipments and bulk cargo that doesn't require immediate delivery."
      },
      {
        title: "Service Options",
        description: "We offer full container shipping for large shipments and group shipping (consolidation) for smaller orders, allowing you to share container space and reduce costs."
      }
    ],
    serviceBenefits: [
      {
        title: "Competitive Pricing",
        description: "Our sea shipping rates are highly competitive, starting from $240 per CBM to Accra warehouse, providing the most cost-effective shipping solution from China to Ghana."
      },
      {
        title: "Full & Group Shipping",
        description: "Choose between full container shipping for large shipments or group shipping for smaller orders, giving you flexibility and cost savings based on your needs."
      },
      {
        title: "Reliable Delivery",
        description: "With 35-45 day delivery times and our established shipping routes, you can count on reliable and predictable delivery schedules for your sea freight shipments."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Sea Shipping" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Sea Shipping"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
