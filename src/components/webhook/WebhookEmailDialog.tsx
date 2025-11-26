import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth-helpers';
import { Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WebhookEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (email: string, userId: string) => Promise<void>;
  webhookType: 'autosync' | 'metrics' | 'commercial_metrics';
  title?: string;
  description?: string;
}

export function WebhookEmailDialog({
  open,
  onClose,
  onConfirm,
  webhookType,
  title = "Confirmar Email",
  description = "Digite seu email para confirmar e acionar o webhook"
}: WebhookEmailDialogProps) {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  // Carregar email do usuário logado
  useEffect(() => {
    async function loadUserEmail() {
      const user = await getCurrentUser();
      if (user?.email) {
        setUserEmail(user.email);
        setEmail(user.email); // Preencher automaticamente
      }
    }
    if (open) {
      loadUserEmail();
    }
  }, [open]);

  // Resetar ao fechar
  useEffect(() => {
    if (!open) {
      setEmail('');
      setLoading(false);
      setValidating(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu email",
        variant: "destructive"
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Erro",
        description: "Por favor, digite um email válido",
        variant: "destructive"
      });
      return;
    }

    setValidating(true);

    try {
      // Verificar se o email corresponde ao usuário logado
      const user = await getCurrentUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive"
        });
        setValidating(false);
        return;
      }

      if (user.email?.toLowerCase() !== email.toLowerCase()) {
        toast({
          title: "Email não corresponde",
          description: "O email digitado não corresponde ao seu email de login. Por favor, verifique.",
          variant: "destructive"
        });
        setValidating(false);
        return;
      }

      // Email válido, confirmar
      setLoading(true);
      await onConfirm(email, user.id);
      
    } catch (error: any) {
      console.error('Erro ao confirmar email:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar",
        variant: "destructive"
      });
      setLoading(false);
      setValidating(false);
    }
  };

  const isEmailValid = userEmail && email.toLowerCase() === userEmail.toLowerCase();

  // Debug: log quando o dialog deve abrir
  useEffect(() => {
    console.log('🔵 WebhookEmailDialog: Estado mudou', { open, userEmail, email });
    if (open) {
      console.log('🔵 WebhookEmailDialog: Dialog DEVE estar aberto agora!');
    }
  }, [open, userEmail, email]);

  // Forçar renderização quando open mudar
  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email do usuário logado (informação) */}
          {userEmail && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Seu email de login:</p>
              <p className="text-sm text-white font-medium">{userEmail}</p>
            </div>
          )}

          {/* Campo de email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Digite seu email para confirmar
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && !validating) {
                    handleConfirm();
                  }
                }}
                className="pl-10 bg-slate-700/50 border-slate-600/50 text-white"
                placeholder="seu@email.com"
                disabled={loading || validating}
                autoFocus
              />
            </div>
          </div>

          {/* Validação visual */}
          {email && (
            <Alert className={isEmailValid ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"}>
              {isEmailValid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    Email corresponde ao seu login. Você pode continuar.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-400">
                    O email digitado não corresponde ao seu email de login.
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}

          {/* Informação sobre isolamento */}
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
            <p className="text-xs text-blue-300">
              <strong>Segurança:</strong> O webhook será acionado apenas para o email informado, garantindo isolamento entre usuários.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading || validating}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || validating || !email || !isEmailValid}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading || validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {validating ? 'Validando...' : 'Acionando...'}
                </>
              ) : (
                'Confirmar e Acionar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

