import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PlansList } from "@/components/plans/PlansList";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function Plans() {
  return (
    <AuthGuard sectionName="Planos" sectionIcon="📋">
      <DashboardLayout>
        <PlansList />
      </DashboardLayout>
    </AuthGuard>
  );
}