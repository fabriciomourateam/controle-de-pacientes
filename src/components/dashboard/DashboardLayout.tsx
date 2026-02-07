import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "@/components/ui/global-search";
import { NotificationsPanel } from "@/components/ui/notifications-panel";
import { useSubscriptionCheck } from "@/hooks/use-subscription-check";
import { SubscriptionBlockedModal } from "@/components/subscription/SubscriptionBlockedModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading: authLoading } = useAuthContext();
  const { status, showBlockedModal, loading: subscriptionLoading } = useSubscriptionCheck();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);
  
  // Não mostrar modal de bloqueio na página de pricing (para permitir escolher plano)
  const isPricingPage = location.pathname === '/pricing';
  
  // Mostrar loading enquanto verifica autenticação
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  // Se não está logado, não renderizar nada (vai redirecionar)
  if (!user) {
    return null;
  }

  const isBlockedBySubscription = showBlockedModal && !isPricingPage;

  // Quando assinatura inativa: não mostrar sidebar nem conteúdo do dashboard (evitar vazar dados de outro usuário)
  if (isBlockedBySubscription) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <SubscriptionBlockedModal
          open={true}
          reason={status?.reason}
          isTrial={status?.isTrial}
          daysRemaining={status?.daysRemaining}
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 sm:h-18 nav-premium sticky top-0 z-50 border-b border-slate-700/30">
            <div className="flex items-center justify-between h-full px-4 sm:px-8">
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger className="hover:bg-surface-hover hover:text-primary transition-colors" />
                <GlobalSearch />
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationsPanel />
              </div>
            </div>
          </header>

          {/* Main Content com gradiente sutil de fundo */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Gradiente decorativo de fundo */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none -z-10" />
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}