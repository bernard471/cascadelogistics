import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function AirShipmentsPage() {
  const service = {
    id: 1,
    title: "Air Shipments",
    description: `Cascade Logistics provides fast and reliable air cargo services globally to Ghana. Our air shipment solutions are designed for businesses and individuals who need faster delivery times for their shipments.

We offer comprehensive air freight services with multiple routes connecting major global markets to Ghana. All our air shipments include freight and custom clearance, ensuring a seamless shipping experience. Our experienced team ensures your goods are handled with care and delivered to your location in Ghana within 7-10 days. We work with trusted airline partners to provide reliable service for all your air shipping needs.`,
    image: "/logisticssection/airshipping.jpg",
    benefits: [
      {
        icon: "speed",
        title: "Fast Delivery",
        description: "Air shipments provide fast delivery times, with packages arriving in Ghana within 7-10 days globally, perfect for urgent cargo and time-sensitive goods."
      },
      {
        icon: "reliability",
        title: "Multiple Routes",
        description: "We offer air cargo services from multiple origins including UK, China, USA, and Turkey, giving you flexibility in choosing the best route for your needs."
      },
      {
        icon: "global-reach",
        title: "Full Service Included",
        description: "All air shipments include freight and custom clearance, providing a complete end-to-end service without hidden fees or additional charges."
      }
    ],
    information: [
      {
        title: "Delivery Time",
        description: "Air shipments typically take 7-10 days for arrival in Ghana globally, making it ideal for urgent shipments and time-sensitive cargo."
      },
      {
        title: "Service Coverage",
        description: "We handle air cargo from multiple origins including UK, China, USA, and Turkey to Ghana, with all packages including freight and custom clearance."
      },
      {
        title: "Cargo Types",
        description: "We handle various cargo types including general goods, electronics, and other items with appropriate handling procedures and full service support."
      }
    ],
    serviceBenefits: [
      {
        title: "Fast Transit Times",
        description: "With delivery times of 7-10 days, air shipments are the fastest option for getting your goods globally to Ghana, perfect for urgent business needs."
      },
      {
        title: "Multiple Origin Points",
        description: "We offer air cargo services globally, giving you flexibility to ship from the location most convenient for your business."
      },
      {
        title: "Complete Service Package",
        description: "All air shipments include freight and custom clearance, ensuring a hassle-free shipping experience with no hidden fees or additional charges."
      },
      {
        title: "Transparent Tracking",
        description: "Get real-time updates on your shipment status with our transparent tracking system, keeping you informed throughout the entire shipping process."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Air Shipments" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Air Shipments"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}

