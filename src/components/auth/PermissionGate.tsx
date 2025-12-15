import { ReactNode } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

interface PermissionGateProps {
  children: ReactNode;
  resource: string;
  action?: string;
  fallback?: ReactNode;
}

/**
 * Componente para controlar visibilidade de elementos baseado em permissões
 * 
 * @example
 * <PermissionGate resource="patients" action="delete">
 *   <Button>Deletar Paciente</Button>
 * </PermissionGate>
 */
export function PermissionGate({ 
  children, 
  resource, 
  action,
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission } = useAuthContext();

  const hasAccess = hasPermission(resource, action);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
