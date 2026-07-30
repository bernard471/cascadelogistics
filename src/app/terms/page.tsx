"use client";

import { useState, useEffect, useMemo } from "react";
import TopBanner from "@/components/TopBanner";
import Navigation from "@/components/Navigation";
// import BreadcrumbHero from "@/components/BreadcrumbHero";
import Footer from "@/components/Footer";
import {
  FileText,
  UserCheck,
  ShieldCheck,
  Package,
  ClipboardCheck,
  Tag,
  ShoppingCart,
  CreditCard,
  Warehouse,
  Clock,
  Truck,
  Globe,
  FileCode,
  AlertOctagon,
  Flame,
  Landmark,
  ShieldAlert,
  Scale,
  AlertCircle,
  ShieldX,
  FileSpreadsheet,
  Award,
  CloudOff,
  UserX,
  RefreshCw,
  Mail,
  Search,
  Printer,
  ChevronRight,
  ArrowUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  ExternalLink,
  BookOpen,
  Filter,
  Check,
  Copy,
  ChevronDown,
  type LucideIcon
} from "lucide-react";

type CategoryType = "All" | "Account & Identity" | "Services & Storage" | "Payments & Billing" | "Compliance & Safety" | "Legal & Disclaimers";

interface TermSection {
  id: string;
  number: string;
  title: string;
  category: CategoryType;
  icon: LucideIcon;
  intro?: string;
  bullets?: string[];
  paragraphs?: string[];
  callout?: {
    type: "info" | "warning" | "alert" | "tip";
    title: string;
    text: string;
  };
  subsections?: {
    subtitle: string;
    intro?: string;
    bullets?: string[];
    paragraphs?: string[];
  }[];
}

