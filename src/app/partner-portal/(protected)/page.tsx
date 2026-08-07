import type { Metadata } from "next";
import PartnerPortalConsole from "@/components/partner/PartnerPortalConsole";

export const metadata: Metadata = { title: "Partner Portal | Cascade Developers", robots: { index: false, follow: false } };
export default function PartnerPortalPage() { return <PartnerPortalConsole />; }
