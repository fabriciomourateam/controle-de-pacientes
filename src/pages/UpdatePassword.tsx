import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2 } from "lucide-react";

export default function UpdatePassword() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        // Escuta mudanças de hash para lidar com o token de recuperação, caso necessário logo de início
        const handleHash = async () => {
            const hash = window.location.hash;
            if (hash && hash.includes("type=recovery")) {
                // Redirecionamento da recuperação capturado validamente
                console.log("Token de recuperação de senha detectado.");
            }
        };
        handleHash();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || password.length < 6) {
            toast({
                title: "Erro",
                description: "Sua nova senha deve ter pelo menos 6 caracteres",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            toast({
                title: "Senha atualizada!",
                description: "Sua senha foi redefinida com sucesso. Você já pode usar a plataforma.",
            });

            // Redireciona para o login para que o usuário entre novamente com segurança ou direto pro dashboard se a sessão da recuperação cobrir certinho
            navigate("/");
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message || "Erro ao atualizar senha. O link pode ter expirado.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.06] p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Criar Nova Senha</h2>
                    <p className="text-slate-400 text-sm">Digite uma nova senha segura para a sua conta.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Nova Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-12 bg-white/[0.04] border-white/[0.08] text-white rounded-xl placeholder:text-slate-500 focus:border-amber-500/30"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold rounded-xl"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                        Atualizar e Entrar
                    </Button>
                </form>
            </div>
        </div>
    );
}
