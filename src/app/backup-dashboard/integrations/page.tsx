import { notFound } from "next/navigation";
import PartnerIntegrationConsole from "@/components/dashboard/PartnerIntegrationConsole";
import { isPartnerPlatformEnabled } from "@/lib/partner-platform/feature";

export default function PartnerIntegrationsPage() {
  if (!isPartnerPlatformEnabled()) notFound();
  return <PartnerIntegrationConsole />;
}
