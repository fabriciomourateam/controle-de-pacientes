interface N8NDataTableResponse {
  success: boolean;
  data: any[];
  error?: string;
}

interface CommercialMetricsData {
  dailyLeads: Array<{
    date: string;
    google: number;
    googleForms: number;
    instagram: number;
    facebook: number;
    seller: number;
    indicacao: number;
    outros: number;
    total: number;
  }>;
  monthlyLeads: {
    current: number;
    previous: number;
    growth: number;
  };
  dailyCalls: Array<{
    date: string;
    scheduled: number;
    completed: number;
  }>;
  monthlyCalls: {
    current: number;
    previous: number;
    growth: number;
  };
  totalLeads: number;
  totalCalls: number;
  conversionRate: number;
  lastUpdated: string;
}

export class N8NDataTableService {
  private static readonly N8N_BASE_URL = 'http://localhost:3002';
  private static readonly API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMzg3MmUxMy00YWE1LTRlNDAtYjRhNi03NTQ2ZjQyZGQ5NTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5NTE0NTg5fQ.aI088L82zfQYwuTCLrN4IiSuD4XuFC6hxmtWMpys0ko';
  
  // IDs das tabelas do N8N (baseado no seu JSON)
  private static readonly TABLES = {
    LEADS_QUE_ENTRARAM: '07P5hv4Q2O4fRA7t', // "Leads que Entraram"
    TOTAL_LEADS_MES: '6qM6zJYfYvGhhSTM', // "Total de Leads"
    CALLS_AGENDADAS: 'd3CAyQhEPlaMKw6e', // "Total de Calls Agendadas"
    LEADS_FUNIS: 'aRnjDkWWRPIKW5TW', // "Total de Leads por Funil"
    AGEND_FUNIS: '7TZHcivegKRPI083', // "Total de Agendamentos por Funil"
  };

