import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import RevenueManagementSection from "@/components/dashboard/RevenueManagementSection";

export default function RevenueManagement() {
  return (
    <AdminDashboardLayout activePage="revenue">
      <RevenueManagementSection />
    </AdminDashboardLayout>
  );
}


