import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import type { GrowthMetrics, RetentionMetrics, HealthMetrics } from "@/types/dashboard";

interface ExecutiveSummaryProps {
  growthMetrics: GrowthMetrics | null;
  retentionMetrics: RetentionMetrics | null;
  healthMetrics: HealthMetrics | null;
  loading?: boolean;
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'growing':
    case 'improving':
      return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    case 'declining':
    case 'worsening':
      return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    default:
      return <Minus className="w-4 h-4 text-slate-400" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'growing':
    case 'improving':
      return 'text-green-400 border-green-500/30';
    case 'declining':
    case 'worsening':
      return 'text-red-400 border-red-500/30';
    default:
      return 'text-slate-400 border-slate-500/30';
  }
};

export function ExecutiveSummary({ 
  growthMetrics, 
  retentionMetrics, 
  healthMetrics, 
  loading = false 
}: ExecutiveSummaryProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Resumo Executivo</CardTitle>
          <CardDescription className="text-slate-400">
            Visão geral das principais métricas da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-20 bg-slate-700/50 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!growthMetrics || !retentionMetrics || !healthMetrics) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Resumo Executivo</CardTitle>
          <CardDescription className="text-slate-400">
            Visão geral das principais métricas da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-400 mb-2">Dados não disponíveis</p>
            <p className="text-sm text-slate-500">
              O resumo executivo aparecerá conforme os dados forem inseridos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Resumo Executivo
        </CardTitle>
        <CardDescription className="text-slate-400">
          Visão geral das principais métricas da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Geral */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {healthMetrics.healthScore}/100
          </div>
          <div className="text-sm text-slate-400 mb-3">Score de Saúde</div>
          <Badge 
            variant="outline" 
            className={`${
              healthMetrics.healthStatus === 'excellent' ? 'text-green-400 border-green-500/30' :
              healthMetrics.healthStatus === 'good' ? 'text-blue-400 border-blue-500/30' :
              healthMetrics.healthStatus === 'fair' ? 'text-yellow-400 border-yellow-500/30' :
              healthMetrics.healthStatus === 'poor' ? 'text-orange-400 border-orange-500/30' :
              'text-red-400 border-red-500/30'
            }`}
          >
            {healthMetrics.healthStatus === 'excellent' ? 'Excelente' :
             healthMetrics.healthStatus === 'good' ? 'Bom' :
             healthMetrics.healthStatus === 'fair' ? 'Regular' :
             healthMetrics.healthStatus === 'poor' ? 'Ruim' : 'Crítico'}
          </Badge>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-slate-800/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {growthMetrics.totalGrowth >= 0 ? '+' : ''}{growthMetrics.totalGrowth}%
            </div>
            <div className="text-xs text-slate-400 mb-2">Crescimento Total</div>
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon(growthMetrics.growthTrend)}
              <span className="text-xs text-slate-300 capitalize">
                {growthMetrics.growthTrend}
              </span>
            </div>
          </div>
          
          <div className="text-center p-4 bg-slate-800/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {retentionMetrics.averageRetention}%
            </div>
            <div className="text-xs text-slate-400 mb-2">Taxa de Retenção</div>
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon(retentionMetrics.retentionTrend)}
              <span className="text-xs text-slate-300 capitalize">
                {retentionMetrics.retentionTrend}
              </span>
            </div>
          </div>
        </div>

        {/* Projeção e Churn */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-slate-800/30 rounded-lg">
            <div className="text-xl font-bold text-purple-400 mb-1">
              {growthMetrics.projectedNextMonth.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-slate-400">Projeção Próximo Mês</div>
          </div>
          
          <div className="text-center p-4 bg-slate-800/30 rounded-lg">
            <div className="text-xl font-bold text-red-400 mb-1">
              {retentionMetrics.churnRate}%
            </div>
            <div className="text-xs text-slate-400 mb-2">Taxa de Churn</div>
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon(retentionMetrics.churnTrend)}
              <span className="text-xs text-slate-300 capitalize">
                {retentionMetrics.churnTrend}
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores de Performance */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Indicadores de Performance</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Crescimento Mensal Médio:</span>
              <span className={`font-semibold ${growthMetrics.averageMonthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growthMetrics.averageMonthlyGrowth >= 0 ? '+' : ''}{growthMetrics.averageMonthlyGrowth}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Saúde da Retenção:</span>
              <Badge 
                variant="outline" 
                className={`${
                  retentionMetrics.retentionHealth === 'excellent' ? 'text-green-400 border-green-500/30' :
                  retentionMetrics.retentionHealth === 'good' ? 'text-blue-400 border-blue-500/30' :
                  retentionMetrics.retentionHealth === 'fair' ? 'text-yellow-400 border-yellow-500/30' :
                  'text-red-400 border-red-500/30'
                }`}
              >
                {retentionMetrics.retentionHealth === 'excellent' ? 'Excelente' :
                 retentionMetrics.retentionHealth === 'good' ? 'Bom' :
                 retentionMetrics.retentionHealth === 'fair' ? 'Regular' : 'Ruim'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Crescimento Atual:</span>
              <span className={`font-semibold ${growthMetrics.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growthMetrics.monthlyGrowth >= 0 ? '+' : ''}{growthMetrics.monthlyGrowth}%
              </span>
            </div>
          </div>
        </div>

        {/* Alertas Rápidos */}
        {(healthMetrics.riskFactors.length > 0 || healthMetrics.healthStatus === 'critical' || healthMetrics.healthStatus === 'poor') && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Alertas Importantes
            </h4>
            <div className="space-y-2">
              {healthMetrics.riskFactors.slice(0, 3).map((risk, index) => (
                <div key={index} className="text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-500/20">
                  ⚠️ {risk}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Positivo */}
        {healthMetrics.healthStatus === 'excellent' || healthMetrics.healthStatus === 'good' ? (
          <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-300 font-medium">
              {healthMetrics.healthStatus === 'excellent' 
                ? 'Excelente performance! Continue mantendo os padrões atuais.'
                : 'Boa performance! Pequenos ajustes podem otimizar ainda mais os resultados.'
              }
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
