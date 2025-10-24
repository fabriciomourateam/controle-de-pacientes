import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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

// URL do webhook N8N
const N8N_WEBHOOK_URL = 'https://n8n.shapepro.shop/webhook/atualizardash';

export function AutoSyncManager() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const saved = localStorage.getItem('lastDashboardSync');
    return saved ? new Date(saved) : null;
  });

  // Executar sincronização via webhook N8N
  const syncDashboard = async () => {
    setSyncing(true);
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'dashboard'
        })
      });

      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }

      const now = new Date();
      setLastSync(now);
      localStorage.setItem('lastDashboardSync', now.toISOString());
      
      toast({
        title: "Sincronização iniciada! ✅",
        description: "O dashboard está sendo atualizado via N8N",
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
            onClick={syncDashboard}
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
  );
}
