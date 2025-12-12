import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import AdminDashboardOverview from "@/components/dashboard/AdminDashboardOverview";

export default async function AdminDashboard() {
  const session = await auth();
  
  if (!session) {
    redirect("/member-login");
  }
  
  // Check if user is not admin and redirect to user dashboard
  if (session.user?.role !== "admin") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="dashboard">
      <AdminDashboardOverview />
    </AdminDashboardLayout>
  );
}


