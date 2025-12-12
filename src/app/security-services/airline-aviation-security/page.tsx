import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServiceDetailsSection from "@/components/SecurityServiceDetailsSection";
import Footer from "@/components/Footer";

export default function AirlineAviationSecurityPage() {
  const service = {
    id: 6,
    title: "Airline / Aviation Security",
    description: `The recent upsurge of global terrorism especially on airlines and their operations has made aviation security more critical than ever. At Nivamore Courier Services, we provide comprehensive aviation security services to protect passengers, crew, aircraft, and airport facilities from security threats.

Our aviation security services include passenger screening, baggage inspection, aircraft security, and airport perimeter protection. We work with customers to identify security needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for aviation security compliance.`,
    image: "/servicesection/service-img6.jpg",
    benefits: [
      {
        icon: "passenger-screening",
        title: "Advanced Passenger Screening",
        description: "We provide state-of-the-art passenger screening services using the latest technology to detect threats while maintaining efficient passenger flow."
      },
      {
        icon: "aircraft-protection",
        title: "Aircraft Security",
        description: "Our specialized teams provide comprehensive aircraft security including pre-flight inspections, onboard security, and ground protection services."
      },
      {
        icon: "threat-assessment",
        title: "Threat Assessment",
        description: "We conduct regular threat assessments and security evaluations to identify potential vulnerabilities and implement appropriate countermeasures."
      }
    ],
    information: [
      {
        title: "Security Standards",
        description: "Our aviation security services comply with international standards including ICAO, TSA, and local aviation authority requirements for maximum security effectiveness."
      },
      {
        title: "Personnel Training",
        description: "All our aviation security personnel undergo specialized training in aviation security protocols, threat recognition, and emergency response procedures."
      },
      {
        title: "Technology Integration",
        description: "We integrate advanced security technology including biometric systems, explosive detection, and surveillance systems to enhance aviation security."
      }
    ],
    serviceBenefits: [
      {
        title: "Comprehensive Coverage",
        description: "Our aviation security services provide complete coverage from passenger check-in to aircraft departure, ensuring no security gaps in the process."
      },
      {
        title: "Rapid Response",
        description: "We maintain rapid response capabilities for security incidents, with trained teams ready to respond immediately to any aviation security threat."
      },
      {
        title: "Continuous Monitoring",
        description: "Our 24/7 monitoring systems provide continuous surveillance of airport facilities and aircraft to detect and prevent security threats in real-time."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "SERVICE", href: "/security-services" },
    { label: "AIRLINE / AVIATION SECURITY" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Airline / Aviation Security"
        crumbs={breadcrumbs}
      />
      <SecurityServiceDetailsSection service={service} />
      <Footer />
    </div>
  );
}
