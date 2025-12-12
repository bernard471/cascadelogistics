import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import MyAssetsListSection from "@/components/dashboard/MyAssetsListSection";

export default function MyAssetsList() {
  return (
    <UserDashboardLayout activePage="assets-list">
      <MyAssetsListSection />
    </UserDashboardLayout>
  );
}

