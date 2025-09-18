import { useMemo } from 'react';
import type { KPIMetric } from '@/types/dashboard';

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

export function useFilteredMetrics(data: MetricsData[], selectedMonths: number[]) {
  // Filtrar dados baseado nos meses selecionados
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (selectedMonths.length === 0) return data;
    return data.filter(item => selectedMonths.includes(item.mes_numero));
  }, [data, selectedMonths]);

  // Calcular KPIs filtrados CORRETAMENTE
  const filteredKpis = useMemo(() => {
    if (filteredData.length === 0) {
      return [
        {
          titulo: 'Nenhum Dado',
          valor: 0,
          variacao: 0,
          variacao_tipo: 'neutra' as const,
          icone: 'AlertTriangle',
          cor: 'red',
          descricao: 'Selecione meses para ver métricas'
        }
      ];
    }

    // LÓGICA CORRETA: Usar dados da ÚLTIMA LINHA (valor atual) + análise do período
    
    // Ordenar dados por mes_numero para garantir ordem correta
    const sortedData = [...filteredData].sort((a, b) => a.mes_numero - b.mes_numero);
    
    // 1. Pacientes Ativos ATUAIS: valor da última linha selecionada
    const currentActivePatients = sortedData.length > 0 
      ? sortedData[sortedData.length - 1].pacientes_ativos 
      : 0;

    // 2. Taxa de Churn: usar percentual_churn da última linha
    const currentChurn = sortedData.length > 0 
      ? sortedData[sortedData.length - 1].churn_rate 
      : 0;
    
    // 3. Taxa de Renovação: usar renovacao_rate da última linha (percentual_renovacao)
    const currentRenovacao = sortedData.length > 0
      ? sortedData[sortedData.length - 1].renovacao_rate
      : 0;

    // 4. Crescimento: comparação primeiro vs último período selecionado
    const growthRate = sortedData.length > 1 
      ? ((sortedData[sortedData.length - 1].pacientes_ativos - sortedData[0].pacientes_ativos) / Math.max(1, sortedData[0].pacientes_ativos)) * 100
      : 0;

    // 5. Médias comparativas dos períodos selecionados
    const averageChurnFiltered = sortedData.length > 0 
      ? sortedData.reduce((sum, month) => sum + month.churn_rate, 0) / sortedData.length 
      : 0;
    
    const averageRenovacaoFiltered = sortedData.length > 0 
      ? sortedData.reduce((sum, month) => sum + month.renovacao_rate, 0) / sortedData.length 
      : 0;

    const averageActivePatientsFiltered = sortedData.length > 0 
      ? sortedData.reduce((sum, month) => sum + month.pacientes_ativos, 0) / sortedData.length 
      : 0;

    const kpis: KPIMetric[] = [
      {
        titulo: 'Pacientes Ativos Atuais',
        valor: currentActivePatients,
        variacao: Number(growthRate.toFixed(1)),
        variacao_tipo: growthRate > 0 ? 'positiva' : growthRate < 0 ? 'negativa' : 'neutra',
        icone: 'Users',
        cor: 'blue',
        descricao: `Atual: ${currentActivePatients} | Média período: ${Math.round(averageActivePatientsFiltered)}`
      },
      {
        titulo: 'Taxa de Renovação',
        valor: `${currentRenovacao.toFixed(1)}%`,
        variacao: Number((currentRenovacao - averageRenovacaoFiltered).toFixed(1)),
        variacao_tipo: currentRenovacao >= averageRenovacaoFiltered ? 'positiva' : 'negativa',
        icone: 'RefreshCw',
        cor: currentRenovacao >= 70 ? 'green' : currentRenovacao >= 50 ? 'yellow' : 'red',
        descricao: `Atual: ${currentRenovacao.toFixed(1)}% | Média período: ${averageRenovacaoFiltered.toFixed(1)}%`
      },
      {
        titulo: 'Taxa de Churn',
        valor: `${currentChurn.toFixed(1)}%`,
        variacao: Number((averageChurnFiltered - currentChurn).toFixed(1)),
        variacao_tipo: currentChurn <= averageChurnFiltered ? 'positiva' : 'negativa',
        icone: 'TrendingDown',
        cor: currentChurn < 10 ? 'green' : currentChurn < 20 ? 'yellow' : 'red',
        descricao: `Atual: ${currentChurn.toFixed(1)}% | Média período: ${averageChurnFiltered.toFixed(1)}%`
      },
      // KPIs adicionais para comparação de médias
      {
        titulo: 'Média Churn Período',
        valor: `${averageChurnFiltered.toFixed(1)}%`,
        variacao: 0,
        variacao_tipo: averageChurnFiltered < 15 ? 'positiva' : 'negativa',
        icone: 'BarChart3',
        cor: averageChurnFiltered < 10 ? 'green' : averageChurnFiltered < 20 ? 'yellow' : 'red',
        descricao: `Média de churn dos ${sortedData.length} períodos selecionados`
      },
      {
        titulo: 'Média Renovação Período',
        valor: `${averageRenovacaoFiltered.toFixed(1)}%`,
        variacao: 0,
        variacao_tipo: averageRenovacaoFiltered >= 70 ? 'positiva' : 'negativa',
        icone: 'BarChart3',
        cor: averageRenovacaoFiltered >= 70 ? 'green' : averageRenovacaoFiltered >= 50 ? 'yellow' : 'red',
        descricao: `Média de renovação dos ${sortedData.length} períodos selecionados`
      }
    ];

    console.log('🎯 KPIs CORRETOS calculados:', {
      mesesSelecionados: sortedData.length,
      currentActivePatients,
      currentChurn: currentChurn.toFixed(1),
      currentRenovacao: currentRenovacao.toFixed(1),
      growthRate: growthRate.toFixed(1),
      averageChurnFiltered: averageChurnFiltered.toFixed(1),
      averageRenovacaoFiltered: averageRenovacaoFiltered.toFixed(1),
      ultimoPeriodo: sortedData.length > 0 ? sortedData[sortedData.length - 1].mes : 'N/A'
    });

    return kpis;
  }, [filteredData]);

  return {
    filteredData,
    filteredKpis,
  };
}
