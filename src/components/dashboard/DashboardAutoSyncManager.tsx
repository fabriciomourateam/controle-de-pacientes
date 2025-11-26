import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth-helpers';
import { WebhookEmailDialogSimple } from '@/components/webhook/WebhookEmailDialogSimple';
import { getUserWebhookUrl } from '@/lib/webhook-config-service';
import { 
  RefreshCw,
  CheckCircle,
  Loader2
} from 'lucide-react';

export function DashboardAutoSyncManager() {
  const [syncing, setSyncing] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  // Carregar user_id e última sincronização ao montar
  useEffect(() => {
    async function loadUserData() {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        // Carregar última sincronização específica do usuário
        const saved = localStorage.getItem(`lastDashboardSync_${user.id}`);
        if (saved) {
          setLastSync(new Date(saved));
        }
      }
    }
    loadUserData();
  }, []);

  // Abrir dialog de confirmação de email
  const handleSyncClick = () => {
    console.log('🟢 DashboardAutoSyncManager: handleSyncClick chamado, abrindo dialog de email');
    setShowEmailDialog(true);
    console.log('🟢 DashboardAutoSyncManager: showEmailDialog definido como true');
  };

  // Executar sincronização via webhook N8N (após confirmação de email)
  const syncDashboard = async (confirmedEmail: string, confirmedUserId: string) => {
    setSyncing(true);
    setShowEmailDialog(false);
    
    try {
      // Buscar URL de webhook personalizada do usuário
      const webhookUrl = await getUserWebhookUrl('autosync');
      
      if (!webhookUrl) {
        toast({
          title: "Webhook não configurado",
          description: "Você precisa configurar sua URL de webhook primeiro. Entre em contato com o suporte.",
          variant: "destructive"
        });
        setSyncing(false);
        return;
      }
      
      console.log('🔗 Usando webhook URL:', webhookUrl);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: confirmedUserId, // ⚠️ IMPORTANTE: Isolar por usuário
          user_email: confirmedEmail, // Email confirmado pelo usuário
          timestamp: new Date().toISOString(),
          source: 'dashboard',
          webhook_type: 'autosync'
        })
      });

      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }

      const now = new Date();
      setLastSync(now);
      // Salvar última sincronização isolada por usuário
      if (confirmedUserId) {
        localStorage.setItem(`lastDashboardSync_${confirmedUserId}`, now.toISOString());
      }
      
      toast({
        title: "Sincronização iniciada! ✅",
        description: `Webhook acionado para ${confirmedEmail}`,
      });
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível conectar ao N8N",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-400" />
          Sincronização do Dashboard
        </CardTitle>
        <CardDescription className="text-slate-400">
          Sincronize as métricas do dashboard via N8N
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">Status:</span>
            <Badge variant={syncing ? "default" : "secondary"}>
              {syncing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Sincronizando
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Pronto
                </>
              )}
            </Badge>
          </div>
          
          {lastSync && (
            <div className="text-xs text-slate-400">
              Última sync: {lastSync.toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-sm text-slate-300">
            Clique no botão abaixo para iniciar a sincronização das métricas do dashboard através do seu webhook N8N configurado.
          </p>
        </div>

        {/* Botão de Sincronização */}
        <Button
          onClick={handleSyncClick}
          disabled={syncing}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          size="lg"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar Dashboard
            </>
          )}
        </Button>
      </CardContent>

      {/* Dialog de confirmação de email */}
      <WebhookEmailDialogSimple
        open={showEmailDialog}
        onClose={() => {
          console.log('🔴 DashboardAutoSyncManager: Fechando dialog de email');
          setShowEmailDialog(false);
        }}
        onConfirm={syncDashboard}
        webhookType="autosync"
        title="Confirmar Email para Sincronização"
        description="Digite seu email para confirmar e acionar o webhook de sincronização"
      />
    </Card>
  );
}
