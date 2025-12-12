import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServiceDetailsSection from "@/components/SecurityServiceDetailsSection";
import Footer from "@/components/Footer";

export default function SafeKeepingPage() {
  const service = {
    id: 1,
    title: "Safe Keeping",
    description: `We protect valuable assets such as Money, Gold, Diamond, and valuable documents with the highest level of security and confidentiality. At Nivamore Courier Services, we understand that your valuables are irreplaceable and require specialized protection.

Our safe keeping services utilize state-of-the-art security systems, including biometric access controls, 24/7 monitoring, and climate-controlled storage facilities. We work with customers to identify security needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for asset protection.`,
    image: "/servicesection/service-img1.jpg",
    benefits: [
      {
        icon: "security",
        title: "Maximum Security",
        description: "Our facilities feature multiple layers of security including biometric access, 24/7 surveillance, and armed guards to ensure your valuables are protected at all times."
      },
      {
        icon: "confidentiality",
        title: "Complete Confidentiality",
        description: "We maintain strict confidentiality protocols and non-disclosure agreements to ensure your assets and their locations remain completely private and secure."
      },
      {
        icon: "insurance",
        title: "Fully Insured",
        description: "All stored items are covered by comprehensive insurance policies, providing you with complete peace of mind and financial protection for your valuable assets."
      }
    ],
    information: [
      {
        title: "Asset Types",
        description: "We accept various types of valuable assets including precious metals, jewelry, important documents, cash, artwork, and other high-value items that require specialized security measures."
      },
      {
        title: "Storage Conditions",
        description: "Our climate-controlled facilities maintain optimal temperature and humidity levels to preserve the condition of your valuable items, especially important for documents and artwork."
      },
      {
        title: "Access Procedures",
        description: "Access to stored items requires multiple levels of authorization, including biometric verification and scheduled appointments to ensure maximum security and accountability."
      }
    ],
    serviceBenefits: [
      {
        title: "24/7 Monitoring",
        description: "Your valuable assets are monitored around the clock by trained security personnel and advanced surveillance systems, ensuring immediate response to any security concerns."
      },
      {
        title: "Secure Storage",
        description: "Our specialized storage facilities are designed with bank-level security features including reinforced walls, multiple access controls, and redundant security systems."
      },
      {
        title: "Regular Audits",
        description: "We conduct regular security audits and inventory checks to ensure all stored items remain secure and accounted for, providing you with detailed reports on request."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "SERVICE", href: "/security-services" },
    { label: "SAFE KEEPING" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Safe Keeping"
        crumbs={breadcrumbs}
      />
      <SecurityServiceDetailsSection service={service} />
      <Footer />
    </div>
  );
}
