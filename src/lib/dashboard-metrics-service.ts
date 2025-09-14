import { supabase } from '@/integrations/supabase/client';
import type { 
  DashboardMetricas, 
  KPIMetric,
  ChartData,
  GrowthMetrics,
  RetentionMetrics,
  HealthMetrics
} from '@/types/dashboard';

export const dashboardMetricsService = {
  // Calcular métricas de crescimento baseadas em dados reais
  async calculateGrowthMetrics(filters: DashboardFilters = {}): Promise<GrowthMetrics> {
    try {
      // Aplicar filtros na query
      let query = supabase
        .from('dashboard_metricas')
        .select('*')
        .order('mes_numero', { ascending: true });

      // Aplicar filtro de ano se especificado
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }

      // Aplicar filtro de período se especificado
      if (filters.meses && filters.tipo_periodo === 'meses') {
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setMonth(currentDate.getMonth() - filters.meses);
        query = query.gte('data_referencia', startDate.toISOString().split('T')[0]);
      }

      const { data: dashboardData, error } = await query.limit(50);

      if (error) throw error;

      if (!dashboardData || dashboardData.length === 0) {
        return {
          totalGrowth: 0,
          monthlyGrowth: 0,
          averageMonthlyGrowth: 0,
          growthTrend: 'stable',
          projectedNextMonth: 0,
          growthRate: 0
        };
      }

      // Calcular crescimento total
      const firstMonth = dashboardData[0];
      const lastMonth = dashboardData[dashboardData.length - 1];
      const totalGrowth = firstMonth.ativos_total_inicio_mes > 0 
        ? ((lastMonth.ativos_total_inicio_mes - firstMonth.ativos_total_inicio_mes) / firstMonth.ativos_total_inicio_mes) * 100
        : 0;

      // Calcular crescimento mensal médio
      const monthlyGrowths = [];
      for (let i = 1; i < dashboardData.length; i++) {
        const current = dashboardData[i];
        const previous = dashboardData[i - 1];
        if (previous.ativos_total_inicio_mes > 0) {
          const growth = ((current.ativos_total_inicio_mes - previous.ativos_total_inicio_mes) / previous.ativos_total_inicio_mes) * 100;
          monthlyGrowths.push(growth);
        }
      }

      const averageMonthlyGrowth = monthlyGrowths.length > 0 
        ? monthlyGrowths.reduce((sum, growth) => sum + growth, 0) / monthlyGrowths.length
        : 0;

      // Calcular tendência de crescimento
      const recentGrowths = monthlyGrowths.slice(-3); // Últimos 3 meses
      const recentAverage = recentGrowths.length > 0 
        ? recentGrowths.reduce((sum, growth) => sum + growth, 0) / recentGrowths.length
        : 0;

      let growthTrend: 'growing' | 'declining' | 'stable' = 'stable';
      if (recentAverage > 2) growthTrend = 'growing';
      else if (recentAverage < -2) growthTrend = 'declining';

      // Projeção para o próximo mês
      const projectedNextMonth = lastMonth.ativos_total_inicio_mes * (1 + (averageMonthlyGrowth / 100));

      return {
        totalGrowth: Number(totalGrowth.toFixed(2)),
        monthlyGrowth: monthlyGrowths.length > 0 ? Number(monthlyGrowths[monthlyGrowths.length - 1].toFixed(2)) : 0,
        averageMonthlyGrowth: Number(averageMonthlyGrowth.toFixed(2)),
        growthTrend,
        projectedNextMonth: Math.round(projectedNextMonth),
        growthRate: Number(averageMonthlyGrowth.toFixed(2))
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de crescimento:', error);
      return {
        totalGrowth: 0,
        monthlyGrowth: 0,
        averageMonthlyGrowth: 0,
        growthTrend: 'stable',
        projectedNextMonth: 0,
        growthRate: 0
      };
    }
  },

  // Calcular métricas de retenção
  async calculateRetentionMetrics(filters: DashboardFilters = {}): Promise<RetentionMetrics> {
    try {
      // Aplicar filtros na query
      let query = supabase
        .from('dashboard_metricas')
        .select('*')
        .order('mes_numero', { ascending: true });

      // Aplicar filtro de ano se especificado
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }

      // Aplicar filtro de período se especificado
      if (filters.meses && filters.tipo_periodo === 'meses') {
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setMonth(currentDate.getMonth() - filters.meses);
        query = query.gte('data_referencia', startDate.toISOString().split('T')[0]);
      }

      const { data: dashboardData, error } = await query.limit(50);

      if (error) throw error;

      if (!dashboardData || dashboardData.length === 0) {
        return {
          averageRetention: 0,
          retentionTrend: 'stable',
          churnRate: 0,
          churnTrend: 'stable',
          retentionHealth: 'good'
        };
      }

      // Calcular retenção média (multiplicar por 100 pois vem como decimal)
      const averageRetention = dashboardData.reduce((sum, item) => sum + (item.percentual_renovacao * 100), 0) / dashboardData.length;

      // Calcular tendência de retenção (multiplicar por 100)
      const recentRetention = dashboardData.slice(0, 3).reduce((sum, item) => sum + (item.percentual_renovacao * 100), 0) / 3;
      const olderRetention = dashboardData.slice(3, 6).reduce((sum, item) => sum + (item.percentual_renovacao * 100), 0) / 3;
      
      let retentionTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recentRetention > olderRetention + 5) retentionTrend = 'improving';
      else if (recentRetention < olderRetention - 5) retentionTrend = 'declining';

      // Calcular churn médio (multiplicar por 100 pois vem como decimal)
      const churnRate = dashboardData.reduce((sum, item) => sum + (item.percentual_churn * 100), 0) / dashboardData.length;

      // Tendência de churn (multiplicar por 100)
      const recentChurn = dashboardData.slice(0, 3).reduce((sum, item) => sum + (item.percentual_churn * 100), 0) / 3;
      const olderChurn = dashboardData.slice(3, 6).reduce((sum, item) => sum + (item.percentual_churn * 100), 0) / 3;
      
      let churnTrend: 'improving' | 'worsening' | 'stable' = 'stable';
      if (recentChurn < olderChurn - 2) churnTrend = 'improving';
      else if (recentChurn > olderChurn + 2) churnTrend = 'worsening';

      // Saúde da retenção
      let retentionHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
      if (averageRetention >= 85 && churnRate <= 5) retentionHealth = 'excellent';
      else if (averageRetention >= 75 && churnRate <= 8) retentionHealth = 'good';
      else if (averageRetention >= 60 && churnRate <= 12) retentionHealth = 'fair';
      else retentionHealth = 'poor';

      return {
        averageRetention: Number(averageRetention.toFixed(2)),
        retentionTrend,
        churnRate: Number(churnRate.toFixed(2)),
        churnTrend,
        retentionHealth
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de retenção:', error);
      return {
        averageRetention: 0,
        retentionTrend: 'stable',
        churnRate: 0,
        churnTrend: 'stable',
        retentionHealth: 'good'
      };
    }
  },

  // Calcular métricas de saúde do negócio
  async calculateHealthMetrics(filters: DashboardFilters = {}): Promise<HealthMetrics> {
    try {
      // Aplicar filtros na query
      let query = supabase
        .from('dashboard_metricas')
        .select('*')
        .order('mes_numero', { ascending: true });

      // Aplicar filtro de ano se especificado
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }

      // Aplicar filtro de período se especificado
      if (filters.meses && filters.tipo_periodo === 'meses') {
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setMonth(currentDate.getMonth() - filters.meses);
        query = query.gte('data_referencia', startDate.toISOString().split('T')[0]);
      }

      const { data: dashboardData, error } = await query.limit(50);

      if (error) throw error;

      if (!dashboardData || dashboardData.length === 0) {
        return {
          healthScore: 0,
          healthStatus: 'unknown',
          recommendations: ['Dados insuficientes para análise'],
          riskFactors: []
        };
      }

      const latest = dashboardData[dashboardData.length - 1]; // Último mês dos dados ordenados
      
      // Calcular score de saúde (0-100) - multiplicar por 100 pois vem como decimal
      const retentionScore = Math.min(100, latest.percentual_renovacao * 100);
      const churnScore = Math.max(0, 100 - (latest.percentual_churn * 100));
      const growthScore = latest.crescimento_mensal ? Math.min(100, Math.max(0, latest.crescimento_mensal * 5)) : 50;
      
      const healthScore = (retentionScore * 0.4) + (churnScore * 0.4) + (growthScore * 0.2);

      // Determinar status de saúde
      let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown' = 'unknown';
      if (healthScore >= 90) healthStatus = 'excellent';
      else if (healthScore >= 75) healthStatus = 'good';
      else if (healthScore >= 60) healthStatus = 'fair';
      else if (healthScore >= 40) healthStatus = 'poor';
      else healthStatus = 'critical';

      // Gerar recomendações
      const recommendations: string[] = [];
      const riskFactors: string[] = [];

      if (latest.percentual_renovacao * 100 < 70) {
        recommendations.push('Melhorar estratégias de retenção de clientes');
        riskFactors.push('Taxa de renovação baixa');
      }

      if (latest.percentual_churn * 100 > 10) {
        recommendations.push('Investigar causas do alto churn');
        riskFactors.push('Taxa de churn elevada');
      }

      if (latest.crescimento_mensal && latest.crescimento_mensal < 0) {
        recommendations.push('Implementar estratégias de crescimento');
        riskFactors.push('Crescimento negativo');
      }

      if (latest.entraram < latest.sairam) {
        recommendations.push('Aumentar aquisição de novos clientes');
        riskFactors.push('Mais saídas que entradas');
      }

      if (recommendations.length === 0) {
        recommendations.push('Manter estratégias atuais - performance estável');
      }

      return {
        healthScore: Number(healthScore.toFixed(1)),
        healthStatus,
        recommendations,
        riskFactors
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de saúde:', error);
      return {
        healthScore: 0,
        healthStatus: 'unknown',
        recommendations: ['Erro ao calcular métricas'],
        riskFactors: []
      };
    }
  },

  // Gerar KPIs organizados
  async generateOrganizedKPIs(filters: DashboardFilters = {}): Promise<KPIMetric[]> {
    try {
      const [growthMetrics, retentionMetrics, healthMetrics] = await Promise.all([
        this.calculateGrowthMetrics(filters),
        this.calculateRetentionMetrics(filters),
        this.calculateHealthMetrics(filters)
      ]);

      const kpis: KPIMetric[] = [
        {
          titulo: 'Crescimento Total',
          valor: `${growthMetrics.totalGrowth >= 0 ? '+' : ''}${growthMetrics.totalGrowth}%`,
          variacao: growthMetrics.monthlyGrowth,
          variacao_tipo: growthMetrics.monthlyGrowth >= 0 ? 'positiva' : 'negativa',
          icone: 'TrendingUp',
          cor: growthMetrics.growthTrend === 'growing' ? 'green' : growthMetrics.growthTrend === 'declining' ? 'red' : 'blue',
          descricao: `Crescimento acumulado nos últimos ${growthMetrics.totalGrowth !== 0 ? '12' : '0'} meses`
        },
        {
          titulo: 'Taxa de Retenção',
          valor: `${retentionMetrics.averageRetention}%`,
          variacao: retentionMetrics.retentionTrend === 'improving' ? 5 : retentionMetrics.retentionTrend === 'declining' ? -5 : 0,
          variacao_tipo: retentionMetrics.retentionTrend === 'improving' ? 'positiva' : retentionMetrics.retentionTrend === 'declining' ? 'negativa' : 'neutra',
          icone: 'RefreshCw',
          cor: retentionMetrics.averageRetention >= 75 ? 'green' : retentionMetrics.averageRetention >= 60 ? 'blue' : 'red',
          descricao: `Média de renovação dos últimos 6 meses`
        },
        {
          titulo: 'Taxa de Churn',
          valor: `${retentionMetrics.churnRate}%`,
          variacao: retentionMetrics.churnTrend === 'improving' ? 5 : retentionMetrics.churnTrend === 'worsening' ? -5 : 0,
          variacao_tipo: retentionMetrics.churnTrend === 'improving' ? 'positiva' : retentionMetrics.churnTrend === 'worsening' ? 'negativa' : 'neutra',
          icone: 'TrendingDown',
          cor: retentionMetrics.churnRate <= 5 ? 'green' : retentionMetrics.churnRate <= 10 ? 'purple' : 'red',
          descricao: `Taxa média de cancelamento`
        },
        {
          titulo: 'Saúde do Negócio',
          valor: `${healthMetrics.healthScore}/100`,
          variacao: healthMetrics.healthScore >= 80 ? 5 : healthMetrics.healthScore >= 70 ? 0 : healthMetrics.healthScore >= 60 ? -5 : -10,
          variacao_tipo: healthMetrics.healthScore >= 80 ? 'positiva' : healthMetrics.healthScore >= 70 ? 'neutra' : healthMetrics.healthScore >= 60 ? 'negativa' : 'negativa',
          icone: 'Activity',
          cor: healthMetrics.healthScore >= 80 ? 'green' : healthMetrics.healthScore >= 70 ? 'blue' : healthMetrics.healthScore >= 60 ? 'purple' : 'red',
          descricao: `Score geral de saúde do negócio`
        }
      ];

      return kpis;
    } catch (error) {
      console.error('Erro ao gerar KPIs organizados:', error);
      return [];
    }
  },

  // Preparar dados para gráficos organizados
  async prepareOrganizedChartData(filters: DashboardFilters = {}): Promise<ChartData[]> {
    try {
      // Aplicar filtros na query
      let query = supabase
        .from('dashboard_metricas')
        .select('*')
        .order('mes_numero', { ascending: true });

      // Aplicar filtro de ano se especificado
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }

      // Aplicar filtro de período se especificado
      if (filters.meses && filters.tipo_periodo === 'meses') {
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setMonth(currentDate.getMonth() - filters.meses);
        query = query.gte('data_referencia', startDate.toISOString().split('T')[0]);
      }

      const { data: dashboardData, error } = await query.limit(50); // Buscar mais dados para ter melhor ordenação

      if (error) throw error;

      if (!dashboardData || dashboardData.length === 0) {
        return [];
      }

      // Ordenar os dados cronologicamente por mes_numero (01-20)
      const sortedData = dashboardData.sort((a, b) => a.mes_numero - b.mes_numero);

      return sortedData.map((item, index) => {
        // Calcular crescimento mensal
        const previousMonth = index > 0 ? sortedData[index - 1] : null;
        const monthlyGrowth = previousMonth && previousMonth.ativos_total_inicio_mes > 0
          ? ((item.ativos_total_inicio_mes - previousMonth.ativos_total_inicio_mes) / previousMonth.ativos_total_inicio_mes) * 100
          : 0;

        return {
          mes: `${item.mes}/${item.ano}`,
          ativos: item.ativos_total_inicio_mes,
          entraram: item.entraram,
          sairam: item.sairam,
          renovacao: Number((item.percentual_renovacao * 100).toFixed(2)), // Multiplicar por 100
          churn: Number((item.percentual_churn * 100).toFixed(2)), // Multiplicar por 100
          crescimento: Number(monthlyGrowth.toFixed(2)),
          saldo: item.entraram - item.sairam,
          eficiencia: item.sairam > 0 ? Number(((item.entraram / item.sairam) * 100).toFixed(2)) : 0
        };
      });
    } catch (error) {
      console.error('Erro ao preparar dados dos gráficos:', error);
      return [];
    }
  }
};
