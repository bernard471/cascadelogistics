import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function ExpressAirFreightPage() {
  const service = {
    id: 3,
    title: "Express Air Shipping",
    description: `Guangzhou Swift Logistics provides express air freight services for the fastest delivery from China to Ghana. Our express air shipping is designed for urgent shipments that require the quickest possible transit times.

Our express air shipping services deliver your goods in just 2-5 days, making it the fastest shipping option available. We handle general goods, special goods (liquid, powder, food), electronics, and battery-powered devices with appropriate care and handling. General goods start from $18 per KG, special goods are $20 per KG, mobile phones are $25 per unit, laptops $30 per KG, tablets $25 per unit, and batteries $20 per unit. Perfect for urgent business needs and time-sensitive cargo.`,
    image: "/logisticssection/expressair.jpg",
    benefits: [
      {
        icon: "speed",
        title: "Ultra-Fast Delivery",
        description: "Express air shipping delivers your goods in just 2-5 days, providing the fastest possible delivery time from China to Ghana for urgent shipments."
      },
      {
        icon: "priority",
        title: "Priority Handling",
        description: "Your express shipments receive priority handling throughout the shipping process, ensuring they are processed and delivered as quickly as possible."
      },
      {
        icon: "reliability",
        title: "Guaranteed Service",
        description: "Our express air shipping service offers reliable and predictable delivery times, perfect for time-sensitive business operations and urgent cargo needs."
      }
    ],
    information: [
      {
        title: "Express Pricing",
        description: "General goods: $18/KG. Special goods (liquid, powder, food): $20/KG. Mobile phones: $25/unit. Laptops: $30/KG. Tablets: $25/unit. Batteries: $20/unit."
      },
      {
        title: "Delivery Time",
        description: "Express air shipping takes 2-5 days for arrival in Ghana, making it the fastest shipping option available for urgent and time-sensitive shipments."
      },
      {
        title: "Cargo Handling",
        description: "We provide specialized handling for various cargo types including electronics, special goods, and battery-powered devices with appropriate safety measures."
      }
    ],
    serviceBenefits: [
      {
        title: "Fastest Delivery",
        description: "With delivery times of just 2-5 days, express air shipping is the fastest option for getting your goods from China to Ghana, perfect for urgent business needs."
      },
      {
        title: "Priority Processing",
        description: "Express shipments receive priority processing and handling at every stage, ensuring your urgent cargo moves through the system as quickly as possible."
      },
      {
        title: "Comprehensive Support",
        description: "Our dedicated team provides 24/7 support for express shipments, with real-time tracking and updates to keep you informed throughout the shipping process."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Express Air Shipping" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Express Air Shipping"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}

