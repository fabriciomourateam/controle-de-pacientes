import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, TrendingUp } from 'lucide-react';
// Função para sincronizar métricas via proxy
async function syncDashboardMetrics(apiKey: string, databaseId: string) {
  const response = await fetch('http://localhost:3001/api/sync-dashboard-metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      databaseId
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }

  return await response.json();
}

interface DashboardSyncModalProps {
  onSyncComplete?: () => void;
}

export function DashboardSyncModalSimple({ onSyncComplete }: DashboardSyncModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    console.log('🔄 Iniciando sincronização...');
    
    if (!apiKey.trim() || !databaseId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('📡 Chamando syncDashboardMetrics...');
      const syncResult = await syncDashboardMetrics(apiKey.trim(), databaseId.trim());
      console.log('📊 Resultado da sincronização:', syncResult);
      
      if (syncResult.success) {
        setResult(syncResult);
        
        toast({
          title: "Sincronização Concluída!",
          description: syncResult.message || "Dados sincronizados com sucesso!"
        });
        
        // Notificar componente pai
        if (onSyncComplete) {
          onSyncComplete();
        }
        
        // Fechar modal após 3 segundos
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      } else {
        toast({
          title: "Erro na Sincronização",
          description: syncResult.error || "Erro ao processar dados do Notion",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na Sincronização",
        description: "Erro ao conectar com o Notion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
          <TrendingUp className="w-4 h-4 mr-2" />
          Sincronizar Métricas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Sincronizar Métricas do Dashboard
          </DialogTitle>
          <DialogDescription>
            Conecte seu banco de dados do Notion para sincronizar as métricas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="api-key" className="text-white">API Key do Notion</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_..."
              className="mt-1 bg-slate-700/50 border-slate-600/50 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              Encontre sua API Key em: https://www.notion.so/my-integrations
            </p>
          </div>
          
          <div>
            <Label htmlFor="database-id" className="text-white">Database ID</Label>
            <Input
              id="database-id"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="0c81fb6abe4a424ba65b72f68d11d0d1"
              className="mt-1 bg-slate-700/50 border-slate-600/50 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              ID da sua base de dados do Notion (da URL)
            </p>
          </div>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 text-green-600 mr-2">✅</div>
                <div>
                  <p className="font-medium text-green-800">
                    Sincronização Concluída!
                  </p>
                  <p className="text-sm text-green-600">
                    {result.message || "Dados sincronizados com sucesso!"}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={loading || !apiKey.trim() || !databaseId.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                'Sincronizar'
              )}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
