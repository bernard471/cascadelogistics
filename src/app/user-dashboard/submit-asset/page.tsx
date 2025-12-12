import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import SubmitAssetSection from "@/components/dashboard/SubmitAssetSection";

export default function SubmitAsset() {
  return (
    <UserDashboardLayout activePage="submit-asset">
      <SubmitAssetSection />
    </UserDashboardLayout>
  );
}

