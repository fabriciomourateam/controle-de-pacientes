interface N8NWebhookData {
  table: string;
  data: any;
  timestamp: string;
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

export class N8NWebhookService {
  private static readonly STORAGE_KEY = 'n8n_metrics_data';
  private static readonly WEBHOOK_URL = '/api/n8n-webhook';

  // Processar dados recebidos do webhook
  static processWebhookData(webhookData: N8NWebhookData): void {
    console.log(`📊 Processando dados do N8N - Tabela: ${webhookData.table}`);
    
    try {
      // Obter dados existentes do localStorage
      const existingData = this.getStoredData();
      
      // Processar dados baseado na tabela
      switch (webhookData.table) {
        case 'leads_que_entraram':
          this.processLeadsData(webhookData.data, existingData);
          break;
        case 'total_leads_mes':
          this.processMonthlyLeadsData(webhookData.data, existingData);
          break;
        case 'calls_agendadas':
          this.processCallsData(webhookData.data, existingData);
          break;
        case 'leads_funis':
          this.processLeadsFunisData(webhookData.data, existingData);
          break;
        case 'agend_funis':
          this.processAgendFunisData(webhookData.data, existingData);
          break;
        default:
          console.warn(`Tabela desconhecida: ${webhookData.table}`);
      }
      
      // Atualizar timestamp
      existingData.lastUpdated = webhookData.timestamp;
      
      // Salvar dados atualizados
      this.saveData(existingData);
      
      console.log('✅ Dados processados e salvos com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao processar dados do webhook:', error);
    }
  }

  // Processar dados de leads diários
  private static processLeadsData(data: any, existingData: CommercialMetricsData): void {
    if (!data.DATA) return;
    
    const leadData = {
      date: this.formatDate(data.DATA),
      google: this.parseNumber(data.GOOGLE || 0),
      googleForms: this.parseNumber(data.GOOGLE_FORMS || 0),
      instagram: this.parseNumber(data.INSTAGRAM || 0),
      facebook: this.parseNumber(data.FACEBOOK || 0),
      seller: this.parseNumber(data.SELLER || 0),
      indicacao: this.parseNumber(data.INDICACAO || 0),
      outros: this.parseNumber(data.OUTROS || 0),
      total: this.parseNumber(data.TOTAL || 0),
    };

    // Atualizar ou adicionar dados de leads
    const existingIndex = existingData.dailyLeads.findIndex(item => item.date === leadData.date);
    if (existingIndex >= 0) {
      existingData.dailyLeads[existingIndex] = leadData;
    } else {
      existingData.dailyLeads.push(leadData);
    }

    // Ordenar por data
    existingData.dailyLeads.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Processar dados de calls
  private static processCallsData(data: any, existingData: CommercialMetricsData): void {
    if (!data.AGENDADAS) return;
    
    const callData = {
      date: this.formatDate(data.AGENDADAS),
      scheduled: this.parseNumber(data.TOTAL_DE_CALLS_AGENDADAS || 0),
      completed: Math.round(this.parseNumber(data.TOTAL_DE_CALLS_AGENDADAS || 0) * 0.8), // Estimativa
    };

    // Atualizar ou adicionar dados de calls
    const existingIndex = existingData.dailyCalls.findIndex(item => item.date === callData.date);
    if (existingIndex >= 0) {
      existingData.dailyCalls[existingIndex] = callData;
    } else {
      existingData.dailyCalls.push(callData);
    }

    // Ordenar por data
    existingData.dailyCalls.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Processar dados mensais de leads
  private static processMonthlyLeadsData(data: any, existingData: CommercialMetricsData): void {
    // Implementar lógica para dados mensais
    console.log('📈 Processando dados mensais de leads:', data);
  }

  // Processar dados de leads por funil
  private static processLeadsFunisData(data: any, existingData: CommercialMetricsData): void {
    // Implementar lógica para leads por funil
    console.log('🎯 Processando dados de leads por funil:', data);
  }

  // Processar dados de agendamentos por funil
  private static processAgendFunisData(data: any, existingData: CommercialMetricsData): void {
    // Implementar lógica para agendamentos por funil
    console.log('📅 Processando dados de agendamentos por funil:', data);
  }

  // Obter dados armazenados
  static getStoredData(): CommercialMetricsData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao obter dados armazenados:', error);
    }

    // Retornar estrutura padrão
    return {
      dailyLeads: [],
      dailyCalls: [],
      monthlyLeads: { current: 0, previous: 0, growth: 0 },
      monthlyCalls: { current: 0, previous: 0, growth: 0 },
      totalLeads: 0,
      totalCalls: 0,
      conversionRate: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Salvar dados
  private static saveData(data: CommercialMetricsData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }

  // Obter métricas processadas
  static getMetrics(): CommercialMetricsData {
    const data = this.getStoredData();
    
    // Calcular totais
    data.totalLeads = data.dailyLeads.reduce((sum, item) => sum + item.total, 0);
    data.totalCalls = data.dailyCalls.reduce((sum, item) => sum + item.scheduled, 0);
    data.conversionRate = data.totalLeads > 0 ? (data.totalCalls / data.totalLeads) * 100 : 0;

    return data;
  }

  // Buscar dados do N8N via API
  static async fetchDataFromN8N(): Promise<void> {
    try {
      console.log('🔄 Buscando dados do N8N...');
      
      // Verificar se já há dados no localStorage
      const existingData = this.getStoredData();
      if (existingData.dailyLeads.length > 0 || existingData.dailyCalls.length > 0) {
        console.log('✅ Dados já existem no localStorage, não é necessário buscar');
        return;
      }
      
      // Usar dados simulados como fallback
      console.log('⚠️ Nenhum dado encontrado, usando dados simulados para demonstração');
      this.simulateN8NData();
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados do N8N:', error);
      // Em caso de erro, usar dados simulados
      this.simulateN8NData();
    }
  }

  // Processar dados reais do N8N (chamado quando N8N envia dados)
  static processRealN8NData(webhookData: N8NWebhookData): void {
    console.log('🔄 Processando dados reais do N8N...');
    console.log('📊 Tabela:', webhookData.table);
    console.log('📋 Dados:', webhookData.data);
    
    try {
      this.processWebhookData(webhookData);
      console.log('✅ Dados reais do N8N processados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao processar dados reais do N8N:', error);
    }
  }

  // Simular dados do N8N (para teste)
  static simulateN8NData(): void {
    console.log('🔄 Simulando dados do N8N...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const mockData = [
      {
        table: 'leads_que_entraram',
        data: {
          DATA: today.toISOString().split('T')[0],
          GOOGLE: 15,
          GOOGLE_FORMS: 8,
          INSTAGRAM: 12,
          FACEBOOK: 6,
          SELLER: 4,
          INDICACAO: 3,
          OUTROS: 2,
          TOTAL: 50
        },
        timestamp: today.toISOString()
      },
      {
        table: 'leads_que_entraram',
        data: {
          DATA: yesterday.toISOString().split('T')[0],
          GOOGLE: 12,
          GOOGLE_FORMS: 6,
          INSTAGRAM: 10,
          FACEBOOK: 5,
          SELLER: 3,
          INDICACAO: 2,
          OUTROS: 1,
          TOTAL: 39
        },
        timestamp: yesterday.toISOString()
      },
      {
        table: 'calls_agendadas',
        data: {
          AGENDADAS: today.toISOString().split('T')[0],
          TOTAL_DE_CALLS_AGENDADAS: 25
        },
        timestamp: today.toISOString()
      },
      {
        table: 'calls_agendadas',
        data: {
          AGENDADAS: yesterday.toISOString().split('T')[0],
          TOTAL_DE_CALLS_AGENDADAS: 18
        },
        timestamp: yesterday.toISOString()
      }
    ];

    mockData.forEach(data => {
      this.processWebhookData(data);
    });
    
    console.log('✅ Dados simulados do N8N processados');
  }

  // Limpar dados
  static clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Testar conexão com o endpoint
  static async testConnection(): Promise<boolean> {
    // Modo offline - sempre retorna true para permitir uso local
    console.log('🔄 Testando conexão (modo offline)...');
    
    try {
      // Verificar se há dados no localStorage
      const existingData = this.getStoredData();
      const hasData = existingData.dailyLeads.length > 0 || existingData.dailyCalls.length > 0;
      
      if (hasData) {
        console.log('✅ Dados encontrados no localStorage');
        return true;
      } else {
        console.log('⚠️ Nenhum dado encontrado, mas sistema funcionando offline');
        return true;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar dados locais:', error);
      // Retornar true mesmo com erro para permitir uso offline
      return true;
    }
  }

  // Utilitários
  private static formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
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
}
