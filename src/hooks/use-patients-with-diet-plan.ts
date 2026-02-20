import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar pacientes que têm plano alimentar cadastrado
 * Otimizado: usa React Query com cache para evitar chamadas desnecessárias
 */
export function usePatientsWithDietPlan() {
    return useQuery({
        queryKey: ['patients-with-diet-plan'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('diet_plans')
                .select('patient_id')
                .not('patient_id', 'is', null)
                .limit(2000);

            if (error) throw error;

            // Retornar Set de patient_ids únicos
            const patientIds = new Set(data?.map(d => d.patient_id).filter(Boolean) || []);
            return patientIds;
        },
        staleTime: 10 * 60 * 1000, // 10 minutos
        refetchOnWindowFocus: false,
    });
}
