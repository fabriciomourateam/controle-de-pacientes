import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { autoSyncService } from '@/lib/auto-sync-service';

interface AutoSyncConfig {
  apiKey: string;
  databaseId: string;
  intervalDays: number;
  intervalMinutes: number;
  enabled: boolean;
}

export function AutoSyncManager() {
  const { toast } = useToast();
  const [config, setConfig] = useState<AutoSyncConfig>({
    apiKey: '',
    databaseId: '',
    intervalDays: 1,
    intervalMinutes: 1440, // 1 dia = 1440 minutos
    enabled: false
  });
  const [isRunning, setIsRunning] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Converter dias para minutos
  const convertDaysToMinutes = (days: number) => {
    return days * 24 * 60; // 1 dia = 1440 minutos
  };

  // Atualizar minutos quando dias mudarem
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      intervalMinutes: convertDaysToMinutes(prev.intervalDays)
    }));
  }, [config.intervalDays]);

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('autoSyncConfig');
    const savedStatus = autoSyncService.getSyncStatus();
    
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      // Garantir que intervalDays existe, senão usar 1 dia
      if (!parsedConfig.intervalDays) {
        parsedConfig.intervalDays = 1;
        parsedConfig.intervalMinutes = convertDaysToMinutes(1);
      }
      setConfig(parsedConfig);
    }
    
    if (savedStatus) {
      setLastSyncStatus(savedStatus);
      setIsRunning(savedStatus.isRunning);
    }
  }, []);

  // Verificar status periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const status = autoSyncService.getSyncStatus();
      if (status) {
        setLastSyncStatus(status);
        setIsRunning(autoSyncService.isAutoSyncRunning());
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = () => {
    const configToSave = {
      ...config,
      intervalMinutes: convertDaysToMinutes(config.intervalDays)
    };
    localStorage.setItem('autoSyncConfig', JSON.stringify(configToSave));
    toast({
      title: "Configuração salva",
      description: "As configurações de auto-sync foram salvas com sucesso.",
    });
  };

  const handleStartAutoSync = async () => {
    if (!config.apiKey || !config.databaseId) {
      toast({
        title: "Erro",
        description: "API Key e Database ID são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await autoSyncService.startAutoSync(config);
      setIsRunning(true);
      toast({
        title: "Auto-sync iniciado",
        description: `Sincronização automática iniciada com intervalo de ${config.intervalDays} ${config.intervalDays === 1 ? 'dia' : 'dias'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao iniciar auto-sync.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAutoSync = () => {
    autoSyncService.stopAutoSync();
    setIsRunning(false);
    toast({
      title: "Auto-sync parado",
      description: "Sincronização automática foi interrompida.",
    });
  };

  const handleManualSync = async () => {
    if (!config.apiKey || !config.databaseId) {
      toast({
        title: "Erro",
        description: "API Key e Database ID são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await autoSyncService.startAutoSync({ ...config, intervalMinutes: 0.1 }); // Sincronização única
      toast({
        title: "Sincronização manual",
        description: "Sincronização manual iniciada.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro na sincronização manual.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative">
      {/* Botão Minimizado */}
      {!isExpanded && (
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 border-gold hover:bg-primary/10"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Auto-sync</span>
          {isRunning ? (
            <Badge variant="default" className="ml-1 px-1.5 py-0.5 text-xs">
              <CheckCircle className="w-2 h-2 mr-1" />
              Ativo
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              <AlertCircle className="w-2 h-2 mr-1" />
              Inativo
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      )}

      {/* Card Expandido */}
      {isExpanded && (
        <Card className="absolute top-0 right-0 z-50 w-96 shadow-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm text-white">
                  <Activity className="w-4 h-4" />
                  Sincronização Automática
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Configure a sincronização automática entre Notion e Supabase
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configurações */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-xs text-slate-300">API Key do Notion</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="ntn_..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="databaseId" className="text-xs text-slate-300">Database ID</Label>
                <Input
                  id="databaseId"
                  value={config.databaseId}
                  onChange={(e) => setConfig(prev => ({ ...prev, databaseId: e.target.value }))}
                  placeholder="631cf85b..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="interval" className="text-xs text-slate-300">Intervalo (dias)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="30"
                    value={config.intervalDays}
                    onChange={(e) => setConfig(prev => ({ ...prev, intervalDays: parseInt(e.target.value) || 1 }))}
                    className="h-8 w-20 text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled" className="text-xs text-slate-300">Habilitar</Label>
                </div>
              </div>
              
              <div className="text-xs text-slate-400">
                Equivale a {convertDaysToMinutes(config.intervalDays)} minutos ({config.intervalDays} {config.intervalDays === 1 ? 'dia' : 'dias'})
              </div>

              <Button onClick={handleSaveConfig} variant="outline" size="sm" className="w-full h-8 text-xs">
                <Settings className="w-3 h-3 mr-2" />
                Salvar Configurações
              </Button>
            </div>

            {/* Controles */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button 
                  onClick={handleStartAutoSync} 
                  disabled={isLoading || !config.enabled}
                  size="sm"
                  className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {isLoading ? 'Iniciando...' : 'Iniciar'}
                </Button>
              ) : (
                <Button 
                  onClick={handleStopAutoSync} 
                  variant="destructive"
                  disabled={isLoading}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Parar
                </Button>
              )}
              
              <Button 
                onClick={handleManualSync} 
                variant="outline"
                disabled={isLoading || !config.apiKey || !config.databaseId}
                size="sm"
                className="h-8 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync
              </Button>
            </div>

            {/* Status */}
            {lastSyncStatus && (
              <div className="space-y-2">
                <h4 className="font-medium text-xs">Status da Última Sincronização</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {lastSyncStatus.totalRecords || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {lastSyncStatus.inserted || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Novos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {lastSyncStatus.updated || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Atual.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {lastSyncStatus.errors || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Erros</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Última: {formatLastSync(lastSyncStatus.lastSync)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
