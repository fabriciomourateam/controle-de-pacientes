import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Copy, Check, ExternalLink, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getOrCreatePatientToken, getPortalUrl } from '@/lib/patient-portal-service';

interface PortalLinkButtonProps {
  telefone: string;
  patientName: string;
}

export function PortalLinkButton({ telefone, patientName }: PortalLinkButtonProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isNewToken, setIsNewToken] = useState(false);

  useEffect(() => {
    if (showDialog && !portalUrl) {
      loadPortalUrl();
    }
  }, [showDialog]);

  const loadPortalUrl = async () => {
    setLoading(true);
    try {
      const result = await getOrCreatePatientToken(telefone);
      
      if (!result) {
        toast({
          title: 'Tabela não encontrada',
          description: 'Execute o SQL create_patient_portal_tokens.sql no Supabase primeiro. Verifique o console.',
          variant: 'destructive',
          duration: 8000
        });
        return;
      }

      const url = getPortalUrl(result.token);
      setPortalUrl(url);
      setIsNewToken(result.isNew);
      
      if (result.isNew) {
        toast({
          title: 'Link gerado!',
          description: 'Um novo link de acesso foi criado para o paciente',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar link do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o link do portal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'O link do portal foi copiado para a área de transferência',
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive'
      });
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá ${patientName}! 👋\n\n` +
      `Aqui está o link para você acessar seu Portal de Evolução personalizado:\n\n` +
      `${portalUrl}\n\n` +
      `Nele você pode:\n` +
      `📊 Ver todos os seus gráficos de evolução\n` +
      `🏆 Acompanhar suas conquistas\n` +
      `📈 Analisar seu progresso\n` +
      `💪 Ver suas fotos de transformação\n\n` +
      `Este link é pessoal e exclusivo seu. Você pode acessar quando quiser!\n\n` +
      `Continue firme! 💪✨`
    );
    
    window.open(`https://wa.me/${telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
    
    toast({
      title: 'WhatsApp aberto!',
      description: 'Mensagem pronta para enviar',
    });
  };

  const handleOpenPortal = () => {
    window.open(portalUrl, '_blank');
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
        >
          <Link2 className="w-4 h-4 mr-2" />
          Portal do Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Link2 className="w-6 h-6 text-purple-400" />
            Portal do Aluno
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Compartilhe este link com {patientName} para acesso pessoal à evolução
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <>
              {/* Informações do Portal */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🌐</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">O que é o Portal do Aluno?</h3>
                    <p className="text-sm text-slate-300">
                      Um link personalizado onde o aluno pode visualizar sua evolução completa: gráficos, 
                      conquistas, fotos de transformação e análises. É como a página de evolução, mas 
                      totalmente acessível pelo aluno, sem precisar de login!
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge de Status */}
              {isNewToken && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                  ✨ Link gerado agora
                </Badge>
              )}

              {/* Campo do Link Pessoal */}
              <div className="space-y-2">
                <Label htmlFor="portal-url" className="text-slate-300">
                  Link de Acesso Pessoal
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="portal-url"
                    value={portalUrl}
                    readOnly
                    className="bg-slate-800/50 border-slate-700 text-slate-200 font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-800"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-400" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Divisor */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-400">ou</span>
                </div>
              </div>

              {/* Link Universal */}
              <div className="space-y-2">
                <Label htmlFor="universal-url" className="text-slate-300 flex items-center gap-2">
                  🌐 Link Universal (para todos os alunos)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="universal-url"
                    value={`${window.location.origin}/portal`}
                    readOnly
                    className="bg-slate-800/50 border-slate-700 text-slate-200 font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      window.open(`${window.location.origin}/portal`, '_blank');
                      toast({
                        title: 'Portal aberto!',
                        description: 'Uma nova aba foi aberta com o portal de login',
                      });
                    }}
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Portal
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  💡 Com este link, cada aluno acessa digitando seu próprio telefone
                </p>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar via WhatsApp
                </Button>
                <Button
                  onClick={handleOpenPortal}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visualizar Portal
                </Button>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span>O link não expira e pode ser acessado a qualquer momento</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <span>Os dados são atualizados automaticamente</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  <span>O aluno não precisa de senha ou cadastro</span>
                </div>
              </div>

              {/* Nota de Segurança */}
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">
                  🔒 <strong>Privacidade:</strong> Este link é pessoal e mostra apenas os dados deste aluno. 
                  Recomendamos não compartilhar publicamente.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

