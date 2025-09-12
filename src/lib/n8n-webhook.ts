import { supabase } from '@/integrations/supabase/client';
import type { PatientInsert } from '@/integrations/supabase/types';

export interface N8NWebhookData {
  nome: string;
  apelido?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  genero?: string;
  data_nascimento?: string;
  inicio_acompanhamento?: string;
  plano?: string;
  tempo_acompanhamento?: number;
  vencimento?: string;
  dias_para_vencer?: number;
  valor?: number;
  ticket_medio?: number;
  rescisao_30_percent?: number;
  pagamento?: string;
  observacao?: string;
  indicacoes?: string;
  lembrete?: string;
  telefone_filtro?: string;
  antes_depois?: string;
  janeiro?: string;
  fevereiro?: string;
  marco?: string;
  abril?: string;
  maio?: string;
  junho?: string;
  julho?: string;
  agosto?: string;
  setembro?: string;
  outubro?: string;
  novembro?: string;
  dezembro?: string;
  peso?: number;
  medida?: number;
  treino?: string;
  cardio?: string;
  agua?: string;
  sono?: string;
  ref_livre?: string;
  beliscos?: string;
  oq_comeu_ref_livre?: string;
  oq_beliscou?: string;
  comeu_menos?: string;
  fome_algum_horario?: string;
  alimento_para_incluir?: string;
  melhora_visual?: string;
  quais_pontos?: string;
  objetivo?: string;
  dificuldades?: string;
  stress?: string;
  libido?: string;
  tempo?: string;
  descanso?: string;
  tempo_cardio?: string;
  foto_1?: string;
  foto_2?: string;
  foto_3?: string;
  foto_4?: string;
  telefone_checkin?: string;
  pontos_treinos?: number;
  pontos_cardios?: number;
  pontos_descanso_entre_series?: number;
  pontos_refeicao_livre?: number;
  pontos_beliscos?: number;
  pontos_agua?: number;
  pontos_sono?: number;
  pontos_qualidade_sono?: number;
  pontos_stress?: number;
  pontos_libido?: number;
  total_pontuacao?: number;
  percentual_aproveitamento?: number;
}

export class N8NWebhookService {
  // Função para sanitizar dados do n8n - converte strings "null" para null real
  private static sanitizeN8NData(data: any): any {
    const sanitized = { ...data };
    
    // Lista de campos numéricos que podem receber "null" como string
    const numericFields = [
      'tempo_acompanhamento', 'dias_para_vencer', 'valor', 'ticket_medio', 
      'rescisao_30_percent', 'peso', 'medida', 'pontos_treinos', 'pontos_cardios',
      'pontos_descanso_entre_series', 'pontos_refeicao_livre', 'pontos_beliscos',
      'pontos_agua', 'pontos_sono', 'pontos_qualidade_sono', 'pontos_stress',
      'pontos_libido', 'total_pontuacao', 'percentual_aproveitamento'
    ];
    
    // Converter strings "null" para null real nos campos numéricos
    numericFields.forEach(field => {
      if (sanitized[field] === "null" || sanitized[field] === "" || sanitized[field] === undefined) {
        sanitized[field] = null;
      } else if (typeof sanitized[field] === 'string' && !isNaN(Number(sanitized[field]))) {
        // Converter strings numéricas para números
        sanitized[field] = Number(sanitized[field]);
      }
    });
    
    // Lista de campos de texto que podem receber "null" como string
    const textFields = [
      'apelido', 'cpf', 'email', 'telefone', 'genero', 'data_nascimento',
      'inicio_acompanhamento', 'plano', 'vencimento', 'pagamento', 'observacao',
      'indicacoes', 'lembrete', 'telefone_filtro', 'antes_depois', 'janeiro',
      'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto',
      'setembro', 'outubro', 'novembro', 'dezembro', 'treino', 'cardio',
      'agua', 'sono', 'ref_livre', 'beliscos', 'oq_comeu_ref_livre',
      'oq_beliscou', 'comeu_menos', 'fome_algum_horario', 'alimento_para_incluir',
      'melhora_visual', 'quais_pontos', 'objetivo', 'dificuldades', 'stress',
      'libido', 'tempo', 'descanso', 'tempo_cardio', 'foto_1', 'foto_2',
      'foto_3', 'foto_4', 'telefone_checkin'
    ];
    
    // Converter strings "null" para null real nos campos de texto
    textFields.forEach(field => {
      if (sanitized[field] === "null" || sanitized[field] === "") {
        sanitized[field] = null;
      }
    });
    
    return sanitized;
  }

