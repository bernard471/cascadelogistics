import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import ContactSubmissionsSection from "@/components/dashboard/ContactSubmissionsSection";

export default function ContactSubmissionsPage() {
  return (
    <AdminDashboardLayout activePage="contact-submissions">
      <ContactSubmissionsSection />
    </AdminDashboardLayout>
  );
}
