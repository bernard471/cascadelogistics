import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import IdentityVerificationSection from "@/components/dashboard/IdentityVerificationSection";

export default async function IdentityVerificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/member-login");
  if (session.user.role !== "admin") redirect("/forbidden");

  return (
    <AdminDashboardLayout activePage="identity-verifications">
      <IdentityVerificationSection />
    </AdminDashboardLayout>
  );
}

