import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AnalyticsReportsSection from "@/components/dashboard/AnalyticsReportsSection";

export default function AnalyticsReports() {
  return (
    <AdminDashboardLayout activePage="analytics">
      <AnalyticsReportsSection />
    </AdminDashboardLayout>
  );
}


