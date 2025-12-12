import UserDashboardLayout from "@/components/dashboard/UserDashboardLayout";
import SubmitPaymentProofSection from "@/components/dashboard/SubmitPaymentProofSection";

export default function PaymentProofPage() {
  return (
    <UserDashboardLayout activePage="payment-proof">
      <SubmitPaymentProofSection />
    </UserDashboardLayout>
  );
}
