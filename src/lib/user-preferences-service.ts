import { supabase } from "@/integrations/supabase/client";

export interface PatientViewPreferences {
  id?: string;
  user_id: string;
  filters: {
    plan?: string;
    status?: 'active' | 'expired' | 'expiring_soon' | 'all';
    days_to_expire?: number;
    gender?: string;
    created_after?: string;
    created_before?: string;
  };
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  visible_columns: string[];
  page_size: number;
  created_at?: string;
  updated_at?: string;
}

export const userPreferencesService = {
  // Salvar preferências do usuário
  async savePatientPreferences(preferences: Omit<PatientViewPreferences, 'id' | 'created_at' | 'updated_at'>): Promise<PatientViewPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: preferences.user_id,
        filters: preferences.filters,
        sorting: preferences.sorting,
        visible_columns: preferences.visible_columns,
        page_size: preferences.page_size,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Carregar preferências do usuário
  async getPatientPreferences(userId: string): Promise<PatientViewPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Preferências padrão
  getDefaultPreferences(): Omit<PatientViewPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
    return {
      filters: {
        status: 'all'
      },
      sorting: {
        field: 'created_at',
        direction: 'desc'
      },
      visible_columns: [
        'nome',
        'apelido',
        'telefone',
        'email',
        'plano',
        'vencimento',
        'dias_para_vencer',
        'status',
        'created_at'
      ],
      page_size: 20
    };
  }
};
