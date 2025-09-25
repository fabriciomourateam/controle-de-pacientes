import { Client } from '@notionhq/client';
import { supabase } from '@/integrations/supabase/client';
import { DashboardDados } from '@/types/dashboard';
import { getProxyUrl } from './config';

export class DashboardNotionService {
  private notion: Client;

  constructor(apiKey: string) {
    this.notion = new Client({ auth: apiKey });
  }

  async fetchAllData(databaseId: string) {
    try {
      let allData: any[] = [];
      let hasMore = true;
      let startCursor: string | undefined = undefined;

      while (hasMore) {
        console.log(`Buscando página ${allData.length / 100 + 1}...`);
        
        const response = await this.notion.databases.query({
          database_id: databaseId,
          start_cursor: startCursor,
          page_size: 100,
        });

        allData = [...allData, ...response.results];
        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;
        
        console.log(`Buscados ${allData.length} registros até agora...`);
      }

      console.log(`Total de registros encontrados: ${allData.length}`);
      return allData;
    } catch (error) {
      console.error('Erro ao buscar dados do Notion:', error);
      throw error;
    }
  }

  async fetchAllDataProxy(databaseId: string) {
    try {
      const response = await fetch(getProxyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseId,
          action: 'query'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erro no servidor proxy');
      }

      return result.data || [];
    } catch (error) {
      console.error('Erro ao buscar dados do Notion via proxy:', error);
      throw error;
    }
  }

  private mapNotionToDashboard(notionPage: any): Partial<DashboardDados> {
    const properties = notionPage.properties || {};
    
    // Mapear campos específicos de métricas
    const mes = this.extractText(properties['Mês']) || null;
    const ano = this.extractNumber(properties['Ano']) || new Date().getFullYear();
    const mesNumero = this.extractNumber(properties['Mês Número']) || this.getMonthNumber(mes);
    const dataReferencia = this.formatDate(ano, mesNumero);
    
    const ativosTotal = this.extractNumber(properties['Ativos (Total início do mês)']) || 0;
    const saldoEntradaSaida = this.extractNumber(properties['Saldo (Entrada/Saída)']) || 0;
    const entraram = this.extractNumber(properties['Entraram']) || 0;
    const sairam = this.extractNumber(properties['Saíram']) || 0;
    const vencimentos = this.extractNumber(properties['Vencimentos']) || 0;
    const naoRenovou = this.extractNumber(properties['Não renovou']) || 0;
    const desistencia = this.extractNumber(properties['Desitência']) || 0;
    const congelamento = this.extractNumber(properties['Congelamento']) || 0;
    const churnMax = this.extractNumber(properties['Churn Máx']) || 0;
    
    // Extrair percentuais dos campos de texto
    const percentualRenovacao = this.extractPercentage(properties['% Renov: +60%']) || 0;
    const percentualChurn = this.extractPercentage(properties['% Churn: -5%']) || 0;

    return {
      mes,
      ano: ano.toString(),
      mes_numero: mesNumero.toString(),
      data_referencia: dataReferencia,
      ativos_total_inicio_mes: ativosTotal.toString(),
      saldo_entrada_saida: saldoEntradaSaida.toString(),
      entraram: entraram.toString(),
      sairam: sairam.toString(),
      vencimentos: vencimentos.toString(),
      nao_renovou: naoRenovou.toString(),
      desistencia: desistencia.toString(),
      congelamento: congelamento.toString(),
      percentual_renovacao: percentualRenovacao.toString(),
      percentual_churn: percentualChurn.toString(),
      churn_max: churnMax.toString(),
    };
  }

  private extractText(property: any): string | null {
    if (!property) return null;
    
    if (property.type === 'title' && property.title?.[0]?.plain_text) {
      return property.title[0].plain_text;
    }
    
    if (property.type === 'rich_text' && property.rich_text?.[0]?.plain_text) {
      return property.rich_text[0].plain_text;
    }
    
    if (property.type === 'select' && property.select?.name) {
      return property.select.name;
    }
    
    return null;
  }

  private extractNumber(property: any): number | null {
    if (!property) return null;
    
    if (property.type === 'number' && typeof property.number === 'number') {
      return property.number;
    }
    
    if (property.type === 'rich_text' && property.rich_text?.[0]?.plain_text) {
      const text = property.rich_text[0].plain_text;
      const number = parseFloat(text.replace(/[^\d.-]/g, ''));
      return isNaN(number) ? null : number;
    }
    
    return null;
  }

  private extractPercentage(property: any): number | null {
    if (!property) return null;
    
    if (property.type === 'rich_text' && property.rich_text?.[0]?.plain_text) {
      const text = property.rich_text[0].plain_text;
      // Extrair número de strings como "+60%" ou "-5%"
      const match = text.match(/([+-]?\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    return null;
  }

  private getMonthNumber(monthName: string | null): number {
    if (!monthName) return 1;
    
    const months: { [key: string]: number } = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };
    
    return months[monthName.toLowerCase()] || 1;
  }

  private formatDate(year: number, month: number): string {
    const date = new Date(year, month - 1, 1);
    return date.toISOString().split('T')[0];
  }

  // Método para processar dados do Notion para métricas (compatibilidade)
  async processNotionDataForMetrics(databaseId: string) {
    return await this.syncToSupabase(databaseId);
  }

  async syncToSupabase(databaseId: string): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: number;
    message: string;
  }> {
    try {
      console.log('🔄 Processando dados do Notion para métricas...');
      
      // Buscar dados reais do Notion via proxy
      console.log('🔍 Buscando dados reais do Notion...');
      const notionData = await this.fetchAllDataProxy(databaseId);
      console.log('✅ Dados reais obtidos do Notion via proxy');

      console.log(`📊 Encontrados ${notionData.length} registros no Notion`);

      if (notionData.length === 0) {
        return {
          success: true,
          imported: 0,
          updated: 0,
          errors: 0,
          message: 'Nenhum dado encontrado no Notion'
        };
      }

      // Mapear dados do Notion para formato do Supabase
      const mappedData = notionData.map(page => this.mapNotionToDashboard(page));
      
      console.log(`📋 Dados mapeados: ${mappedData.length}`);

      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Inserir/atualizar no Supabase
      for (const data of mappedData) {
        try {
          // Verificar se já existe registro com mesmo ano e mês
          const { data: existing } = await supabase
            .from('dashboard_dados')
            .select('id')
            .eq('ano', data.ano)
            .eq('mes_numero', data.mes_numero)
            .single();

          if (existing) {
            // Atualizar registro existente
            const { error } = await supabase
              .from('dashboard_dados')
              .update(data)
              .eq('id', existing.id);

            if (error) throw error;
            updated++;
          } else {
            // Inserir novo registro
            const { error } = await supabase
              .from('dashboard_dados')
              .insert(data);

            if (error) throw error;
            imported++;
          }
        } catch (error) {
          console.error(`Erro ao processar métrica:`, error);
          errors++;
        }
      }

      console.log(`✅ Sincronização concluída: ${imported} inseridos, ${updated} atualizados, ${errors} erros`);

      return {
        success: true,
        imported,
        updated,
        errors,
        message: `Métricas sincronizadas: ${imported} inseridas, ${updated} atualizadas, ${errors} erros`
      };

    } catch (error) {
      console.error('Erro na sincronização de métricas:', error);
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}