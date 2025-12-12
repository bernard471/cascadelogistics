import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServiceDetailsSection from "@/components/SecurityServiceDetailsSection";
import Footer from "@/components/Footer";

export default function CounterSurveillancePage() {
  const service = {
    id: 3,
    title: "Counter Surveillance",
    description: `We also undertake Counter Surveillance and Close Circuit TV Surveillance. At Nivamore Courier Services, we specialize in detecting and neutralizing surveillance threats to protect your privacy and security. Our expert team uses advanced detection equipment and techniques to identify potential surveillance activities.

Our counter surveillance services help protect individuals and organizations from unauthorized monitoring, espionage, and privacy violations. We work with customers to identify security needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for privacy protection.`,
    image: "/servicesection/service-img3.jpg",
    benefits: [
      {
        icon: "detection",
        title: "Advanced Detection",
        description: "We use state-of-the-art equipment to detect hidden cameras, listening devices, GPS trackers, and other surveillance equipment that may compromise your privacy."
      },
      {
        icon: "protection",
        title: "Privacy Protection",
        description: "Our services ensure your conversations, meetings, and sensitive activities remain private and protected from unauthorized surveillance and monitoring."
      },
      {
        icon: "neutralization",
        title: "Threat Neutralization",
        description: "We not only detect surveillance threats but also provide solutions to neutralize them and prevent future unauthorized monitoring of your activities."
      }
    ],
    information: [
      {
        title: "Detection Methods",
        description: "Our counter surveillance techniques include RF signal detection, thermal imaging, physical sweeps, and electronic countermeasures to identify all types of surveillance devices."
      },
      {
        title: "Regular Sweeps",
        description: "We recommend regular counter surveillance sweeps of offices, vehicles, and meeting rooms to ensure ongoing protection against evolving surveillance threats."
      },
      {
        title: "Training Programs",
        description: "We provide training to your security team on basic counter surveillance techniques and awareness to help maintain ongoing protection against surveillance threats."
      }
    ],
    serviceBenefits: [
      {
        title: "Comprehensive Sweeps",
        description: "Our thorough counter surveillance sweeps cover all areas including offices, vehicles, meeting rooms, and personal spaces to ensure complete protection."
      },
      {
        title: "Expert Analysis",
        description: "Our specialists analyze detected threats and provide detailed reports on potential security vulnerabilities and recommended protective measures."
      },
      {
        title: "Ongoing Monitoring",
        description: "We offer continuous monitoring services to detect new surveillance threats as they emerge and provide immediate response to protect your privacy."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "SERVICE", href: "/security-services" },
    { label: "COUNTER SURVEILLANCE" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Counter Surveillance"
        crumbs={breadcrumbs}
      />
      <SecurityServiceDetailsSection service={service} />
      <Footer />
    </div>
  );
}
