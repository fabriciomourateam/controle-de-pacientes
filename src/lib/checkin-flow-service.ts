import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_CHECKIN_FLOW, FlowStep } from './checkin-flow-default';

export interface CheckinFlowTheme {
  bg_gradient_from: string;
  bg_gradient_via: string;
  bg_gradient_to: string;
  bot_bubble_bg: string;
  bot_bubble_text: string;
  user_bubble_bg: string;
  user_bubble_text: string;
  button_bg: string;
  button_hover_bg: string;
  button_text: string;
  option_bg: string;
  option_border: string;
  option_text: string;
  header_bg: string;
  header_text: string;
  input_bg: string;
  input_border: string;
  input_text: string;
  accent_color: string;
}

export const DEFAULT_THEME: CheckinFlowTheme = {
  bg_gradient_from: '#020617',
  bg_gradient_via: '#172554',
  bg_gradient_to: '#020617',
  bot_bubble_bg: 'rgba(30,41,59,0.8)',
  bot_bubble_text: '#e2e8f0',
  user_bubble_bg: '#2563eb',
  user_bubble_text: '#ffffff',
  button_bg: '#2563eb',
  button_hover_bg: '#1d4ed8',
  button_text: '#ffffff',
  option_bg: 'rgba(30,41,59,0.5)',
  option_border: 'rgba(51,65,85,0.5)',
  option_text: '#e2e8f0',
  header_bg: 'transparent',
  header_text: '#ffffff',
  input_bg: 'rgba(30,41,59,0.5)',
  input_border: 'rgba(51,65,85,0.5)',
  input_text: '#ffffff',
  accent_color: '#3b82f6',
};

export interface CheckinFlowConfig {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  flow: FlowStep[];
  theme: CheckinFlowTheme;
  header_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const checkinFlowService = {
  /** Listar todos os fluxos do owner logado */
  async getMyFlows(): Promise<CheckinFlowConfig[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('checkin_flow_config' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      flow: row.flow || DEFAULT_CHECKIN_FLOW,
      theme: row.theme || DEFAULT_THEME,
    }));
  },

  /**
   * Criar um novo fluxo.
   * @param name Nome do fluxo
   * @param options.fromTemplate Se true (padrão), usa o modelo completo (check-in com mensagens condicionais). Se false, cria em branco.
   */
  async createFlow(name: string, options?: { fromTemplate?: boolean }): Promise<CheckinFlowConfig> {
    const fromTemplate = options?.fromTemplate !== false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('checkin_flow_config' as any)
      .insert({
        user_id: user.id,
        name,
        flow: fromTemplate ? DEFAULT_CHECKIN_FLOW : [],
        theme: DEFAULT_THEME,
        is_active: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, flow: data.flow || (fromTemplate ? DEFAULT_CHECKIN_FLOW : []), theme: data.theme || DEFAULT_THEME } as unknown as CheckinFlowConfig;
  },

  /** Duplicar um fluxo existente */
  async duplicateFlow(flowId: string): Promise<CheckinFlowConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Buscar original
    const { data: original, error: fetchError } = await supabase
      .from('checkin_flow_config' as any)
      .select('*')
      .eq('id', flowId)
      .single();

    if (fetchError || !original) throw new Error('Fluxo não encontrado');

    // Criar cópia
    const { data, error } = await supabase
      .from('checkin_flow_config' as any)
      .insert({
        user_id: user.id,
        name: `${(original as any).name} (cópia)`,
        description: (original as any).description || '',
        flow: (original as any).flow,
        theme: (original as any).theme || DEFAULT_THEME,
        header_image_url: (original as any).header_image_url,
        is_active: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CheckinFlowConfig;
  },

  /** Atualizar fluxo (steps, tema, nome, imagem) */
  async updateFlow(flowId: string, updates: Partial<Omit<CheckinFlowConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('checkin_flow_config' as any)
      .update(updates)
      .eq('id', flowId);

    if (error) throw error;
  },

  /** Ativar um fluxo (e desativar os outros do mesmo owner) */
  async activateFlow(flowId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Desativar todos
    await supabase
      .from('checkin_flow_config' as any)
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Ativar o selecionado
    const { error } = await supabase
      .from('checkin_flow_config' as any)
      .update({ is_active: true })
      .eq('id', flowId);

    if (error) throw error;
  },

  /** Desativar um fluxo */
  async deactivateFlow(flowId: string): Promise<void> {
    const { error } = await supabase
      .from('checkin_flow_config' as any)
      .update({ is_active: false })
      .eq('id', flowId);

    if (error) throw error;
  },

  /** Deletar fluxo */
  async deleteFlow(flowId: string): Promise<void> {
    const { error } = await supabase
      .from('checkin_flow_config' as any)
      .delete()
      .eq('id', flowId);

    if (error) throw error;
  },

  /** Upload de imagem do header */
  async uploadHeaderImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `checkin_header_${user.id}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('patient-photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('patient-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  },
};
