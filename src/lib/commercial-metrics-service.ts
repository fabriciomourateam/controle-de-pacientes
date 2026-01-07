import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Tipos das tabelas
type LeadsQueEntraram = Database['public']['Tables']['leads_que_entraram']['Row'];
type TotalDeLeads = Database['public']['Tables']['Total de Leads']['Row'];
type TotalDeCallsAgendadas = Database['public']['Tables']['Total de Calls Agendadas']['Row'];
type TotalDeLeadsPorFunil = Database['public']['Tables']['Total de Leads por Funil']['Row'];
type TotalDeAgendamentosPorFunil = Database['public']['Tables']['Total de Agendamentos por Funil']['Row'];
type TotalDeVendas = Database['public']['Tables']['Total de Vendas']['Row'];

// Serviço de métricas comerciais
export const commercialMetricsService = {
  // Buscar dados diários de leads que entraram
  // Otimizado: adiciona limite para reduzir egress
  async getLeadsQueEntraram(limit: number = 365) {
    const { data, error } = await supabase
      .from('leads_que_entraram')
      .select('*')
      .order('DATA', { ascending: true })
      .limit(limit); // Limitar a 365 dias (1 ano)

    if (error) {
      console.error('Erro ao buscar leads que entraram:', error);
      throw error;
    }

    return data as LeadsQueEntraram[];
  },

  // Buscar todos os meses de leads
  // Otimizado: adiciona limite para reduzir egress
  async getAllTotalDeLeads(limit: number = 24) {
    const { data, error } = await supabase
      .from('Total de Leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit); // Limitar a 24 meses (2 anos)

    if (error) {
      console.error('Erro ao buscar total de leads:', error);
      throw error;
    }

    return (data || []) as TotalDeLeads[];
  },

  // Buscar total de leads de um mês específico
  async getTotalDeLeadsByMonth(month: string) {
    const { data, error } = await supabase
      .from('Total de Leads')
      .select('*')
      .eq('LEADS', month)
      .single();

    if (error) {
      console.error('Erro ao buscar total de leads do mês:', error);
      return null;
    }

    return data as TotalDeLeads | null;
  },

  // Buscar todos os meses de calls agendadas
  // Otimizado: adiciona limite para reduzir egress
  async getAllTotalDeCallsAgendadas(limit: number = 24) {
    const { data, error } = await supabase
      .from('Total de Calls Agendadas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit); // Limitar a 24 meses (2 anos)

    if (error) {
      console.error('Erro ao buscar total de calls agendadas:', error);
      throw error;
    }

    return (data || []) as TotalDeCallsAgendadas[];
  },

  // Buscar total de calls agendadas de um mês específico
  async getTotalDeCallsAgendadasByMonth(month: string) {
    const { data, error } = await supabase
      .from('Total de Calls Agendadas')
      .select('*')
      .eq('AGENDADAS', month)
      .single();

    if (error) {
      console.error('Erro ao buscar total de calls agendadas do mês:', error);
      return null;
    }

    return data as TotalDeCallsAgendadas | null;
  },

  // Buscar total de leads por funil
  // Otimizado: adiciona limite para reduzir egress
  async getTotalDeLeadsPorFunil(limit: number = 50) {
    const { data, error } = await supabase
      .from('Total de Leads por Funil')
      .select('*')
      .limit(limit); // Limitar a 50 registros

    if (error) {
      console.error('Erro ao buscar total de leads por funil:', error);
      throw error;
    }

    return data as TotalDeLeadsPorFunil[];
  },

  // Buscar total de agendamentos por funil
  // Otimizado: adiciona limite para reduzir egress
  async getTotalDeAgendamentosPorFunil(limit: number = 50) {
    const { data, error } = await supabase
      .from('Total de Agendamentos por Funil')
      .select('*')
      .limit(limit); // Limitar a 50 registros

    if (error) {
      console.error('Erro ao buscar total de agendamentos por funil:', error);
      throw error;
    }

    return data as TotalDeAgendamentosPorFunil[];
  },

  // Buscar dados de vendas
  // Otimizado: adiciona limite para reduzir egress
  // Se selectedYear for 2026 ou posterior, busca da tabela "Total de Vendas 2026"
  // Se selectedYear for 2025, busca da tabela "Total de Vendas"
  // Se selectedYear for undefined (todos os anos), busca de ambas as tabelas e combina
  async getTotalDeVendas(limit: number = 1000, selectedYear?: number) {
    console.log('🔍 Buscando dados DIRETO do Supabase...', selectedYear ? `Ano: ${selectedYear}` : 'Todos os anos');
    
    // Se não há ano selecionado (todos os anos), buscar de ambas as tabelas
    if (selectedYear === undefined) {
      console.log('📊 Buscando de ambas as tabelas (2025 e 2026)');
      
      const [data2025, data2026] = await Promise.all([
        supabase
          .from('Total de Vendas')
          .select('*')
          .order('DATA', { ascending: false })
          .limit(limit),
        supabase
          .from('Total de Vendas 2026')
          .select('*')
          .order('DATA', { ascending: false })
          .limit(limit)
      ]);

      if (data2025.error) {
        console.error('Erro ao buscar vendas de 2025:', data2025.error);
        throw data2025.error;
      }

      // Se a tabela de 2026 não existir (404), apenas usar dados de 2025
      if (data2026.error) {
        if (data2026.error.code === 'PGRST116' || data2026.error.message?.includes('404') || data2026.error.message?.includes('not found')) {
          console.warn('⚠️ Tabela "Total de Vendas 2026" não encontrada. Usando apenas dados de 2025.');
          return (data2025.data || []) as TotalDeVendas[];
        }
        console.error('Erro ao buscar vendas de 2026:', data2026.error);
        throw data2026.error;
      }

      const combined = [...(data2025.data || []), ...(data2026.data || [])];
      console.log(`✅ Dados combinados: ${data2025.data?.length || 0} de 2025 + ${data2026.data?.length || 0} de 2026 = ${combined.length} total`);
      
      return combined as TotalDeVendas[];
    }
    
    // Determinar qual tabela usar baseado no ano
    const use2026Table = selectedYear >= 2026;
    const tableName = use2026Table ? 'Total de Vendas 2026' : 'Total de Vendas';
    
    console.log(`📊 Usando tabela: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('DATA', { ascending: false })
      .limit(limit); // Limitar a 1000 registros mais recentes

    if (error) {
      // Se a tabela de 2026 não existir e estamos tentando buscar dela, retornar erro mais claro
      if (use2026Table && (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('not found'))) {
        console.error(`❌ Tabela "${tableName}" não encontrada no Supabase. Verifique se o nome da tabela está correto.`);
        throw new Error(`Tabela "${tableName}" não encontrada. Por favor, verifique se a tabela existe no Supabase com este nome exato.`);
      }
      console.error(`Erro ao buscar total de vendas da tabela ${tableName}:`, error);
      throw error;
    }
    
    console.log(`✅ Dados recebidos do Supabase (${tableName}):`, data?.length, 'registros');
    
    // Contar diretamente aqui para verificar
    if (data) {
      const contagemDireta = {
        total: data.length,
        comprou: data.filter(v => v.COMPROU === '1').length,
        naoComprou: data.filter(v => v['NÃO COMPROU'] === '1').length,
        noShow: data.filter(v => v['NO SHOW'] === '1').length
      };
      console.log('📊 CONTAGEM DIRETA NO SERVICE:', contagemDireta);
    }

    return data as TotalDeVendas[];
  },

  // Buscar vendas por mês específico
  // Otimizado: adiciona limite para reduzir egress
  // Se o mês contém "2026" ou ano >= 2026, busca da tabela "Total de Vendas 2026"
  async getVendasByMonth(month: string, limit: number = 500, selectedYear?: number) {
    // Determinar qual tabela usar baseado no ano
    // Se selectedYear for 2026 ou posterior, ou se o mês contém "2026", usar a tabela de 2026
    const use2026Table = selectedYear !== undefined && selectedYear >= 2026 || month.includes('2026');
    const tableName = use2026Table ? 'Total de Vendas 2026' : 'Total de Vendas';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('MES', month)
      .order('DATA', { ascending: false })
      .limit(limit); // Limitar a 500 registros por mês

    if (error) {
      console.error(`Erro ao buscar vendas do mês da tabela ${tableName}:`, error);
      throw error;
    }

    return data as TotalDeVendas[];
  },

  // Buscar todos os dados de uma vez
  async getAllMetrics() {
    try {
      const [
        leadsQueEntraram,
        totalLeads,
        totalCalls,
        leadsPorFunil,
        agendamentosPorFunil,
        vendas
      ] = await Promise.all([
        this.getLeadsQueEntraram(),
        this.getTotalDeLeads(),
        this.getTotalDeCallsAgendadas(),
        this.getTotalDeLeadsPorFunil(),
        this.getTotalDeAgendamentosPorFunil(),
        this.getTotalDeVendas()
      ]);

      return {
        leadsQueEntraram,
        totalLeads,
        totalCalls,
        leadsPorFunil,
        agendamentosPorFunil,
        vendas
      };
    } catch (error) {
      console.error('Erro ao buscar todas as métricas:', error);
      throw error;
    }
  }
};

// Funções auxiliares para calcular métricas
export const metricsCalculations = {
  // Calcular taxa de conversão
  calculateConversionRate(totalLeads: number, totalCalls: number): number {
    if (totalLeads === 0) return 0;
    return (totalCalls / totalLeads) * 100;
  },

  // Calcular crescimento percentual
  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  // Formatar número como porcentagem
  formatPercent(value: string | number | null | undefined): number {
    if (!value) return 0;
    
    // Se é número
    if (typeof value === 'number') {
      // Se está entre 0 e 1, multiplica por 100
      if (value > 0 && value < 1) {
        return value * 100;
      }
      return value;
    }
    
    // Se é string, remove % e converte
    const cleaned = value.replace('%', '').replace(',', '.').trim();
    const num = parseFloat(cleaned) || 0;
    
    // Se o número resultante está entre 0 e 1, multiplica por 100
    if (num > 0 && num < 1) {
      return num * 100;
    }
    
    return num;
  },

  // Converter string para número (sem conversão automática de %)
  parseNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    
    const cleaned = value.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  },

  // Formatar valor para exibição
  formatValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '0';
    
    // Se é string e contém %, retorna como está
    if (typeof value === 'string' && value.includes('%')) {
      return value;
    }
    
    const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(',', '.'));
    
    // Se o número original está entre 0 e 1 (decimal), converte e exibe como %
    if (typeof value === 'number' && value > 0 && value < 1) {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    // Se é um número string que parece ser decimal (0.xxxx)
    if (typeof value === 'string') {
      const original = parseFloat(value);
      if (original > 0 && original < 1) {
        return `${(original * 100).toFixed(1)}%`;
      }
    }
    
    return num.toLocaleString('pt-BR');
  }
};