  static async getMetrics(): Promise<CommercialMetricsData> {
    try {
      // Buscar dados de todas as tabelas em paralelo
      const [leadsData, monthlyLeadsData, callsData, leadsFunisData, agendFunisData] = await Promise.all([
        this.fetchDataTable(this.TABLES.LEADS_QUE_ENTRARAM),
        this.fetchDataTable(this.TABLES.TOTAL_LEADS_MES),
        this.fetchDataTable(this.TABLES.CALLS_AGENDADAS),
        this.fetchDataTable(this.TABLES.LEADS_FUNIS),
        this.fetchDataTable(this.TABLES.AGEND_FUNIS),
      ]);

      // Processar dados de leads diários
      const dailyLeads = this.processDailyLeads(leadsData);
      
      // Processar dados de calls diários
      const dailyCalls = this.processDailyCalls(callsData);
      
      // Processar métricas mensais
      const monthlyLeads = this.processMonthlyLeads(monthlyLeadsData);
      const monthlyCalls = this.processMonthlyCalls(callsData);
      
      // Calcular totais
      const totalLeads = dailyLeads.reduce((sum, item) => sum + item.total, 0);
      const totalCalls = dailyCalls.reduce((sum, item) => sum + item.scheduled, 0);
      const conversionRate = totalLeads > 0 ? (totalCalls / totalLeads) * 100 : 0;

      return {
        dailyLeads,
        dailyCalls,
        monthlyLeads,
        monthlyCalls,
        totalLeads,
        totalCalls,
        conversionRate,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao buscar dados do N8N:', error);
      throw new Error('Não foi possível carregar dados do N8N');
    }
  }

  private static async fetchDataTable(tableId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.N8N_BASE_URL}/api/v1/datatables/${tableId}/rows`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error(`Erro ao buscar tabela ${tableId}: ${response.status} - ${response.statusText}`);
        throw new Error(`Erro ao buscar tabela ${tableId}: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Tabela ${tableId} carregada:`, data.data?.length || 0, 'registros');
      return data.data || [];
    } catch (error) {
      console.error(`❌ Erro ao buscar tabela ${tableId}:`, error);
      return [];
    }
  }

  private static processDailyLeads(leadsData: any[]): Array<{
    date: string;
    google: number;
    googleForms: number;
    instagram: number;
    facebook: number;
    seller: number;
    indicacao: number;
    outros: number;
    total: number;
  }> {
    return leadsData
      .map(item => ({
        date: this.formatDate(item.DATA || item.data),
        google: this.parseNumber(item.GOOGLE || item.google || 0),
        googleForms: this.parseNumber(item.GOOGLE_FORMS || item.googleForms || 0),
        instagram: this.parseNumber(item.INSTAGRAM || item.instagram || 0),
        facebook: this.parseNumber(item.FACEBOOK || item.facebook || 0),
        seller: this.parseNumber(item.SELLER || item.seller || 0),
        indicacao: this.parseNumber(item.INDICACAO || item.indicacao || 0),
        outros: this.parseNumber(item.OUTROS || item.outros || 0),
        total: this.parseNumber(item.TOTAL || item.total || 0),
      }))
      .filter(item => item.date && item.date !== 'Invalid Date')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private static processDailyCalls(callsData: any[]): Array<{
    date: string;
    scheduled: number;
    completed: number;
  }> {
    return callsData
      .map(item => ({
        date: this.formatDate(item.AGENDADAS || item.agendadas || item.DATA || item.data),
        scheduled: this.parseNumber(item.TOTAL_DE_CALLS_AGENDADAS || item.totalCalls || 0),
        completed: Math.round(this.parseNumber(item.TOTAL_DE_CALLS_AGENDADAS || item.totalCalls || 0) * 0.8), // Estimativa
      }))
      .filter(item => item.date && item.date !== 'Invalid Date')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private static processMonthlyLeads(monthlyData: any[]): {
    current: number;
    previous: number;
    growth: number;
  } {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthData = monthlyData.find(item => {
      const itemDate = new Date(item.LEADS || item.leads || '');
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthData = monthlyData.find(item => {
      const itemDate = new Date(item.LEADS || item.leads || '');
      return itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear;
    });

    const current = currentMonthData ? this.parseNumber(currentMonthData.TOTAL_DE_LEADS || currentMonthData.totalLeads || 0) : 0;
    const previous = previousMonthData ? this.parseNumber(previousMonthData.TOTAL_DE_LEADS || previousMonthData.totalLeads || 0) : 0;
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return { current, previous, growth };
  }

  private static processMonthlyCalls(callsData: any[]): {
    current: number;
    previous: number;
    growth: number;
  } {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthCalls = callsData
      .filter(item => {
        const itemDate = new Date(item.AGENDADAS || item.agendadas || '');
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + this.parseNumber(item.TOTAL_DE_CALLS_AGENDADAS || item.totalCalls || 0), 0);

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthCalls = callsData
      .filter(item => {
        const itemDate = new Date(item.AGENDADAS || item.agendadas || '');
        return itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear;
      })
      .reduce((sum, item) => sum + this.parseNumber(item.TOTAL_DE_CALLS_AGENDADAS || item.totalCalls || 0), 0);

    const growth = previousMonthCalls > 0 ? ((currentMonthCalls - previousMonthCalls) / previousMonthCalls) * 100 : 0;

    return { current: currentMonthCalls, previous: previousMonthCalls, growth };
  }

  private static formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      // Tenta diferentes formatos de data
      const formats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // DD-MM-YYYY
      ];

      for (const format of formats) {
        const match = dateStr.toString().match(format);
        if (match) {
          if (format === formats[0]) { // DD/MM/YYYY
            const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
            return date.toISOString().split('T')[0];
          } else if (format === formats[1]) { // YYYY-MM-DD
            return dateStr;
          } else { // DD-MM-YYYY
            const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
            return date.toISOString().split('T')[0];
          }
        }
      }

      // Fallback
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  private static parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    const cleaned = value.toString().replace(/[^\d,.-]/g, '');
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  // Método para testar a conexão
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.N8N_BASE_URL}/test-n8n`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return data.success === true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao testar conexão N8N:', error);
      return false;
    }
  }

  // Método para forçar atualização
  static async refreshData(): Promise<CommercialMetricsData> {
    return this.getMetrics();
  }
}
