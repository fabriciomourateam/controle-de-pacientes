import { supabase } from '@/integrations/supabase/client';

export interface AnamnesisData {
  // Endereço
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  detalhes_endereco_exterior?: string;

  // Dados pessoais extras
  instagram?: string;
  idade?: string;

  // Histórico e Objetivos
  objetivo?: string;
  onde_conheceu?: string;
  objetivo_detalhado?: string;
  relato_objetivo?: string;
  ja_foi_nutricionista?: string;
  o_que_funcionou?: string;
  maior_dificuldade?: string;

  // Saúde e Restrições
  restricao_alimentar?: string;
  alergia_intolerancia?: string;
  fuma?: string;
  bebida_alcoolica?: string;
  problema_saude?: string;
  medicamento_continuo?: string;
  uso_hormonal?: string;
  protocolo_hormonal?: string;
  interesse_hormonal?: string;

  // Hábitos Alimentares
  mora_com_quantas_pessoas?: string;
  habito_cozinhar?: string;
  alimentos_nao_gosta?: string;
  problema_alimentos_especificos?: string;
  preferencia_carboidratos?: string;
  preferencia_proteinas?: string;
  preferencia_frutas?: string;
  hora_mais_fome?: string;
  apetite?: string;
  mastigacao?: string;
  alimentos_faz_questao?: string;
  habito_intestinal?: string;
  habito_urinario?: string;
  ciclo_menstrual?: string;
  tpm?: string;
  metodo_contraceptivo?: string;
  suplementos?: string;
  alimentacao_fim_semana?: string;
  levar_refeicoes_trabalho?: string;
  pesar_refeicoes?: string;
  litros_agua?: string;

  // Rotina
  horario_estudo?: string;
  horario_trabalho?: string;
  trabalha_pe_sentado?: string;
  tempo_em_pe?: string;
  horario_treino?: string;
  horario_acordar?: string;
  horario_dormir?: string;
  horas_sono?: string;
  qualidade_sono?: string;
  habito_cafe?: string;
  cafe_sem_acucar?: string;

  // Refeições (01-06)
  refeicao_01?: string;
  horario_refeicao_01?: string;
  refeicao_02?: string;
  horario_refeicao_02?: string;
  refeicao_03?: string;
  horario_refeicao_03?: string;
  refeicao_04?: string;
  horario_refeicao_04?: string;
  refeicao_05?: string;
  horario_refeicao_05?: string;
  refeicao_06?: string;
  horario_refeicao_06?: string;

  // Treinos e Atividade Física
  atividades_fisicas?: string;
  horas_treino_dia?: string;
  tempo_treinando?: string;
  treina_jejum?: string;
  ja_treinou_jejum?: string;
  frequencia_musculacao?: string;
  recuperacao_pos_treino?: string;
  disponibilidade_musculacao?: string;
  divisao_treino?: string;
  exercicios_por_grupo?: string;
  series_por_exercicio?: string;
  repeticoes_por_serie?: string;
  prioridade_muscular?: string;
  lesoes?: string;
  aerobico_dias_semana?: string;
  tempo_aerobico?: string;
  aerobico_preferido?: string;

  // Observações Finais
  observacao_alimentar?: string;
  observacao_treinos?: string;
  indicacoes_amigos?: string;
}

export interface PatientAnamnesis {
  id: string;
  patient_id: string;
  telefone: string;
  user_id: string;
  data: AnamnesisData;
  created_at: string;
  updated_at: string;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export const anamnesisService = {
  async create(patientId: string, telefone: string, data: AnamnesisData): Promise<PatientAnamnesis> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Usuário não autenticado');

    const { data: result, error } = await supabase
      .from('patient_anamnesis' as any)
      .insert({
        patient_id: patientId,
        telefone,
        user_id: userId,
        data,
      })
      .select()
      .single();

    if (error) throw error;
    return result as unknown as PatientAnamnesis;
  },

  async getByPatientId(patientId: string): Promise<PatientAnamnesis | null> {
    const { data, error } = await supabase
      .from('patient_anamnesis' as any)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as PatientAnamnesis | null;
  },

  async getByTelefone(telefone: string): Promise<PatientAnamnesis | null> {
    const { data, error } = await supabase
      .from('patient_anamnesis' as any)
      .select('*')
      .eq('telefone', telefone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as PatientAnamnesis | null;
  },

  async update(id: string, data: AnamnesisData): Promise<PatientAnamnesis> {
    const { data: result, error } = await supabase
      .from('patient_anamnesis' as any)
      .update({ data })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as unknown as PatientAnamnesis;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('patient_anamnesis' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
