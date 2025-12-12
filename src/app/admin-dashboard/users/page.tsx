import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import UserManagementSection from "@/components/dashboard/UserManagementSection";

export default function UserManagement() {
  return (
    <AdminDashboardLayout activePage="users">
      <UserManagementSection />
    </AdminDashboardLayout>
  );
}


