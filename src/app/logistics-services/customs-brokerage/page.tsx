import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function CustomsBrokeragePage() {
  const service = {
    id: 4,
    title: "Customs Brokerage",
    description: `We provide customs brokerage services to our clients. We will help you assess your customs brokerage needs and work with you to develop a comprehensive compliance plan to meet your import/export objectives. At Nivamore Courier Services, we understand the complexities of international trade regulations and customs procedures.

Our customs brokerage services include import/export documentation, duty calculation, customs clearance, and regulatory compliance. We work with customers to identify logistics needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for international trade and customs regulations.`,
    image: "/servicesection/service-img4.jpg",
    benefits: [
      {
        icon: "expertise",
        title: "Regulatory Expertise",
        description: "Our customs brokers have extensive knowledge of international trade regulations, tariff classifications, and customs procedures to ensure smooth clearance."
      },
      {
        icon: "compliance",
        title: "Full Compliance",
        description: "We ensure all shipments comply with relevant customs regulations, trade agreements, and security requirements to avoid delays and penalties."
      },
      {
        icon: "cost-optimization",
        title: "Duty Optimization",
        description: "Our experts help optimize duty payments through proper classification, free trade agreements, and duty drawback programs to minimize costs."
      }
    ],
    information: [
      {
        title: "Documentation Services",
        description: "We handle all required customs documentation including commercial invoices, packing lists, certificates of origin, and import/export declarations."
      },
      {
        title: "Tariff Classification",
        description: "Our experts provide accurate tariff classification services to ensure proper duty rates and compliance with customs regulations."
      },
      {
        title: "Trade Programs",
        description: "We help clients take advantage of various trade programs including free trade agreements, duty drawback, and preferential tariff programs."
      }
    ],
    serviceBenefits: [
      {
        title: "Fast Clearance",
        description: "Our efficient customs clearance processes minimize delays and ensure your shipments clear customs quickly, reducing storage costs and improving delivery times."
      },
      {
        title: "Risk Management",
        description: "We help identify and mitigate customs-related risks including compliance issues, duty assessments, and regulatory changes that could affect your shipments."
      },
      {
        title: "Audit Support",
        description: "We provide comprehensive audit support and record-keeping services to help you maintain compliance and respond to customs inquiries or audits."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "LOGISTICS SERVICES", href: "/logistics-services" },
    { label: "CUSTOMS BROKERAGE" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Customs Brokerage"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
