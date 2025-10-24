import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw,
  CheckCircle,
  Loader2
} from 'lucide-react';

// URL do webhook N8N
const N8N_WEBHOOK_URL = 'https://n8n.shapepro.shop/webhook/atualizardash';

export function DashboardAutoSyncManager() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const saved = localStorage.getItem('lastDashboardSync');
    return saved ? new Date(saved) : null;
  });
  const { toast } = useToast();

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
            Clique no botão abaixo para iniciar a sincronização das métricas do dashboard através do webhook N8N.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Webhook: {N8N_WEBHOOK_URL}
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
              Sincronizar Dashboard
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
