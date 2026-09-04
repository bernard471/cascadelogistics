import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Air Freight Globally to Ghana",
  description: "Fast, reliable air freight Globally to Ghana with secure cargo handling, competitive rates and delivery to Accra or Kumasi.",
  path: "/logistics-services/air-freight",
  keywords: ["air freight Globally to Ghana", "air cargo Ghana"],
});

export default function AirFreightPage() {
  const service = {
    id: 1,
    title: "Air Shipping",
    description: `Guangzhou Swift Logistics provides reliable and efficient air freight services Globally to Ghana. Our air shipping solutions are designed for businesses and individuals who need faster delivery times for their shipments.

We offer comprehensive air freight services including standard air cargo, express delivery options, and specialized handling for various cargo types. Our experienced team ensures your goods are handled with care and delivered to your warehouse in Accra or Kumasi within 10-14 days. We work with trusted airline partners to provide competitive rates and reliable service for all your air shipping needs.`,
    image: "/logisticssection/airshipping.jpg",
    benefits: [
      {
        icon: "speed",
        title: "Fast Delivery",
        description: "Air shipping provides the fastest delivery times, with shipments arriving in Ghana within 10-14 days, perfect for urgent cargo and time-sensitive goods."
      },
      {
        icon: "reliability",
        title: "Reliable Service",
        description: "Our air freight services offer high reliability with scheduled departures and arrivals, providing predictable delivery times for your logistics planning."
      },
      {
        icon: "global-reach",
        title: "Secure Handling",
        description: "We ensure secure handling of your goods throughout the air freight process, with proper packaging and tracking from pickup to final delivery."
      }
    ],
    information: [
      {
        title: "Pricing Structure",
        description: "General goods start from $18 per KG. Special goods (liquid, powder, food) are $20 per KG. Mobile phones are $25 per unit, laptops $30 per KG, tablets $25 per unit, and batteries $20 per unit."
      },
      {
        title: "Delivery Time",
        description: "Air shipping typically takes 10-14 days for arrival in Ghana, making it ideal for urgent shipments and time-sensitive cargo."
      },
      {
        title: "Cargo Types",
        description: "We handle various cargo types including general goods, electronics, special goods (food, powder, liquid), and battery-powered devices with appropriate handling procedures."
      }
    ],
    serviceBenefits: [
      {
        title: "Competitive Rates",
        description: "Our air shipping rates start from $18 per KG for general goods, offering competitive pricing for fast delivery Globally to Ghana."
      },
      {
        title: "Fast Transit Times",
        description: "With delivery times of 10-14 days, air shipping is the fastest option for getting your goods from anywhere to Ghana, perfect for urgent business needs."
      },
      {
        title: "Comprehensive Support",
        description: "Our team provides end-to-end support including booking, documentation, tracking, and delivery coordination to ensure a smooth shipping experience."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Air Shipping" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Air Freight"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
