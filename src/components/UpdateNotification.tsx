// Notificação de atualização agora é gerida principalmente pela navegação (seamless update)
// Este componente fica aqui apenas como fallback ou indicador visual discreto
import { useUpdateManager } from '@/hooks/use-update-manager';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpdateNotification() {
  const { isUpdatePending, applyUpdate } = useUpdateManager();

  if (!isUpdatePending) return null;

  // Mostra apenas um botão discreto no canto se houver atualização pendente
  // O usuário provavelmente nem vai clicar, pois ao navegar a atualização ocorrerá
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in duration-300">
      <Button
        size="sm"
        variant="outline"
        onClick={applyUpdate}
        className="bg-background/80 backdrop-blur-sm border-blue-500/30 hover:bg-blue-500/10 text-xs gap-2 shadow-sm"
      >
        <RefreshCw className="w-3 h-3 text-blue-500 animate-spin-slow" />
        <span className="text-muted-foreground">Nova versão pronta</span>
      </Button>
    </div>
  );
}
