import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServiceDetailsSection from "@/components/SecurityServiceDetailsSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "CCTV Surveillance Services",
  description: "Protect homes, facilities and cargo with professional CCTV surveillance, remote monitoring, incident evidence and crime-deterrence solutions.",
  path: "/security-services/closed-circuit-tv",
  keywords: ["CCTV services Ghana","security surveillance Accra"],
});

export default function ClosedCircuitTVPage() {
  const service = {
    id: 7,
    title: "Closed Circuit TV (CCTV)",
    description: `Distant observing is a compelling affordable security arrangement that gives significant serenity. At Nivamore Courier Services, we utilize computerized innovation and expert staff to screen your property and give you the most ideal security.

Trained operatives can alert emergency services or initiate other procedures as required, guaranteeing a quick and proper reaction to any circumstance. Utilizing computerized innovation, Afamase Security CCTV systems are among the absolute best and most dependable camera frameworks accessible. We work with customers to distinguish security needs, meet goals, and create services to answer them. We also help ensure its clients meet their legal obligations.
`,
    image: "/servicesection/service-img7.jpg",
    benefits: [
      {
        icon: "peace",
        title: "Peace of Mind",
        description: "Professional CCTV installation provides you with the feeling of safety and security, knowing that your property is being monitored 24/7 by trained professionals."
      },
      {
        icon: "prosecution",
        title: "Prosecution",
        description: "CCTV increases the chances of successful prosecution if a crime occurs on your property, providing clear evidence for law enforcement and legal proceedings."
      },
      {
        icon: "deterrent",
        title: "Deterrent and Crime Prevention",
        description: "CCTV cameras dissuade criminals from illegal activities such as breaking in, stealing, vandalism, and anti-social behavior on your property."
      }
    ],
    information: [
      {
        title: "Criminal use",
        description: "Surveillance cameras can be misused by criminals, such as hidden cameras at ATMs to capture PINs. There's also a risk of data falling into unauthorized hands if security measures are not properly implemented."
      },
      {
        title: "Use in private homes",
        description: "Homeowners install CCTV systems primarily for deterrence purposes and to increase the identification risk for potential intruders, providing an additional layer of security for their families and property."
      },
      {
        title: "Use in schools",
        description: "There are restrictions on camera placement in areas with a reasonable expectation of privacy, such as bathrooms, locker rooms, and private offices, to protect individual privacy rights."
      }
    ],
    serviceBenefits: [
      {
        title: "Discourages Crimes",
        description: "The presence of CCTV cameras acts as a powerful deterrent against criminal activities. Potential offenders are less likely to commit crimes when they know they are being watched and recorded, significantly reducing the risk of theft, vandalism, and other illegal activities on your property."
      },
      {
        title: "Observe Activities",
        description: "CCTV systems allow for continuous monitoring of activities on your property, providing real-time surveillance and the ability to review recorded footage when needed for security purposes."
      },
      {
        title: "Assemble Evidence",
        description: "CCTV footage serves as crucial evidence in legal proceedings, providing clear visual documentation of events that can be used in court cases and insurance claims."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "SERVICE", href: "/security-services" },
    { label: "CLOSED CIRCUIT TV (CCTV)" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Closed Circuit TV (CCTV)"
        crumbs={breadcrumbs}
      />
      <SecurityServiceDetailsSection service={service} />
      <Footer />
    </div>
  );
}
