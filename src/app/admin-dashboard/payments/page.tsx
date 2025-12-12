import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import PaymentVerificationSection from "@/components/dashboard/PaymentVerificationSection";

export default async function PaymentsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/member-login");
  }
  
  // Check if user is not admin and redirect to user dashboard
  if (session.user?.role !== "admin") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="payments">
      <PaymentVerificationSection />
    </AdminDashboardLayout>
  );
}
