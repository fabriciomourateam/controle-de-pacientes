import { useQuery } from '@tanstack/react-query';
import { commercialMetricsService, metricsCalculations } from '@/lib/commercial-metrics-service';
import { useScheduledDataRefetch } from '@/hooks/use-scheduled-refetch';

// Hook para buscar leads que entraram (dados diários)
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useLeadsQueEntraram() {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['leads-que-entraram'],
    queryFn: () => commercialMetricsService.getLeadsQueEntraram(),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });
}

// Hook para buscar todos os meses de leads
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useAllTotalDeLeads() {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['all-total-de-leads'],
    queryFn: () => commercialMetricsService.getAllTotalDeLeads(),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar total de leads de um mês específico
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useTotalDeLeadsByMonth(month: string | null) {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['total-de-leads', month],
    queryFn: () => month ? commercialMetricsService.getTotalDeLeadsByMonth(month) : null,
    enabled: !!month,
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar todos os meses de calls agendadas
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useAllTotalDeCallsAgendadas() {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['all-total-de-calls-agendadas'],
    queryFn: () => commercialMetricsService.getAllTotalDeCallsAgendadas(),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar total de calls agendadas de um mês específico
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useTotalDeCallsAgendadasByMonth(month: string | null) {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['total-de-calls-agendadas', month],
    queryFn: () => month ? commercialMetricsService.getTotalDeCallsAgendadasByMonth(month) : null,
    enabled: !!month,
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar total de leads por funil
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useTotalDeLeadsPorFunil() {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['total-de-leads-por-funil'],
    queryFn: () => commercialMetricsService.getTotalDeLeadsPorFunil(),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar total de agendamentos por funil
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useTotalDeAgendamentosPorFunil() {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['total-de-agendamentos-por-funil'],
    queryFn: () => commercialMetricsService.getTotalDeAgendamentosPorFunil(),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar dados de vendas
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useTotalDeVendas() {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['total-de-vendas'],
    queryFn: () => commercialMetricsService.getTotalDeVendas(),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar vendas de um mês específico
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useVendasByMonth(month: string | null) {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['vendas', month],
    queryFn: () => month ? commercialMetricsService.getVendasByMonth(month) : [],
    enabled: !!month,
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
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
  const dailyData = (() => {
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
        
        return new Date(year, month, day);
      }
      
      // Tentar formato ISO ou outros
      return new Date(dateStr);
    };

    // Data de hoje (17/10/2025)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia de hoje
    
    // Data de 10 dias atrás
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 9); // -9 porque hoje conta como 1
    tenDaysAgo.setHours(0, 0, 0, 0); // Início do dia

    const processValue = (value: any) => {
      const num = metricsCalculations.parseNumber(value);
      // Se já foi convertido (> 1) ou é zero, retorna como está
      // Se está entre 0 e 1, multiplica por 100
      if (num > 0 && num < 1) {
        return num * 100;
      }
      return num;
    };

    const allData = leadsQueEntraramQuery.data?.map(item => {
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
        parsedDate: parseDate(item.DATA || ''),
      };
    }) || [];

    // Filtrar pelos últimos 10 dias
    const filteredData = allData.filter(item => {
      const itemDate = item.parsedDate;
      return itemDate >= tenDaysAgo && itemDate <= today;
    });

    // Ordenar por data cronologicamente (mais antiga primeiro)
    const sortedData = filteredData.sort((a, b) => {
      return a.parsedDate.getTime() - b.parsedDate.getTime();
    });

    // Remover o parsedDate antes de retornar
    return sortedData.map(({ parsedDate, ...rest }) => rest);
  })();

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

// Função auxiliar para extrair ano do campo DATA
const extractYearFromData = (dataStr: string | null | undefined): number | null => {
  if (!dataStr) return null;
  
  // Tentar parsear como data
  const date = new Date(dataStr);
  if (!isNaN(date.getTime())) {
    return date.getFullYear();
  }
  
  // Tentar extrair ano de string (formato YYYY)
  const yearMatch = dataStr.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  
  return null;
};

// Hook para processar métricas de vendas
export function useSalesMetrics(selectedMonth?: string, selectedYear?: number) {
  const vendasQuery = useTotalDeVendas();
  
  if (vendasQuery.isLoading || !vendasQuery.data) {
      return {
      isLoading: true,
      isError: false,
      monthlyMetrics: [],
      funnelMetrics: [],
      closerMetrics: {
        fabricio: { total: 0, comprou: 0, naoComprou: 0, noShow: 0, conversionRate: 0 },
        closer: { total: 0, comprou: 0, naoComprou: 0, noShow: 0, conversionRate: 0 }
      },
      availableMonths: [],
      availableYears: [],
      monthsByYear: {},
      totals: {
        totalCalls: 0,
        comprou: 0,
        naoComprou: 0,
        noShow: 0,
        desmarcados: 0,
        pixCompromisso: 0
      },
      refetch: vendasQuery.refetch,
    };
  }

  if (vendasQuery.isError) {
      return {
      isLoading: false,
      isError: true,
      monthlyMetrics: [],
      funnelMetrics: [],
      closerMetrics: {
        fabricio: { total: 0, comprou: 0, naoComprou: 0, noShow: 0, conversionRate: 0 },
        closer: { total: 0, comprou: 0, naoComprou: 0, noShow: 0, conversionRate: 0 }
      },
      availableMonths: [],
      availableYears: [],
      monthsByYear: {},
      totals: {
        totalCalls: 0,
        comprou: 0,
        naoComprou: 0,
        noShow: 0,
        desmarcados: 0,
        pixCompromisso: 0
      },
      refetch: vendasQuery.refetch,
    };
  }

  const vendas = vendasQuery.data;

  // Função auxiliar para normalizar strings (remover acentos, espaços extras, etc)
  const normalizeString = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.toString().toLowerCase().trim();
  };

  // Log para debug - verificar se os dados estão chegando
  // console.log('🔍 useSalesMetrics - Total de vendas:', vendas.length);

  // Função para verificar se é "Sim" ou variação (aceita vários formatos) - VERSÃO CORRIGIDA
  const isYes = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const normalized = normalizeString(value);
    
    // Log para debug - verificar valores problemáticos
    if (normalized && !['sim', 's', 'yes', 'y', 'x', '1', 'true', 'não', 'nao', 'no', '0', 'false', ''].includes(normalized)) {
      console.log('🔍 Valor não reconhecido:', value, '-> normalizado:', normalized);
    }
    
    // Aceita: "Sim", "sim", "S", "s", "Yes", "yes", "Y", "y", "X", "x", "1", "true"
    const result = normalized === 'sim' || 
           normalized === 's' || 
           normalized === 'yes' || 
           normalized === 'y' || 
           normalized === 'x' || 
           normalized === '1' || 
           normalized === 'true';
    return result;
  };

  // Filtrar vendas para remover "Reunião de equipe" e "Não especificado"
  const vendasValidas = vendas.filter(venda => {
    const funil = normalizeString(venda.FUNIL);
    const closer = normalizeString(venda['QUEM FEZ A CALL']);
    
    // Remover se o funil for "reunião de equipe"
    if (funil.includes('reuniao') || funil.includes('reunião') || funil.includes('equipe')) {
      return false;
    }
    
    // Remover se o closer for "não especificado"
    if (closer.includes('nao especificado') || closer.includes('não especificado')) {
      return false;
    }
    
    return true;
  });

  // Extrair ano de cada venda e criar estrutura de meses por ano
  const monthOrder = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  // Criar mapa de meses por ano
  const monthsByYearMap = new Map<number, Set<string>>();
  const monthYearMap = new Map<string, { mes: string; ano: number }>();
  
  vendasValidas.forEach(venda => {
    const mes = venda.MÊS;
    if (!mes) return;
    
    // Tentar extrair ano do campo DATA
    let ano = extractYearFromData(venda.DATA);
    
    // Se não conseguiu extrair do DATA, assumir 2025 para meses de junho a dezembro
    // e 2026 para meses de janeiro a maio (assumindo que estamos em 2025)
    if (!ano) {
      const mesLower = mes.toLowerCase();
      const mesIndex = monthOrder.findIndex(m => mesLower.includes(m.toLowerCase()));
      
      // Se for junho a dezembro, assumir 2025
      if (mesIndex >= 5 && mesIndex <= 11) {
        ano = 2025;
      } else {
        // Para outros meses, usar ano atual ou 2026
        ano = new Date().getFullYear();
      }
    }
    
    if (!monthsByYearMap.has(ano)) {
      monthsByYearMap.set(ano, new Set());
    }
    monthsByYearMap.get(ano)!.add(mes);
    
    // Criar chave única mes-ano
    const key = `${mes}-${ano}`;
    monthYearMap.set(key, { mes, ano });
  });
  
  // Converter para estrutura de meses por ano
  const monthsByYear: Record<number, string[]> = {};
  const availableYears: number[] = [];
  
  monthsByYearMap.forEach((months, year) => {
    const sortedMonths = Array.from(months).sort((a, b) => {
      const indexA = monthOrder.findIndex(m => a && a.toLowerCase().includes(m.toLowerCase()));
      const indexB = monthOrder.findIndex(m => b && b.toLowerCase().includes(m.toLowerCase()));
      return indexB - indexA; // Mais recente primeiro
    });
    monthsByYear[year] = sortedMonths;
    availableYears.push(year);
  });
  
  // Ordenar anos (mais recente primeiro)
  availableYears.sort((a, b) => b - a);
  
  // Criar lista de meses disponíveis com ano (formato: "Mês - Ano")
  const availableMonths: string[] = [];
  availableYears.forEach(year => {
    monthsByYear[year].forEach(mes => {
      availableMonths.push(`${mes} - ${year}`);
    });
  });
  
  // Filtrar por mês e ano se especificado
  const filteredVendas = vendasValidas.filter(venda => {
    const mes = venda.MÊS;
    if (!mes) return false;
    
    // Se não há filtro, retornar todas
    if (!selectedMonth && !selectedYear) return true;
    
    // Extrair ano da venda
    let ano = extractYearFromData(venda.DATA);
    if (!ano) {
      const mesLower = mes.toLowerCase();
      const mesIndex = monthOrder.findIndex(m => mesLower.includes(m.toLowerCase()));
      if (mesIndex >= 5 && mesIndex <= 11) {
        ano = 2025;
      } else {
        ano = new Date().getFullYear();
      }
    }
    
    // Se há filtro de ano, verificar se o ano corresponde
    if (selectedYear && ano !== selectedYear) return false;
    
    // Se há filtro de mês, verificar se o mês corresponde
    if (selectedMonth) {
      // Se selectedMonth contém ano (formato "Mês - Ano"), extrair apenas o mês
      const monthOnly = selectedMonth.includes(' - ') 
        ? selectedMonth.split(' - ')[0].trim()
        : selectedMonth;
      
      if (mes !== monthOnly) return false;
    }
    
    return true;
  });

  // 1. Métricas por mês (agora com ano)
  const monthlyMetricsMap = new Map<string, any>();
  
  filteredVendas.forEach(venda => {
    const mes = venda.MÊS || 'Sem mês';
    
    // Extrair ano
    let ano = extractYearFromData(venda.DATA);
    if (!ano) {
      const mesLower = mes.toLowerCase();
      const mesIndex = monthOrder.findIndex(m => mesLower.includes(m.toLowerCase()));
      if (mesIndex >= 5 && mesIndex <= 11) {
        ano = 2025;
      } else {
        ano = new Date().getFullYear();
      }
    }
    
    // Criar chave única mes-ano
    const key = `${mes} - ${ano}`;
    
    if (!monthlyMetricsMap.has(key)) {
      monthlyMetricsMap.set(key, {
        mes,
        ano,
        mesAno: key,
        totalCalls: 0,
        comprou: 0,
        naoComprou: 0,
        noShow: 0,
        desmarcados: 0,
        pixCompromisso: 0,
        funnels: new Map<string, any>(),
        closers: new Map<string, any>()
      });
    }
    
    const monthData = monthlyMetricsMap.get(key);
    monthData.totalCalls++;
    
    // LÓGICA SIMPLES: Contar exatamente como está marcado no Excel
    // Sem lógica de prioridade - cada status é independente
    const comprou = isYes(venda.COMPROU);
    const naoComprou = isYes(venda['NÃO COMPROU']);
    const noShow = isYes(venda['NO SHOW']);
    const desmarcados = isYes(venda['DESMARCADOS']);
    const pixCompromisso = isYes(venda['PIX COMPROMISSO']);
    
    if (comprou) {
      monthData.comprou++;
    }
    
    if (naoComprou) {
      monthData.naoComprou++;
    }
    
    if (noShow) {
      monthData.noShow++;
    }
    
    if (desmarcados) {
      monthData.desmarcados++;
    }
    
    if (pixCompromisso) {
      monthData.pixCompromisso++;
    }
    
    // Por funil dentro do mês
    const funil = venda.FUNIL || 'Sem funil';
    if (!monthData.funnels.has(funil)) {
      monthData.funnels.set(funil, {
        funil,
        totalCalls: 0,
        comprou: 0,
        naoComprou: 0,
        noShow: 0
      });
    }
    const funnelData = monthData.funnels.get(funil);
    funnelData.totalCalls++;
    
    // LÓGICA SIMPLES: Contar exatamente como está marcado
    if (comprou) {
      funnelData.comprou++;
    }
    
    if (naoComprou) {
      funnelData.naoComprou++;
    }
    
    if (noShow) {
      funnelData.noShow++;
    }
    
    // Por closer dentro do mês
    const closer = venda['QUEM FEZ A CALL'] || 'Não especificado';
    if (!monthData.closers.has(closer)) {
      monthData.closers.set(closer, {
        closer,
        totalCalls: 0,
        comprou: 0,
        naoComprou: 0,
        noShow: 0
      });
    }
    const closerData = monthData.closers.get(closer);
    closerData.totalCalls++;
    
    // LÓGICA SIMPLES: Contar exatamente como está marcado
    if (comprou) {
      closerData.comprou++;
    }
    
    if (naoComprou) {
      closerData.naoComprou++;
    }
    
    if (noShow) {
      closerData.noShow++;
    }
  });

  // Converter mapas em arrays e calcular taxas de conversão
  const monthlyMetrics = Array.from(monthlyMetricsMap.values()).map(month => {
    const totalCallsRealizadas = month.comprou + month.naoComprou; // Não conta no show
    const conversionRate = totalCallsRealizadas > 0 
      ? (month.comprou / totalCallsRealizadas) * 100 
      : 0;

    return {
      ...month,
      funnels: Array.from(month.funnels.values()).map((f: any) => {
        const funnelCallsRealizadas = f.comprou + f.naoComprou;
        return {
          ...f,
          conversionRate: funnelCallsRealizadas > 0 
            ? (f.comprou / funnelCallsRealizadas) * 100 
            : 0
        };
      }),
      closers: Array.from(month.closers.values()).map((c: any) => {
        const closerCallsRealizadas = c.comprou + c.naoComprou;
        return {
          ...c,
          conversionRate: closerCallsRealizadas > 0 
            ? (c.comprou / closerCallsRealizadas) * 100 
            : 0
        };
      }),
      conversionRate
    };
  });

  // 2. Métricas gerais por funil (todos os meses)
  const funnelMetricsMap = new Map<string, any>();
  
  filteredVendas.forEach(venda => {
    const funil = venda.FUNIL || 'Sem funil';
    
    if (!funnelMetricsMap.has(funil)) {
      funnelMetricsMap.set(funil, {
        funil,
        totalCalls: 0,
        comprou: 0,
        naoComprou: 0,
        noShow: 0
      });
    }
    
    const funnelData = funnelMetricsMap.get(funil);
    funnelData.totalCalls++;
    
    const comprou = isYes(venda.COMPROU);
    const naoComprou = isYes(venda['NÃO COMPROU']);
    const noShow = isYes(venda['NO SHOW']);
    
    // LÓGICA SIMPLES: Contar exatamente como está marcado
    if (comprou) {
      funnelData.comprou++;
    }
    
    if (naoComprou) {
      funnelData.naoComprou++;
    }
    
    if (noShow) {
      funnelData.noShow++;
    }
  });

  const funnelMetrics = Array.from(funnelMetricsMap.values()).map(funnel => {
    // Taxa de conversão = (Vendas / Calls Realizadas) × 100
    // Calls Realizadas = comprou + não comprou (exclui no show)
    const funnelCallsRealizadas = funnel.comprou + funnel.naoComprou;
    return {
      ...funnel,
      conversionRate: funnelCallsRealizadas > 0 
        ? (funnel.comprou / funnelCallsRealizadas) * 100 
        : 0
    };
  });

  // 3. Métricas por closer (Fabricio vs Closer)
  const closerMetricsMap = new Map<string, any>();
  
  filteredVendas.forEach(venda => {
    const closer = venda['QUEM FEZ A CALL'] || 'Não especificado';
    
    if (!closerMetricsMap.has(closer)) {
      closerMetricsMap.set(closer, {
        closer,
        totalCalls: 0,
        comprou: 0,
        naoComprou: 0,
        noShow: 0
      });
    }
    
    const closerData = closerMetricsMap.get(closer);
    closerData.totalCalls++;
    
    const comprou = isYes(venda.COMPROU);
    const naoComprou = isYes(venda['NÃO COMPROU']);
    const noShow = isYes(venda['NO SHOW']);
    
    // LÓGICA SIMPLES: Contar exatamente como está marcado
    if (comprou) {
      closerData.comprou++;
    }
    
    if (naoComprou) {
      closerData.naoComprou++;
    }
    
    if (noShow) {
      closerData.noShow++;
    }
  });

  // Normalizar nomes de closers
  const getFabricioData = () => {
    const fabricioVariations = ['fabricio', 'fabrício', 'fab'];
    for (const [key, value] of closerMetricsMap.entries()) {
      if (fabricioVariations.some(v => normalizeString(key).includes(v))) {
        const callsRealizadas = value.comprou + value.naoComprou;
        return {
          ...value,
          conversionRate: callsRealizadas > 0 
            ? (value.comprou / callsRealizadas) * 100 
            : 0
        };
      }
    }
    return { total: 0, comprou: 0, naoComprou: 0, noShow: 0, conversionRate: 0 };
  };

  const getCloserData = () => {
    const closerVariations = ['closer'];
    for (const [key, value] of closerMetricsMap.entries()) {
      if (closerVariations.some(v => normalizeString(key).includes(v))) {
        const callsRealizadas = value.comprou + value.naoComprou;
        return {
          ...value,
          conversionRate: callsRealizadas > 0 
            ? (value.comprou / callsRealizadas) * 100 
            : 0
        };
      }
    }
    return { total: 0, comprou: 0, naoComprou: 0, noShow: 0, conversionRate: 0 };
  };

  // Calcular totais gerais
  const totals = monthlyMetrics.reduce((acc, month) => ({
    totalCalls: acc.totalCalls + month.totalCalls,
    comprou: acc.comprou + month.comprou,
    naoComprou: acc.naoComprou + month.naoComprou,
    noShow: acc.noShow + month.noShow,
    desmarcados: acc.desmarcados + (month.desmarcados || 0),
    pixCompromisso: acc.pixCompromisso + (month.pixCompromisso || 0),
  }), { 
    totalCalls: 0, 
    comprou: 0, 
    naoComprou: 0, 
    noShow: 0,
    desmarcados: 0,
    pixCompromisso: 0
  });

  return {
    isLoading: false,
    isError: false,
    monthlyMetrics,
    funnelMetrics,
    closerMetrics: {
      fabricio: getFabricioData(),
      closer: getCloserData(),
      all: Array.from(closerMetricsMap.values()).map(closer => {
        const callsRealizadas = closer.comprou + closer.naoComprou;
        return {
          ...closer,
          conversionRate: callsRealizadas > 0 
            ? (closer.comprou / callsRealizadas) * 100 
            : 0
        };
      })
    },
    availableMonths,
    availableYears,
    monthsByYear,
    totals,
    refetch: vendasQuery.refetch,
  };
}

