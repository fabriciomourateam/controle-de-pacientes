interface GoogleSheetsResponse {
  values: string[][];
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

export class CommercialMetricsService {
  private static readonly SHEET_ID = '1BTzBftwg_C6rxzNYmIHTvlCGNH1GuyjIQHzGQlkQQuo';
  private static readonly API_KEY = 'AIzaSyCvyO-iC4qK2iw321_VpdxYE8qkkPR1lVU';
  private static readonly BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

  private static async fetchSheetData(range: string): Promise<string[][]> {
    if (!this.API_KEY) {
      throw new Error('Google Sheets API key não configurada');
    }

    const url = `${this.BASE_URL}/${this.SHEET_ID}/values/${range}?key=${this.API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
    }

    const data: GoogleSheetsResponse = await response.json();
    return data.values || [];
  }

  private static isValidDate(dateStr: string): boolean {
    if (!dateStr || dateStr.trim() === '') return false;
    
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // DD-MM-YYYY
    ];

    return formats.some(format => format.test(dateStr));
  }

  private static parseDate(dateStr: string): Date {
    // Tenta diferentes formatos de data
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) { // DD/MM/YYYY
          return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        } else if (format === formats[1]) { // YYYY-MM-DD
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else { // DD-MM-YYYY
          return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        }
      }
    }

    // Fallback para Date constructor
    return new Date(dateStr);
  }

  private static parseNumber(value: string): number {
    if (!value || value.trim() === '') return 0;
    
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleaned = value.replace(/[^\d,.-]/g, '');
    
    // Substitui vírgula por ponto para parseFloat
    const normalized = cleaned.replace(',', '.');
    
    return parseFloat(normalized) || 0;
  }

  private static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  static async getMetrics(): Promise<CommercialMetricsData> {
    try {
      // Busca dados da aba "RELATÓRIO DE LEADS (SDR)"
      const leadsData = await this.fetchSheetData('RELATÓRIO DE LEADS (SDR)!A2:Z100');
      
      // Processa dados de leads baseado na estrutura da planilha
      const dailyLeads = leadsData
        .filter(row => row.length >= 10 && row[0] && this.isValidDate(row[0]))
        .map(row => {
          const date = this.parseDate(row[0]); // Coluna A - DATA
          const google = this.parseNumber(row[1] || '0'); // Coluna B - GOOGLE
          const googleForms = this.parseNumber(row[2] || '0'); // Coluna C - GOOGLE-FORMS
          const instagram = this.parseNumber(row[3] || '0'); // Coluna D - INSTAGRAM
          const facebook = this.parseNumber(row[4] || '0'); // Coluna E - FACEBOOK
          const seller = this.parseNumber(row[5] || '0'); // Coluna F - SELLER
          const indicacao = this.parseNumber(row[6] || '0'); // Coluna G - INDICAÇÃO
          const outros = this.parseNumber(row[7] || '0'); // Coluna H - OUTROS
          const total = this.parseNumber(row[8] || '0'); // Coluna I - TOTAL
          
          return {
            date: date.toISOString().split('T')[0],
            google: google,
            googleForms: googleForms,
            instagram: instagram,
            facebook: facebook,
            seller: seller,
            indicacao: indicacao,
            outros: outros,
            total: total,
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Processa dados de calls baseado na estrutura da planilha
      const dailyCalls = leadsData
        .filter(row => row.length >= 20 && row[0] && this.isValidDate(row[0]))
        .map(row => {
          const date = this.parseDate(row[0]); // Coluna A - DATA
          const googleCall = this.parseNumber(row[9] || '0'); // Coluna J - GOOGLE CALL
          const googleFormsCall = this.parseNumber(row[10] || '0'); // Coluna K - GOOGLE-FORMS CALL
          const instaCall = this.parseNumber(row[11] || '0'); // Coluna L - INSTA CALL
          const faceCall = this.parseNumber(row[12] || '0'); // Coluna M - FACE CALL
          const sellerCall = this.parseNumber(row[13] || '0'); // Coluna N - SELLER CALL
          const indicCall = this.parseNumber(row[14] || '0'); // Coluna O - INDIC CALL
          const outroCall = this.parseNumber(row[15] || '0'); // Coluna P - OUTRO CALL
          const totalCalls = this.parseNumber(row[16] || '0'); // Coluna Q - TOTAL DE LEADS
          const callsAgendadas = this.parseNumber(row[17] || '0'); // Coluna R - CALLS AGENDADAS
          
          return {
            date: date.toISOString().split('T')[0],
            scheduled: callsAgendadas,
            completed: Math.round(callsAgendadas * 0.8), // Estimativa baseada em 80% de completude
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calcula métricas mensais
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthLeads = dailyLeads
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + item.total, 0);

      const previousMonthLeads = dailyLeads
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear;
        })
        .reduce((sum, item) => sum + item.total, 0);

      const currentMonthCalls = dailyCalls
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + item.scheduled, 0);

      const previousMonthCalls = dailyCalls
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear;
        })
        .reduce((sum, item) => sum + item.scheduled, 0);

      // Calcula totais
      const totalLeads = dailyLeads.reduce((sum, item) => sum + item.total, 0);
      const totalCalls = dailyCalls.reduce((sum, item) => sum + item.scheduled, 0);

      // Calcula taxa de conversão
      const conversionRate = totalLeads > 0 ? (totalCalls / totalLeads) * 100 : 0;

      return {
        dailyLeads,
        monthlyLeads: {
          current: currentMonthLeads,
          previous: previousMonthLeads,
          growth: this.calculateGrowth(currentMonthLeads, previousMonthLeads),
        },
        dailyCalls,
        monthlyCalls: {
          current: currentMonthCalls,
          previous: previousMonthCalls,
          growth: this.calculateGrowth(currentMonthCalls, previousMonthCalls),
        },
        totalLeads,
        totalCalls,
        conversionRate,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao buscar métricas comerciais:', error);
      throw error; // Re-lança o erro para ser tratado na interface
    }
  }


  // Método para testar a conexão com Google Sheets
  static async testConnection(): Promise<boolean> {
    try {
      await this.fetchSheetData('RELATÓRIO DE LEADS (SDR)!A1:Z1');
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }
}
