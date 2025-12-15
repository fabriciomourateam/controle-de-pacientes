import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/team-service';

interface ProtectedRouteProps {
  children: ReactNode;
  requirePermission?: {
    resource: string;
    action: string;
  };
  requireAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requirePermission,
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { user, profile } = useAuth();

  // Se não estiver autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se requer admin e não é admin, redireciona
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Se requer permissão específica, verifica
  if (requirePermission && profile) {
    const hasAccess = hasPermission(
      profile.permissions || {},
      requirePermission.resource,
      requirePermission.action
    );

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
