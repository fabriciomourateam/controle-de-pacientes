import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook para detectar mudanças em tempo real usando Supabase Realtime
 * Monitora alterações nas tabelas 'patients' e 'checkin'
 * Atualiza o cache automaticamente de forma silenciosa (sem invalidar queries)
 */
export function useRealtimeChanges() {
  const queryClient = useQueryClient();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  // Função para atualização silenciosa (merge com cache)
  const performSilentUpdate = useCallback(async () => {
    if (isUpdatingRef.current) {
      return; // Já está atualizando, aguardar
    }

    isUpdatingRef.current = true;

    try {
      // ✅ ATUALIZAÇÃO INTELIGENTE PARA CHECKINS: Buscar apenas checkins recentes e mesclar com cache
      const { checkinService } = await import('@/lib/checkin-service');
      const recentCheckins = await checkinService.getRecentWithPatient(48); // Últimas 48 horas COM dados do paciente

      // Obter dados do cache atual (tentar diferentes chaves de query)
      const possibleCacheKeys = [
        ['checkins', 'list', 'with-patient', 'limit', 200],
        ['checkins', 'list', 'with-patient', 'limit', null],
        ['checkins', 'list', 'with-patient', 'limit', 500],
        ['checkins', 'list', 'with-patient', 'limit', 1000],
        ['checkins', 'list', 'with-patient', 'limit', 2000],
        ['checkins', 'list', 'with-patient'],
      ];

      let cachedCheckins: any[] | undefined;
      for (const key of possibleCacheKeys) {
        cachedCheckins = queryClient.getQueryData<any[]>(key);
        if (cachedCheckins && Array.isArray(cachedCheckins) && cachedCheckins.length > 0) {
          break; // Encontrou cache válido
        }
      }

      if (cachedCheckins && Array.isArray(cachedCheckins) && cachedCheckins.length > 0) {
        // Mesclar: novos checkins + cache antigo (removendo duplicatas)
        const checkinMap = new Map();

        // Primeiro, adicionar checkins do cache (dados antigos)
        cachedCheckins.forEach(checkin => {
          if (checkin?.id) {
            checkinMap.set(checkin.id, checkin);
          }
        });

        // Depois, adicionar/atualizar com checkins recentes (dados novos)
        recentCheckins.forEach(checkin => {
          if (checkin?.id) {
            checkinMap.set(checkin.id, checkin); // Sobrescreve se já existe (atualiza)
          }
        });

        // Converter de volta para array e ordenar por data
        const mergedCheckins = Array.from(checkinMap.values()).sort((a, b) => {
          const dateA = new Date(a.data_checkin || a.data_preenchimento || 0);
          const dateB = new Date(b.data_checkin || b.data_preenchimento || 0);
          return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
        });

        // Atualizar cache com dados mesclados (atualizar todas as chaves de query possíveis)
        possibleCacheKeys.forEach(key => {
          const existingData = queryClient.getQueryData<any[]>(key);
          if (existingData && Array.isArray(existingData)) {
            // Mesclar também para esta chave específica
            const keyMap = new Map();
            existingData.forEach(c => {
              if (c?.id) keyMap.set(c.id, c);
            });
            recentCheckins.forEach(c => {
              if (c?.id) keyMap.set(c.id, c); // Sobrescreve se já existe
            });
            const keyMerged = Array.from(keyMap.values()).sort((a, b) => {
              const dateA = new Date(a.data_checkin || a.data_preenchimento || 0);
              const dateB = new Date(b.data_checkin || b.data_preenchimento || 0);
              return dateB.getTime() - dateA.getTime();
            });
            queryClient.setQueryData(key, keyMerged);
          }
        });

      }

      // ✅ ATUALIZAÇÃO INTELIGENTE PARA PACIENTES: Buscar apenas pacientes recentes e mesclar com cache
      const { patientService } = await import('@/lib/supabase-services');
      const recentPatients = await patientService.getRecent(48); // Últimas 48 horas

      // Obter cache de pacientes (chave correta: ['patients', 'list', 'limit', X])
      const possiblePatientKeys = [
        ['patients', 'list', 'limit', 1000],
        ['patients', 'list', 'limit', 500],
        ['patients', 'list', 'limit', 200],
        ['patients', 'list', 'limit', null],
        ['patients', 'list'],
      ];

      let cachedPatients: any[] | undefined;
      for (const key of possiblePatientKeys) {
        cachedPatients = queryClient.getQueryData<any[]>(key);
        if (cachedPatients && Array.isArray(cachedPatients) && cachedPatients.length > 0) {
          break; // Encontrou cache válido
        }
      }

      if (cachedPatients && Array.isArray(cachedPatients) && cachedPatients.length > 0) {
        // Mesclar pacientes: novos + cache antigo
        const patientMap = new Map();

        // Primeiro, adicionar pacientes do cache (dados antigos)
        cachedPatients.forEach(patient => {
          if (patient?.id) {
            patientMap.set(patient.id, patient);
          }
        });

        // Depois, adicionar/atualizar com pacientes recentes (dados novos)
        recentPatients.forEach(patient => {
          if (patient?.id) {
            patientMap.set(patient.id, patient); // Sobrescreve se já existe (atualiza)
          }
        });

        // Converter de volta para array e ordenar por data
        const mergedPatients = Array.from(patientMap.values()).sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
        });

        // Atualizar cache com dados mesclados
        possiblePatientKeys.forEach(key => {
          const existingData = queryClient.getQueryData<any[]>(key);
          if (existingData && Array.isArray(existingData)) {
            // Mesclar também para esta chave específica
            const keyMap = new Map();
            existingData.forEach(p => {
              if (p?.id) keyMap.set(p.id, p);
            });
            recentPatients.forEach(p => {
              if (p?.id) keyMap.set(p.id, p); // Sobrescreve se já existe
            });
            const keyMerged = Array.from(keyMap.values()).sort((a, b) => {
              const dateA = new Date(a.created_at || a.updated_at || 0);
              const dateB = new Date(b.created_at || b.updated_at || 0);
              return dateB.getTime() - dateA.getTime();
            });
            queryClient.setQueryData(key, keyMerged);
          }
        });
      }

      // Para feedbacks, invalidar normalmente (são menores e mudam menos)
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    } catch (error) {
      console.error('Erro ao atualizar dados silenciosamente:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [queryClient]);

  // Função para agendar atualização com debounce
  const scheduleAutoUpdate = useCallback(() => {
    // Cancelar atualização anterior se ainda não foi executada
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Agendar nova atualização após 1 segundo de inatividade (debounce)
    updateTimeoutRef.current = setTimeout(() => {
      performSilentUpdate();
      updateTimeoutRef.current = null;
    }, 1000);
  }, [performSilentUpdate]);

  useEffect(() => {
    let patientsChannel: RealtimeChannel | null = null;
    let checkinsChannel: RealtimeChannel | null = null;

    // Canal para pacientes
    patientsChannel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          scheduleAutoUpdate(); // Agendar atualização automática silenciosa
        }
      )
      .subscribe();

    // Canal para checkins
    checkinsChannel = supabase
      .channel('checkins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkin'
        },
        (payload) => {
          scheduleAutoUpdate(); // Agendar atualização automática silenciosa
        }
      )
      .subscribe();

    return () => {
      // Limpar timeout pendente
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      // Desinscrever dos canais
      if (patientsChannel) {
        patientsChannel.unsubscribe();
      }
      if (checkinsChannel) {
        checkinsChannel.unsubscribe();
      }
    };
  }, [scheduleAutoUpdate]);

  // Este hook não retorna mais hasChanges/notifications já que não há mais modal
  return {};
}
