import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import SecurityServiceDetailsSection from "@/components/SecurityServiceDetailsSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Security Dispatch Services",
  description: "Coordinate personnel and resources with 24/7 security dispatch, real-time communication, rapid emergency response and activity reporting.",
  path: "/security-services/dispatch-arrangement",
  keywords: ["security dispatch Ghana","24/7 security response"],
});

export default function DispatchArrangementPage() {
  const service = {
    id: 4,
    title: "Dispatch Arrangement",
    description: `You want immediate and accurate dispatching services and that is what we provide. At Nivamore Courier Services, we offer professional dispatch services that ensure your security personnel and resources are deployed efficiently and effectively. Our dispatch center operates 24/7 to coordinate security operations and emergency responses.

Our dispatch arrangement services include real-time monitoring, resource allocation, emergency response coordination, and communication management. We work with customers to identify security needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for proper security coordination.`,
    image: "/servicesection/service-img4.jpg",
    benefits: [
      {
        icon: "coordination",
        title: "Real-time Coordination",
        description: "Our dispatch center provides real-time coordination of security personnel and resources, ensuring immediate response to security incidents and emergencies."
      },
      {
        icon: "communication",
        title: "Advanced Communication",
        description: "We maintain secure communication channels between dispatch centers, field personnel, and clients to ensure seamless coordination and information sharing."
      },
      {
        icon: "efficiency",
        title: "Resource Optimization",
        description: "Our dispatch services optimize the allocation of security resources, ensuring maximum coverage and efficiency while minimizing response times and costs."
      }
    ],
    information: [
      {
        title: "Dispatch Center Operations",
        description: "Our 24/7 dispatch center is staffed by experienced operators who monitor security systems, coordinate responses, and maintain constant communication with field personnel."
      },
      {
        title: "Emergency Protocols",
        description: "We have established emergency response protocols that ensure rapid deployment of security resources and coordination with local law enforcement when necessary."
      },
      {
        title: "Technology Integration",
        description: "Our dispatch systems integrate with GPS tracking, communication devices, and security monitoring systems to provide comprehensive oversight and control."
      }
    ],
    serviceBenefits: [
      {
        title: "24/7 Monitoring",
        description: "Our dispatch center operates around the clock to monitor security situations, coordinate responses, and ensure continuous protection for our clients."
      },
      {
        title: "Rapid Response",
        description: "We maintain rapid response capabilities with pre-positioned resources and established protocols to ensure immediate deployment when security incidents occur."
      },
      {
        title: "Comprehensive Reporting",
        description: "We provide detailed reports on all dispatch activities, response times, and security incidents to help improve future security planning and operations."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "SERVICE", href: "/security-services" },
    { label: "DISPATCH ARRANGEMENT" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Dispatch Arrangement"
        crumbs={breadcrumbs}
      />
      <SecurityServiceDetailsSection service={service} />
      <Footer />
    </div>
  );
}