const TERMS_SECTIONS: TermSection[] = [
  {
    id: "section-1",
    number: "1",
    title: "Introduction and Acceptance of Terms",
    category: "Account & Identity",
    icon: FileText,
    intro: "These Terms and Conditions (\"Terms\") govern the use of services provided by Cascade Logistics, a company organized under the laws of Ghana (collectively, \"Cascade Logistics,\" \"Company,\" \"we,\" \"our,\" or \"us\").",
    paragraphs: [
      "By creating an account, completing identity verification, receiving a shipping address, submitting shipments, utilizing our warehouse facilities, using our website, application, or services, or otherwise engaging with Cascade Logistics, you (\"Customer,\" \"you,\" or \"your\") acknowledge that you have read, understood, and agree to be bound by these Terms.",
      "If you do not agree to these Terms, you must not use Cascade Logistics services."
    ],
    callout: {
      type: "info",
      title: "Supplementary Policy Notice",
      text: "These Terms are intended to supplement, and not replace, the Cascade Logistics Customer Handbook, Identity Verification & Customer Onboarding Policy, Privacy Policy, and any other applicable agreements or policies."
    }
  },
  {
    id: "section-2",
    number: "2",
    title: "Eligibility and Account Requirements",
    category: "Account & Identity",
    icon: UserCheck,
    intro: "To use Cascade Logistics services, you must meet and maintain all of the following requirements:",
    bullets: [
      "Be at least eighteen (18) years of age.",
      "Possess the legal capacity to enter into binding agreements.",
      "Provide accurate, complete, and current information during registration and throughout your use of our services.",
      "Successfully complete all required identity verification and onboarding procedures."
    ],
    paragraphs: [
      "Customers are responsible for maintaining accurate account information and must promptly update any changes to their name, address, email address, telephone number, business information, or other relevant account information.",
      "Cascade Logistics reserves the right to deny, suspend, restrict, or terminate access to services if eligibility requirements are not met."
    ]
  },
  {
    id: "section-3",
    number: "3",
    title: "Identity Verification and Account Approval",
    category: "Account & Identity",
    icon: ShieldCheck,
    intro: "Access to Cascade Logistics services is subject to successful completion of identity verification and account approval procedures. Customers may be required to provide:",
    bullets: [
      "Government-issued identification",
      "Business registration documents",
      "Proof of address",
      "Purchase documentation",
      "Ownership documentation",
      "Tax identification information",
      "Additional documentation requested by Cascade Logistics"
    ],
    paragraphs: [
      "Completion of identity verification does not guarantee approval. Cascade Logistics reserves the right to deny, suspend, restrict, revoke, or terminate access to services at its sole discretion.",
      "Cascade Logistics may require re-verification of identity at any time if account ownership, shipment activity, payment activity, security concerns, compliance concerns, or other circumstances warrant additional review.",
      "The Company reserves the right to conduct sanctions screening, restricted-party screening, fraud screening, and other due diligence reviews before or after account approval.",
      "Customers acknowledge that Cascade Logistics may rely upon third-party verification providers and screening services in connection with identity verification and compliance reviews."
    ]
  },
  {
    id: "section-4",
    number: "4",
    title: "Services",
    category: "Services & Storage",
    icon: Package,
    intro: "Cascade Logistics provides logistics, freight forwarding, package receiving, package consolidation, export coordination, customs clearance coordination, transportation arrangement, and related services. Services may include, but are not limited to:",
    bullets: [
      "Air cargo transportation",
      "Sea cargo transportation",
      "Package receiving",
      "Warehouse processing",
      "Package consolidation",
      "Repackaging services",
      "Export coordination",
      "Customs clearance coordination",
      "Delivery coordination",
      "Commercial cargo handling",
      "Business shipping solutions"
    ],
    paragraphs: [
      "Cascade Logistics reserves the right to modify, suspend, limit, or discontinue any service at any time without prior notice.",
      "Nothing in these Terms guarantees the availability of any particular service, shipping route, carrier, transit time, or destination."
    ]
  },
  {
    id: "section-5",
    number: "5",
    title: "Customer Responsibilities",
    category: "Services & Storage",
    icon: ClipboardCheck,
    subsections: [
      {
        subtitle: "Required Customer Actions",
        intro: "Customers are responsible for:",
        bullets: [
          "Providing accurate shipment information.",
          "Providing accurate package descriptions.",
          "Providing accurate shipment values.",
          "Providing invoices, receipts, and supporting documentation when requested.",
          "Ensuring all shipments comply with applicable laws and regulations.",
          "Ensuring all payment methods used are valid and authorized.",
          "Complying with all Cascade Logistics policies and procedures."
        ]
      },
      {
        subtitle: "Prohibited Customer Actions",
        intro: "Customers shall NOT:",
        bullets: [
          "Submit false or misleading information.",
          "Use another person's identity.",
          "Use Cascade Logistics services for unlawful purposes.",
          "Attempt to circumvent verification procedures.",
          "Submit prohibited, restricted, stolen, counterfeit, fraudulent, or unlawful items."
        ]
      }
    ],
    callout: {
      type: "warning",
      title: "Impact of False Information",
      text: "Customers acknowledge that inaccurate information may result in shipment delays, refusal of service, regulatory action, customs action, account suspension, account termination, or additional charges."
    }
  },
  {
    id: "section-6",
    number: "6",
    title: "Ownership of Goods",
    category: "Services & Storage",
    icon: Tag,
    intro: "Customers represent and warrant that they are the lawful owner of all goods submitted to Cascade Logistics, or possess full legal authority to ship, store, export, receive, transport, or otherwise handle such goods.",
    bullets: [
      "All goods were lawfully acquired.",
      "All goods are not stolen.",
      "All goods are not counterfeit.",
      "All goods are not connected to unlawful activity.",
      "All goods do not violate any applicable law, regulation, court order, or governmental restriction."
    ],
    paragraphs: [
      "Cascade Logistics reserves the right to request proof of ownership, proof of purchase, invoices, receipts, authorization letters, or other supporting documentation at any time.",
      "Failure to provide satisfactory documentation may result in shipment refusal, shipment delay, account suspension, account termination, reporting to authorities, or other action deemed appropriate by Cascade Logistics."
    ]
  },
  {
    id: "section-7",
    number: "7",
    title: "Customer Purchase Authorization and Third-Party Retailers",
    category: "Services & Storage",
    icon: ShoppingCart,
    intro: "Customers authorize Cascade Logistics to receive packages, merchandise, and shipments delivered to Cascade Logistics facilities on their behalf.",
    subsections: [
      {
        subtitle: "Customer Responsibilities with Third-Party Retailers",
        intro: "Customers remain solely responsible for:",
        bullets: [
          "All purchases made through third-party retailers or suppliers.",
          "Compliance with retailer terms and conditions.",
          "Payment authorization and verification.",
          "Product selection and order accuracy.",
          "Product warranties.",
          "Returns and exchanges.",
          "Manufacturer restrictions.",
          "Retailer account compliance."
        ]
      },
      {
        subtitle: "Retailer Disclaimer",
        intro: "Cascade Logistics shall NOT be responsible for:",
        bullets: [
          "Retailer order cancellations or fraud reviews.",
          "Payment disputes or declined transactions.",
          "Product defects or manufacturer defects.",
          "Missing items originating from retailers.",
          "Incorrect retailer shipments or product performance issues.",
          "Warranty disputes or marketplace account suspensions.",
          "Actions taken by retailers, suppliers, manufacturers, payment processors, or marketplaces."
        ]
      }
    ],
    paragraphs: [
      "Cascade Logistics reserves the right to request proof of purchase, invoices, payment confirmations, ownership documentation, authorization documentation, or additional supporting records before accepting, processing, storing, transporting, or exporting any shipment.",
      "Cascade Logistics may refuse, delay, suspend, inspect, cancel, or otherwise restrict any shipment if ownership, payment authorization, export compliance, identity verification, shipment legitimacy, or required documentation cannot be reasonably verified."
    ],
    callout: {
      type: "alert",
      title: "Indemnification Notice",
      text: "Customers agree to indemnify and hold harmless Cascade Logistics and Shipping Nibees Ltd from claims, disputes, investigations, losses, liabilities, penalties, damages, costs, and expenses arising from purchases made through third-party retailers, suppliers, manufacturers, marketplaces, or e-commerce platforms."
    }
  },
  {
    id: "section-8",
    number: "8",
    title: "Payment, Fees, and Billing",
    category: "Payments & Billing",
    icon: CreditCard,
    intro: "Customers agree to pay all applicable charges, fees, shipping costs, storage fees, handling fees, customs-related charges, repackaging fees, and other amounts due for services provided by Cascade Logistics.",
    bullets: [
      "All charges must be paid in full before shipment release unless otherwise agreed to in writing by Cascade Logistics.",
      "Cascade Logistics reserves the right to modify pricing, fees, rates, and charges at any time. The rates in effect at the time a shipment is processed shall apply.",
      "Cascade Logistics is not responsible for errors, delays, failures, charge declines, or disputes involving third-party payment processors, financial institutions, payment gateways, or payment service providers.",
      "Failure to make timely payment may result in shipment delays, storage fees, account restrictions, account suspension, or disposition of cargo as permitted by these Terms."
    ]
  },
  {
    id: "section-9",
    number: "9",
    title: "Package Receiving and Warehouse Operations",
    category: "Services & Storage",
    icon: Warehouse,
    intro: "Cascade Logistics provides package receiving services for approved customers. Receipt of a package by Cascade Logistics does not constitute inspection, verification, testing, authentication, quality control, or confirmation that the contents match the customer's order.",
    paragraphs: [
      "Package photographs, Proof of Delivery (POD), inventory records, or package processing activities are provided solely for operational purposes and do not constitute a quality inspection."
    ],
    subsections: [
      {
        subtitle: "Items Beyond Company Scope",
        intro: "Cascade Logistics shall not be responsible for:",
        bullets: [
          "Incorrect merchandise shipped by a retailer or supplier.",
          "Missing items originating from a retailer or supplier.",
          "Defective merchandise or manufacturer defects.",
          "Damaged merchandise received from a retailer or carrier.",
          "Product performance issues or warranty claims."
        ]
      }
    ],
    callout: {
      type: "tip",
      title: "Warehouse Access Rules",
      text: "Cascade Logistics does NOT accept Cash on Delivery (COD) shipments. Customers are responsible for coordinating delivery issues directly with retailers. Warehouse access is strictly by appointment only. Only the verified account holder may receive package information, photographs, or records."
    }
  },
  {
    id: "section-10",
    number: "10",
    title: "Storage Fees and Abandoned Cargo",
    category: "Services & Storage",
    icon: Clock,
    intro: "Cascade Logistics is NOT a storage facility. Customers are expected to arrange shipment of their goods within a reasonable time after receipt at a Cascade Logistics facility.",
    bullets: [
      "Free Storage Window: Storage shall be provided free of charge for the first five (5) working days following receipt of a package.",
      "Accrual Rate: Beginning on the sixth (6th) working day, storage fees shall accrue at a rate of One Dollar (US $1.00) per kilogram per day, subject to any minimum storage charges established by Cascade Logistics.",
      "Accrual Duration: Storage fees continue to accrue until all outstanding charges have been paid and the shipment has been processed, released, or otherwise removed from the facility.",
      "Abandoned Threshold: Packages that remain unpaid, unclaimed, abandoned, or otherwise unresolved for more than four (4) weeks may be considered abandoned cargo.",
      "Disposition Right: Abandoned cargo may be donated, disposed of, auctioned, destroyed, sold, transferred, or otherwise handled at Cascade Logistics' sole discretion without compensation to the customer."
    ],
    callout: {
      type: "alert",
      title: "Strict Storage Warning",
      text: "Cascade Logistics shall have no obligation to preserve, return, or compensate customers for abandoned cargo after the 4-week unresolved threshold."
    }
  },
  {
    id: "section-11",
    number: "11",
    title: "Shipping and Delivery",
    category: "Services & Storage",
    icon: Truck,
    intro: "Cascade Logistics acts as a logistics provider, freight forwarder, transportation arranger, and shipment coordinator.",
    paragraphs: [
      "Shipping schedules, transit times, estimated delivery dates, carrier schedules, and shipment projections are estimates only and are not guaranteed.",
      "Once a shipment has been tendered to a carrier, airline, shipping line, trucking company, customs authority, delivery provider, or other third party for transportation or processing, Cascade Logistics' responsibility for the shipment ends.",
      "Cascade Logistics shall not be liable for loss, damage, delay, theft, seizure, customs action, carrier action, or other events occurring after the shipment leaves Cascade Logistics' custody and control."
    ],
    bullets: [
      "Delivery dates and transit times are non-guaranteed estimates.",
      "Carrier schedules, customs processing times, and regulatory timelines are subject to external factors.",
      "Delivery performance of third-party carriers is not guaranteed."
    ]
  },
  {
    id: "section-12",
    number: "12",
    title: "Export Compliance",
    category: "Compliance & Safety",
    icon: Globe,
    intro: "Customers are responsible for providing accurate shipment descriptions, declared values, invoices, receipts, proof of ownership, and any documentation required for export, transportation, customs clearance, or regulatory compliance.",
    subsections: [
      {
        subtitle: "Strict Compliance Declaration",
        intro: "Customers shall not knowingly provide false, misleading, incomplete, or inaccurate information regarding:",
        bullets: [
          "Shipment contents and shipment values.",
          "Ownership of goods.",
          "End users and intended use of goods.",
          "Destination information."
        ]
      }
    ],
    paragraphs: [
      "Cascade Logistics reserves the right to refuse, delay, inspect, suspend, cancel, or otherwise restrict any shipment that may violate applicable laws, regulations, carrier requirements, governmental requirements, or company policies.",
      "Customers remain responsible for compliance with all applicable export, import, transportation, customs, sanctions, trade, and regulatory requirements."
    ]
  },
  {
    id: "section-13",
    number: "13",
    title: "AES, EEI, USPPI, and Export Regulatory Disclaimer",
    category: "Compliance & Safety",
    icon: FileCode,
    intro: "Cascade Logistics does NOT provide legal advice regarding regulatory determinations or filings:",
    bullets: [
      "USPPI determination",
      "AES filing obligations",
      "EEI filing requirements",
      "Export licensing requirements",
      "Export classification responsibilities",
      "ECCN determinations",
      "Foreign Trade Regulations (FTR) compliance",
      "Export Administration Regulations (EAR) compliance"
    ],
    paragraphs: [
      "Customers remain solely responsible for obtaining independent legal, regulatory, customs, export compliance, or trade compliance advice when necessary. Nothing provided by Cascade Logistics shall be interpreted as legal advice or a legal determination regarding export obligations."
    ]
  },
  {
    id: "section-14",
    number: "14",
    title: "Restricted Commodities",
    category: "Compliance & Safety",
    icon: AlertOctagon,
    intro: "Cascade Logistics reserves the right to refuse any shipment at its sole discretion. Examples of prohibited or restricted items include:",
    bullets: [
      "Firearms and Ammunition",
      "Illegal drugs and controlled substances",
      "Counterfeit goods and Stolen goods",
      "Explosives and Hazardous materials",
      "Export-controlled items requiring authorization",
      "Undeclared lithium batteries",
      "Goods prohibited by applicable law"
    ],
    paragraphs: [
      "This list is not exhaustive. Cascade Logistics reserves the right to determine whether any commodity may be accepted, transported, stored, processed, or exported."
    ]
  },
  {
    id: "section-15",
    number: "15",
    title: "Dangerous Goods and Lithium Batteries",
    category: "Compliance & Safety",
    icon: Flame,
    intro: "Customers must accurately disclose all dangerous goods, hazardous materials, lithium batteries, and regulated commodities before shipment.",
    bullets: [
      "Certain dangerous goods may be accepted for transportation subject to applicable laws, carrier requirements, packaging, documentation, operational capabilities, and explicit Cascade Logistics approval.",
      "Acceptance of any dangerous goods shipment is entirely at the discretion of Cascade Logistics.",
      "Undeclared dangerous goods, hazardous materials, lithium batteries, or regulated commodities may result in shipment refusal, shipment destruction, regulatory reporting, account suspension, account termination, fines, penalties, or legal action.",
      "Customers shall remain fully responsible for all consequences arising from inaccurate, incomplete, or misleading dangerous goods declarations."
    ]
  },
  {
    id: "section-16",
    number: "16",
    title: "Customs, Duties, Taxes, and Government Actions",
    category: "Compliance & Safety",
    icon: Landmark,
    intro: "Customers acknowledge that shipments may be subject to customs inspections, examinations, holds, duties, taxes, fees, permits, licensing requirements, or other governmental actions.",
    subsections: [
      {
        subtitle: "Governmental Disclaimer",
        intro: "Cascade Logistics does not control and shall not be responsible for:",
        bullets: [
          "Customs inspections and examinations.",
          "Regulatory holds or government seizures.",
          "Duties, taxes, and permit requirements.",
          "Regulatory approvals or government enforcement actions.",
          "Customs clearance timelines."
        ]
      }
    ],
    paragraphs: [
      "Customers remain solely responsible for all duties, taxes, fines, penalties, assessments, storage charges, demurrage charges, government fees, and related costs arising from their shipments.",
      "Cascade Logistics shall not be liable for losses, delays, damages, expenses, or other consequences resulting from customs actions, regulatory reviews, governmental actions, or law enforcement actions."
    ]
  },
  {
    id: "section-17",
    number: "17",
    title: "Fraud Prevention",
    category: "Compliance & Safety",
    icon: ShieldAlert,
    intro: "Cascade Logistics maintains fraud prevention, identity verification, transaction monitoring, sanctions screening, and compliance review procedures designed to protect customers, transportation providers, business partners, and the Company.",
    paragraphs: [
      "Cascade Logistics reserves the right to investigate suspicious activity and may suspend, restrict, delay, cancel, refuse, inspect, or terminate services when fraud, misrepresentation, unauthorized activity, compliance concerns, or other irregularities are suspected.",
      "Customers agree to cooperate fully with any fraud prevention or compliance review conducted by Cascade Logistics."
    ]
  },
  {
    id: "section-18",
    number: "18",
    title: "Cooperation with Law Enforcement",
    category: "Compliance & Safety",
    icon: Scale,
    intro: "Cascade Logistics reserves the right to cooperate fully with law enforcement agencies, customs authorities, regulatory agencies, governmental authorities, transportation security authorities, and other authorized entities.",
    bullets: [
      "Customer information and verification records",
      "Shipment and transaction records",
      "Communication records",
      "Documentation submitted by customers"
    ],
    paragraphs: [
      "By using Cascade Logistics services, customers acknowledge and consent to such disclosures when required by law, requested by authorized authorities, or deemed necessary by Cascade Logistics to protect its legal interests, business operations, customers, transportation providers, or regulatory obligations."
    ]
  },
  {
    id: "section-19",
    number: "19",
    title: "Chargebacks and Payment Disputes",
    category: "Payments & Billing",
    icon: AlertCircle,
    intro: "Customers agree not to initiate chargebacks, payment reversals, payment disputes, or similar actions for charges that are validly incurred under these Terms.",
    paragraphs: [
      "Customers must first contact Cascade Logistics and provide a reasonable opportunity to investigate and resolve any billing dispute."
    ],
    subsections: [
      {
        subtitle: "Remedies for Improper Disputes",
        intro: "If Cascade Logistics determines that a chargeback, payment reversal, or dispute was improper, fraudulent, abusive, or unsupported, Cascade Logistics may:",
        bullets: [
          "Suspend or terminate customer accounts.",
          "Refuse future service.",
          "Recover unpaid balances.",
          "Recover collection costs.",
          "Recover attorneys' fees and legal expenses where permitted by law.",
          "Pursue any other remedies available under applicable law."
        ]
      }
    ]
  },
  {
    id: "section-20",
    number: "20",
    title: "Insurance Disclaimer",
    category: "Legal & Disclaimers",
    icon: ShieldX,
    intro: "Cascade Logistics does NOT provide cargo insurance unless expressly stated in writing. Customers shipping high-value items are encouraged to obtain independent insurance coverage through a third-party insurance provider.",
    paragraphs: [
      "Once a shipment has been tendered to a carrier, airline, shipping line, trucking company, customs authority, delivery provider, or other third party for transportation or processing, Cascade Logistics shall not be responsible for loss, damage, theft, delay, mishandling, seizure, or other events occurring during transit.",
      "Cascade Logistics shall not be liable for losses that would otherwise be covered by cargo insurance."
    ]
  },
  {
    id: "section-21",
    number: "21",
    title: "Limitation of Liability",
    category: "Legal & Disclaimers",
    icon: FileSpreadsheet,
    intro: "To the fullest extent permitted by applicable law, Cascade Logistics, their owners, officers, directors, employees, contractors, agents, affiliates, representatives, successors, and assigns shall not be liable for any indirect, incidental, consequential, special, punitive, exemplary, or economic damages arising out of or relating to:",
    bullets: [
      "Use of Cascade Logistics services.",
      "Shipment delays, customs actions, regulatory actions, or carrier actions.",
      "Government actions.",
      "Loss of business, loss of profits, or loss of revenue.",
      "Loss of data or loss of opportunity.",
      "Shipment loss or damage occurring outside Cascade Logistics' custody and control."
    ]
  },
  {
    id: "section-22",
    number: "22",
    title: "Indemnification",
    category: "Legal & Disclaimers",
    icon: Award,
    intro: "Customers agree to defend, indemnify, and hold harmless Cascade Logistics, their owners, officers, directors, employees, contractors, agents, affiliates, representatives, successors, and assigns from and against any claims, demands, liabilities, damages, judgments, losses, penalties, fines, costs, expenses, and attorneys' fees arising out of or relating to:",
    bullets: [
      "Customer shipments and customer conduct.",
      "Violations of these Terms.",
      "Regulatory violations or customs violations.",
      "False declarations or inaccurate information.",
      "Ownership disputes or intellectual property disputes.",
      "Third-party claims relating to customer shipments."
    ]
  },
  {
    id: "section-23",
    number: "23",
    title: "Force Majeure",
    category: "Legal & Disclaimers",
    icon: CloudOff,
    intro: "Cascade Logistics shall not be liable for delays, interruptions, failures, losses, or inability to perform services resulting from events beyond its reasonable control, including:",
    bullets: [
      "Natural disasters, severe weather, floods, and fires.",
      "Epidemics and pandemics.",
      "Labor disputes and carrier disruptions.",
      "Government actions and customs delays.",
      "Utility outages and transportation disruptions.",
      "Security incidents, acts of war, civil unrest, and terrorism.",
      "Any other force majeure event."
    ]
  },
  {
    id: "section-24",
    number: "24",
    title: "Termination",
    category: "Account & Identity",
    icon: UserX,
    intro: "Customers may terminate their accounts by contacting Cascade Logistics.",
    paragraphs: [
      "Cascade Logistics may suspend, restrict, deny, or terminate accounts or services at any time and for any lawful reason, including but not limited to: fraud concerns, compliance concerns, non-payment, violation of these Terms, regulatory concerns, or business reasons.",
      "Termination shall not relieve customers of obligations incurred prior to termination."
    ]
  },
  {
    id: "section-28",
    number: "28",
    title: "Changes to Terms",
    category: "Legal & Disclaimers",
    icon: RefreshCw,
    intro: "Cascade Logistics reserves the right to modify these Terms at any time.",
    paragraphs: [
      "Updated versions may be posted on the Cascade Logistics website, application, customer portal, or other communication channels.",
      "Continued use of Cascade Logistics services following any modification constitutes acceptance of the revised Terms."
    ]
  },
  {
    id: "section-29",
    number: "29",
    title: "Contact Information",
    category: "Legal & Disclaimers",
    icon: Mail,
    intro: "If you have questions, inquiries, or legal notices regarding these Terms and Conditions, please reach out to Cascade Logistics Limited:",
    paragraphs: [
      "Company Name: Cascade Logistics Limited",
      "Legal Jurisdiction: Organized under the laws of Ghana",
      "Headquarters: Accra, Ghana",
      "Official Email: info@cascadelogistics.co",
      "Official Website: Cascadelogistics.co"
    ]
  }
];

