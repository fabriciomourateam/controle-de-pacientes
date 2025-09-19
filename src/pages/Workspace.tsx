import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

function WorkspacePage() {
  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* Iframe Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
          <iframe 
            src="https://workspace-fmteam.netlify.app/cronograma"
            width="100%"
            height="900px"
            frameBorder="0"
            title="Cronograma FMTEAM"
            className="w-full h-[900px]"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default WorkspacePage;
