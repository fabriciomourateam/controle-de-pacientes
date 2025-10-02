import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveIframe } from "@/components/ui/responsive-iframe";

function WorkspacePage() {
  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        <ResponsiveIframe 
          src="https://workspace-fmteam.netlify.app/cronograma"
          title="Cronograma FMTEAM"
        />
      </div>
    </DashboardLayout>
  );
}

export default WorkspacePage;
