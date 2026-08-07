import type { Metadata } from "next";
import PartnerPortalLogin from "@/components/partner/PartnerPortalLogin";

export const metadata: Metadata = { title: "Partner Login | Cascade Developers", robots: { index: false, follow: false } };
export default function PartnerPortalLoginPage() { return <PartnerPortalLogin />; }