  // Processar dados do n8n
  static async processN8NData(data: N8NWebhookData): Promise<{ success: boolean; error?: string }> {
    try {
      // Sanitizar dados primeiro
      const sanitizedData = this.sanitizeN8NData(data);
      
      // Converter dados do n8n para formato do Supabase
      const patient: PatientInsert = {
        nome: sanitizedData.nome,
        apelido: sanitizedData.apelido,
        cpf: sanitizedData.cpf,
        email: sanitizedData.email,
        telefone: sanitizedData.telefone,
        genero: sanitizedData.genero,
        data_nascimento: sanitizedData.data_nascimento,
        inicio_acompanhamento: sanitizedData.inicio_acompanhamento,
        plano: sanitizedData.plano,
        tempo_acompanhamento: sanitizedData.tempo_acompanhamento,
        vencimento: sanitizedData.vencimento,
        dias_para_vencer: sanitizedData.dias_para_vencer,
        valor: sanitizedData.valor,
        ticket_medio: sanitizedData.ticket_medio,
        rescisao_30_percent: sanitizedData.rescisao_30_percent,
        pagamento: sanitizedData.pagamento,
        observacao: sanitizedData.observacao,
        indicacoes: sanitizedData.indicacoes,
        lembrete: sanitizedData.lembrete,
        telefone_filtro: sanitizedData.telefone_filtro,
        antes_depois: sanitizedData.antes_depois,
        janeiro: sanitizedData.janeiro,
        fevereiro: sanitizedData.fevereiro,
        marco: sanitizedData.marco,
        abril: sanitizedData.abril,
        maio: sanitizedData.maio,
        junho: sanitizedData.junho,
        julho: sanitizedData.julho,
        agosto: sanitizedData.agosto,
        setembro: sanitizedData.setembro,
        outubro: sanitizedData.outubro,
        novembro: sanitizedData.novembro,
        dezembro: sanitizedData.dezembro,
        peso: sanitizedData.peso,
        medida: sanitizedData.medida,
        treino: sanitizedData.treino,
        cardio: sanitizedData.cardio,
        agua: sanitizedData.agua,
        sono: sanitizedData.sono,
        ref_livre: sanitizedData.ref_livre,
        beliscos: sanitizedData.beliscos,
        oq_comeu_ref_livre: sanitizedData.oq_comeu_ref_livre,
        oq_beliscou: sanitizedData.oq_beliscou,
        comeu_menos: sanitizedData.comeu_menos,
        fome_algum_horario: sanitizedData.fome_algum_horario,
        alimento_para_incluir: sanitizedData.alimento_para_incluir,
        melhora_visual: sanitizedData.melhora_visual,
        quais_pontos: sanitizedData.quais_pontos,
        objetivo: sanitizedData.objetivo,
        dificuldades: sanitizedData.dificuldades,
        stress: sanitizedData.stress,
        libido: sanitizedData.libido,
        tempo: sanitizedData.tempo,
        descanso: sanitizedData.descanso,
        tempo_cardio: sanitizedData.tempo_cardio,
        foto_1: sanitizedData.foto_1,
        foto_2: sanitizedData.foto_2,
        foto_3: sanitizedData.foto_3,
        foto_4: sanitizedData.foto_4,
        telefone_checkin: sanitizedData.telefone_checkin,
        pontos_treinos: sanitizedData.pontos_treinos,
        pontos_cardios: sanitizedData.pontos_cardios,
        pontos_descanso_entre_series: sanitizedData.pontos_descanso_entre_series,
        pontos_refeicao_livre: sanitizedData.pontos_refeicao_livre,
        pontos_beliscos: sanitizedData.pontos_beliscos,
        pontos_agua: sanitizedData.pontos_agua,
        pontos_sono: sanitizedData.pontos_sono,
        pontos_qualidade_sono: sanitizedData.pontos_qualidade_sono,
        pontos_stress: sanitizedData.pontos_stress,
        pontos_libido: sanitizedData.pontos_libido,
        total_pontuacao: sanitizedData.total_pontuacao,
        percentual_aproveitamento: sanitizedData.percentual_aproveitamento
      };

      // Inserir no Supabase
      const { error } = await supabase
        .from('patients')
        .insert(patient);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Processar múltiplos dados do n8n
  static async processBatchN8NData(dataArray: N8NWebhookData[]): Promise<{ 
    success: boolean; 
    imported: number; 
    errors: string[] 
  }> {
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const result = await this.processN8NData(dataArray[i]);
      if (result.success) {
        imported++;
      } else {
        errors.push(`Linha ${i + 1}: ${result.error}`);
      }
    }

    return {
      success: imported > 0,
      imported,
      errors
    };
  }
}
