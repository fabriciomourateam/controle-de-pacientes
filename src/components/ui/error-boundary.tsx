
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        // Tenta limpar caches que podem estar causando loop de erro
        localStorage.removeItem('anamnesis-form-progress');
        // Recarregar a página
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Algo deu errado</h2>
                        <p className="text-slate-400 mb-6">
                            Ocorreu um erro inesperado ao carregar esta página. Tente recarregar para resolver.
                        </p>

                        {/* Detalhes técnicos apenas em desenvolvimento */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-left overflow-auto max-h-32">
                                <p className="text-red-400 text-xs font-mono break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={this.handleReload}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-base font-medium"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recarregar Página
                        </Button>

                        <p className="text-slate-600 text-xs mt-4">
                            Se o problema persistir, entre em contato com o suporte.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
