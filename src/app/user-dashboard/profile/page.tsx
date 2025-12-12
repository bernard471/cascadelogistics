import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import MyProfileSection from "@/components/dashboard/MyProfileSection";

export default function MyProfile() {
  return (
    <UserDashboardLayout activePage="profile">
      <MyProfileSection />
    </UserDashboardLayout>
  );
}

