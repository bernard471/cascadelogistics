import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServiceDetailsSection from "@/components/SecurityServiceDetailsSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Investigation & General Security",
  description: "Protect people, events and property with professional investigations, intelligence gathering, risk assessments and tailored security coverage.",
  path: "/security-services/general-services",
  keywords: ["investigation services Ghana","general security services"],
});

export default function GeneralServicesPage() {
  const service = {
    id: 2,
    title: "General Services",
    description: `Nivamore Courier Services Civil Investigations and Bureau of intelligence provides the finest investigative services with a team of highly trained professionals. We offer comprehensive security solutions tailored to meet your specific needs and requirements.

Our general services encompass a wide range of security solutions including personal protection, event security, property surveillance, and risk assessment. We work with customers to identify security needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for comprehensive security coverage.`,
    image: "/servicesection/service-img2.jpg",
    benefits: [
      {
        icon: "investigation",
        title: "Professional Investigations",
        description: "Our experienced investigators use advanced techniques and technology to conduct thorough investigations, providing you with detailed reports and actionable intelligence."
      },
      {
        icon: "intelligence",
        title: "Intelligence Gathering",
        description: "We specialize in gathering critical intelligence through various methods, helping you make informed decisions about security threats and potential risks."
      },
      {
        icon: "comprehensive",
        title: "Comprehensive Coverage",
        description: "Our general services cover all aspects of security from personal protection to corporate security, ensuring complete coverage for all your security needs."
      }
    ],
    information: [
      {
        title: "Service Range",
        description: "Our general services include personal protection, event security, property surveillance, background checks, risk assessments, and emergency response planning."
      },
      {
        title: "Professional Standards",
        description: "All our security personnel are licensed, bonded, and undergo continuous training to maintain the highest professional standards and stay updated with latest security protocols."
      },
      {
        title: "Custom Solutions",
        description: "We work closely with clients to develop customized security solutions that address specific threats and vulnerabilities unique to their situation or business environment."
      }
    ],
    serviceBenefits: [
      {
        title: "Expert Personnel",
        description: "Our team consists of former law enforcement officers, military veterans, and security professionals with extensive experience in various security disciplines."
      },
      {
        title: "Advanced Technology",
        description: "We utilize cutting-edge security technology and equipment to enhance our services and provide more effective protection for our clients."
      },
      {
        title: "Rapid Response",
        description: "Our emergency response teams are available 24/7 to provide immediate assistance and security support whenever and wherever you need it."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "SERVICE", href: "/security-services" },
    { label: "GENERAL SERVICES" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="General Services"
        crumbs={breadcrumbs}
      />
      <SecurityServiceDetailsSection service={service} />
      <Footer />
    </div>
  );
}
