import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SubscriptionLimitAlertProps {
  currentCount: number;
  maxAllowed: number;
  planName: string;
  onDismiss?: () => void;
}

export function SubscriptionLimitAlert({
  currentCount,
  maxAllowed,
  planName,
  onDismiss
}: SubscriptionLimitAlertProps) {
  const navigate = useNavigate();
  const percentage = (currentCount / maxAllowed) * 100;
  const isAtLimit = currentCount >= maxAllowed;
  const isNearLimit = percentage >= 80;

  if (!isAtLimit && !isNearLimit) {
    return null;
  }

  return (
    <Alert
      className={`mb-4 ${
        isAtLimit
          ? 'bg-red-500/10 border-red-500/50'
          : 'bg-yellow-500/10 border-yellow-500/50'
      }`}
    >
      <AlertTriangle className={`h-4 w-4 ${isAtLimit ? 'text-red-400' : 'text-yellow-400'}`} />
      <AlertTitle className={isAtLimit ? 'text-red-400' : 'text-yellow-400'}>
        {isAtLimit ? 'Limite Atingido' : 'Limite Próximo'}
      </AlertTitle>
      <AlertDescription className="text-slate-300">
        <div className="space-y-3">
          <p>
            {isAtLimit
              ? `Você atingiu o limite de ${maxAllowed} pacientes do plano ${planName}.`
              : `Você está usando ${currentCount} de ${maxAllowed} pacientes (${percentage.toFixed(0)}%).`}
          </p>
          
          {isAtLimit && (
            <p className="text-sm">
              Para adicionar mais pacientes, faça upgrade do seu plano.
            </p>
          )}

          {isNearLimit && !isAtLimit && (
            <p className="text-sm">
              Considere fazer upgrade antes de atingir o limite.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/pricing')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}



