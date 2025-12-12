import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminSettingsSection from "@/components/dashboard/AdminSettingsSection";

export default function AdminSettings() {
  return (
    <AdminDashboardLayout activePage="settings">
      <AdminSettingsSection />
    </AdminDashboardLayout>
  );
}


