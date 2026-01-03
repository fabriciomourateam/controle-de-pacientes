import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar pacientes que têm bioimpedância
 * Otimizado: usa React Query com cache para evitar chamadas desnecessárias
 */
export function usePatientsWithBioimpedance() {
  return useQuery({
    queryKey: ['patients-with-bioimpedance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_composition')
        .select('telefone')
        .not('telefone', 'is', null)
        .limit(1000); // Limitar a 1000 registros
      
      if (error) throw error;
      
      // Retornar Set de telefones únicos
      const telefones = new Set(data?.map(bio => bio.telefone).filter(Boolean) || []);
      return telefones;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - dados não mudam frequentemente
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });
}
