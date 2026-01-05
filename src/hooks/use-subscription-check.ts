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
      // Timeout de segurança: se demorar mais de 3 segundos, liberar acesso temporariamente
      const timeoutPromise = new Promise<SubscriptionStatus>((resolve) => {
        setTimeout(() => {
          resolve({
            isActive: true,
            plan: null,
            subscription: null,
            expiresAt: null,
            canAccess: true,
            isTrial: false,
            daysRemaining: null,
            reason: 'Timeout - verificando em background'
          });
        }, 3000);
      });
      
      const subscriptionPromise = subscriptionService.checkSubscription();
      const subscriptionStatus = await Promise.race([subscriptionPromise, timeoutPromise]);
      
      setStatus(subscriptionStatus);
      
      // Se o timeout venceu, continuar verificando em background
      if (subscriptionStatus.reason === 'Timeout - verificando em background') {
        subscriptionPromise.then((realStatus) => {
          setStatus(realStatus);
          if (!realStatus.canAccess && realStatus.reason !== 'Usuário não autenticado') {
            setShowBlockedModal(true);
          }
        }).catch(() => {
          // Ignorar erros em background
        });
      } else {
        // Mostrar modal de bloqueio se não tiver acesso (exceto se não estiver autenticado)
        if (!subscriptionStatus.canAccess && subscriptionStatus.reason !== 'Usuário não autenticado') {
          setShowBlockedModal(true);
        }
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
