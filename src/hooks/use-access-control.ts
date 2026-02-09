import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { userAccessService, AccessRoutes } from '@/lib/user-access-service';

const ADMIN_EMAIL = 'fabriciomouratreinador@gmail.com';

/**
 * Hook para verificar se o usuario logado tem acesso a rotas restritas.
 * Admin sempre tem acesso total.
 * Owners verificam na tabela user_access_control.
 * Se nao tiver registro, nao tem acesso (padrao false).
 */
export function useAccessControl() {
  const { profile, isOwner } = useAuthContext();
  const [access, setAccess] = useState<AccessRoutes>({
    route_metrics: false,
    route_commercial_metrics: false,
    route_reports: false,
    route_plans: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Admin tem acesso total
        if (profile?.email === ADMIN_EMAIL) {
          setAccess({
            route_metrics: true,
            route_commercial_metrics: true,
            route_reports: true,
            route_plans: true,
          });
          return;
        }

        // Buscar acessos do usuario
        const routes = await userAccessService.getMyAccess();
        setAccess(routes);
      } catch (error) {
        console.error('Erro ao carregar acessos:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profile?.id) {
      load();
    }
  }, [profile?.id, profile?.email]);

  /**
   * Verifica se o usuario pode acessar uma rota especifica
   */
  const canAccess = (route: string): boolean => {
    // Admin sempre pode
    if (profile?.email === ADMIN_EMAIL) return true;

    switch (route) {
      case '/metrics': return access.route_metrics;
      case '/commercial-metrics': return access.route_commercial_metrics;
      case '/reports': return access.route_reports;
      case '/plans': return access.route_plans;
      default: return true;
    }
  };

  return { access, loading, canAccess };
}
