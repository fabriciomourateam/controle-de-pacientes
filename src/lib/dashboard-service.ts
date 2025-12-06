import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/lib/auth-helpers';
import type { 
  DashboardDados, 
  DashboardMetricas, 
  UltimosMeses, 
  AlertaDashboard,
  DashboardFilters,
  KPIMetric,
  ChartData
} from '@/types/dashboard';

export const dashboardService = {
  // Função auxiliar para converter valores seguramente
  safeParseNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') return defaultValue;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  },

  safeParseInt(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') return defaultValue;
    const parsed = parseInt(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  },

  // Buscar dados completos do dashboard
  async getDashboardData(filters: DashboardFilters = {}) {
    try {
      // Obter user_id do usuário autenticado
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado. Faça login para visualizar as métricas.');
      }

      let query = supabase
        .from('dashboard_dados')
        .select('*')
        .eq('user_id', userId); // FILTRAR POR USER_ID
      
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }
      
      if (filters.meses && filters.tipo_periodo === 'meses') {
        const currentDate = new Date();
        const startDate = new Date();
        startDate.setMonth(currentDate.getMonth() - filters.meses);
        
        query = query.gte('data_referencia', startDate.toISOString().split('T')[0]);
      }
      
      const { data, error } = await query.order('data_referencia', { ascending: false });
      
      if (error) throw error;
      
      // Converter dados flexíveis para o formato esperado
      return (data || []).map(item => ({
        ...item,
        ano: this.safeParseInt(item.ano),
        mes_numero: this.safeParseInt(item.mes_numero),
        ativos_total_inicio_mes: this.safeParseInt(item.ativos_total_inicio_mes),
        saldo_entrada_saida: this.safeParseInt(item.saldo_entrada_saida),
        entraram: this.safeParseInt(item.entraram),
        sairam: this.safeParseInt(item.sairam),
        vencimentos: this.safeParseInt(item.vencimentos),
        nao_renovou: this.safeParseInt(item.nao_renovou),
        desistencia: this.safeParseInt(item.desistencia),
        congelamento: this.safeParseInt(item.congelamento),
        percentual_renovacao: this.safeParseNumber(item.percentual_renovacao),
        percentual_churn: this.safeParseNumber(item.percentual_churn),
        churn_max: this.safeParseInt(item.churn_max),
      })) as DashboardMetricas[];
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  },

  // Buscar últimos 6 meses
  async getUltimosMeses() {
    try {
      // Obter user_id do usuário autenticado
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado. Faça login para visualizar as métricas.');
      }

      const { data, error } = await supabase
        .from('ultimos_6_meses')
        .select('*')
        .eq('user_id', userId) // FILTRAR POR USER_ID
        .order('data_referencia', { ascending: false });
      
      if (error) throw error;
      return (data || []) as UltimosMeses[];
    } catch (error) {
      console.error('Erro ao buscar últimos meses:', error);
      throw error;
    }
  },

  // Buscar alertas
  async getAlertas() {
    try {
      // Obter user_id do usuário autenticado
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado. Faça login para visualizar as métricas.');
      }

      const { data, error } = await supabase
        .from('alertas_dashboard')
        .select('*')
        .eq('user_id', userId) // FILTRAR POR USER_ID
        .eq('ativo', true)
        .order('prioridade', { ascending: false });
      
      if (error) throw error;
      return (data || []) as AlertaDashboard[];
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      // Retorna array vazio em caso de erro
      return [] as AlertaDashboard[];
    }
  },

  // Buscar métricas calculadas
  async getMetricas(filters: DashboardFilters = {}) {
    try {
      // Obter user_id do usuário autenticado
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado. Faça login para visualizar as métricas.');
      }

      // Query simplificada para debug
      const { data, error } = await supabase
        .from('dashboard_metricas')
        .select('*')
        .eq('user_id', userId) // FILTRAR POR USER_ID
        .order('mes_numero', { ascending: true })
        .limit(50);
      
      if (error) {
        console.error('Erro na query:', error);
        throw error;
      }
      
      // Aplicar filtros manualmente
      let filteredData = data || [];
      
      if (filters.ano) {
        filteredData = filteredData.filter(item => item.ano === filters.ano);
      }
      
      if (filters.meses && filters.tipo_periodo === 'meses') {
        // Pegar os últimos N meses dos dados ordenados
        const meses = parseInt(filters.meses.toString());
        filteredData = filteredData.slice(-meses);
      }
      
      return filteredData as DashboardMetricas[];
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      throw error;
    }
  },

  // Calcular KPIs
  calculateKPIs(data: DashboardMetricas[]): KPIMetric[] {
    if (data.length === 0) {
      return [
        {
          titulo: 'Total Ativos',
          valor: 0,
          icone: 'Users',
          cor: 'blue',
          descricao: 'Total de pacientes ativos'
        },
        {
          titulo: 'Taxa Renovação',
          valor: '0%',
          icone: 'RefreshCw',
          cor: 'green',
          descricao: 'Percentual de renovação médio'
        },
        {
          titulo: 'Churn Médio',
          valor: '0%',
          icone: 'TrendingDown',
          cor: 'red',
          descricao: 'Taxa de cancelamento média'
        },
        {
          titulo: 'Crescimento',
          valor: '0%',
          icone: 'TrendingUp',
          cor: 'purple',
          descricao: 'Crescimento mensal médio'
        }
      ];
    }

    // Calcular métricas
    const totalAtivos = data[0]?.ativos_total_inicio_mes || 0;
    const renovacaoMedia = data.reduce((acc, item) => acc + item.percentual_renovacao, 0) / data.length;
    const churnMedio = data.reduce((acc, item) => acc + item.percentual_churn, 0) / data.length;
    
    // Calcular crescimento mensal
    let crescimentoMedio = 0;
    if (data.length > 1) {
      const crescimentos = [];
      for (let i = 0; i < data.length - 1; i++) {
        const atual = data[i].ativos_total_inicio_mes;
        const anterior = data[i + 1].ativos_total_inicio_mes;
        if (anterior > 0) {
          crescimentos.push(((atual - anterior) / anterior) * 100);
        }
      }
      crescimentoMedio = crescimentos.length > 0 ? 
        crescimentos.reduce((acc, val) => acc + val, 0) / crescimentos.length : 0;
    }

    return [
      {
        titulo: 'Total Ativos',
        valor: totalAtivos.toLocaleString('pt-BR'),
        variacao: crescimentoMedio,
        variacao_tipo: crescimentoMedio >= 0 ? 'positiva' : 'negativa',
        icone: 'Users',
        cor: 'blue',
        descricao: 'Total de pacientes ativos'
      },
      {
        titulo: 'Taxa Renovação',
        valor: `${renovacaoMedia.toFixed(1)}%`,
        variacao: renovacaoMedia - 80, // Considerando 80% como baseline
        variacao_tipo: renovacaoMedia >= 80 ? 'positiva' : 'negativa',
        icone: 'RefreshCw',
        cor: 'green',
        descricao: 'Percentual de renovação médio'
      },
      {
        titulo: 'Churn Médio',
        valor: `${churnMedio.toFixed(1)}%`,
        variacao: 5 - churnMedio, // Considerando 5% como baseline
        variacao_tipo: churnMedio <= 5 ? 'positiva' : 'negativa',
        icone: 'TrendingDown',
        cor: 'red',
        descricao: 'Taxa de cancelamento média'
      },
      {
        titulo: 'Crescimento',
        valor: `${crescimentoMedio.toFixed(1)}%`,
        variacao: crescimentoMedio,
        variacao_tipo: crescimentoMedio >= 0 ? 'positiva' : 'negativa',
        icone: 'TrendingUp',
        cor: 'purple',
        descricao: 'Crescimento mensal médio'
      }
    ];
  },

  // Preparar dados para gráficos
  prepareChartData(data: DashboardMetricas[]): ChartData[] {
    return data
      .sort((a, b) => a.mes_numero - b.mes_numero) // Ordenar por mes_numero (01-20)
      .map(item => ({
        mes: `${item.mes}/${item.ano}`,
        ativos: item.ativos_total_inicio_mes,
        entraram: item.entraram,
        sairam: item.sairam,
        renovacao: Number((item.percentual_renovacao * 100).toFixed(2)), // Multiplicar por 100
        churn: Number((item.percentual_churn * 100).toFixed(2)) // Multiplicar por 100
      }));
  },

  // Exportar dados para CSV
  async exportToCSV(data: DashboardMetricas[]) {
    const headers = [
      'Mês/Ano',
      'Ativos Início',
      'Entraram',
      'Sairam',
      'Vencimentos',
      'Não Renovou',
      'Desistência',
      'Congelamento',
      'Renovação (%)',
      'Churn (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `${item.mes}/${item.ano}`,
        item.ativos_total_inicio_mes,
        item.entraram,
        item.sairam,
        item.vencimentos,
        item.nao_renovou,
        item.desistencia,
        item.congelamento,
        item.percentual_renovacao,
        item.percentual_churn
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard-metricas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
