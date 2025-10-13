import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw, Database } from "lucide-react";
import { N8NWebhookService } from "@/lib/n8n-webhook-service";

export function ConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      const isConnected = await N8NWebhookService.testConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
      if (!isConnected) {
        setErrorMessage('Falha na conexão com endpoint N8N');
      }
    } catch (error) {
      setConnectionStatus('error');
      
      let errorMsg = 'Erro desconhecido';
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          errorMsg = 'Erro 403: API Key do N8N não tem permissão ou está expirada';
        } else if (error.message.includes('404')) {
          errorMsg = 'Erro 404: Tabela não encontrada. Verifique se o workflow está rodando';
        } else if (error.message.includes('400')) {
          errorMsg = 'Erro 400: API Key inválida ou formato de requisição incorreto';
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Database className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return <Badge className="bg-green-600 text-white">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-600/50 text-slate-300">Não testado</Badge>;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {getStatusIcon()}
          Teste de Conexão N8N
        </CardTitle>
        <CardDescription className="text-slate-400">
          Verificar conexão com N8N Webhook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Status da conexão:</span>
          {getStatusBadge()}
        </div>
        
        {errorMessage && (
          <div className="p-3 bg-red-900/20 border border-red-600/50 rounded-md">
            <p className="text-sm text-red-300">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-2 text-sm text-slate-400">
          <p><strong>Fonte Principal:</strong> N8N Webhook (Direto)</p>
          <p><strong>URL:</strong> https://dashboard-fmteam.vercel.app/api/public-webhook</p>
          <p><strong>Método:</strong> N8N envia dados automaticamente</p>
          <p><strong>Webhook:</strong> Configurado ✅</p>
        </div>

        <Button 
          onClick={testConnection} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Testar Conexão
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
