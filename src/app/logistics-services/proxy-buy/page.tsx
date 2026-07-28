import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function ProxyBuyPage() {
  const service = {
    id: 6,
    title: "Door to Door Service",
    description: `Cascade Logistics provides convenient Door to Door services, allowing you to shop from USA stores and have items shipped directly to you in Ghana. Our Door to Door service handles all aspects of your purchase and shipping needs.

We offer comprehensive Door to Door services where you can shop from any USA store, and we'll handle the purchase, receive the items at our USA warehouse, and ship them directly to you in Ghana. This service is perfect for accessing products not available in Ghana or taking advantage of USA store sales and promotions. Our team ensures secure handling of your purchases and provides transparent tracking throughout the process.`,
    image: "/logisticssection/logistics-middle.jpg",
    benefits: [
      {
        icon: "convenience",
        title: "USA Shopping Access",
        description: "Shop from any USA store and have items shipped directly to you in Ghana, giving you access to products not available locally or better prices."
      },
      {
        icon: "direct-shipping",
        title: "Direct Shipping",
        description: "We receive your purchases at our USA warehouse and ship them directly to you in Ghana, providing a seamless shopping and shipping experience."
      },
      {
        icon: "handling",
        title: "Purchase Handling",
        description: "Our team handles all aspects of your purchase including payment processing, receiving items, and coordinating shipment to Ghana."
      }
    ],
    information: [
      {
        title: "Shopping Process",
        description: "You shop from any USA store, provide us with the details, and we handle the purchase, payment, and receipt of items at our USA warehouse for shipment to Ghana."
      },
      {
        title: "USA Warehouse",
        description: "We have a USA warehouse where we receive your purchases, inspect items, and prepare them for shipment to Ghana with our twice-weekly shipping service."
      },
      {
        title: "Shipping Integration",
        description: "Your purchases are integrated with our USA shipping service, which operates twice weekly (Thursday & Sunday) with guaranteed 1-week pickup in Ghana."
      }
    ],
    serviceBenefits: [
      {
        title: "Access to USA Stores",
        description: "Shop from any USA store and have items shipped directly to you in Ghana, giving you access to products not available locally or better prices and promotions."
      },
      {
        title: "Complete Purchase Handling",
        description: "Our team handles all aspects of your purchase including payment processing, receiving items at our USA warehouse, and coordinating shipment to Ghana."
      },
      {
        title: "Twice Weekly Shipping",
        description: "Your purchases are integrated with our USA shipping service, which operates twice weekly (Thursday & Sunday) with guaranteed 1-week pickup in Ghana."
      },
      {
        title: "Transparent Process",
        description: "Get photos of items received, packed, and tracking sent before flight, providing complete transparency throughout the purchase and shipping process."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Door to Door Service" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Door to Dooroor Service"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}

