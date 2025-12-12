import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function SeaCargoPage() {
  const service = {
    id: 2,
    title: "Sea Cargo",
    description: `Cascade Logistics provides cost-effective sea freight services from Turkey to Ghana. Our sea cargo solutions are designed for businesses and individuals who need economical shipping options for larger shipments.

We offer comprehensive sea freight services with all packages including freight and custom clearance, ensuring a seamless shipping experience. Our experienced team ensures your goods are handled with care and delivered to your location in Ghana within 35-45 days. Sea cargo is ideal for heavy items, bulk shipments, and cost-conscious shippers who don't require urgent delivery.`,
    image: "/logisticssection/seashipping.jpeg",
    benefits: [
      {
        icon: "cost",
        title: "Cost-Effective",
        description: "Sea cargo provides the most economical shipping option for larger shipments, making it ideal for businesses shipping bulk goods or heavy items from Turkey to Ghana."
      },
      {
        icon: "capacity",
        title: "Heavy Cargo Support",
        description: "Our sea cargo service can handle heavy and oversized items that may not be suitable for air freight, providing flexibility for various cargo types."
      },
      {
        icon: "reliability",
        title: "Full Service Included",
        description: "All sea cargo shipments include freight and custom clearance, providing a complete end-to-end service without hidden fees or additional charges."
      }
    ],
    information: [
      {
        title: "Delivery Time",
        description: "Sea cargo typically takes 35-45 days for arrival in Ghana from Turkey, making it ideal for non-urgent shipments and cost-effective bulk shipping."
      },
      {
        title: "Route Coverage",
        description: "We offer sea cargo services from Turkey to Ghana, with all packages including freight and custom clearance for a complete shipping solution."
      },
      {
        title: "Cargo Types",
        description: "We handle various cargo types including general goods, heavy items, bulk shipments, and other items suitable for sea transport with full service support."
      }
    ],
    serviceBenefits: [
      {
        title: "Economical Shipping",
        description: "Sea cargo offers the most cost-effective shipping option for larger shipments, making it perfect for businesses looking to minimize shipping costs while maintaining quality service."
      },
      {
        title: "Heavy Cargo Handling",
        description: "Our sea cargo service can accommodate heavy and oversized items that may not be suitable for air freight, providing flexibility for various cargo requirements."
      },
      {
        title: "Complete Service Package",
        description: "All sea cargo shipments include freight and custom clearance, ensuring a hassle-free shipping experience with no hidden fees or additional charges."
      },
      {
        title: "Reliable Service",
        description: "We work with trusted shipping partners to ensure reliable sea cargo service from Turkey to Ghana, with consistent delivery times and professional handling."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Sea Cargo" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Sea Cargo"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
