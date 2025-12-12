import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import SupportTicketsManagementSection from "@/components/dashboard/SupportTicketsManagementSection";

export default async function AdminSupportTickets() {
  const session = await auth();
  
  if (!session) {
    redirect("/member-login");
  }
  
  if (session.user?.role !== "admin") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="support-tickets">
      <SupportTicketsManagementSection />
    </AdminDashboardLayout>
  );
}
