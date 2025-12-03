import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar exclusões de pacientes da lista de retenção
 */
export const retentionService = {
  /**
   * Obter lista de IDs de pacientes excluídos pelo usuário atual
   */
  async getExcludedPatientIds(): Promise<Set<string>> {
    try {
      const { data, error } = await supabase
        .from('retention_exclusions')
        .select('patient_id')
        .order('excluded_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar exclusões:', error);
        return new Set<string>();
      }

      return new Set(data?.map(item => item.patient_id) || []);
    } catch (error) {
      console.error('Erro ao buscar exclusões:', error);
      return new Set<string>();
    }
  },

  /**
   * Excluir um paciente da lista de retenção
   */
  async excludePatient(patientId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('retention_exclusions')
        .insert({
          patient_id: patientId,
          reason: reason || null,
        });

      if (error) {
        // Se já existe, não é erro (UNIQUE constraint)
        if (error.code === '23505') {
          return true;
        }
        console.error('Erro ao excluir paciente:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      return false;
    }
  },

  /**
   * Reincluir um paciente na lista de retenção (remover exclusão)
   */
  async includePatient(patientId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('retention_exclusions')
        .delete()
        .eq('patient_id', patientId);

      if (error) {
        console.error('Erro ao reincluir paciente:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao reincluir paciente:', error);
      return false;
    }
  },

  /**
   * Verificar se um paciente está excluído
   */
  async isPatientExcluded(patientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('retention_exclusions')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar exclusão:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar exclusão:', error);
      return false;
    }
  },
};

