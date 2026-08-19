import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
import BreadcrumbHero from "@/components/BreadcrumbHero";
import LogisticsServicesDetailedSection from "@/components/LogisticsServicesDetailedSection";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Ghana to China Money Transfer",
  description: "Make secure Ghana cedi to Chinese yuan payments for purchases and suppliers through Cascade Logistics' trusted money-transfer service.",
  path: "/logistics-services/money-transfer",
  keywords: ["Ghana to China money transfer","cedi to RMB transfer"],
});

export default function MoneyTransferPage() {
  const service = {
    id: 6,
    title: "Money Transfer",
    description: `Guangzhou Swift Logistics offers secure and reliable money transfer services for currency exchange from Ghana Cedis to Chinese Yuan (RMB). Our money transfer service connects you with our trusted agents in Ghana who facilitate seamless cross-border transactions.

You can send money through bank transfers or mobile money (Momo) to our agents in Ghana, and we'll transfer the equivalent RMB to your designated receiver in China at competitive exchange rates. The process typically takes 24-48 hours, and both parties receive instant confirmation. We offer the best exchange rates in the market with transparent pricing and no hidden fees, making it easy and affordable to send money from Ghana to China.`,
    image: "/logisticssection/money-transfer.jpg",
    benefits: [
      {
        icon: "security",
        title: "Secure Transactions",
        description: "All money transfers are processed through secure and verified channels, ensuring your funds are protected throughout the transaction process."
      },
      {
        icon: "speed",
        title: "Fast Processing",
        description: "Money transfers are typically processed within 24-48 hours, providing quick access to funds for your receivers in China."
      },
      {
        icon: "rates",
        title: "Competitive Rates",
        description: "We offer the best exchange rates from Cedis to RMB in the market, with transparent pricing and no hidden fees."
      }
    ],
    information: [
      {
        title: "Transfer Process",
        description: "Contact our agents in Ghana, send Cedis via Bank or Mobile Money, we exchange at competitive rates, and transfer RMB to your receiver in China within 24-48 hours."
      },
      {
        title: "Payment Methods",
        description: "We accept both bank transfers and mobile money (Momo) payments in Ghana, giving you flexibility in how you send money for currency exchange."
      },
      {
        title: "Exchange Rates",
        description: "We offer competitive exchange rates that are updated regularly based on market conditions, ensuring you get the best value for your money transfers."
      }
    ],
    serviceBenefits: [
      {
        title: "Multiple Payment Options",
        description: "Choose between bank transfers or mobile money (Momo) for sending Cedis, providing convenience and flexibility for your money transfer needs."
      },
      {
        title: "Best Exchange Rates",
        description: "We offer competitive exchange rates from Cedis to RMB, ensuring you get the best value for your money with transparent pricing and no hidden fees."
      },
      {
        title: "Fast & Secure",
        description: "With 24-48 hour processing times and secure transaction channels, our money transfer service provides fast, reliable, and safe currency exchange."
      }
    ]
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Logistics Services", href: "/logistics-services" },
    { label: "Money Transfer" }
  ];

  return (
    <div className="min-h-screen">
      <TopBanner />
      <Navigation />
      <BreadcrumbHero
        title="Money Transfer"
        crumbs={breadcrumbs}
      />
      <LogisticsServicesDetailedSection service={service} />
      <Footer />
    </div>
  );
}
