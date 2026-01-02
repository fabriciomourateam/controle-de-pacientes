import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinService, type Checkin, type CheckinWithPatient } from '@/lib/checkin-service';
import { useScheduledRefetch } from './use-scheduled-refetch';
import { useCallback } from 'react';

// Re-exportar tipos para uso externo
export type { Checkin, CheckinWithPatient };

// Chaves de query para invalidação de cache
export const checkinQueryKeys = {
  all: ['checkins'] as const,
  lists: () => [...checkinQueryKeys.all, 'list'] as const,
  list: (filters?: any) => [...checkinQueryKeys.lists(), filters] as const,
  details: () => [...checkinQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...checkinQueryKeys.details(), id] as const,
  byPhone: (telefone: string) => [...checkinQueryKeys.all, 'phone', telefone] as const,
  stats: () => [...checkinQueryKeys.all, 'stats'] as const,
  recent: (hours: number) => [...checkinQueryKeys.all, 'recent', hours] as const,
  search: (term: string) => [...checkinQueryKeys.all, 'search', term] as const,
};

// ==========================================
// HOOKS OTIMIZADOS - SEM REFETCH AUTOMÁTICO
// Atualização apenas: ao carregar página, horários programados (6h, 12h, 15h, 18h), ou manual
// ==========================================

/**
 * Hook para buscar todos os checkins
 * OTIMIZADO: Sem refetch automático - usa atualização programada
 */
export function useCheckins() {
  return useQuery({
    queryKey: checkinQueryKeys.lists(),
    queryFn: () => checkinService.getAll(),
    staleTime: Infinity, // Dados nunca ficam "stale" automaticamente
    gcTime: 24 * 60 * 60 * 1000, // Cache mantido por 24h
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
    refetchOnReconnect: false, // Não recarrega ao reconectar
  });
}

/**
 * Hook para buscar checkins com dados do paciente
 * OTIMIZADO: Sem refetch automático - usa atualização programada
 */
export function useCheckinsWithPatient() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'with-patient'],
    queryFn: () => checkinService.getAllWithPatient(),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook combinado: checkins com paciente + atualização programada
 * Usa atualização automática às 6h, 12h, 15h, 18h
 */
export function useCheckinsWithScheduledRefetch() {
  const query = useCheckinsWithPatient();
  
  // Wrapper do refetch que retorna void
  const refetchWrapper = useCallback(async () => {
    await query.refetch();
  }, [query]);
  
  // Configura atualização programada
  useScheduledRefetch(refetchWrapper);
  
  return query;
}

/**
 * Hook para buscar checkins recentes (otimizado para notificações)
 * Filtra por data no banco para reduzir tráfego
 */
export function useRecentCheckins(hours: number = 48) {
  return useQuery({
    queryKey: checkinQueryKeys.recent(hours),
    queryFn: () => checkinService.getRecent(hours),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar checkins por termo (busca server-side)
 * Só executa quando o termo tem 2+ caracteres
 */
export function useCheckinSearch(term: string) {
  return useQuery({
    queryKey: checkinQueryKeys.search(term),
    queryFn: () => checkinService.search(term),
    enabled: term.trim().length >= 2,
    staleTime: 30 * 1000, // Cache de 30 segundos para buscas
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar último checkin de cada paciente
 * Útil para verificar pacientes inativos
 */
export function useLastCheckinPerPatient() {
  return useQuery({
    queryKey: [...checkinQueryKeys.all, 'last-per-patient'],
    queryFn: () => checkinService.getLastCheckinPerPatient(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para invalidar cache de checkins
export function useInvalidateCheckins() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: checkinQueryKeys.all });
  };
}

/**
 * Hook para buscar checkins de um paciente específico
 * Mantém refetch limitado pois é para página de detalhes
 */
export function usePatientCheckins(telefone: string) {
  return useQuery({
    queryKey: checkinQueryKeys.byPhone(telefone),
    queryFn: () => checkinService.getByPhone(telefone),
    enabled: !!telefone,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useCurrentMonthCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'current-month'],
    queryFn: () => checkinService.getCurrentMonth(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useCheckinStats() {
  return useQuery({
    queryKey: checkinQueryKeys.stats(),
    queryFn: () => checkinService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function usePatientEvolution(telefone: string, months: number = 12) {
  return useQuery({
    queryKey: [...checkinQueryKeys.byPhone(telefone), 'evolution', months],
    queryFn: () => checkinService.getPatientEvolution(telefone, months),
    enabled: !!telefone,
    staleTime: 10 * 60 * 1000, // 10 minutos - dados históricos mudam pouco
  });
}

export function useCheckinsByFillDate(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'by-date', startDate, endDate],
    queryFn: () => checkinService.getByFillDate(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useFilledTodayCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'filled-today'],
    queryFn: () => checkinService.getFilledToday(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useFilledLastWeekCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'filled-last-week'],
    queryFn: () => checkinService.getFilledLastWeek(),
    staleTime: 10 * 60 * 1000, // 10 minutos - dados históricos
    refetchOnWindowFocus: false,
  });
}
