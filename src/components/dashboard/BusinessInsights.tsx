import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Clock,
  Activity
} from "lucide-react";
import type { GrowthMetrics, RetentionMetrics, HealthMetrics } from "@/types/dashboard";

interface MetricsData {
  mes_numero: number;
  mes: string;
  ano: number;
  total_pacientes: number;
  pacientes_ativos: number;
  novos_pacientes: number;
  churn_rate: number;
  renovacao_rate: number;
}

interface BusinessInsightsProps {
  data: MetricsData[];
  growthMetrics: GrowthMetrics | null;
  retentionMetrics: RetentionMetrics | null;
  healthMetrics: HealthMetrics | null;
  loading?: boolean;
}

export function BusinessInsights({ 
  data, 
  growthMetrics, 
  retentionMetrics, 
  healthMetrics, 
  loading = false 
}: BusinessInsightsProps) {
  console.log('🔍 BusinessInsights recebeu:', { data, growthMetrics, retentionMetrics, healthMetrics });
  
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Insights de Negócio</CardTitle>
          <CardDescription className="text-slate-400">
            Carregando análises...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Insights de Negócio</CardTitle>
          <CardDescription className="text-slate-400">
            Nenhum dado disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-400">
            Sem dados para análise
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular métricas avançadas
  const totalPatients = data.reduce((sum, item) => sum + item.pacientes_ativos, 0);
  const totalNewPatients = data.reduce((sum, item) => sum + item.novos_pacientes, 0);
  const totalLostPatients = 0; // Não disponível nos dados atuais
  const averageRetention = data.length > 0 ? data.reduce((sum, item) => sum + item.renovacao_rate, 0) / data.length : 0;
  const averageChurn = data.length > 0 ? data.reduce((sum, item) => sum + item.churn_rate, 0) / data.length : 0;
  
  // Calcular eficiência de retenção
  const retentionEfficiency = averageRetention - averageChurn;
  
  // Calcular taxa de crescimento composto
  const firstMonth = data[0];
  const lastMonth = data[data.length - 1];
  const compoundGrowthRate = data.length > 1 && firstMonth.pacientes_ativos > 0
    ? (Math.pow(lastMonth.pacientes_ativos / firstMonth.pacientes_ativos, 1 / (data.length - 1)) - 1) * 100
    : 0;

  // Calcular previsão de crescimento
  const monthlyGrowthRate = growthMetrics?.averageMonthlyGrowth || 0;
  const projectedGrowth = monthlyGrowthRate * 6; // Próximos 6 meses


  // Calcular métricas de sazonalidade
  const monthlyData = data.map(item => ({
    month: item.mes, // Usar o nome do mês diretamente
    growth: item.novos_pacientes // Usar novos pacientes como crescimento
  }));

  const seasonalPattern = monthlyData.reduce((acc, item) => {
    if (!acc[item.month]) acc[item.month] = [];
    acc[item.month].push(item.growth);
    return acc;
  }, {} as Record<string, number[]>);

  const averageGrowthByMonth = Object.entries(seasonalPattern).map(([month, values]) => ({
    month: month,
    averageGrowth: values.reduce((sum, val) => sum + val, 0) / values.length
  }));

  const bestMonth = averageGrowthByMonth.reduce((best, current) => 
    current.averageGrowth > best.averageGrowth ? current : best
  );

  const worstMonth = averageGrowthByMonth.reduce((worst, current) => 
    current.averageGrowth < worst.averageGrowth ? current : worst
  );

  const getMonthName = (month: string) => {
    // Mapear nomes completos para abreviações
    const monthMap: Record<string, string> = {
      'Janeiro': 'Jan',
      'Fevereiro': 'Fev', 
      'Março': 'Mar',
      'Abril': 'Abr',
      'Maio': 'Mai',
      'Junho': 'Jun',
      'Julho': 'Jul',
      'Agosto': 'Ago',
      'Setembro': 'Set',
      'Outubro': 'Out',
      'Novembro': 'Nov',
      'Dezembro': 'Dez'
    };
    return monthMap[month] || month;
  };

  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral' | 'warning') => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'negative': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Activity className="w-5 h-5 text-blue-400" />;
    }
  };

  const getInsightColor = (type: 'positive' | 'negative' | 'neutral' | 'warning') => {
    switch (type) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Insights de Negócio
        </CardTitle>
        <CardDescription className="text-slate-400">
          Análises avançadas e métricas estratégicas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Taxa de Crescimento Composto</p>
                <p className={`text-lg font-semibold ${compoundGrowthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {compoundGrowthRate >= 0 ? '+' : ''}{compoundGrowthRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Eficiência de Retenção</p>
                <p className={`text-lg font-semibold ${retentionEfficiency >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {retentionEfficiency >= 0 ? '+' : ''}{retentionEfficiency.toFixed(1)}%
                </p>
              </div>
              <Target className="w-5 h-5 text-green-400" />
            </div>
          </div>


          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Projeção 6 Meses</p>
                <p className={`text-lg font-semibold ${projectedGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {projectedGrowth >= 0 ? '+' : ''}{projectedGrowth.toFixed(1)}%
                </p>
              </div>
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Análise Sazonal */}
        <div className="bg-slate-800/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Análise Sazonal
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-700/30">
              <div>
                <p className="text-sm text-green-400">Melhor Mês</p>
                <p className="text-lg font-semibold text-green-400">
                  {getMonthName(bestMonth.month)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Crescimento</p>
                <p className="text-lg font-semibold text-green-400">
                  +{bestMonth.averageGrowth.toFixed(0)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-700/30">
              <div>
                <p className="text-sm text-red-400">Pior Mês</p>
                <p className="text-lg font-semibold text-red-400">
                  {getMonthName(worstMonth.month)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Crescimento</p>
                <p className="text-lg font-semibold text-red-400">
                  {worstMonth.averageGrowth.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights e Recomendações */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Insights e Recomendações
          </h4>
          
          <div className="space-y-3">
            {/* Insight 1: Crescimento */}
            {compoundGrowthRate > 5 ? (
              <div className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700/30">
                {getInsightIcon('positive')}
                <div>
                  <p className="text-sm font-medium text-green-400">Crescimento Sólido</p>
                  <p className="text-xs text-slate-300">
                    Sua taxa de crescimento composto de {compoundGrowthRate.toFixed(1)}% indica um negócio em expansão saudável.
                  </p>
                </div>
              </div>
            ) : compoundGrowthRate < -5 ? (
              <div className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                {getInsightIcon('negative')}
                <div>
                  <p className="text-sm font-medium text-red-400">Atenção ao Crescimento</p>
                  <p className="text-xs text-slate-300">
                    Taxa de crescimento negativa de {compoundGrowthRate.toFixed(1)}%. Considere estratégias de retenção e aquisição.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
                {getInsightIcon('warning')}
                <div>
                  <p className="text-sm font-medium text-yellow-400">Crescimento Estável</p>
                  <p className="text-xs text-slate-300">
                    Crescimento moderado de {compoundGrowthRate.toFixed(1)}%. Oportunidade de acelerar com estratégias focadas.
                  </p>
                </div>
              </div>
            )}

            {/* Insight 2: Retenção */}
            {retentionEfficiency > 10 ? (
              <div className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700/30">
                {getInsightIcon('positive')}
                <div>
                  <p className="text-sm font-medium text-green-400">Excelente Retenção</p>
                  <p className="text-xs text-slate-300">
                    Eficiência de retenção de {retentionEfficiency.toFixed(1)}% mostra clientes satisfeitos e engajados.
                  </p>
                </div>
              </div>
            ) : retentionEfficiency < 0 ? (
              <div className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                {getInsightIcon('negative')}
                <div>
                  <p className="text-sm font-medium text-red-400">Problema de Retenção</p>
                  <p className="text-xs text-slate-300">
                    Eficiência negativa de {retentionEfficiency.toFixed(1)}%. Foque em melhorar a experiência do cliente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
                {getInsightIcon('warning')}
                <div>
                  <p className="text-sm font-medium text-yellow-400">Retenção Moderada</p>
                  <p className="text-xs text-slate-300">
                    Eficiência de {retentionEfficiency.toFixed(1)}%. Há espaço para melhorar a retenção de clientes.
                  </p>
                </div>
              </div>
            )}

            {/* Insight 3: Sazonalidade */}
            <div className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
              {getInsightIcon('neutral')}
              <div>
                <p className="text-sm font-medium text-blue-400">Padrão Sazonal</p>
                <p className="text-xs text-slate-300">
                  Melhor performance em {getMonthName(bestMonth.month)} (+{bestMonth.averageGrowth.toFixed(0)}). 
                  Planeje campanhas específicas para {getMonthName(worstMonth.month)}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
