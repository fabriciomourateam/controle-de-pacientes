import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CreditCard, Zap, Crown, Sparkles } from 'lucide-react';
import { subscriptionService, SubscriptionPlan } from '@/lib/subscription-service';
import { kiwifyService } from '@/lib/kiwify-service';
import { getCurrentUser } from '@/lib/auth-helpers';
import { useToast } from '@/hooks/use-toast';

export default function Pricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscription] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription()
      ]);
      setPlans(plansData);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    try {
      setProcessingPlan(plan.id);

      const user = await getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Se for plano gratuito, criar trial
      if (plan.name === 'free') {
        try {
          await subscriptionService.createTrialSubscription(plan.id);
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
          } else {
            throw error;
          }
        }
        return;
      }

      // Para planos pagos, redirecionar para Kiwify
      // O productId será obtido automaticamente do kiwifyConfig baseado no nome do plano
      const checkout = await kiwifyService.createCheckout(
        '', // Será obtido automaticamente do config
        user.id,
        user.email || '',
        plan.name
      );

      // Abrir checkout em nova aba
      window.open(checkout.url, '_blank');
      
      toast({
        title: 'Redirecionando...',
        description: 'Você será redirecionado para finalizar o pagamento.',
      });
    } catch (error: any) {
      console.error('Erro ao processar plano:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar o plano selecionado.',
        variant: 'destructive'
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free':
        return <Sparkles className="w-6 h-6" />;
      case 'basic':
        return <Zap className="w-6 h-6" />;
      case 'intermediate':
        return <CreditCard className="w-6 h-6" />;
      case 'advanced':
        return <Crown className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'basic':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'intermediate':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
      case 'advanced':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      default:
        return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
    }
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    if (!currentSubscription) return false;
    return currentSubscription.subscription_plan_id === plan.id && 
           (currentSubscription.status === 'active' || currentSubscription.status === 'trial');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-slate-400">Carregando planos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Escolha seu Plano</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Planos flexíveis para nutricionistas de todos os tamanhos.
            <br />
            Comece grátis e faça upgrade quando precisar.
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans
            .filter(plan => plan.name !== 'start' && plan.name !== 'basic') // Ocultar plano Start/Basic
            .map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const isFree = plan.name === 'free';
            const yearlyPrice = plan.price_yearly ? plan.price_yearly / 10 : null; // Preço mensal no anual
            
            // Definir features customizadas para Silver e Black
            let customFeatures = plan.features;
            if (plan.name === 'silver' || plan.name === 'intermediate') {
              customFeatures = [
                'Até 99 pacientes',
                'Check-ins Ilimitados',
                'Automação que gera resultado do Check-in',
                'Bioimpedância dos Pacientes',
                'Dashboard de Pacientes',
                'Cadastro de Fotos e Dados Antropométricos',
                'Comparativos de Fotos Antes e Depois',
                'Relatórios exportáveis (PDF/Excel)',
                'Templates de Mensagens',
                'Automações Básicas'
              ];
            } else if (plan.name === 'black' || plan.name === 'advanced') {
              customFeatures = [
                'Pacientes Ilimitados',
                'Check-ins Ilimitados',
                'Automação que gera resultado do Check-in',
                'Bioimpedância dos Pacientes',
                'Dashboard de Pacientes',
                'Cadastro de Fotos e Dados Antropométricos',
                'Comparativos de Fotos Antes e Depois',
                'Dashboard de Métricas Comerciais',
                'Dashboard de Métricas Operacionais',
                'Relatórios exportáveis (PDF/Excel)',
                'Templates de Mensagens',
                'Automações Avançadas',
                'API Personalizado'
              ];
            }

            return (
              <Card
                key={plan.id}
                className={`relative bg-gradient-to-br ${getPlanColor(plan.name)} border-2 transition-all duration-300 hover:scale-105 ${
                  isCurrent ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white">
                    Plano Atual
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl text-white">{plan.display_name}</CardTitle>
                  <CardDescription className="text-slate-300 mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Preço */}
                  <div className="text-center">
                    {isFree ? (
                      <div>
                        <div className="text-4xl font-bold text-white">Grátis</div>
                        <p className="text-sm text-slate-400 mt-1">30 dias de trial</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-3xl font-bold text-white">R$</span>
                          <span className="text-5xl font-bold text-white">{plan.price_monthly.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">por mês</p>
                        {yearlyPrice && (
                          <p className="text-xs text-green-400 mt-1">
                            R$ {yearlyPrice.toFixed(2).replace('.', ',')}/mês no anual
                            <span className="text-slate-500 ml-1">(2 meses grátis)</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Limites */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Pacientes:</span>
                      <span className="text-white font-semibold">
                        {plan.max_patients === null ? 'Ilimitado' : `Até ${plan.max_patients}`}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {customFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Botão */}
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || processingPlan === plan.id}
                    className={`w-full ${
                      isCurrent
                        ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                        : plan.name === 'advanced'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : isCurrent ? (
                      'Plano Atual'
                    ) : isFree ? (
                      'Iniciar Trial Grátis'
                    ) : (
                      'Assinar Agora'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Informações adicionais */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-2">✓</div>
                <p className="text-sm text-slate-400">Cancelamento a qualquer momento</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-2">✓</div>
                <p className="text-sm text-slate-400">Suporte por email</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-2">✓</div>
                <p className="text-sm text-slate-400">Atualizações automáticas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

