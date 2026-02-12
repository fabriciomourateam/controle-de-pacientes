import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  BarChart3,
  MessageSquare,
  Target,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Brain,
  FileText,
  Smartphone,
  Clock,
  Award,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth-helpers';
import { subscriptionService } from '@/lib/subscription-service';
import { useToast } from '@/hooks/use-toast';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    checkAuth();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const plans = await subscriptionService.getPlans();
      const freePlan = plans.find(p => p.name === 'free');

      if (!freePlan) {
        toast({
          title: 'Erro',
          description: 'Plano gratuito não encontrado',
          variant: 'destructive'
        });
        return;
      }

      await subscriptionService.createTrialSubscription(freePlan.id);
      toast({
        title: 'Trial iniciado!',
        description: 'Você tem 30 dias grátis para testar a plataforma.',
      });
      navigate('/');
    } catch (error: any) {
      if (error.message.includes('já possui assinatura')) {
        toast({
          title: 'Atenção',
          description: 'Você já possui uma assinatura ativa.',
        });
        navigate('/');
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível iniciar o trial. Tente novamente.',
          variant: 'destructive'
        });
      }
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Gestão Completa de Pacientes',
      description: 'Organize todos os seus pacientes em um só lugar com histórico completo e fácil acesso.',
      accent: 'from-amber-500 to-orange-500',
      glow: 'amber',
    },
    {
      icon: MessageSquare,
      title: 'Check-ins Inteligentes',
      description: 'Acompanhe o progresso dos seus pacientes em tempo real com check-ins diários personalizados.',
      accent: 'from-blue-500 to-cyan-500',
      glow: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Evolução Visual',
      description: 'Gráficos e análises detalhadas mostrando a evolução completa do paciente ao longo do tempo.',
      accent: 'from-emerald-500 to-green-500',
      glow: 'emerald',
    },
    {
      icon: Target,
      title: 'Planos Personalizados',
      description: 'Crie planos de dieta e treino sob medida com calculadora TMB/GET integrada.',
      accent: 'from-rose-500 to-pink-500',
      glow: 'rose',
    },
    {
      icon: BarChart3,
      title: 'Dashboard de Métricas',
      description: 'MRR, ARPU, Churn Rate e muito mais. Tudo em um dashboard completo e intuitivo.',
      accent: 'from-indigo-500 to-blue-500',
      glow: 'indigo',
    },
    {
      icon: AlertTriangle,
      title: 'Sistema de Retenção',
      description: 'Identifique pacientes em risco e tome ações preventivas automaticamente.',
      accent: 'from-amber-400 to-yellow-500',
      glow: 'amber',
    },
    {
      icon: Brain,
      title: 'Análise com IA',
      description: 'Insights inteligentes sobre composição corporal, tendências e recomendações.',
      accent: 'from-fuchsia-500 to-pink-500',
      glow: 'fuchsia',
    },
    {
      icon: Smartphone,
      title: 'Portal do Paciente',
      description: 'Seus pacientes têm acesso ao próprio portal para visualizar evolução e conquistas.',
      accent: 'from-cyan-500 to-teal-500',
      glow: 'cyan',
    },
    {
      icon: FileText,
      title: 'Relatórios Profissionais',
      description: 'Gere relatórios completos e profissionais para seus pacientes com um clique.',
      accent: 'from-slate-400 to-slate-500',
      glow: 'slate',
    }
  ];

  const benefits = [
    'Economize horas por dia na organização',
    'Aumente a retenção de pacientes em até 40%',
    'Tenha insights valiosos sobre seu negócio',
    'Profissionalize seu atendimento',
    'Escale seu consultório sem perder qualidade',
    'Foque no que realmente importa: seus pacientes'
  ];

  const stats = [
    { value: '+40%', label: 'Retenção', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
    { value: '-15h', label: 'Semana', icon: Clock, color: 'from-blue-500 to-cyan-500' },
    { value: '100%', label: 'Profissional', icon: Award, color: 'from-emerald-500 to-green-500' },
  ];

  return (
    <div className="min-h-screen relative bg-[#0a0e1a]">
      {/* Global Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-25px); opacity: 0.6; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s ease-out forwards;
        }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
        .text-gradient-gold {
          background: linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Background Effects (persistent) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-amber-500/[0.07] via-amber-600/[0.03] to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-blue-600/[0.06] via-cyan-500/[0.03] to-transparent blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[50%] left-[60%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-amber-400/[0.04] to-transparent blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        {/* Particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/30"
            style={{
              left: `${10 + i * 12}%`,
              top: `${5 + (i % 4) * 25}%`,
              animation: `float ${5 + i * 1.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* ========== HEADER ========== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/30'
        : 'bg-transparent'
        }`}>
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/Logo.png"
                alt="My Shape"
                className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
              />
              <div className="flex flex-col">
                <img
                  src="/Texto.png"
                  alt="My Shape"
                  className="h-8 object-contain"
                />
                <p className="text-[9px] text-amber-400/80 tracking-[0.2em] uppercase text-center -mt-0.5">Construindo Resultados</p>
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-xl"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Ver Planos
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-xl"
                  >
                    Entrar
                  </Button>
                  <Button
                    onClick={handleStartTrial}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105"
                  >
                    <Zap className="w-4 h-4 mr-1.5" />
                    Começar Grátis
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Hero-specific glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-500/[0.08] to-transparent blur-3xl rounded-full" />

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-amber-500/[0.08] border border-amber-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-200/80">A plataforma que transforma nutricionistas</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/60" />
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up delay-1 text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              O Controle que{' '}
              <span className="text-gradient-gold">
                Transforma
              </span>
              <br />
              sua Prática Profissional
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-in-up delay-2 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Organize pacientes, acompanhe evoluções, gere insights com IA e escale seu negócio.
              Tudo em uma plataforma <span className="text-slate-300 font-medium">moderna e intuitiva</span>.
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={handleStartTrial}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 text-base font-semibold px-8 py-6 h-auto rounded-xl shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/35 transition-all duration-300 hover:scale-105 active:scale-[0.98]"
              >
                <Zap className="w-5 h-5 mr-2" />
                Começar Trial de 30 Dias Grátis
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="border border-white/[0.1] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] text-base px-8 py-6 h-auto rounded-xl transition-all duration-300"
              >
                Ver Planos e Preços
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="animate-fade-in-up delay-4 flex flex-wrap items-center justify-center gap-8 pt-6">
              {[
                { icon: Shield, text: 'Sem cartão de crédito' },
                { icon: CheckCircle2, text: '30 dias grátis' },
                { icon: Sparkles, text: 'Cancele quando quiser' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-500">
                  <item.icon className="w-4 h-4 text-amber-500/60" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS BAR ========== */}
      <section className="relative py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/20 via-white/[0.05] to-amber-500/20 rounded-2xl" />
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/[0.04] p-8">
              <div className="grid grid-cols-3 gap-8">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="text-center space-y-2">
                      <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} items-center justify-center mb-2 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-slate-400">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Funcionalidades</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Tudo para{' '}
              <span className="text-gradient-gold">revolucionar</span>
              {' '}seu consultório
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Funcionalidades poderosas que economizam seu tempo e aumentam seus resultados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="card-hover group relative"
                >
                  <div className="absolute -inset-[1px] bg-gradient-to-b from-white/[0.06] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                  <Card className="relative bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] rounded-2xl overflow-hidden transition-colors duration-400">
                    <CardContent className="p-7">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-200/90 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== WHY MY SHAPE ========== */}
      <section className="relative py-24 px-6">
        {/* Section glow */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-amber-500/[0.05] to-transparent blur-3xl" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Diferencial</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Por que nutricionistas{' '}
                  <span className="text-gradient-gold">escolhem</span>
                  {' '}a My Shape?
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Não é apenas um software. É uma transformação completa na forma como você gerencia seu consultório.
                </p>
              </div>

              <div className="space-y-3.5">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3.5 group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mt-0.5 shadow-md shadow-amber-500/20 group-hover:shadow-lg group-hover:shadow-amber-500/30 transition-shadow">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-base text-slate-300 group-hover:text-white transition-colors">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
              <div className="relative space-y-4">
                {[
                  { icon: TrendingUp, value: '+40% Retenção', desc: 'Aumento médio na retenção de pacientes', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
                  { icon: Clock, value: '-15h/semana', desc: 'Tempo economizado em organização', color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                  { icon: Award, value: '100% Profissional', desc: 'Relatórios e análises de nível empresarial', color: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="group relative">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-white/[0.05] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-5 p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-colors">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg ${item.shadow}`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{item.value}</h3>
                          <p className="text-sm text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Simples e Rápido</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Como{' '}
              <span className="text-gradient-gold">Funciona</span>
            </h2>
            <p className="text-lg text-slate-400">
              Em 3 passos simples, você está pronto para transformar seu consultório
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Cadastre-se Grátis',
                description: 'Crie sua conta em segundos. Sem cartão de crédito. Comece seu trial de 30 dias agora mesmo.',
                icon: Shield,
                accent: 'from-amber-500 to-orange-500',
              },
              {
                step: '02',
                title: 'Organize seus Pacientes',
                description: 'Importe ou cadastre seus pacientes. Tudo organizado e acessível em um só lugar.',
                icon: Users,
                accent: 'from-blue-500 to-cyan-500',
              },
              {
                step: '03',
                title: 'Transforme seu Negócio',
                description: 'Acompanhe evoluções, gere insights e escale seu consultório com dados reais.',
                icon: TrendingUp,
                accent: 'from-emerald-500 to-green-500',
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="card-hover group relative">
                  <div className="absolute -inset-[1px] bg-gradient-to-b from-white/[0.06] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Card className="relative bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] rounded-2xl h-full transition-colors">
                    <CardContent className="p-8">
                      <div className="text-6xl font-black text-white/[0.08] mb-4 tracking-tighter">{item.step}</div>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-200/90 transition-colors">{item.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* CTA Background glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-amber-500/[0.08] via-amber-400/[0.04] to-amber-500/[0.08] blur-3xl rounded-full" />
        </div>

        <div className="container mx-auto max-w-3xl text-center relative z-10 space-y-8">
          {/* Logo as visual anchor */}
          <div className="relative inline-block mb-2">
            <div className="absolute inset-0 bg-amber-400/15 rounded-2xl blur-2xl scale-150" />
            <img
              src="/Logo.png"
              alt="My Shape"
              className="relative w-32 h-32 object-contain mx-auto drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]"
            />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Pronto para{' '}
            <span className="text-gradient-gold">transformar</span>
            {' '}seu consultório?
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Junte-se a nutricionistas que já estão revolucionando sua prática profissional
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleStartTrial}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 text-base font-semibold px-8 py-6 h-auto rounded-xl shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/35 transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 mr-2" />
              Começar Trial Grátis Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="border border-white/[0.1] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] text-base px-8 py-6 h-auto rounded-xl transition-all duration-300"
            >
              Ver Planos e Preços
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="relative py-10 px-6 border-t border-white/[0.04]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Footer Logo */}
            <div className="flex items-center gap-2.5">
              <img
                src="/Logo.png"
                alt="My Shape"
                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
              />
              <div className="flex flex-col">
                <img
                  src="/Texto.png"
                  alt="My Shape"
                  className="h-6 object-contain"
                />
                <p className="text-[8px] text-amber-400/70 tracking-[0.2em] uppercase text-center">Construindo Resultados</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm">
              © 2025 My Shape. Transformando objetivos em resultados reais.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
