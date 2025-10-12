import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Tipos das tabelas
type LeadsQueEntraram = Database['public']['Tables']['leads_que_entraram']['Row'];
type TotalDeLeads = Database['public']['Tables']['Total de Leads']['Row'];
type TotalDeCallsAgendadas = Database['public']['Tables']['Total de Calls Agendadas']['Row'];
type TotalDeLeadsPorFunil = Database['public']['Tables']['Total de Leads por Funil']['Row'];
type TotalDeAgendamentosPorFunil = Database['public']['Tables']['Total de Agendamentos por Funil']['Row'];

// Serviço de métricas comerciais
export const commercialMetricsService = {
  // Buscar dados diários de leads que entraram
  async getLeadsQueEntraram() {
    const { data, error } = await supabase
      .from('leads_que_entraram')
      .select('*')
      .order('DATA', { ascending: true });

    if (error) {
      console.error('Erro ao buscar leads que entraram:', error);
      throw error;
    }

    return data as LeadsQueEntraram[];
  },

  // Buscar todos os meses de leads
  async getAllTotalDeLeads() {
    const { data, error } = await supabase
      .from('Total de Leads')
      .select('*')
      .order('created_at', { ascending: false });

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
  async getAllTotalDeCallsAgendadas() {
    const { data, error } = await supabase
      .from('Total de Calls Agendadas')
      .select('*')
      .order('created_at', { ascending: false });

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
  async getTotalDeLeadsPorFunil() {
    const { data, error } = await supabase
      .from('Total de Leads por Funil')
      .select('*');

    if (error) {
      console.error('Erro ao buscar total de leads por funil:', error);
      throw error;
    }

    return data as TotalDeLeadsPorFunil[];
  },

  // Buscar total de agendamentos por funil
  async getTotalDeAgendamentosPorFunil() {
    const { data, error } = await supabase
      .from('Total de Agendamentos por Funil')
      .select('*');

    if (error) {
      console.error('Erro ao buscar total de agendamentos por funil:', error);
      throw error;
    }

    return data as TotalDeAgendamentosPorFunil[];
  },

  // Buscar todos os dados de uma vez
  async getAllMetrics() {
    try {
      const [
        leadsQueEntraram,
        totalLeads,
        totalCalls,
        leadsPorFunil,
        agendamentosPorFunil
      ] = await Promise.all([
        this.getLeadsQueEntraram(),
        this.getTotalDeLeads(),
        this.getTotalDeCallsAgendadas(),
        this.getTotalDeLeadsPorFunil(),
        this.getTotalDeAgendamentosPorFunil()
      ]);

      return {
        leadsQueEntraram,
        totalLeads,
        totalCalls,
        leadsPorFunil,
        agendamentosPorFunil
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
