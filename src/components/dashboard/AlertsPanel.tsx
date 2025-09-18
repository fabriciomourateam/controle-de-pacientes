import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  RefreshCw,
  XCircle,
  CheckCircle,
  Info
} from "lucide-react";
import type { AlertaDashboard } from "@/types/dashboard";

interface AlertsPanelProps {
  alertas: AlertaDashboard[];
  loading?: boolean;
}

const getAlertIcon = (tipo: string) => {
  switch (tipo) {
    case 'churn_alto':
      return <TrendingDown className="w-4 h-4" />;
    case 'renovacao_baixa':
      return <RefreshCw className="w-4 h-4" />;
    case 'crescimento_negativo':
      return <TrendingDown className="w-4 h-4" />;
    case 'vencimentos_altos':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
};

const getAlertColor = (prioridade: string) => {
  switch (prioridade) {
    case 'alta':
      return {
        bg: 'bg-red-500/10 border-red-500/30',
        text: 'text-red-400',
        icon: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400 border-red-500/30'
      };
    case 'media':
      return {
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        text: 'text-yellow-400',
        icon: 'text-yellow-400',
        badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      };
    case 'baixa':
      return {
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        icon: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      };
    default:
      return {
        bg: 'bg-slate-500/10 border-slate-500/30',
        text: 'text-slate-400',
        icon: 'text-slate-400',
        badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      };
  }
};

const getAlertTitle = (tipo: string) => {
  switch (tipo) {
    case 'churn_alto':
      return 'Churn Elevado';
    case 'renovacao_baixa':
      return 'Renovação Baixa';
    case 'crescimento_negativo':
      return 'Crescimento Negativo';
    case 'vencimentos_altos':
      return 'Vencimentos Altos';
    default:
      return 'Alerta';
  }
};

export function AlertsPanel({ alertas, loading = false }: AlertsPanelProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Alertas do Sistema</CardTitle>
          <CardDescription className="text-slate-400">
            Notificações importantes sobre métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-16 bg-slate-700/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alertas.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Alertas do Sistema</CardTitle>
          <CardDescription className="text-slate-400">
            Notificações importantes sobre métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
            <p className="text-green-400 font-medium mb-2">Tudo em ordem!</p>
            <p className="text-sm text-slate-400">
              Nenhum alerta crítico no momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Alertas do Sistema
            </CardTitle>
            <CardDescription className="text-slate-400">
              {alertas.length} notificação{alertas.length !== 1 ? 'ões' : ''} importante{alertas.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            {alertas.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alertas.map((alerta, index) => {
            const colors = getAlertColor(alerta.prioridade);
            const icon = getAlertIcon(alerta.tipo);
            const title = getAlertTitle(alerta.tipo);
            
            return (
              <Alert 
                key={alerta.id || index}
                className={`${colors.bg} border ${colors.bg.replace('bg-', 'border-').replace('/10', '/30')}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${colors.icon} mt-0.5`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium ${colors.text}`}>
                        {title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={colors.badge}
                      >
                        {alerta.prioridade}
                      </Badge>
                    </div>
                    <AlertDescription className="text-slate-300 text-sm">
                      {alerta.mensagem}
                    </AlertDescription>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                      <span>
                        Valor: <span className="font-semibold text-white">{alerta.valor}</span>
                        {alerta.limite && (
                          <span> (Limite: {alerta.limite})</span>
                        )}
                      </span>
                      <span>
                        {new Date(alerta.data_referencia).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>
        
        {/* Resumo dos alertas */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-medium text-white mb-3">Resumo dos Alertas</h4>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <p className="text-red-400 font-semibold text-lg">
                {alertas.filter(a => a.prioridade === 'alta').length}
              </p>
              <p className="text-slate-400">Alta Prioridade</p>
            </div>
            <div className="text-center">
              <p className="text-yellow-400 font-semibold text-lg">
                {alertas.filter(a => a.prioridade === 'media').length}
              </p>
              <p className="text-slate-400">Média Prioridade</p>
            </div>
            <div className="text-center">
              <p className="text-blue-400 font-semibold text-lg">
                {alertas.filter(a => a.prioridade === 'baixa').length}
              </p>
              <p className="text-slate-400">Baixa Prioridade</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




