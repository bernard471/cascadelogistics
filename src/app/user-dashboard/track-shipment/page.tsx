import { Suspense } from "react";
import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import TrackShipmentSection from "@/components/dashboard/TrackShipmentSection";

export default function TrackShipment() {
  return (
    <UserDashboardLayout activePage="track-shipment">
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-600">Loading...</div></div>}>
        <TrackShipmentSection />
      </Suspense>
    </UserDashboardLayout>
  );
}

