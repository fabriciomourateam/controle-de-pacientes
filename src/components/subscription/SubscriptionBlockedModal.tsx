import { AlertTriangle, CreditCard, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubscriptionBlockedModalProps {
  open: boolean;
  reason?: string;
  isTrial?: boolean;
  daysRemaining?: number | null;
}

export function SubscriptionBlockedModal({ 
  open, 
  reason, 
  isTrial,
  daysRemaining 
}: SubscriptionBlockedModalProps) {
  
  const handleUpgrade = () => {
    // Redirecionar para página de planos interna
    window.location.href = '/pricing';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <DialogTitle className="text-2xl text-white">
              {isTrial ? 'Período de Trial Expirado' : 'Assinatura Inativa'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-300 text-base">
            {reason || 'Sua assinatura não está ativa.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isTrial && daysRemaining !== null && daysRemaining <= 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Seu trial de 30 dias terminou</h3>
              </div>
              <p className="text-sm text-slate-400">
                Para continuar usando o sistema, faça upgrade para um plano pago.
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">O que você ganha com o plano pago:</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">✓</Badge>
                Acesso ilimitado ao sistema
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">✓</Badge>
                Todos os recursos desbloqueados
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">✓</Badge>
                Suporte prioritário
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">✓</Badge>
                Atualizações automáticas
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Fazer Upgrade Agora
          </Button>

          <p className="text-xs text-center text-slate-400">
            Pagamento seguro via Kiwify • Cancele quando quiser
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
