
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
    children?: ReactNode;
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
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = "/";
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Ops! Algo deu errado.</h1>
                            <p className="text-slate-400 text-sm">
                                Encontramos um erro inesperado. Tente recarregar a página.
                            </p>
                            {this.state.error && (
                                <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 text-left overflow-auto max-h-32">
                                    <p className="text-xs font-mono text-red-400 break-all">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-center pt-2">
                            <Button
                                onClick={this.handleReload}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tentar Novamente
                            </Button>
                            <Button
                                variant="outline"
                                onClick={this.handleGoHome}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Início
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
