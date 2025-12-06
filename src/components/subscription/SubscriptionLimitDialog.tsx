import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  maxAllowed: number;
  planName: string;
}

export function SubscriptionLimitDialog({
  open,
  onOpenChange,
  currentCount,
  maxAllowed,
  planName
}: SubscriptionLimitDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-slate-700">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <DialogTitle className="text-2xl text-white text-center">
            Limite de Pacientes Atingido
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-center mt-2">
            Você atingiu o limite de <strong className="text-white">{maxAllowed} pacientes</strong> do plano <strong className="text-white">{planName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Pacientes cadastrados:</span>
              <span className="text-white font-semibold">{currentCount} / {maxAllowed}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <p className="text-sm text-slate-300 text-center">
            Para adicionar mais pacientes, faça upgrade do seu plano.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Fechar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate('/pricing');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Ver Planos e Fazer Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



