import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Horários de atualização automática (em horas, formato 24h)
const SCHEDULED_HOURS = [6, 12, 15, 18];

/**
 * Hook para agendar atualizações automáticas em horários específicos
 * Atualiza automaticamente às 6h, 12h, 15h e 18h
 */
export function useScheduledRefetch(refetchFn: () => void | Promise<void>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getNextScheduledTime = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Encontrar o próximo horário programado
    for (const hour of SCHEDULED_HOURS) {
      if (hour > currentHour || (hour === currentHour && currentMinutes < 1)) {
        // Próximo horário é hoje
        const next = new Date(now);
        next.setHours(hour, 0, 0, 0);
        return next;
      }
    }
    
    // Todos os horários de hoje já passaram, próximo é amanhã às 6h
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(SCHEDULED_HOURS[0], 0, 0, 0);
    return tomorrow;
  }, []);

  useEffect(() => {
    const scheduleNextRefetch = () => {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const nextTime = getNextScheduledTime();
      const msUntilNext = nextTime.getTime() - Date.now();
      
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`📅 Próxima atualização programada: ${nextTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      }
      
      timeoutRef.current = setTimeout(async () => {
        console.log('🔄 Atualização programada executada!');
        try {
          await refetchFn();
        } catch (error) {
          console.error('Erro na atualização programada:', error);
        }
        // Agendar a próxima atualização
        scheduleNextRefetch();
      }, msUntilNext);
    };

    scheduleNextRefetch();
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [refetchFn, getNextScheduledTime]);
}

/**
 * Retorna informações sobre a próxima atualização programada
 */
export function getNextScheduledUpdate(): { time: string; isToday: boolean } {
  const now = new Date();
  const currentHour = now.getHours();
  
  for (const hour of SCHEDULED_HOURS) {
    if (hour > currentHour) {
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        isToday: true
      };
    }
  }
  
  return {
    time: `${SCHEDULED_HOURS[0].toString().padStart(2, '0')}:00`,
    isToday: false
  };
}

/**
 * Retorna os horários de atualização configurados
 */
export function getScheduledHours(): number[] {
  return [...SCHEDULED_HOURS];
}

/**
 * Hook específico para atualizar pacientes, feedbacks e checkins em horários agendados
 * Usa invalidateQueries para forçar refetch apenas quando necessário
 */
export function useScheduledDataRefetch() {
  const queryClient = useQueryClient();

  const refetchAll = useCallback(async () => {
    console.log('🔄 Atualização programada: invalidando queries de pacientes, feedbacks e checkins');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['patients'] }),
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] }),
      queryClient.invalidateQueries({ queryKey: ['checkins'] }),
      queryClient.invalidateQueries({ queryKey: ['checkin'] }),
    ]);
  }, [queryClient]);

  useScheduledRefetch(refetchAll);
}
