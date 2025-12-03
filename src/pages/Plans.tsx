import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PlansList } from "@/components/plans/PlansList";

export default function Plans() {
  return (
    <DashboardLayout>
      <PlansList />
    </DashboardLayout>
  );
}