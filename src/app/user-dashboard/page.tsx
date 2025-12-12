import { redirect } from "next/navigation";
import { auth } from "@/auth";
import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default async function UserDashboard() {
  const session = await auth();
  
  if (!session) {
    redirect("/member-login");
  }
  
  // Check if user is admin and redirect to admin dashboard
  if (session.user?.role === "admin") {
    redirect("/admin-dashboard");
  }

  return (
    <UserDashboardLayout activePage="dashboard">
      <DashboardOverview />
    </UserDashboardLayout>
  );
}

