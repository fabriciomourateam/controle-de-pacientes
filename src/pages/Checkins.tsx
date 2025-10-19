import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CheckinsList } from "@/components/checkins/CheckinsList";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function Checkins() {
  return (
    <AuthGuard sectionName="Checkins" sectionIcon="📋">
      <DashboardLayout>
        <CheckinsList />
      </DashboardLayout>
    </AuthGuard>
  );
}


























