import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AnalyticsReportsSection from "@/components/dashboard/AnalyticsReportsSection";

export default async function AnalyticsReports() {
  const session = await auth();

  if (!session) {
    redirect("/member-login");
  }

  if (session.user?.role !== "admin" && session.user?.role !== "staff") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="analytics">
      <AnalyticsReportsSection />
    </AdminDashboardLayout>
  );
}


