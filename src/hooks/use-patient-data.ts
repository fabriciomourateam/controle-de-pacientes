import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const patientDataQueryKeys = {
  all: ['patient-data'] as const,
  byTelefone: (telefone: string) => [...patientDataQueryKeys.all, 'telefone', telefone] as const,
  byId: (id: string) => [...patientDataQueryKeys.all, 'id', id] as const,
};

/**
 * Hook para buscar um paciente específico por telefone
 * Com cache para reduzir egress - IMPLEMENTAÇÃO BÁSICA E SEGURA
 */
export function usePatientByTelefone(telefone: string | undefined) {
  return useQuery({
    queryKey: patientDataQueryKeys.byTelefone(telefone || ''),
    queryFn: async () => {
      if (!telefone) return null;
      
      // Query direta com select('*') - mantém compatibilidade total
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', telefone)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!telefone,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados ficam "frescos"
    gcTime: 10 * 60 * 1000, // Cache mantido por 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar
  });
}
