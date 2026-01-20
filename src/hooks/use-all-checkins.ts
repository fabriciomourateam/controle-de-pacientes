import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CheckinData {
  id: string;
  data_checkin: string;
  peso: string | null;
  medida: string | null;
  tempo: string | null;
  tempo_cardio: string | null;
  descanso: string | null;
  treino: string | null;
  cardio: string | null;
  ref_livre: string | null;
  beliscos: string | null;
  agua: string | null;
  sono: string | null;
  percentual_aproveitamento: string | null;
  foto_1: string | null;
  foto_2: string | null;
  foto_3: string | null;
  foto_4: string | null;
}

export function useAllCheckins(telefone: string, currentCheckinId: string, enabled: boolean = true) {
  const [allCheckins, setAllCheckins] = useState<CheckinData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ⚡ OTIMIZAÇÃO: Só buscar se enabled=true
    if (!telefone || !enabled) {
      setAllCheckins([]);
      setLoading(false);
      return;
    }

    const fetchAllCheckins = async () => {
      setLoading(true);
      try {
        // Buscar todos os check-ins do paciente, ordenados por data
        const { data, error } = await supabase
          .from('checkin')
          .select(`
            id,
            data_checkin,
            peso,
            medida,
            tempo,
            tempo_cardio,
            descanso,
            treino,
            cardio,
            ref_livre,
            beliscos,
            agua,
            sono,
            percentual_aproveitamento,
            foto_1,
            foto_2,
            foto_3,
            foto_4
          `)
          .eq('telefone', telefone)
          .order('data_checkin', { ascending: true });

        if (error) {
          console.error('❌ Erro ao buscar check-ins:', error);
          throw error;
        }

        // Debug para telefone específico
        if (telefone === '5511995844506') {
          console.log('🔍 useAllCheckins - Todos os check-ins retornados do BANCO:', {
            total: data?.length || 0,
            checkins: data?.map(c => ({ 
              id: c.id, 
              data: new Date(c.data_checkin).toLocaleDateString('pt-BR'),
              data_iso: c.data_checkin,
              peso: c.peso
            })) || [],
            currentCheckinId,
            mensagem: data?.length === 2 
              ? '⚠️ BANCO SÓ TEM 2 CHECK-INS TOTAIS (incluindo o atual)' 
              : data?.length === 3 
                ? '✅ BANCO TEM 3 CHECK-INS TOTAIS (incluindo o atual)'
                : `BANCO TEM ${data?.length} CHECK-INS TOTAIS`
          });
        }

        setAllCheckins(data || []);
      } catch (error) {
        console.error('Erro ao buscar todos os check-ins:', error);
        setAllCheckins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCheckins();
  }, [telefone, enabled]);

  // Encontrar o índice do check-in atual
  const currentIndex = allCheckins.findIndex(c => c.id === currentCheckinId);
  
  // Pegar todos os check-ins anteriores ao atual
  const previousCheckins = currentIndex > 0 ? allCheckins.slice(0, currentIndex) : [];
  
  // Check-in atual
  const currentCheckin = currentIndex >= 0 ? allCheckins[currentIndex] : null;

  return {
    allCheckins,
    previousCheckins,
    currentCheckin,
    currentIndex,
    loading,
    totalCheckins: allCheckins.length
  };
}
