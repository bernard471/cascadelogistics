import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function ProcurementPage() {
  const service = {
    id: 4,
    title: "Procurement & Payment",
    description: `Guangzhou Swift Logistics offers comprehensive procurement and payment services to help you source quality products from China and handle all payment transactions securely.

Our procurement services include finding quality products, negotiating with suppliers on your behalf (including branding if needed), handling payments to Chinese suppliers, consolidating your goods, and preparing them for shipping. We act as your trusted partner in China, ensuring you get the best products at competitive prices while handling all the complexities of international procurement and payment processing.`,
    image: "/logisticssection/logistics-middle.jpg",
    benefits: [
      {
        icon: "sourcing",
        title: "Product Sourcing",
        description: "We help you find quality products from reliable Chinese suppliers, leveraging our extensive network and market knowledge to source the best products at competitive prices."
      },
      {
        icon: "negotiation",
        title: "Supplier Negotiation",
        description: "Our team negotiates with suppliers on your behalf, including branding requirements, ensuring you get the best deals and terms for your procurement needs."
      },
      {
        icon: "payment",
        title: "Secure Payment Processing",
        description: "We handle all payments to your Chinese suppliers securely and efficiently, ensuring smooth transactions and protecting your financial interests throughout the process."
      }
    ],
    information: [
      {
        title: "Procurement Services",
        description: "We help you find quality products, negotiate with suppliers (including branding), handle payments, consolidate goods, and prepare them for shipping to Ghana."
      },
      {
        title: "Payment Options",
        description: "We offer secure payment processing to Chinese suppliers, handling all currency conversions and transaction details to ensure smooth and secure payments."
      },
      {
        title: "Consolidation",
        description: "We consolidate your goods from multiple suppliers into single shipments, reducing costs and simplifying the logistics process for your business."
      }
    ],
    serviceBenefits: [
      {
        title: "Expert Sourcing",
        description: "Our team has extensive knowledge of Chinese markets and suppliers, helping you find quality products at competitive prices while ensuring reliability and quality standards."
      },
      {
        title: "Supplier Management",
        description: "We handle all supplier communications, negotiations, and relationship management, including branding requirements, saving you time and ensuring professional interactions."
      },
      {
        title: "End-to-End Service",
        description: "From product sourcing to payment processing, consolidation, and shipping preparation, we provide a complete procurement solution that simplifies your supply chain."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Procurement & Payment" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Procurement & Payment"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}

