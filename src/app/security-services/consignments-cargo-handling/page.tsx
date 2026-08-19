import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServiceDetailsSection from "@/components/SecurityServiceDetailsSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Secure Cargo Handling",
  description: "Protect consignments with cargo screening, secure transport, documented chain of custody, regulatory compliance and emergency response.",
  path: "/security-services/consignments-cargo-handling",
  keywords: ["secure cargo handling Ghana","consignment security"],
});

export default function ConsignmentsCargoHandlingPage() {
  const service = {
    id: 5,
    title: "Consignments/Cargo Handling",
    description: `The carriage of cargo is getting progressively significant in the general airline industry, and we provide specialized security services for cargo and consignment handling. At Nivamore Courier Services, we understand the critical importance of secure cargo transportation and offer comprehensive security solutions for all types of shipments.

Our cargo handling security services include cargo screening, secure transportation, warehouse security, and customs compliance. We work with customers to identify security needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for cargo security and transportation safety.`,
    image: "/servicesection/service-img5.jpg",
    benefits: [
      {
        icon: "screening",
        title: "Advanced Cargo Screening",
        description: "We use state-of-the-art screening technology to inspect cargo for contraband, explosives, and other security threats before transportation and storage."
      },
      {
        icon: "secure-transport",
        title: "Secure Transportation",
        description: "Our secure transportation services ensure your cargo is protected throughout its journey with armed escorts and specialized security vehicles."
      },
      {
        icon: "compliance",
        title: "Regulatory Compliance",
        description: "We ensure all cargo handling procedures meet international security standards and regulatory requirements for safe and legal transportation."
      }
    ],
    information: [
      {
        title: "Cargo Types",
        description: "We handle various types of cargo including general merchandise, hazardous materials, high-value items, and sensitive documents with appropriate security measures."
      },
      {
        title: "Security Protocols",
        description: "Our cargo security protocols include background checks for personnel, secure access controls, and continuous monitoring throughout the handling process."
      },
      {
        title: "Documentation",
        description: "After the withdrawal of the goods, the customer receives a withdrawal document, which serves as the basis for invoicing (i.e. the customer receives an invoice according to the information recorded on the withdrawal document)."
      }
    ],
    serviceBenefits: [
      {
        title: "Risk Mitigation",
        description: "Our comprehensive security measures significantly reduce the risk of theft, damage, or tampering with cargo during handling and transportation."
      },
      {
        title: "Chain of Custody",
        description: "We maintain a secure chain of custody for all cargo, ensuring accountability and traceability from origin to final destination."
      },
      {
        title: "Emergency Response",
        description: "Our security teams are trained to respond quickly to any security incidents involving cargo, minimizing potential losses and ensuring safety."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "SERVICE", href: "/security-services" },
    { label: "CONSIGNMENTS/CARGO HANDLING" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Consignments/Cargo Handling"
        crumbs={breadcrumbs}
      />
      <SecurityServiceDetailsSection service={service} />
      <Footer />
    </div>
  );
}
