import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { KPIMetric, HealthMetrics as HealthMetricsType } from '@/types/dashboard';

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

type HealthMetrics = HealthMetricsType & {
  crescimento?: number;
  retencao?: number;
  churnRate?: number;
  satisfacao?: number;
  performance?: number;
};

interface Filters {
  periodo: string;
  categoria: string;
}

export function useDashboardMetrics() {
  const [data, setData] = useState<MetricsData[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [alertas, setAlertas] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState(null);
  const [retentionMetrics, setRetentionMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    periodo: 'todos',
    categoria: 'todas',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando dados REAIS das tabelas de dashboard...');

      // Buscar dados da tabela dashboard_dados (dados crescentes 1, 2, 3, 4, 5, 6... até 20+)
      const { data: dashboardDados, error: dadosError } = await supabase
        .from('dashboard_dados')
        .select('*')
        .order('mes_numero', { ascending: true });

      if (dadosError) {
        console.error('❌ Erro ao buscar dashboard_dados:', dadosError);
        throw new Error(`Tabela dashboard_dados: ${dadosError.message}`);
      }

      console.log('✅ Dashboard dados carregados:', dashboardDados?.length || 0);
      console.log('📊 Dados da tabela dashboard_dados:', dashboardDados?.slice(0, 3));

      // Verificar se há dados
      if (!dashboardDados || dashboardDados.length === 0) {
        throw new Error('Tabela dashboard_dados está vazia. Execute a sincronização primeiro.');
      }

      // Buscar checkins para score médio
      let checkins = [];
      try {
        const { data: checkinsData, error: checkinsError } = await supabase
          .from('checkin')
          .select('telefone, data_checkin, total_pontuacao');

        if (checkinsError) {
          console.log('⚠️ Erro ao buscar checkins:', checkinsError.message);
        } else {
          checkins = checkinsData || [];
          console.log('✅ Checkins carregados:', checkins.length);
        }
      } catch (checkinErr) {
        console.log('⚠️ Tabela checkin não encontrada, continuando sem score');
      }

      // Processar dados por MÊS baseado nos campos mensais REAIS
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const monthFields = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

      const monthsData: MetricsData[] = [];

      // USAR DADOS REAIS DA TABELA DASHBOARD_DADOS
      console.log('📊 Processando dados reais da tabela dashboard_dados...');

      // Processar cada registro da tabela (1, 2, 3, 4, 5, 6... até 20+)
      dashboardDados.forEach(item => {
        try {
          // Função para converter valores que podem vir como string
          const parseNumber = (value: any): number => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') return parseFloat(value) || 0;
            return 0;
          };

          const mesNumero = parseNumber(item.mes_numero);
          const ativosInicioMes = parseNumber(item.ativos_total_inicio_mes);
          const entraram = parseNumber(item.entraram);
          const sairam = parseNumber(item.sairam);
          const vencimentos = parseNumber(item.vencimentos);
          const naoRenovou = parseNumber(item.nao_renovou);
          const percentualChurn = parseNumber(item.percentual_churn);
          const percentualRenovacao = parseNumber(item.percentual_renovacao);

          monthsData.push({
            mes_numero: mesNumero,
            mes: item.mes || `Período ${mesNumero}`,
            ano: parseNumber(item.ano) || new Date().getFullYear(),
            total_pacientes: ativosInicioMes + entraram, // Total no final do mês
            pacientes_ativos: ativosInicioMes, // Pacientes ativos no início do mês
            novos_pacientes: entraram, // Pacientes que entraram
            churn_rate: percentualChurn * 100, // percentual_churn * 100 para %
            renovacao_rate: percentualRenovacao * 100, // percentual_renovacao * 100 para %
          });

          console.log(`📊 Período ${mesNumero} (${item.mes}):`, {
            ativos_inicio: ativosInicioMes,
            entraram: entraram,
            sairam: sairam,
            churn: (percentualChurn * 100).toFixed(1) + '%',
            renovacao: (percentualRenovacao * 100).toFixed(1) + '%'
          });

        } catch (e) {
          console.log(`❌ Erro ao processar registro ${item.mes_numero}:`, e);
        }
      });

      console.log(`📈 TOTAL de meses com dados: ${monthsData.length}`);
      console.log('📋 Resumo final:', monthsData.map(m => `${m.mes}: ${m.pacientes_ativos} ativos`));

      // Calcular métricas agregadas de TODOS os meses com dados
      const totalActivePatients = monthsData.reduce((sum, month) => sum + month.pacientes_ativos, 0);
      const averageChurn = monthsData.length > 0 
        ? monthsData.reduce((sum, month) => sum + month.churn_rate, 0) / monthsData.length 
        : 0;
      
      // Taxa de renovação baseada na média dos meses (já multiplicada por 100)
      const taxaRenovacao = monthsData.length > 0 
        ? monthsData.reduce((sum, month) => sum + month.renovacao_rate, 0) / monthsData.length
        : 0;

      // Crescimento baseado na comparação primeiro vs último mês
      const growthRate = monthsData.length > 1 
        ? ((monthsData[monthsData.length - 1].pacientes_ativos - monthsData[0].pacientes_ativos) / Math.max(1, monthsData[0].pacientes_ativos)) * 100
        : 0;

      // Score médio baseado nos checkins reais
      let avgScore = 0;
      if (checkins && checkins.length > 0) {
        const totalScore = checkins.reduce((sum, checkin) => sum + (checkin.total_pontuacao || 0), 0);
        avgScore = totalScore / checkins.length;
      }

      // Calcular score de saúde
      console.log('🔍 Calculando healthScore:', {
        averageChurn,
        taxaRenovacao,
        avgScore,
        churnComponent: (100 - averageChurn) * 0.4,
        renovacaoComponent: (taxaRenovacao / 100) * 30,
        scoreComponent: (avgScore / 10) * 30
      });

      const healthScore = Math.min(100, Math.max(0, 
        (100 - averageChurn) * 0.4 + // 40% baseado em baixo churn (churn já está em %)
        (taxaRenovacao) * 0.3 + // 30% baseado na taxa de renovação (já está em %)
        (avgScore || 50) * 0.3 // 30% baseado no score dos checkins (ou 50 se não houver)
      ));

      console.log('🎯 HealthScore final:', healthScore);

      const healthStatus = healthScore >= 80 ? 'excellent' :
                          healthScore >= 60 ? 'good' :
                          healthScore >= 40 ? 'fair' :
                          healthScore >= 20 ? 'poor' : 'critical';

      const realHealthMetrics: HealthMetrics = {
        crescimento: Number(growthRate.toFixed(1)),
        retencao: Number(taxaRenovacao.toFixed(1)),
        churnRate: Number(averageChurn.toFixed(1)), // Adicionar churn real
        satisfacao: Number((avgScore || 0).toFixed(1)),
        performance: Number((isNaN(healthScore) ? 0 : healthScore).toFixed(1)),
        healthScore: Number((isNaN(healthScore) ? 0 : healthScore).toFixed(0)),
        healthStatus: isNaN(healthScore) ? 'unknown' : healthStatus,
        recommendations: [
          averageChurn > 10 ? 'Taxa de churn alta - implementar programa de retenção' : 'Taxa de churn controlada',
          taxaRenovacao < 70 ? 'Taxa de renovação baixa - revisar estratégia de retenção' : 'Taxa de renovação saudável',
          growthRate < 0 ? 'Crescimento negativo - revisar estratégia de aquisição' : 'Crescimento positivo'
        ],
        riskFactors: [
          ...(averageChurn > 15 ? ['Taxa de churn crítica (>15%)'] : []),
          ...(taxaRenovacao < 60 ? ['Taxa de renovação muito baixa (<60%)'] : []),
          ...(growthRate < -5 ? ['Crescimento negativo significativo'] : []),
          ...(totalActivePatients < 50 ? ['Base de clientes pequena'] : [])
        ],
      };

      console.log('📊 HealthMetrics final:', realHealthMetrics);

      const realKpis: KPIMetric[] = [
        {
          titulo: 'Pacientes Ativos',
          valor: totalActivePatients,
          variacao: Number(growthRate.toFixed(1)),
          variacao_tipo: growthRate > 0 ? 'positiva' : growthRate < 0 ? 'negativa' : 'neutra',
          icone: 'Users',
          cor: 'blue',
          descricao: 'Total de pacientes ativos em todos os meses'
        },
        {
          titulo: 'Taxa de Renovação',
          valor: `${taxaRenovacao.toFixed(1)}%`,
          variacao: 0,
          variacao_tipo: taxaRenovacao >= 70 ? 'positiva' : 'negativa',
          icone: 'RefreshCw',
          cor: taxaRenovacao >= 70 ? 'green' : taxaRenovacao >= 50 ? 'yellow' : 'red',
          descricao: 'Percentual de retenção de pacientes'
        },
        {
          titulo: 'Taxa de Churn',
          valor: `${averageChurn.toFixed(1)}%`,
          variacao: 0,
          variacao_tipo: averageChurn < 10 ? 'positiva' : 'negativa',
          icone: 'TrendingDown',
          cor: averageChurn < 10 ? 'green' : averageChurn < 20 ? 'yellow' : 'red',
          descricao: 'Taxa média de cancelamento'
        },
        {
          titulo: 'Saúde do Negócio',
          valor: `${isNaN(healthScore) ? 0 : healthScore.toFixed(0)}%`,
          variacao: Number(growthRate.toFixed(1)),
          variacao_tipo: healthScore >= 70 ? 'positiva' : 'negativa',
          icone: 'Activity',
          cor: healthScore >= 70 ? 'green' : healthScore >= 50 ? 'yellow' : 'red',
          descricao: 'Indicador geral de saúde'
        }
      ];

      console.log('🎯 MÉTRICAS FINAIS DA PÁGINA DE MÉTRICAS:');
      console.log('📊 Total de meses processados:', monthsData.length);
      console.log('📈 KPIs calculados:', realKpis.map(k => `${k.titulo}: ${k.valor}`));
      console.log('👥 Pacientes ativos agregados:', totalActivePatients);
      console.log('📉 Churn médio:', averageChurn.toFixed(1) + '%');
      console.log('📈 Taxa renovação:', taxaRenovacao.toFixed(1) + '%');

      setData(monthsData);
      setHealthMetrics(realHealthMetrics);
      setKpis(realKpis);
      
    } catch (err) {
      console.error('❌ Erro ao carregar dados da página de métricas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      
      // Definir dados vazios para evitar crashes
      setData([]);
      setHealthMetrics(null);
      setKpis([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refreshData = () => {
    fetchData();
  };

  const exportData = () => {
    console.log('📁 Exportando dados da página de métricas:', data);
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'metricas-mensais.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    data,
    healthMetrics,
    kpis,
    alertas,
    chartData,
    growthMetrics,
    retentionMetrics,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
    exportData,
  };
}