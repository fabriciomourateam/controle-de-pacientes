interface N8NWebhookResponse {
  success: boolean;
  data: {
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
    dailyCalls: Array<{
      date: string;
      scheduled: number;
      completed: number;
    }>;
    monthlyLeads: {
      current: number;
      previous: number;
      growth: number;
    };
    monthlyCalls: {
      current: number;
      previous: number;
      growth: number;
    };
    totalLeads: number;
    totalCalls: number;
    conversionRate: number;
  };
  lastUpdated: string;
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

export class N8NMetricsService {
  private static readonly N8N_WEBHOOK_URL = 'https://seu-n8n-instance.com/webhook/commercial-metrics';
  private static readonly FALLBACK_GOOGLE_SHEETS = true; // Usar Google Sheets como fallback

  static async getMetrics(): Promise<CommercialMetricsData> {
    try {
      // Tenta buscar dados do N8N primeiro
      const n8nData = await this.fetchFromN8N();
      if (n8nData) {
        return n8nData;
      }
    } catch (error) {
      console.warn('Erro ao buscar dados do N8N, tentando Google Sheets:', error);
    }

    // Fallback para Google Sheets se N8N falhar
    if (this.FALLBACK_GOOGLE_SHEETS) {
      try {
        const { CommercialMetricsService } = await import('./commercial-metrics-service');
        return await CommercialMetricsService.getMetrics();
      } catch (error) {
        console.error('Erro ao buscar dados do Google Sheets:', error);
        throw new Error('Não foi possível carregar dados nem do N8N nem do Google Sheets');
      }
    }

    throw new Error('N8N não disponível e fallback desabilitado');
  }

  private static async fetchFromN8N(): Promise<CommercialMetricsData | null> {
    try {
      const response = await fetch(this.N8N_WEBHOOK_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`N8N webhook retornou status ${response.status}`);
      }

      const data: N8NWebhookResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Resposta inválida do N8N');
      }

      return {
        dailyLeads: data.data.dailyLeads || [],
        dailyCalls: data.data.dailyCalls || [],
        monthlyLeads: data.data.monthlyLeads || { current: 0, previous: 0, growth: 0 },
        monthlyCalls: data.data.monthlyCalls || { current: 0, previous: 0, growth: 0 },
        totalLeads: data.data.totalLeads || 0,
        totalCalls: data.data.totalCalls || 0,
        conversionRate: data.data.conversionRate || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao buscar dados do N8N:', error);
      return null;
    }
  }

  // Método para testar a conexão com N8N
  static async testN8NConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.N8N_WEBHOOK_URL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao testar conexão N8N:', error);
      return false;
    }
  }

  // Método para forçar atualização via N8N
  static async refreshData(): Promise<CommercialMetricsData> {
    try {
      const response = await fetch(`${this.N8N_WEBHOOK_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar dados: ${response.status}`);
      }

      const data: N8NWebhookResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Resposta inválida do N8N');
      }

      return {
        dailyLeads: data.data.dailyLeads || [],
        dailyCalls: data.data.dailyCalls || [],
        monthlyLeads: data.data.monthlyLeads || { current: 0, previous: 0, growth: 0 },
        monthlyCalls: data.data.monthlyCalls || { current: 0, previous: 0, growth: 0 },
        totalLeads: data.data.totalLeads || 0,
        totalCalls: data.data.totalCalls || 0,
        conversionRate: data.data.conversionRate || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao atualizar dados via N8N:', error);
      throw error;
    }
  }
}
