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
  Calendar,
  Activity,
  Brain,
  FileText,
  Smartphone,
  Clock,
  Award,
  Heart,
  LineChart,
  AlertTriangle,
  Monitor
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
    
    // Verificar se está autenticado
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
      // Buscar plano gratuito
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
      description: 'Organize todos os seus pacientes em um só lugar. Histórico completo, dados organizados e fácil acesso.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: MessageSquare,
      title: 'Check-ins Inteligentes',
      description: 'Sistema de check-ins diários que permite acompanhar o progresso dos seus pacientes em tempo real.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: LineChart,
      title: 'Evolução Visual',
      description: 'Gráficos e análises detalhadas mostrando a evolução completa do paciente ao longo do tempo.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Planos Personalizados',
      description: 'Crie planos de dieta e treino personalizados para cada paciente com calculadora TMB/GET integrada.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: BarChart3,
      title: 'Dashboard de Métricas',
      description: 'Acompanhe métricas operacionais e comerciais. MRR, ARPU, Churn Rate e muito mais.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: AlertTriangle,
      title: 'Sistema de Retenção',
      description: 'Identifique pacientes em risco de cancelamento e tome ações preventivas automaticamente.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Brain,
      title: 'Análise com IA',
      description: 'Insights inteligentes sobre composição corporal, tendências e recomendações personalizadas.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Smartphone,
      title: 'Portal do Paciente',
      description: 'Seus pacientes têm acesso ao próprio portal para visualizar evolução e conquistas.',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: FileText,
      title: 'Relatórios Profissionais',
      description: 'Gere relatórios completos e profissionais para seus pacientes com um clique.',
      color: 'from-violet-500 to-purple-500'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Fixo */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-blue-600/30 rounded-xl flex items-center justify-center border border-blue-500/40 shadow-lg shadow-blue-500/20">
                  <LineChart className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-cyan-400 tracking-tight">
                  Grow Nutri
                </h1>
                <p className="text-xs text-slate-400">Gestão de Pacientes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="text-slate-300 hover:text-white"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    Ver Planos
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-slate-300 hover:text-white"
                  >
                    Entrar
                  </Button>
                  <Button
                    onClick={handleStartTrial}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    Começar Grátis
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Transforme seu consultório em minutos</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              O Controle que{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                Transforma
              </span>
              <br />
              sua Prática como Nutricionista
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Organize pacientes, acompanhe evoluções, gere insights e escale seu negócio. 
              Tudo em uma plataforma moderna e intuitiva.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={handleStartTrial}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5 mr-2" />
                Começar Trial de 30 Dias Grátis
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-lg px-8 py-6 h-auto hover:border-slate-500 transition-all duration-300"
              >
                Ver Planos e Preços
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>30 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tudo que você precisa para{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                revolucionar
              </span>{' '}
              seu consultório
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Funcionalidades poderosas que economizam seu tempo e aumentam seus resultados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Por que nutricionistas{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  escolhem
                </span>{' '}
                a Grow Nutri?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Não é apenas um software. É uma transformação completa na forma como você gerencia seu consultório.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg text-slate-300">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-slate-800/80 border-slate-700 backdrop-blur-md p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">+40% Retenção</h3>
                      <p className="text-slate-400">Aumento médio na retenção de pacientes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">-15h/semana</h3>
                      <p className="text-slate-400">Tempo economizado em organização</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">100% Profissional</h3>
                      <p className="text-slate-400">Relatórios e análises de nível empresarial</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Como{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Funciona
              </span>
            </h2>
            <p className="text-xl text-slate-400">
              Em 3 passos simples, você está pronto para transformar seu consultório
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Cadastre-se Grátis',
                description: 'Crie sua conta em segundos. Sem cartão de crédito. Comece seu trial de 30 dias agora mesmo.',
                icon: Shield
              },
              {
                step: '02',
                title: 'Organize seus Pacientes',
                description: 'Importe ou cadastre seus pacientes. Tudo organizado e acessível em um só lugar.',
                icon: Users
              },
              {
                step: '03',
                title: 'Transforme seu Negócio',
                description: 'Acompanhe evoluções, gere insights e escale seu consultório com dados reais.',
                icon: TrendingUp
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  <Card className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 h-full">
                    <CardContent className="p-8">
                      <div className="text-6xl font-bold text-slate-700 mb-4">{item.step}</div>
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Pronto para{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                transformar
              </span>{' '}
              seu consultório?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Junte-se a nutricionistas que já estão revolucionando sua prática profissional
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={handleStartTrial}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5 mr-2" />
                Começar Trial Grátis Agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-lg px-8 py-6 h-auto hover:border-slate-500 transition-all duration-300"
              >
                Ver Planos e Preços
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-blue-600/30 rounded-xl flex items-center justify-center border border-blue-500/40 shadow-lg shadow-blue-500/20">
                  <LineChart className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-cyan-400 tracking-tight">
                  Grow Nutri
                </h1>
                <p className="text-xs text-slate-400">Gestão de Pacientes</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              © 2025 Grow Nutri. Transformando consultórios de nutrição.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

