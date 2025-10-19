import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveIframe } from "@/components/ui/responsive-iframe";
import { AuthGuard } from "@/components/auth/AuthGuard";

function WorkspacePage() {
  return (
    <AuthGuard sectionName="Workspace" sectionIcon="🏢">
      <DashboardLayout>
        <div className="animate-fadeIn">
          <ResponsiveIframe 
            src="https://workspace-fmteam.netlify.app/cronograma"
            title="Cronograma FMTEAM"
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default WorkspacePage;
