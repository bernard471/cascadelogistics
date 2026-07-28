import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function ClearingCustomsPage() {
  const service = {
    id: 3,
    title: "Customs Brokerage & Clearance",
    description: `Cascade Logistics provides comprehensive clearing and customs processing services for all your shipments. Our expert team handles all documentation and ensures smooth clearance for your shipments entering Ghana.

We specialize in navigating the complexities of customs procedures, ensuring your goods clear customs efficiently and without delays. Our experienced customs team understands the requirements and regulations, providing expert handling for all types of cargo. We handle all necessary documentation, compliance checks, and coordination with customs authorities to ensure a seamless clearance process.`,
    image: "/logisticssection/expressair.jpg",
    benefits: [
      {
        icon: "expertise",
        title: "Expert Handling",
        description: "Our experienced customs team understands all requirements and regulations, providing expert handling for all types of cargo to ensure smooth clearance."
      },
      {
        icon: "documentation",
        title: "Complete Documentation",
        description: "We handle all necessary documentation including import permits, customs declarations, and compliance certificates, ensuring your shipment meets all requirements."
      },
      {
        icon: "efficiency",
        title: "Fast Processing",
        description: "Our streamlined customs processing ensures quick clearance times, minimizing delays and getting your goods to you faster."
      }
    ],
    information: [
      {
        title: "Documentation Services",
        description: "We handle all necessary documentation including import permits, customs declarations, compliance certificates, and other required paperwork for smooth customs clearance."
      },
      {
        title: "Compliance Assurance",
        description: "Our team ensures all shipments meet Ghana's customs regulations and compliance requirements, preventing delays and ensuring smooth clearance processes."
      },
      {
        title: "Expert Coordination",
        description: "We coordinate directly with customs authorities on your behalf, handling all communications and ensuring your shipment clears customs efficiently."
      }
    ],
    serviceBenefits: [
      {
        title: "Expert Customs Knowledge",
        description: "Our experienced team understands all customs requirements and regulations, ensuring your shipments clear customs efficiently without unnecessary delays or complications."
      },
      {
        title: "Complete Documentation Support",
        description: "We handle all necessary documentation including import permits, customs declarations, and compliance certificates, ensuring your shipment meets all requirements."
      },
      {
        title: "Streamlined Process",
        description: "Our streamlined customs processing ensures quick clearance times, minimizing delays and getting your goods to you faster with professional handling throughout."
      },
      {
        title: "Compliance Guarantee",
        description: "We ensure all shipments meet Ghana's customs regulations and compliance requirements, preventing delays and ensuring smooth clearance processes for all cargo types."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Customs Brokerage & Clearance" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Customs Brokerage & Clearance"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}

