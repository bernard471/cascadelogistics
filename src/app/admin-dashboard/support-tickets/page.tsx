import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import SupportTicketsManagementSection from "@/components/dashboard/SupportTicketsManagementSection";

export default async function AdminSupportTickets() {
  const session = await auth();
  
  if (!session) {
    redirect("/member-login");
  }
  
  // Check if user is not admin or staff and redirect to user dashboard
  if (session.user?.role !== "admin" && session.user?.role !== "staff") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="support-tickets">
      <SupportTicketsManagementSection />
    </AdminDashboardLayout>
  );
}
