import { NotionService } from './notion-service';
import { supabase } from '@/integrations/supabase/client';

export class DashboardNotionService {
  private notionService: NotionService;

  constructor(apiKey: string) {
    this.notionService = new NotionService(apiKey);
  }

  // Processar dados do Notion para gerar métricas mensais
  // Usa exatamente o mesmo padrão do NotionService existente
  async processNotionDataForMetrics(databaseId: string) {
    try {
      console.log('🔄 Processando dados do Notion para métricas...');
      
      // Usar o mesmo método de sincronização que já funciona para pacientes
      const syncResult = await this.notionService.syncToSupabase(databaseId);
      
      console.log(`📊 Sincronização concluída: ${syncResult.inserted} inseridos, ${syncResult.updated} atualizados`);
      
      // Agora processar os dados mensais para gerar métricas
      const metricsResult = await this.generateMonthlyMetrics();
      
      console.log('✅ Métricas processadas com sucesso:', metricsResult);
      return {
        ...syncResult,
        metrics: metricsResult
      };

    } catch (error) {
      console.error('Erro ao processar dados do Notion para métricas:', error);
      throw error;
    }
  }

  // Gerar métricas mensais baseado nos dados já sincronizados
  private async generateMonthlyMetrics() {
    try {
      console.log('📊 Gerando métricas mensais...');
      
      // Buscar dados dos pacientes já sincronizados
      const { data: pacientes, error } = await supabase
        .from('patients')
        .select('*');

      if (error) {
        throw error;
      }

      if (!pacientes || pacientes.length === 0) {
        console.log('⚠️ Nenhum paciente encontrado para gerar métricas');
        return { inserted: 0, updated: 0, errors: [] };
      }

      console.log(`📋 Processando ${pacientes.length} pacientes para métricas`);

      // Processar dados mensais
      const monthlyData = this.processMonthlyDataFromPatients(pacientes);
      
      // Inserir/atualizar métricas no Supabase
      const result = await this.syncMetricsToSupabase(monthlyData);
      
      return result;

    } catch (error) {
      console.error('Erro ao gerar métricas mensais:', error);
      throw error;
    }
  }

  // Processar dados mensais dos pacientes
  private processMonthlyDataFromPatients(pacientes: any[]) {
    const monthlyMetrics: any = {};
    
    // Agrupar por ano
    pacientes.forEach(paciente => {
      if (!paciente.inicio_acompanhamento) return;
      
      const inicioDate = new Date(paciente.inicio_acompanhamento);
      const ano = inicioDate.getFullYear();
      
      if (!monthlyMetrics[ano]) {
        monthlyMetrics[ano] = {};
      }

      // Processar cada mês
      const meses = [
        { campo: 'janeiro', numero: 1, nome: 'Janeiro' },
        { campo: 'fevereiro', numero: 2, nome: 'Fevereiro' },
        { campo: 'marco', numero: 3, nome: 'Março' },
        { campo: 'abril', numero: 4, nome: 'Abril' },
        { campo: 'maio', numero: 5, nome: 'Maio' },
        { campo: 'junho', numero: 6, nome: 'Junho' },
        { campo: 'julho', numero: 7, nome: 'Julho' },
        { campo: 'agosto', numero: 8, nome: 'Agosto' },
        { campo: 'setembro', numero: 9, nome: 'Setembro' },
        { campo: 'outubro', numero: 10, nome: 'Outubro' },
        { campo: 'novembro', numero: 11, nome: 'Novembro' },
        { campo: 'dezembro', numero: 12, nome: 'Dezembro' }
      ];

      meses.forEach(mes => {
        const status = paciente[mes.campo];
        if (!status) return;

        const chave = `${ano}-${mes.numero.toString().padStart(2, '0')}`;
        
        if (!monthlyMetrics[ano][chave]) {
          monthlyMetrics[ano][chave] = {
            mes: mes.nome,
            ano: ano,
            mes_numero: mes.numero,
            data_referencia: new Date(ano, mes.numero - 1, 1),
            ativos_total_inicio_mes: 0,
            saldo_entrada_saida: 0,
            entraram: 0,
            sairam: 0,
            vencimentos: 0,
            nao_renovou: 0,
            desistencia: 0,
            congelamento: 0,
            percentual_renovacao: 0,
            percentual_churn: 0,
            churn_max: 0
          };
        }

        // Contar por status
        if (['Ativo', 'Pago', 'Renovado'].includes(status)) {
          monthlyMetrics[ano][chave].ativos_total_inicio_mes += 1;
        } else if (['Vencido', 'Não Renovou'].includes(status)) {
          monthlyMetrics[ano][chave].nao_renovou += 1;
          monthlyMetrics[ano][chave].vencimentos += 1;
        } else if (['Desistiu', 'Cancelado'].includes(status)) {
          monthlyMetrics[ano][chave].desistencia += 1;
        } else if (['Congelado', 'Pausado'].includes(status)) {
          monthlyMetrics[ano][chave].congelamento += 1;
        }
      });
    });

    // Converter para array e calcular totais
    const result = [];
    Object.values(monthlyMetrics).forEach((anoData: any) => {
      Object.values(anoData).forEach((mesData: any) => {
        // Calcular totais
        mesData.sairam = mesData.nao_renovou + mesData.desistencia + mesData.congelamento;
        mesData.saldo_entrada_saida = mesData.entraram - mesData.sairam;
        
        // Calcular percentuais
        const totalVencimentos = mesData.vencimentos;
        const totalAtivos = mesData.ativos_total_inicio_mes;
        
        if (totalVencimentos > 0) {
          mesData.percentual_renovacao = ((totalVencimentos - mesData.nao_renovou) / totalVencimentos) * 100;
          mesData.percentual_churn = (mesData.sairam / (totalAtivos + mesData.sairam)) * 100;
        }
        
        result.push(mesData);
      });
    });

    return result.sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes_numero - b.mes_numero;
    });
  }

  // Sincronizar métricas para Supabase
  private async syncMetricsToSupabase(monthlyData: any[]) {
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    console.log(`📊 Sincronizando ${monthlyData.length} registros de métricas...`);

    for (const data of monthlyData) {
      try {
        const { error } = await supabase
          .from('dashboard_dados')
          .upsert(data, { 
            onConflict: 'mes,ano,mes_numero',
            ignoreDuplicates: false 
          });

        if (error) {
          errors.push(`Erro ao sincronizar ${data.mes}/${data.ano}: ${error.message}`);
          console.error(`Erro ao sincronizar ${data.mes}/${data.ano}:`, error);
        } else {
          // Verificar se foi inserido ou atualizado
          const { data: existing } = await supabase
            .from('dashboard_dados')
            .select('id')
            .eq('mes', data.mes)
            .eq('ano', data.ano)
            .eq('mes_numero', data.mes_numero)
            .single();

          if (existing) {
            updated++;
          } else {
            inserted++;
          }
        }
      } catch (error) {
        errors.push(`Erro inesperado ${data.mes}/${data.ano}: ${error.message}`);
        console.error(`Erro inesperado ${data.mes}/${data.ano}:`, error);
      }
    }

    console.log(`✅ Métricas sincronizadas: ${inserted} inseridos, ${updated} atualizados, ${errors.length} erros`);

    return {
      inserted,
      updated,
      errors,
      total: monthlyData.length
    };
  }
}
















