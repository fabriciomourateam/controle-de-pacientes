import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { WebhookEmailDialogSimple } from "@/components/webhook/WebhookEmailDialogSimple";
import { 
  RefreshCw, 
  CheckCircle,
  Loader2,
  Activity
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { getUserWebhookUrl } from '@/lib/webhook-config-service';

export function AutoSyncManager() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

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
    console.log('🟢 AutoSyncManager: handleSyncClick chamado, abrindo dialog de email');
    // Fechar o dialog principal e abrir o de email imediatamente
    setIsOpen(false);
    setShowEmailDialog(true);
    console.log('🟢 AutoSyncManager: showEmailDialog definido como true');
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

      // Fechar modal após sucesso
      setTimeout(() => setIsOpen(false), 1500);
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
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Auto-sync</span>
            {lastSync && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                <CheckCircle className="w-3 h-3" />
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              Sincronizar Dashboard
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Atualize as métricas do dashboard via N8N
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
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
            </div>

            {/* Última sincronização */}
            {lastSync && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Última sincronização:</p>
                <p className="text-sm text-white font-medium mt-1">
                  {lastSync.toLocaleString('pt-BR')}
                </p>
              </div>
            )}

            {/* Informações */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-300">
                A sincronização irá atualizar todas as métricas do dashboard através do webhook N8N.
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
                  Sincronizar Agora
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de email - FORA do Dialog principal */}
      <WebhookEmailDialogSimple
        open={showEmailDialog}
        onClose={() => {
          console.log('🔴 AutoSyncManager: Fechando dialog de email');
          setShowEmailDialog(false);
        }}
        onConfirm={syncDashboard}
        webhookType="autosync"
        title="Confirmar Email para Sincronização"
        description="Digite seu email para confirmar e acionar o webhook de sincronização"
      />
    </>
  );
}
