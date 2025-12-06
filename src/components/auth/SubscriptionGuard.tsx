import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { subscriptionService, SubscriptionStatus } from '@/lib/subscription-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requireActive?: boolean; // Se true, exige assinatura ativa. Se false, permite trial também
}

export function SubscriptionGuard({ children, requireActive = false }: SubscriptionGuardProps) {
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSubscription() {
      try {
        const status = await subscriptionService.checkSubscription();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        setSubscriptionStatus({
          isActive: false,
          plan: null,
          subscription: null,
          expiresAt: null,
          canAccess: false,
          reason: 'Erro ao verificar assinatura',
          isTrial: false,
          daysRemaining: null
        });
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-slate-400">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Se não tem acesso, mostrar tela de assinatura necessária
  if (!subscriptionStatus?.canAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl text-white">Assinatura Necessária</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {subscriptionStatus?.reason || 'Você precisa de uma assinatura ativa para acessar esta área'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionStatus?.isTrial && subscriptionStatus.daysRemaining !== null && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Trial Expirado</span>
                </div>
                <p className="text-sm text-slate-300">
                  Seu período de teste de 30 dias expirou. Escolha um plano para continuar usando a plataforma.
                </p>
              </div>
            )}

            {subscriptionStatus?.plan && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-1">Plano atual:</p>
                <p className="text-lg font-semibold text-white">{subscriptionStatus.plan.display_name}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/pricing')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Ver Planos
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se requireActive é true e está em trial, também bloquear
  if (requireActive && subscriptionStatus.isTrial) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl text-white">Upgrade Necessário</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Esta funcionalidade requer uma assinatura paga
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionStatus.daysRemaining !== null && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                  Você ainda tem <span className="font-semibold text-blue-400">{subscriptionStatus.daysRemaining} dias</span> de trial restantes.
                </p>
              </div>
            )}

            <Button
              onClick={() => navigate('/pricing')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ver Planos e Fazer Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tudo certo, renderizar children
  return <>{children}</>;
}



