import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import ShipmentManagementSection from "@/components/dashboard/ShipmentManagementSection";

export default async function ShipmentManagement({
  searchParams,
}: {
  searchParams: Promise<{ shipment?: string }>;
}) {
  const session = await auth();
  const { shipment } = await searchParams;
  
  if (!session) {
    redirect("/member-login");
  }
  
  // Check if user is not admin or staff and redirect to user dashboard
  if (session.user?.role !== "admin" && session.user?.role !== "staff") {
    redirect("/user-dashboard");
  }

  return (
    <AdminDashboardLayout activePage="shipments">
      <ShipmentManagementSection initialShipmentTrackingId={shipment || ""} />
    </AdminDashboardLayout>
  );
}

