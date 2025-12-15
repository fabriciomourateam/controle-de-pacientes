import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "@/components/ui/global-search";
import { NotificationsPanel } from "@/components/ui/notifications-panel";
import { useSubscriptionCheck } from "@/hooks/use-subscription-check";
import { SubscriptionBlockedModal } from "@/components/subscription/SubscriptionBlockedModal";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { status, showBlockedModal } = useSubscriptionCheck();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        {/* Modal de bloqueio de assinatura */}
        <SubscriptionBlockedModal
          open={showBlockedModal}
          reason={status?.reason}
          isTrial={status?.isTrial}
          daysRemaining={status?.daysRemaining}
        />
        
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