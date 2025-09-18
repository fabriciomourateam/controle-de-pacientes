import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  Shield
} from "lucide-react";
import type { HealthMetrics, RetentionMetrics, GrowthMetrics } from "@/types/dashboard";

interface BusinessHealthPanelProps {
  healthMetrics: HealthMetrics | null;
  retentionMetrics: RetentionMetrics | null;
  growthMetrics: GrowthMetrics | null;
  loading?: boolean;
}

const getHealthIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'good': return <Activity className="w-5 h-5 text-blue-400" />;
    case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    case 'poor': return <XCircle className="w-5 h-5 text-orange-400" />;
    case 'critical': return <XCircle className="w-5 h-5 text-red-400" />;
    default: return <Activity className="w-5 h-5 text-slate-400" />;
  }
};

const getHealthColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'text-green-400 border-green-500/30';
    case 'good': return 'text-blue-400 border-blue-500/30';
    case 'fair': return 'text-yellow-400 border-yellow-500/30';
    case 'poor': return 'text-orange-400 border-orange-500/30';
    case 'critical': return 'text-red-400 border-red-500/30';
    default: return 'text-slate-400 border-slate-500/30';
  }
};

const getHealthLabel = (status: string) => {
  switch (status) {
    case 'excellent': return 'Excelente';
    case 'good': return 'Bom';
    case 'fair': return 'Regular';
    case 'poor': return 'Ruim';
    case 'critical': return 'Crítico';
    default: return 'Desconhecido';
  }
};

export function BusinessHealthPanel({ 
  healthMetrics, 
  retentionMetrics, 
  growthMetrics, 
  loading = false 
}: BusinessHealthPanelProps) {
  console.log('🔍 BusinessHealthPanel recebeu:', { healthMetrics, retentionMetrics, growthMetrics });
  
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Saúde do Negócio</CardTitle>
          <CardDescription className="text-slate-400">
            Análise completa da saúde da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-16 bg-slate-700/50 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthMetrics) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Saúde do Negócio</CardTitle>
          <CardDescription className="text-slate-400">
            Análise completa da saúde da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-400 mb-2">Dados não disponíveis</p>
            <p className="text-sm text-slate-500">
              As métricas de saúde aparecerão conforme os dados forem inseridos
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
              <Shield className="w-5 h-5 text-blue-400" />
              Saúde do Negócio
            </CardTitle>
            <CardDescription className="text-slate-400">
              Análise completa da saúde da empresa
            </CardDescription>
          </div>
          <Badge variant="outline" className={getHealthColor(healthMetrics?.healthStatus || 'unknown')}>
            <div className="flex items-center gap-1">
              {getHealthIcon(healthMetrics?.healthStatus || 'unknown')}
              <span className="text-xs">{getHealthLabel(healthMetrics?.healthStatus || 'unknown')}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score de Saúde */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Score de Saúde</span>
            <span className="text-sm text-white font-semibold">{healthMetrics?.healthScore || 0}/100</span>
          </div>
          <Progress 
            value={healthMetrics?.healthScore || 0} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-slate-800/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {healthMetrics?.retencao?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-xs text-slate-400">Retenção</div>
          </div>
          <div className="text-center p-3 bg-slate-800/30 rounded-lg">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {healthMetrics?.churnRate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-xs text-slate-400">Churn</div>
          </div>
        </div>

        {/* Tendências */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Tendências</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Crescimento:</span>
              <div className="flex items-center gap-1">
                {(healthMetrics?.crescimento || 0) > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (healthMetrics?.crescimento || 0) < 0 ? (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                ) : (
                  <div className="w-3 h-3 bg-slate-400 rounded-full" />
                )}
                <span className="text-white capitalize">Estável</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Retenção:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-slate-400 rounded-full" />
                <span className="text-white capitalize">Estável</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Churn:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-slate-400 rounded-full" />
                <span className="text-white capitalize">Estável</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {healthMetrics?.recommendations?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Recomendações
            </h4>
            <div className="space-y-2">
              {healthMetrics?.recommendations?.map((recommendation, index) => (
                <div key={index} className="text-xs text-slate-300 bg-slate-800/30 p-2 rounded">
                  • {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fatores de Risco */}
        {healthMetrics?.riskFactors?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Fatores de Risco
            </h4>
            <div className="space-y-2">
              {healthMetrics?.riskFactors?.map((risk, index) => (
                <div key={index} className="text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-500/20">
                  ⚠️ {risk}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
