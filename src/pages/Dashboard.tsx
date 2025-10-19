import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function Dashboard() {
  return (
    <AuthGuard sectionName="Dashboard" sectionIcon="🏠">
      <DashboardLayout>
        <DashboardOverview />
      </DashboardLayout>
    </AuthGuard>
  );
}