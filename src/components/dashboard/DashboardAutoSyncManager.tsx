import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';
import { dashboardAutoSyncService } from '@/lib/dashboard-auto-sync-service';

export function DashboardAutoSyncManager() {
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [lastSync, setLastSync] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('dashboardAutoSyncConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setEnabled(config.enabled || false);
      setIntervalMinutes(config.intervalMinutes || 60);
      setApiKey(config.apiKey || '');
      setDatabaseId(config.databaseId || '');
    }

    // Carregar status da sincronização
    const status = dashboardAutoSyncService.getSyncStatus();
    if (status) {
      setLastSync(status);
      setIsRunning(status.isRunning);
    }
  }, []);

  // Salvar configurações
  const saveConfig = () => {
    const config = {
      enabled,
      intervalMinutes,
      apiKey,
      databaseId
    };
    localStorage.setItem('dashboardAutoSyncConfig', JSON.stringify(config));
    toast({
      title: "Configurações salvas",
      description: "Configurações de auto-sync salvas com sucesso"
    });
  };

  // Iniciar sincronização automática
  const startAutoSync = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, configure a API Key e Database ID",
        variant: "destructive"
      });
      return;
    }

    try {
      await dashboardAutoSyncService.startAutoSync({
        apiKey: apiKey.trim(),
        databaseId: databaseId.trim(),
        intervalMinutes,
        enabled: true
      });
      
      setIsRunning(true);
      setEnabled(true);
      saveConfig();
      
      toast({
        title: "Auto-sync iniciado",
        description: `Sincronização automática a cada ${intervalMinutes} minutos`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao iniciar auto-sync",
        variant: "destructive"
      });
    }
  };

  // Parar sincronização automática
  const stopAutoSync = () => {
    dashboardAutoSyncService.stopAutoSync();
    setIsRunning(false);
    setEnabled(false);
    saveConfig();
    
    toast({
      title: "Auto-sync parado",
      description: "Sincronização automática interrompida"
    });
  };

  // Executar sincronização manual
  const runManualSync = async () => {
    if (!apiKey.trim() || !databaseId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, configure a API Key e Database ID",
        variant: "destructive"
      });
      return;
    }

    try {
      await dashboardAutoSyncService.startAutoSync({
        apiKey: apiKey.trim(),
        databaseId: databaseId.trim(),
        intervalMinutes,
        enabled: false
      });
      
      toast({
        title: "Sincronização executada",
        description: "Sincronização manual concluída"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro na sincronização manual",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Sincronização Automática
        </CardTitle>
        <CardDescription className="text-slate-400">
          Configure sincronização automática das métricas do Notion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">Status:</span>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Ativo
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Inativo
                </>
              )}
            </Badge>
          </div>
          
          {lastSync && (
            <div className="text-xs text-slate-400">
              Última sync: {new Date(lastSync.lastSync).toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {/* Configurações */}
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
          </div>
          
          <div>
            <Label htmlFor="database-id" className="text-white">Database ID</Label>
            <Input
              id="database-id"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="631cf85b-608d-4c16-93b7-72bfe0822f64"
              className="mt-1 bg-slate-700/50 border-slate-600/50 text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="interval" className="text-white">Intervalo (minutos)</Label>
            <Input
              id="interval"
              type="number"
              min="5"
              max="1440"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)}
              className="w-20 bg-slate-700/50 border-slate-600/50 text-white"
            />
          </div>
        </div>

        {/* Estatísticas da última sincronização */}
        {lastSync && (
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Última Sincronização</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Inseridos:</span>
                <span className="text-green-400">{lastSync.inserted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Atualizados:</span>
                <span className="text-blue-400">{lastSync.updated || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Erros:</span>
                <span className="text-red-400">{lastSync.errors || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total:</span>
                <span className="text-white">{lastSync.totalRecords || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={startAutoSync}
              disabled={!apiKey.trim() || !databaseId.trim()}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Auto-sync
            </Button>
          ) : (
            <Button
              onClick={stopAutoSync}
              variant="destructive"
            >
              <Pause className="w-4 h-4 mr-2" />
              Parar Auto-sync
            </Button>
          )}
          
          <Button
            onClick={runManualSync}
            disabled={!apiKey.trim() || !databaseId.trim()}
            variant="outline"
            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Manual
          </Button>
          
          <Button
            onClick={saveConfig}
            variant="outline"
            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}






