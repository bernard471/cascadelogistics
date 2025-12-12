import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import NotificationsSection from "@/components/dashboard/NotificationsSection";

export default function Notifications() {
  return (
    <UserDashboardLayout activePage="notifications">
      <NotificationsSection />
    </UserDashboardLayout>
  );
}

