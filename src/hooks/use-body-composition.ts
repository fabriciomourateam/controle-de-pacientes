import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const bodyCompositionQueryKeys = {
  all: ['body-composition'] as const,
  byTelefone: (telefone: string, limit?: number) => 
    [...bodyCompositionQueryKeys.all, 'telefone', telefone, 'limit', limit] as const,
};

/**
 * Hook para buscar bioimpedâncias de um paciente
 * Com cache e limite para reduzir egress
 */
export function useBodyComposition(telefone: string | undefined, limit: number = 50) {
  return useQuery({
    queryKey: bodyCompositionQueryKeys.byTelefone(telefone || '', limit),
    queryFn: async () => {
      if (!telefone) return [];
      
      const { data, error } = await supabase
        .from('body_composition')
        .select('*')
        .eq('telefone', telefone)
        .order('data_avaliacao', { ascending: false })
        .limit(limit); // Limite padrão: 50 avaliações
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!telefone,
    staleTime: 5 * 60 * 1000, // 5 minutos - dados históricos mudam pouco
    gcTime: 15 * 60 * 1000, // Cache mantido por 15 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar
  });
}
