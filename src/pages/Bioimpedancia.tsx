import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveIframe } from "@/components/ui/responsive-iframe";

function BioimpedanciaPage() {
  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        <ResponsiveIframe 
          src="https://inshape-premium.vercel.app/"
          title="InShape Premium - Avaliação Corporal"
        />
      </div>
    </DashboardLayout>
  );
}

export default BioimpedanciaPage;
