import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Pre-Shipment Quality Inspections",
  description: "Verify products before they leave China with pre-shipment inspections, defect checks, compliance reviews and clear quality reports.",
  path: "/logistics-services/quality-checks",
  keywords: ["quality inspection China", "pre shipment inspection Ghana"],
});

export default function QualityChecksPage() {
  const service = {
    id: 5,
    title: "Quality Checks",
    description: `Guangzhou Swift Logistics provides comprehensive quality inspection services to ensure your goods meet the highest standards before shipping from anywhere Globally to Ghana.

Our quality check services include pre-shipment inspections, detailed quality reports, defect detection, and compliance verification. We inspect your products for quality, quantity, functionality, and compliance with your specifications and industry standards. Our experienced quality control team ensures that only goods meeting your requirements are shipped, giving you peace of mind and protecting your business reputation. Quality checks are included in our service to ensure your satisfaction.`,
    image: "/logisticssection/quality.avif",
    benefits: [
      {
        icon: "inspection",
        title: "Pre-Shipment Inspection",
        description: "We conduct thorough pre-shipment inspections to verify product quality, quantity, and compliance before your goods leave China, ensuring you receive exactly what you ordered."
      },
      {
        icon: "reports",
        title: "Detailed Quality Reports",
        description: "Our quality control team provides comprehensive inspection reports with photos and detailed findings, giving you complete visibility into your product quality before shipping."
      },
      {
        icon: "compliance",
        title: "Compliance Verification",
        description: "We verify that your products meet all specified requirements, industry standards, and compliance regulations, ensuring your goods are ready for import into Ghana."
      }
    ],
    information: [
      {
        title: "Inspection Services",
        description: "We provide comprehensive quality inspections including visual inspection, functional testing, quantity verification, packaging checks, and compliance verification before shipping."
      },
      {
        title: "Quality Reports",
        description: "Our detailed quality reports include photos, defect documentation, compliance status, and recommendations, providing you with complete transparency about your product quality."
      },
      {
        title: "Defect Detection",
        description: "Our experienced inspectors identify defects, non-conformities, and quality issues early, allowing suppliers to address problems before shipment and protecting your interests."
      }
    ],
    serviceBenefits: [
      {
        title: "Comprehensive Inspection",
        description: "Our quality checks cover all aspects of your products including appearance, functionality, quantity, packaging, and compliance, ensuring comprehensive quality assurance."
      },
      {
        title: "Early Problem Detection",
        description: "By identifying quality issues before shipment, we help you avoid costly problems and delays, ensuring only quality goods are shipped to Ghana."
      },
      {
        title: "Peace of Mind",
        description: "With our quality inspection services, you can be confident that your goods meet your standards and requirements before they leave China, protecting your business reputation."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Quality Checks" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Quality Checks"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
