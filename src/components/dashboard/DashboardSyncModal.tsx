import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, TrendingUp, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

// Função para ativar webhook do N8N
async function triggerN8NWebhook() {
  const response = await fetch('https://n8n.shapepro.shop/webhook/controle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trigger: 'metrics_sync',
      timestamp: new Date().toISOString(),
      source: 'dashboard_metrics'
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

export function DashboardSyncModal({ onSyncComplete }: DashboardSyncModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    console.log('🔄 Iniciando sincronização via webhook N8N...');
    
    setLoading(true);
    setResult(null);

    try {
      console.log('📡 Chamando webhook N8N...');
      const webhookResult = await triggerN8NWebhook();
      console.log('📊 Resultado do webhook:', webhookResult);
      
      // Simular sucesso já que o webhook apenas triggera o processo
      setResult({
        success: true,
        message: "Webhook ativado com sucesso! O fluxo N8N está processando os dados do Notion.",
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Webhook Ativado!",
        description: "O fluxo N8N foi iniciado e está processando os dados do Notion"
      });
      
      // Notificar componente pai
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      // Fechar modal após 3 segundos
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao ativar webhook:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
      
      toast({
        title: "Erro ao Ativar Webhook",
        description: "Erro ao conectar com o servidor N8N",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            Sincronizar Métricas via N8N
          </DialogTitle>
          <DialogDescription>
            Ative o webhook N8N para processar dados do Notion e atualizar as métricas automaticamente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações sobre o processo */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Como Funciona
              </CardTitle>
              <CardDescription className="text-slate-400">
                Este processo usa automação N8N para sincronizar dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                <div>
                  <p className="text-white font-medium">Webhook Ativado</p>
                  <p className="text-slate-400 text-sm">Clique em "Ativar Webhook" para iniciar o processo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <div>
                  <p className="text-white font-medium">N8N Processa</p>
                  <p className="text-slate-400 text-sm">O fluxo N8N busca dados do Notion automaticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                <div>
                  <p className="text-white font-medium">Supabase Atualizado</p>
                  <p className="text-slate-400 text-sm">Dados são processados e salvos no Supabase</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                <div>
                  <p className="text-white font-medium">Métricas Atualizadas</p>
                  <p className="text-slate-400 text-sm">Dashboard reflete as métricas mais recentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status da Sincronização */}
          {result && (
            <Card className={result.success ? "bg-green-900/20 border-green-700/50" : "bg-red-900/20 border-red-700/50"}>
              <CardHeader>
                <CardTitle className={result.success ? "text-green-400 flex items-center gap-2" : "text-red-400 flex items-center gap-2"}>
                  {result.success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Webhook Ativado com Sucesso!
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      Erro ao Ativar Webhook
                    </>
                  )}
                </CardTitle>
                <CardDescription className={result.success ? "text-green-300" : "text-red-300"}>
                  {result.success ? "O fluxo N8N foi iniciado" : "Houve um problema na ativação"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className={result.success ? "text-green-200" : "text-red-200"}>
                    {result.message || result.error}
                  </p>
                  {result.success && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-500/50 text-green-400">
                        <Zap className="w-3 h-3 mr-1" />
                        N8N Ativo
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Ativado em: {new Date(result.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleSync}
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ativando Webhook...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Ativar Webhook N8N
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              disabled={loading}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}