import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Shield,
  Sparkles,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });

      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const { autoTrialService } = await import('@/lib/auto-trial-service');
        await autoTrialService.assignTrialToNewUser(data.user.id, email);
      }

      toast({
        title: "Sucesso",
        description: "Conta criada! Você tem 30 dias grátis para testar. Verifique seu e-mail para confirmar.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu e-mail",
        variant: "destructive",
      });
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });

      setResetPasswordMode(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar e-mail de recuperação",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-[#0a0e1a]" />

      {/* Mesh gradient background */}
      <div className="fixed inset-0 opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-400/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
              animation: `float ${6 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-fade-in-up-delay-1 {
          animation: fadeInUp 0.6s ease-out 0.15s forwards;
          opacity: 0;
        }
        .animate-fade-in-up-delay-2 {
          animation: fadeInUp 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }
        .input-glow:focus-within {
          box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.15), 0 0 20px rgba(251, 191, 36, 0.05);
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[440px] px-5 py-10">

        {/* Logo & Branding */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-amber-400/20 rounded-2xl blur-2xl scale-150" />
            <img
              src="/Logo.png"
              alt="My Shape"
              className="relative w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
            />
          </div>
          <div className="space-y-2">
            <img
              src="/Texto.png"
              alt="My Shape"
              className="h-10 object-contain mx-auto"
            />
            <p className="text-sm text-amber-200/60 tracking-[0.3em] uppercase font-light">
              Construindo Resultados
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="animate-fade-in-up-delay-1">
          <div className="relative group">
            {/* Card glow border */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-500/20 via-amber-400/5 to-transparent rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-white/[0.01] rounded-2xl backdrop-blur-xl" />

            <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/[0.06] p-8 shadow-2xl shadow-black/40">
              {/* Card Header */}
              <div className="text-center mb-7">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  {resetPasswordMode ? "Recuperar Senha" : "Bem-vindo de volta"}
                </h2>
                <p className="text-sm text-slate-400 mt-1.5">
                  {resetPasswordMode
                    ? "Digite seu e-mail para recuperar o acesso"
                    : "Entre com suas credenciais para continuar"
                  }
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-300 pl-1">
                    E-mail
                  </Label>
                  <div className="relative input-glow rounded-xl transition-all duration-300">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white rounded-xl placeholder:text-slate-500 focus:border-amber-500/30 focus:bg-white/[0.06] transition-all duration-300"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                {!resetPasswordMode && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-300 pl-1">
                      Senha
                    </Label>
                    <div className="relative input-glow rounded-xl transition-all duration-300">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 bg-white/[0.04] border-white/[0.08] text-white rounded-xl placeholder:text-slate-500 focus:border-amber-500/30 focus:bg-white/[0.06] transition-all duration-300"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!resetPasswordMode ? (
                  <div className="space-y-3 pt-2">
                    {/* Main Login Button */}
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Entrar
                    </Button>

                    {/* Create Account Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSignUp}
                      disabled={loading}
                      className="w-full h-12 bg-transparent border border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:border-white/[0.15] hover:text-white rounded-xl transition-all duration-300 font-medium text-sm"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2 text-amber-400/70" />
                      )}
                      Criar Conta Gratuita
                    </Button>

                    {/* Forgot Password */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setResetPasswordMode(true)}
                        className="text-xs text-slate-500 hover:text-amber-400/70 transition-colors duration-200"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <Button
                      type="button"
                      onClick={handleResetPassword}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Enviar E-mail de Recuperação
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResetPasswordMode(false)}
                      disabled={resetLoading}
                      className="w-full h-12 bg-transparent border border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:border-white/[0.15] hover:text-white rounded-xl transition-all duration-300 font-medium text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar ao Login
                    </Button>

                    <div className="p-3.5 bg-amber-500/[0.06] border border-amber-500/10 rounded-xl">
                      <p className="text-xs text-amber-200/70 leading-relaxed">
                        Um e-mail será enviado para <strong className="text-amber-200/90">{email || "seu e-mail"}</strong> com instruções para redefinir sua senha.
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="animate-fade-in-up-delay-2 mt-8">
          <div className="flex items-center justify-center gap-6 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500/50" />
              <span className="text-[11px]">Dados Seguros</span>
            </div>
            <div className="w-px h-3 bg-slate-700/50" />
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-500/50" />
              <span className="text-[11px]">30 dias grátis</span>
            </div>
            <div className="w-px h-3 bg-slate-700/50" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500/50" />
              <span className="text-[11px]">Premium</span>
            </div>
          </div>
        </div>

        {/* Back to Dashboard Link */}
        <div className="text-center mt-6 animate-fade-in-up-delay-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400/70 transition-colors duration-200"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
