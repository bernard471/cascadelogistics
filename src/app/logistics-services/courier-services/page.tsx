import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function CourierServicesPage() {
  const service = {
    id: 8,
    title: "Courier Services",
    description: `When it comes to sending urgent documents, business packages, or high-value parcels, speed and reliability are paramount. At Cascade Logistics, we specialize in providing fast, secure, and dependable express courier services for both domestic and international shipments.

As a fully licensed member of the Postal and Courier Services Regulatory Commission (PCSRC) of Ghana, we adhere to the highest standards of service and security. Whether you need to send items from the USA, UK, China, or other countries, our rapid dispatch system, door-to-door pickup and delivery, real-time shipment tracking, and dedicated customer support ensure your parcels arrive safely and on time.

Open an account with Cascade Logistics today and enjoy seamless, fast shipping from abroad to Ghana. Let us help you streamline your logistics with a service you can trust.`,
    image: "/logisticssection/expressair.jpg",
    benefits: [
      {
        icon: "speed",
        title: "Express Delivery",
        description: "Priority handling and rapid transit times for urgent documents and parcel deliveries both locally and internationally."
      },
      {
        icon: "door-to-door",
        title: "Door-to-Door Service",
        description: "Convenient pickup from your doorstep and direct delivery to the recipient's exact address with proof of delivery."
      },
      {
        icon: "tracking",
        title: "Real-Time Tracking",
        description: "Complete visibility of your courier package at every stage with instant tracking updates and notifications."
      }
    ],
    information: [
      {
        title: "Parcel & Document Handling",
        description: "Specialized handling for sensitive documents, legal papers, e-commerce parcels, and time-sensitive materials."
      },
      {
        title: "Flexible Pickup Schedules",
        description: "Schedule convenient pickup times that match your daily business or personal routine across major metropolitan areas."
      },
      {
        title: "Secure Packaging & Proof of Delivery",
        description: "Tamper-evident packaging and digital signature verification on delivery for absolute security and peace of mind."
      }
    ],
    serviceBenefits: [
      {
        title: "Fastest Transit Times",
        description: "Our priority courier network ensures your urgent parcels and documents reach their destination in the shortest possible timeframe."
      },
      {
        title: "End-to-End Convenience",
        description: "From door pickup to final recipient delivery, Cascade Logistics takes care of every detail so you don't have to worry."
      },
      {
        title: "Transparent & Competitive Pricing",
        description: "Clear, upfront courier rates with no hidden fees, providing high value for both individual and commercial shipments."
      },
      {
        title: "Dedicated Courier Customer Care",
        description: "Our responsive customer care team keeps you updated and resolves any delivery inquiries instantly."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Courier Services" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Courier Services"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
