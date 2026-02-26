import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { seedPopData } from "@/utils/seedPopData";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

export default function PopLayout() {
    useEffect(() => {
        seedPopData();
    }, []);

    // We force a clean UI wrapper for the POP module, now including the standard sidebar.
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-slate-900 font-sans transition-colors duration-300">
                <AppSidebar />
                <div className="theme-light flex-1 flex flex-col w-full overflow-hidden bg-slate-50 text-slate-900">
                    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm w-full">
                        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger className="mr-2 text-slate-500 hover:text-slate-900" />
                                <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
                                    FM
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold text-slate-900 leading-tight">POP Treinamento</h1>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Consultoria Esportiva</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium font-mono hidden sm:block">
                                    SaaS Interno
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
