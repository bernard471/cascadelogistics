import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import PaymentVerificationSection from "@/components/dashboard/PaymentVerificationSection";

export default async function PaymentsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/member-login");
  }
  
  if (session.user?.role !== "admin" && session.user?.role !== "staff") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="payments">
      <PaymentVerificationSection />
    </AdminDashboardLayout>
  );
}
