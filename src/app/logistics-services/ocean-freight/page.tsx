import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";

export default function OceanFreightPage() {
  const service = {
    id: 2,
    title: "Ocean Freight",
    description: `We provide ocean freight services to our clients. We will help you assess your ocean freight needs and work with you to develop a comprehensive logistics plan to meet your transportation objectives. At Nivamore Courier Services, we understand the cost-effectiveness and capacity advantages of ocean transportation.

Our ocean freight services include full container load (FCL), less than container load (LCL), roll-on/roll-off (RoRo), and breakbulk shipping. We work with customers to identify logistics needs, meet objectives, and create services to answer them. We also help ensure our clients meet their legal obligations for ocean cargo transportation and maritime regulations.`,
    image: "/servicesection/service-img2.jpg",
    benefits: [
      {
        icon: "cost-effective",
        title: "Cost Effective",
        description: "Ocean freight offers the most cost-effective solution for large volume shipments, providing significant savings compared to air freight for non-urgent cargo."
      },
      {
        icon: "high-capacity",
        title: "High Capacity",
        description: "Ocean freight can handle large volumes and oversized cargo that cannot be transported by air, making it ideal for heavy machinery and bulk commodities."
      },
      {
        icon: "environmental",
        title: "Environmentally Friendly",
        description: "Ocean freight has a lower carbon footprint per ton-mile compared to air freight, making it a more sustainable transportation option."
      }
    ],
    information: [
      {
        title: "Container Types",
        description: "We offer various container types including standard 20ft and 40ft containers, refrigerated containers, open-top containers, and flat rack containers for different cargo requirements."
      },
      {
        title: "Port Services",
        description: "Our port services include container handling, customs clearance, warehousing, and inland transportation to ensure seamless door-to-door delivery."
      },
      {
        title: "Schedule Reliability",
        description: "We work with reliable shipping lines to provide consistent sailing schedules and minimize delays in your ocean freight shipments."
      }
    ],
    serviceBenefits: [
      {
        title: "FCL Services",
        description: "Our Full Container Load services provide dedicated container space for your cargo, offering maximum security and flexibility for large shipments."
      },
      {
        title: "LCL Consolidation",
        description: "Our Less than Container Load services allow you to ship smaller quantities cost-effectively by consolidating your cargo with other shipments."
      },
      {
        title: "Specialized Cargo",
        description: "We handle specialized ocean freight including hazardous materials, oversized cargo, and temperature-controlled shipments with appropriate safety measures."
      }
    ]
  };

  const breadcrumbs = [
    { label: "HOME", href: "/" },
    { label: "LOGISTICS SERVICES", href: "/logistics-services" },
    { label: "OCEAN FREIGHT" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Ocean Freight"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
