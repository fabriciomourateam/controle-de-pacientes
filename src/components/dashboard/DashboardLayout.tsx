import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "@/components/ui/global-search";
import { NotificationsPanel } from "@/components/ui/notifications-panel";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 sm:h-16 nav-premium sticky top-0 z-50">
            <div className="flex items-center justify-between h-full px-3 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger className="hover:bg-surface-hover hover:text-primary transition-colors" />
                <GlobalSearch />
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationsPanel />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}