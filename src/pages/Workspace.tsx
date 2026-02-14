import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { WeeklyPlanner } from "@/components/workspace/WeeklyPlanner";

function WorkspacePage() {
  return (
    <AuthGuard sectionName="Workspace" sectionIcon="🏢">
      <DashboardLayout>
        <div className="animate-fadeIn h-[calc(100vh-100px)] p-2">
          <WeeklyPlanner />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default WorkspacePage;
