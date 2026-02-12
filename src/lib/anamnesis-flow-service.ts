import { supabase } from '@/integrations/supabase/client';
import {
    DEFAULT_ANAMNESIS_FLOW,
    DEFAULT_FINAL_MESSAGE,
    DEFAULT_TERMS_URL,
    DEFAULT_TERMS_TEXT,
    AnamnesisFlowStep,
    FinalMessageConfig,
} from './anamnesis-flow-default';

export interface AnamnesisFlowTheme {
    bg_gradient_from: string;
    bg_gradient_via: string;
    bg_gradient_to: string;
    card_bg: string;
    card_border: string;
    text_primary: string;
    text_secondary: string;
    text_muted: string;
    input_bg: string;
    input_border: string;
    input_text: string;
    accent_color: string;
    button_bg: string;
    button_text: string;
    progress_from: string;
    progress_to: string;
}

export const DEFAULT_ANAMNESIS_THEME: AnamnesisFlowTheme = {
    bg_gradient_from: '#020617',
    bg_gradient_via: '#172554',
    bg_gradient_to: '#020617',
    card_bg: 'rgba(15,23,42,0.3)',
    card_border: 'rgba(51,65,85,0.3)',
    text_primary: '#ffffff',
    text_secondary: '#cbd5e1',
    text_muted: '#64748b',
    input_bg: 'rgba(30,41,59,0.4)',
    input_border: 'rgba(51,65,85,0.5)',
    input_text: '#ffffff',
    accent_color: '#3b82f6',
    button_bg: '#2563eb',
    button_text: '#ffffff',
    progress_from: '#3b82f6',
    progress_to: '#a855f7',
};

export interface AnamnesisFlowConfig {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    flow: AnamnesisFlowStep[];
    theme: AnamnesisFlowTheme;
    final_message: FinalMessageConfig;
    terms_url: string;
    terms_text: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const anamnesisFlowService = {
    async getMyFlows(): Promise<AnamnesisFlowConfig[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data, error } = await supabase
            .from('anamnesis_flow_config' as any)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            ...row,
            flow: row.flow || DEFAULT_ANAMNESIS_FLOW,
            theme: row.theme || DEFAULT_ANAMNESIS_THEME,
            final_message: row.final_message || DEFAULT_FINAL_MESSAGE,
            terms_url: row.terms_url || DEFAULT_TERMS_URL,
            terms_text: row.terms_text || DEFAULT_TERMS_TEXT,
        }));
    },

    async createFlow(name: string, options?: { fromTemplate?: boolean }): Promise<AnamnesisFlowConfig> {
        const fromTemplate = options?.fromTemplate !== false;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data, error } = await supabase
            .from('anamnesis_flow_config' as any)
            .insert({
                user_id: user.id,
                name,
                flow: fromTemplate ? DEFAULT_ANAMNESIS_FLOW : [],
                theme: DEFAULT_ANAMNESIS_THEME,
                final_message: DEFAULT_FINAL_MESSAGE,
                terms_url: DEFAULT_TERMS_URL,
                terms_text: DEFAULT_TERMS_TEXT,
                is_active: false,
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            flow: data.flow || (fromTemplate ? DEFAULT_ANAMNESIS_FLOW : []),
            theme: data.theme || DEFAULT_ANAMNESIS_THEME,
            final_message: data.final_message || DEFAULT_FINAL_MESSAGE,
        } as unknown as AnamnesisFlowConfig;
    },

    async duplicateFlow(flowId: string): Promise<AnamnesisFlowConfig> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: original, error: fetchError } = await supabase
            .from('anamnesis_flow_config' as any)
            .select('*')
            .eq('id', flowId)
            .single();

        if (fetchError || !original) throw new Error('Fluxo não encontrado');

        const { data, error } = await supabase
            .from('anamnesis_flow_config' as any)
            .insert({
                user_id: user.id,
                name: `${(original as any).name} (cópia)`,
                description: (original as any).description || '',
                flow: (original as any).flow,
                theme: (original as any).theme || DEFAULT_ANAMNESIS_THEME,
                final_message: (original as any).final_message || DEFAULT_FINAL_MESSAGE,
                terms_url: (original as any).terms_url || DEFAULT_TERMS_URL,
                terms_text: (original as any).terms_text || DEFAULT_TERMS_TEXT,
                is_active: false,
            })
            .select()
            .single();

        if (error) throw error;
        return data as unknown as AnamnesisFlowConfig;
    },

    async updateFlow(flowId: string, updates: Partial<Omit<AnamnesisFlowConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
        const { error } = await supabase
            .from('anamnesis_flow_config' as any)
            .update(updates)
            .eq('id', flowId);

        if (error) throw error;
    },

    async activateFlow(flowId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        await supabase
            .from('anamnesis_flow_config' as any)
            .update({ is_active: false })
            .eq('user_id', user.id);

        const { error } = await supabase
            .from('anamnesis_flow_config' as any)
            .update({ is_active: true })
            .eq('id', flowId);

        if (error) throw error;
    },

    async deactivateFlow(flowId: string): Promise<void> {
        const { error } = await supabase
            .from('anamnesis_flow_config' as any)
            .update({ is_active: false })
            .eq('id', flowId);

        if (error) throw error;
    },

    async deleteFlow(flowId: string): Promise<void> {
        const { error } = await supabase
            .from('anamnesis_flow_config' as any)
            .delete()
            .eq('id', flowId);

        if (error) throw error;
    },
};
