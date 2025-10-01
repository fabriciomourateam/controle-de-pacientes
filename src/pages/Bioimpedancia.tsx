import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

function BioimpedanciaPage() {
  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        {/* Iframe Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
          <iframe 
            src="https://inshape-premium.vercel.app/"
            width="100%"
            height="1200px"
            frameBorder="0"
            title="InShape Premium - Avaliação Corporal"
            className="w-full h-[1200px]"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default BioimpedanciaPage;
