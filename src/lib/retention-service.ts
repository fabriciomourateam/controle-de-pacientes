import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from './auth-helpers';

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
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      // Verificar se já está excluído antes de tentar inserir
      const isExcluded = await this.isPatientExcluded(patientId);
      if (isExcluded) {
        // Já está excluído, retornar sucesso
        return true;
      }

      const { error } = await supabase
        .from('retention_exclusions')
        .insert({
          user_id: userId,
          patient_id: patientId,
          reason: reason || null,
        });

      if (error) {
        // Se já existe (UNIQUE constraint) ou conflito HTTP 409, considerar sucesso
        // O erro 409 (Conflict) ocorre quando há violação de constraint UNIQUE
        if (error.code === '23505' || 
            error.code === '409' ||
            error.message?.toLowerCase().includes('duplicate') || 
            error.message?.toLowerCase().includes('unique') ||
            error.message?.toLowerCase().includes('conflict') ||
            error.message?.toLowerCase().includes('already exists')) {
          // Paciente já está excluído, retornar sucesso silenciosamente
          return true;
        }
        console.error('Erro ao excluir paciente:', error);
        throw error;
      }

      return true;
    } catch (error: any) {
      // Tratar erro HTTP 409 (Conflict) como sucesso
      // O Supabase pode retornar 409 de diferentes formas
      const errorMessage = error?.message?.toLowerCase() || '';
      const errorCode = error?.code || error?.status || '';
      
      if (errorCode === 409 || 
          errorCode === '409' || 
          errorMessage.includes('conflict') ||
          errorMessage.includes('duplicate') ||
          errorMessage.includes('unique')) {
        // Paciente já está excluído, retornar sucesso
        return true;
      }
      console.error('Erro ao excluir paciente:', error);
      return false;
    }
  },

  /**
   * Reincluir um paciente na lista de retenção (remover exclusão)
   */
  async includePatient(patientId: string): Promise<boolean> {
    try {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('retention_exclusions')
        .delete()
        .eq('patient_id', patientId)
        .eq('user_id', userId);

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
      const userId = await getCurrentUserId();
      
      if (!userId) {
        return false;
      }

      const { data, error } = await supabase
        .from('retention_exclusions')
        .select('id')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
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

