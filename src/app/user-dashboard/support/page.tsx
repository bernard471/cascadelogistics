import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import SupportSection from "@/components/dashboard/SupportSection";

export default function Support() {
  return (
    <UserDashboardLayout activePage="support">
      <SupportSection />
    </UserDashboardLayout>
  );
}

