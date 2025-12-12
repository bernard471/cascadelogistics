import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function ConsolidationPage() {
  const service = {
    id: 5,
    title: "Package Consolidation",
    description: `Cascade Logistics provides efficient package consolidation services to help you save on shipping costs. Our consolidation service combines multiple packages into one shipment, reducing overall shipping expenses.

We offer comprehensive package consolidation with efficient packing, repackaging when needed, and careful handling of all items. Our experienced team ensures all your packages are properly consolidated, securely packed, and ready for shipment. This service is perfect for individuals and businesses shipping multiple items, allowing you to maximize cost savings while maintaining quality service.`,
    image: "/logisticssection/consolidation.jpg",
    benefits: [
      {
        icon: "savings",
        title: "Cost Savings",
        description: "Package consolidation helps you save significantly on shipping costs by combining multiple packages into one shipment, reducing overall shipping expenses."
      },
      {
        icon: "efficiency",
        title: "Efficient Packing",
        description: "Our team efficiently packs and consolidates multiple packages, ensuring optimal use of space and secure packaging for all items."
      },
      {
        icon: "convenience",
        title: "Multiple Packages",
        description: "We can consolidate multiple packages from different sources into one shipment, making it convenient for you to ship various items together."
      }
    ],
    information: [
      {
        title: "Consolidation Process",
        description: "We receive your multiple packages, carefully inspect and consolidate them into one shipment, ensuring optimal packing and secure handling throughout the process."
      },
      {
        title: "Repackaging Services",
        description: "When needed, we repackage items to optimize space and ensure secure shipping, reducing overall shipping costs while maintaining item safety."
      },
      {
        title: "Cost Efficiency",
        description: "By consolidating multiple packages into one shipment, you save on shipping costs while maintaining quality service and secure handling of all items."
      }
    ],
    serviceBenefits: [
      {
        title: "Significant Cost Savings",
        description: "Package consolidation helps you save significantly on shipping costs by combining multiple packages into one shipment, reducing overall shipping expenses while maintaining quality service."
      },
      {
        title: "Efficient Space Utilization",
        description: "Our team efficiently packs and consolidates multiple packages, ensuring optimal use of space and secure packaging for all items to maximize cost efficiency."
      },
      {
        title: "Multiple Source Consolidation",
        description: "We can consolidate multiple packages from different sources into one shipment, making it convenient for you to ship various items together from different origins."
      },
      {
        title: "Professional Repackaging",
        description: "When needed, we repackage items to optimize space and ensure secure shipping, reducing overall shipping costs while maintaining item safety and quality."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Package Consolidation" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Package Consolidation"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}

