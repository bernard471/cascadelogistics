import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import ShipmentManagementSection from "@/components/dashboard/ShipmentManagementSection";

export default function ShipmentManagement() {
  return (
    <AdminDashboardLayout activePage="shipments">
      <ShipmentManagementSection />
    </AdminDashboardLayout>
  );
}


