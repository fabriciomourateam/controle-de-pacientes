import { useState, useEffect } from 'react';
import { subscriptionService, SubscriptionStatus } from '@/lib/subscription-service';

export function useSubscriptionCheck() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const subscriptionStatus = await subscriptionService.checkSubscription();
      setStatus(subscriptionStatus);
      
      // Mostrar modal de bloqueio se não tiver acesso (exceto se não estiver autenticado)
      // Se não está autenticado, o DashboardLayout vai redirecionar para login
      if (!subscriptionStatus.canAccess && subscriptionStatus.reason !== 'Usuário não autenticado') {
        setShowBlockedModal(true);
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      // Em caso de erro, liberar acesso (modo degradado)
      setStatus({
        isActive: true,
        plan: null,
        subscription: null,
        expiresAt: null,
        canAccess: true,
        isTrial: false,
        daysRemaining: null
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    showBlockedModal,
    canAccess: status?.canAccess ?? true,
    refetch: checkSubscription
  };
}
