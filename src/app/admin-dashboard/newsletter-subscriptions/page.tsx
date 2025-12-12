import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import NewsletterSubscriptionsSection from "@/components/dashboard/NewsletterSubscriptionsSection";

export default async function NewsletterSubscriptionsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/member-login");
  }
  
  if (session.user?.role !== "admin") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="newsletter-subscriptions">
      <NewsletterSubscriptionsSection />
    </AdminDashboardLayout>
  );
}