const CATEGORIES: CategoryType[] = [
  "All",
  "Account & Identity",
  "Services & Storage",
  "Payments & Billing",
  "Compliance & Safety",
  "Legal & Disclaimers"
];

export default function TermsAndConditions() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>("section-1");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter sections based on search and category
  const filteredSections = useMemo(() => {
    return TERMS_SECTIONS.filter((sec) => {
      const matchesCategory = activeCategory === "All" || sec.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesTitle = sec.title.toLowerCase().includes(q);
      const matchesIntro = sec.intro?.toLowerCase().includes(q) || false;
      const matchesBullets = sec.bullets?.some((b) => b.toLowerCase().includes(q)) || false;
      const matchesParagraphs = sec.paragraphs?.some((p) => p.toLowerCase().includes(q)) || false;

      return matchesCategory && (matchesTitle || matchesIntro || matchesBullets || matchesParagraphs);
    });
  }, [activeCategory, searchQuery]);

  // Handle scroll tracking for active TOC item
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const sec of TERMS_SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSectionId(sec.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const copySectionLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-[#315694] selection:text-white">
      <TopBanner />
      <Navigation />
      
      {/* <BreadcrumbHero 
        title="Terms and Conditions" 
        crumbs={[
          { label: "Home", href: "/" }, 
          { label: "Terms & Conditions", href: "/terms" }
        ]} 
      /> */}

      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1b2a4a] via-[#262262] to-[#315694] py-14 lg:py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-blue-200 mb-5">
              <Building2 className="h-3.5 w-3.5 text-[#f7941d]" />
              Cascade Logistics Limited
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Terms & Conditions
            </h1>
            
            <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed mb-6">
              Official legal agreement governing logistics, shipping, warehouse operations, identity verification, and customer responsibilities with Cascade Logistics in Ghana and globally.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-blue-200 font-medium pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Clock className="h-4 w-4 text-[#f7941d]" />
                <span>Effective Date: <strong>August 01, 2026</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <MapPin className="h-4 w-4 text-[#f7941d]" />
                <span>Jurisdiction: <strong>Republic of Ghana</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Status: <strong>Active & Binding</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* At A Glance Highlights Grid */}
      <section className="py-8 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-[#315694]" />
            Key Governance Highlights At A Glance
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 text-[#315694]">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Storage Policy</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                First <strong>5 working days free</strong>. $1.00/kg/day starting day 6. Cargo unresolved for over 4 weeks is considered abandoned.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Identity Verification</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identity verification & approval required prior to service. Re-verification may be mandated for compliance or security.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Third-Party Retailers</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Customers are solely responsible for purchases, retailer terms, defect disputes, order cancellations, and warranties.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <ShieldX className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Cargo Insurance</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cargo insurance is <strong>not provided</strong> unless requested in writing. Independent insurance is strongly recommended.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        
        {/* Search Bar & Category Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terms, storage fees, dangerous goods, liability..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315694] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Print Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
                title="Print full document"
              >
                <Printer className="h-4 w-4 text-[#315694]" />
                <span className="hidden sm:inline">Print Document</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Category:
            </span>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#315694] text-white shadow-sm shadow-blue-500/30"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Floating Table of Contents Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-left font-bold text-sm text-slate-900"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#315694]" />
              Table of Contents ({filteredSections.length} Sections)
            </span>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {mobileMenuOpen && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 shadow-lg space-y-1 max-h-80 overflow-y-auto">
              {filteredSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs font-semibold transition-colors ${
                    activeSectionId === sec.id
                      ? "bg-blue-50 text-[#315694]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate mr-2">
                    <span className="inline-block w-6 font-bold text-slate-400">{sec.number}.</span>
                    {sec.title}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Left Sticky Navigation (4 Columns) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#315694]" />
                  Table of Contents
                </h2>
                <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredSections.length} Sections
                </span>
              </div>

              <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filteredSections.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  const IconComponent = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition-all group ${
                        isActive
                          ? "bg-[#315694] text-white shadow-md shadow-blue-900/20"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}>
                        <IconComponent className="h-3.5 w-3.5" />
                      </span>
                      
                      <span className="truncate flex-1 font-medium">{sec.title}</span>

                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        isActive ? "text-white translate-x-0.5" : "text-slate-300 group-hover:text-slate-500"
                      }`} />
                    </button>
                  );
                })}

                {filteredSections.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No matching terms found.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Contact Info Badge */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#1b2a4a] text-white space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300">Need Clarification?</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Have questions regarding custom shipping terms or legal compliance?
              </p>
              <a
                href="mailto:info@cascadelogistics.co"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f7941d] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                info@cascadelogistics.co
              </a>
            </div>
          </aside>

          {/* Main Content Column (8 Columns) */}
          <main className="lg:col-span-8 space-y-8">
            
            {filteredSections.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                <Search className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">No matching sections found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Try adjusting your search keywords or switching category filters to see terms content.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="px-4 py-2 bg-[#315694] text-white rounded-xl text-xs font-bold hover:bg-[#262262] transition-colors"
                >
                  Reset Search & Filters
                </button>
              </div>
            )}

            {filteredSections.map((sec) => {
              const IconComponent = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  {/* Top Decorative Border Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#315694] via-[#262262] to-[#f7941d] opacity-80" />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#315694] font-extrabold text-base border border-blue-100">
                        <IconComponent className="h-5 w-5 text-[#315694]" />
                      </span>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Section {sec.number}</span>
                          <span>•</span>
                          <span>{sec.category}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                          {sec.title}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => copySectionLink(sec.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors self-start sm:self-auto border border-slate-200"
                      title="Copy section link"
                    >
                      {copiedId === sec.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Section Content Body */}
                  <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                    {sec.intro && (
                      <p className="font-medium text-slate-800">{sec.intro}</p>
                    )}

                    {sec.paragraphs && sec.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-slate-600 leading-relaxed">
                        {p}
                      </p>
                    ))}

                    {sec.bullets && (
                      <ul className="space-y-2.5 my-4 pl-1">
                        {sec.bullets.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                            <div className="mt-1 h-2 w-2 rounded-full bg-[#315694] shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {sec.subsections && sec.subsections.map((sub, idx) => (
                      <div key={idx} className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-1.5 h-4 bg-[#f7941d] rounded-full" />
                          {sub.subtitle}
                        </h3>
                        {sub.intro && <p className="text-sm font-medium text-slate-700">{sub.intro}</p>}
                        {sub.bullets && (
                          <ul className="space-y-2 pl-1">
                            {sub.bullets.map((bItem, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-3 text-slate-600 text-sm">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                <span>{bItem}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {sub.paragraphs && sub.paragraphs.map((subP, pIdx) => (
                          <p key={pIdx} className="text-sm text-slate-600 leading-relaxed">{subP}</p>
                        ))}
                      </div>
                    ))}

                    {/* Alert / Callout Boxes */}
                    {sec.callout && (
                      <div className={`mt-6 p-4 rounded-xl border ${
                        sec.callout.type === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : sec.callout.type === "alert"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : sec.callout.type === "tip"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-blue-50 border-blue-200 text-blue-900"
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-sm mb-1">
                          {sec.callout.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                          {sec.callout.type === "alert" && <AlertOctagon className="h-4 w-4 text-rose-600" />}
                          {sec.callout.type === "tip" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          {sec.callout.type === "info" && <Info className="h-4 w-4 text-blue-600" />}
                          <span>{sec.callout.title}</span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                          {sec.callout.text}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}

            {/* Bottom Contact & Legal Footer Card */}
            <div className="bg-gradient-to-br from-slate-900 via-[#1b2a4a] to-[#262262] rounded-2xl p-8 text-white space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Cascade Logistics Limited</h3>
                  <p className="text-xs text-blue-200">Registered and operating under the laws of Ghana</p>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 border border-white/10">
                  Accra, Ghana
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="text-xs uppercase font-bold text-slate-400">Direct Inquiries</div>
                  <a
                    href="mailto:info@cascadelogistics.co"
                    className="flex items-center gap-2 font-semibold text-white hover:text-[#f7941d] transition-colors"
                  >
                    <Mail className="h-4 w-4 text-[#f7941d]" />
                    info@cascadelogistics.co
                  </a>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase font-bold text-slate-400">Official Website</div>
                  <a
                    href="https://cascadelogistics.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-semibold text-white hover:text-[#f7941d] transition-colors"
                  >
                    <Globe className="h-4 w-4 text-[#f7941d]" />
                    Cascadelogistics.co
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                <p>© {new Date().getFullYear()} Cascade Logistics Limited. All rights reserved.</p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="inline-flex items-center gap-1 text-blue-300 hover:text-white font-semibold"
                >
                  Back to Top <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
