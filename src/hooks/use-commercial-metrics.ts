import { useQuery } from '@tanstack/react-query';
import { commercialMetricsService, metricsCalculations } from '@/lib/commercial-metrics-service';

// Hook para buscar leads que entraram (dados diários)
export function useLeadsQueEntraram() {
  return useQuery({
    queryKey: ['leads-que-entraram'],
    queryFn: () => commercialMetricsService.getLeadsQueEntraram(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}

// Hook para buscar todos os meses de leads
export function useAllTotalDeLeads() {
  return useQuery({
    queryKey: ['all-total-de-leads'],
    queryFn: () => commercialMetricsService.getAllTotalDeLeads(),
    refetchInterval: 30000,
  });
}

// Hook para buscar total de leads de um mês específico
export function useTotalDeLeadsByMonth(month: string | null) {
  return useQuery({
    queryKey: ['total-de-leads', month],
    queryFn: () => month ? commercialMetricsService.getTotalDeLeadsByMonth(month) : null,
    enabled: !!month,
    refetchInterval: 30000,
  });
}

// Hook para buscar todos os meses de calls agendadas
export function useAllTotalDeCallsAgendadas() {
  return useQuery({
    queryKey: ['all-total-de-calls-agendadas'],
    queryFn: () => commercialMetricsService.getAllTotalDeCallsAgendadas(),
    refetchInterval: 30000,
  });
}

// Hook para buscar total de calls agendadas de um mês específico
export function useTotalDeCallsAgendadasByMonth(month: string | null) {
  return useQuery({
    queryKey: ['total-de-calls-agendadas', month],
    queryFn: () => month ? commercialMetricsService.getTotalDeCallsAgendadasByMonth(month) : null,
    enabled: !!month,
    refetchInterval: 30000,
  });
}

// Hook para buscar total de leads por funil
export function useTotalDeLeadsPorFunil() {
  return useQuery({
    queryKey: ['total-de-leads-por-funil'],
    queryFn: () => commercialMetricsService.getTotalDeLeadsPorFunil(),
    refetchInterval: 30000,
  });
}

// Hook para buscar total de agendamentos por funil
export function useTotalDeAgendamentosPorFunil() {
  return useQuery({
    queryKey: ['total-de-agendamentos-por-funil'],
    queryFn: () => commercialMetricsService.getTotalDeAgendamentosPorFunil(),
    refetchInterval: 30000,
  });
}

// Hook principal que busca todas as métricas e calcula os KPIs
export function useCommercialMetrics(selectedMonth?: string) {
  const leadsQueEntraramQuery = useLeadsQueEntraram();
  const allLeadsQuery = useAllTotalDeLeads();
  const allCallsQuery = useAllTotalDeCallsAgendadas();
  
  // Se não há mês selecionado ou é string vazia, usa o mais recente
  const currentMonth = (selectedMonth && selectedMonth !== '') 
    ? selectedMonth 
    : (allLeadsQuery.data && allLeadsQuery.data.length > 0 ? allLeadsQuery.data[0].LEADS : null);
  
  const totalLeadsQuery = useTotalDeLeadsByMonth(currentMonth);
  const totalCallsQuery = useTotalDeCallsAgendadasByMonth(currentMonth);
  const leadsPorFunilQuery = useTotalDeLeadsPorFunil();
  const agendamentosPorFunilQuery = useTotalDeAgendamentosPorFunil();

  const isLoading = 
    leadsQueEntraramQuery.isLoading ||
    totalLeadsQuery.isLoading ||
    totalCallsQuery.isLoading ||
    leadsPorFunilQuery.isLoading ||
    agendamentosPorFunilQuery.isLoading;

  const isError = 
    leadsQueEntraramQuery.isError ||
    totalLeadsQuery.isError ||
    totalCallsQuery.isError ||
    leadsPorFunilQuery.isError ||
    agendamentosPorFunilQuery.isError;

  // Função auxiliar para processar valores (converte decimais para %)
  const processKpiValue = (value: any): number => {
    const num = metricsCalculations.parseNumber(value);
    // Se está entre 0 e 1, multiplica por 100 para converter para porcentagem
    if (num > 0 && num < 1) {
      return num * 100;
    }
    return num;
  };

  // Calcular KPIs
  const kpis = {
    totalLeads: processKpiValue(totalLeadsQuery.data?.TOTAL_DE_LEADS ?? 0),
    totalCalls: processKpiValue(totalCallsQuery.data?.TOTAL_DE_CALLS_AGENDADAS ?? 0),
    conversionRate: processKpiValue(totalCallsQuery.data?.PERCENT_QUE_VAI_PRA_CALL ?? 0),
    
    // Leads por canal
    leadsGoogle: processKpiValue(totalLeadsQuery.data?.LEAD_GOOGLE ?? 0),
    leadsGoogleForms: processKpiValue(totalLeadsQuery.data?.LEAD_GOOGLE_FORMS ?? 0),
    leadsInstagram: processKpiValue(totalLeadsQuery.data?.LEAD_INSTAGRAM ?? 0),
    leadsFacebook: processKpiValue(totalLeadsQuery.data?.LEAD_FACEBOOK ?? 0),
    leadsSeller: processKpiValue(totalLeadsQuery.data?.LEAD_SELLER ?? 0),
    leadsIndicacao: processKpiValue(totalLeadsQuery.data?.LEAD_INDICACAO ?? 0),
    leadsOutros: processKpiValue(totalLeadsQuery.data?.LEAD_OUTROS ?? 0),

    // Calls por canal
    callsGoogle: processKpiValue(totalCallsQuery.data?.AGENDADOS_GOOGLE ?? 0),
    callsGoogleForms: processKpiValue(totalCallsQuery.data?.AGENDADOS_GOOGLE_FORMS ?? 0),
    callsInstagram: processKpiValue(totalCallsQuery.data?.AGENDADOS_INSTAGRAM ?? 0),
    callsFacebook: processKpiValue(totalCallsQuery.data?.AGENDADOS_FACEBOOK ?? 0),
    callsSeller: processKpiValue(totalCallsQuery.data?.AGENDADOS_SELLER ?? 0),
    callsIndicacao: processKpiValue(totalCallsQuery.data?.AGENDADOS_INDICACAO ?? 0),
    callsOutros: processKpiValue(totalCallsQuery.data?.AGENDADOS_OUTROS ?? 0),
  };

  // Dados diários formatados (valores decimais são convertidos para porcentagem)
  const dailyData = leadsQueEntraramQuery.data?.map(item => {
    // Função para processar cada valor
    const processValue = (value: any) => {
      const num = metricsCalculations.parseNumber(value);
      // Se já foi convertido (> 1) ou é zero, retorna como está
      // Se está entre 0 e 1, multiplica por 100
      if (num > 0 && num < 1) {
        return num * 100;
      }
      return num;
    };

    return {
      date: item.DATA || '',
      google: processValue(item.GOOGLE),
      googleForms: processValue(item.GOOGLE_FORMS),
      instagram: processValue(item.INSTAGRAM),
      facebook: processValue(item.FACEBOOK),
      seller: processValue(item.SELLER),
      indicacao: processValue(item.INDICACAO),
      outros: processValue(item.OUTROS),
      total: processValue(item.TOTAL),
    };
  }).sort((a, b) => {
    // Ordenar por data cronologicamente
    const parseDate = (dateStr: string) => {
      // Tentar diferentes formatos de data
      // Formato DD/MM/YY ou DD/MM/YYYY
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Mês começa em 0
        let year = parseInt(parts[2]);
        
        // Se ano tem 2 dígitos, converter para 4
        if (year < 100) {
          year += 2000;
        }
        
        return new Date(year, month, day).getTime();
      }
      
      // Tentar formato ISO ou outros
      return new Date(dateStr).getTime();
    };

    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    
    return dateA - dateB; // Ordem crescente (mais antiga primeiro)
  }) || [];

  // Dados por funil
  const funnelData = {
    leads: leadsPorFunilQuery.data || [],
    agendamentos: agendamentosPorFunilQuery.data || [],
  };

  // Lista de meses disponíveis
  const availableMonths = allLeadsQuery.data?.map(item => item.LEADS).filter(Boolean) || [];

  return {
    isLoading,
    isError,
    kpis,
    dailyData,
    funnelData,
    availableMonths,
    currentMonth: currentMonth || '',
    allMonthsData: {
      leads: allLeadsQuery.data || [],
      calls: allCallsQuery.data || [],
    },
    rawData: {
      leadsQueEntraram: leadsQueEntraramQuery.data,
      totalLeads: totalLeadsQuery.data,
      totalCalls: totalCallsQuery.data,
      leadsPorFunil: leadsPorFunilQuery.data,
      agendamentosPorFunil: agendamentosPorFunilQuery.data,
    },
    refetch: () => {
      leadsQueEntraramQuery.refetch();
      allLeadsQuery.refetch();
      allCallsQuery.refetch();
      totalLeadsQuery.refetch();
      totalCallsQuery.refetch();
      leadsPorFunilQuery.refetch();
      agendamentosPorFunilQuery.refetch();
    },
  };
}

