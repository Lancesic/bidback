import { OwnerContactQueue } from "@/components/owner-contact-queue";
import { OwnerDashboard } from "@/components/owner-dashboard";
import { OwnerDashboardStyles } from "@/components/owner-dashboard-styles";

export default function OwnerPage() {
  return (
    <>
      <OwnerDashboardStyles />
      <OwnerDashboard />
      <OwnerContactQueue />
    </>
  );
}
