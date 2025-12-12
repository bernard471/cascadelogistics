import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import StaffManagementSection from "@/components/dashboard/StaffManagementSection";

export default function StaffManagement() {
  return (
    <AdminDashboardLayout activePage="staff">
      <StaffManagementSection />
    </AdminDashboardLayout>
  );
}


