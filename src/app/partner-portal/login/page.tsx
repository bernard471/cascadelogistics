import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PartnerPortalLogin from "@/components/partner/PartnerPortalLogin";
import { isPartnerPlatformEnabled } from "@/lib/partner-platform/feature";

export const metadata: Metadata = { title: "Partner Login | Cascade Developers", robots: { index: false, follow: false } };
export default function PartnerPortalLoginPage() {
  if (!isPartnerPlatformEnabled()) notFound();
  return <PartnerPortalLogin />;
}
