import BackupDashboard from "@/components/dashboard/BackupDashboard";
import { isPartnerPlatformEnabled } from "@/lib/partner-platform/feature";

export default function BackupDashboardPage() {
  return <BackupDashboard partnerPlatformEnabled={isPartnerPlatformEnabled()} />;
}
