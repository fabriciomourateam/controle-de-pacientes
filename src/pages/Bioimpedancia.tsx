import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveIframe } from "@/components/ui/responsive-iframe";
import { AuthGuard } from "@/components/auth/AuthGuard";

function BioimpedanciaPage() {
  return (
    <AuthGuard sectionName="Bioimpedância" sectionIcon="⚖️">
      <DashboardLayout>
        <div className="animate-fadeIn">
          <ResponsiveIframe 
            src="https://inshape-premium.vercel.app/"
            title="InShape Premium - Avaliação Corporal"
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default BioimpedanciaPage;
