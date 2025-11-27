import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveIframe } from "@/components/ui/responsive-iframe";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = 'fabriciomouratreinador@gmail.com';

function WorkspacePage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthorization() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthorized(user?.email === ADMIN_EMAIL);
      } catch (error) {
        console.error('Erro ao verificar autorização:', error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuthorization();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-slate-400">Verificando permissões...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

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
