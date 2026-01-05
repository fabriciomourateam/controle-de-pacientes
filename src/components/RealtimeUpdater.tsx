import { useRealtimeChanges } from '@/hooks/use-realtime-changes';

/**
 * Componente que apenas chama o hook useRealtimeChanges para ativar as subscriptions do Realtime
 * Não renderiza nada na tela - apenas mantém as subscriptions ativas
 */
export function RealtimeUpdater() {
  useRealtimeChanges(); // Ativar subscriptions do Realtime
  return null; // Não renderiza nada
}