import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { seedPopData } from "@/utils/seedPopData";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

export default function PopLayout() {
    useEffect(() => {
        const initData = async () => {
            try {
                await seedPopData();
            } catch (err) {
                console.error("Failed to seed POP data", err);
            }
        };
        initData();
    }, []);

    // We force a clean UI wrapper for the POP module, now including the standard sidebar.
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-slate-900 font-sans transition-colors duration-300">
                <AppSidebar />
                <div className="theme-light flex-1 flex flex-col w-full overflow-hidden bg-slate-50 text-slate-900">
                    <header className="bg-white/90 backdrop-blur-xl border-b border-indigo-100/50 sticky top-0 z-30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full">
                        <div className="px-6 sm:px-8 lg:px-10 h-24 flex items-center justify-between w-full relative overflow-hidden">
                            {/* Efeito de brilho de fundo no cabeçalho */}
                            <div className="absolute top-0 left-1/4 w-96 h-24 bg-blue-400/10 blur-3xl -z-10 rounded-full mix-blend-multiply"></div>

                            <div className="flex items-center gap-5">
                                <SidebarTrigger className="text-slate-400 hover:text-indigo-600 transition-colors scale-125" />
                                <div className="h-8 w-px bg-slate-200"></div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-black text-base tracking-widest relative overflow-hidden ring-4 ring-white">
                                        <span className="relative z-10">FM</span>
                                        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 transform -translate-y-1/2"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-400/40 blur-md rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight mb-0.5">
                                            Painel de Padronização
                                        </h1>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                                            <p className="text-xs text-slate-500 font-medium">
                                                Auditoria de Plano Alimentar
                                            </p>
                                        </div>
                                    </div>
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
