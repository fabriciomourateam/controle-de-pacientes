import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinService, type Checkin, type CheckinWithPatient } from '@/lib/checkin-service';

// Chaves de query para invalidação de cache
export const checkinQueryKeys = {
  all: ['checkins'] as const,
  lists: () => [...checkinQueryKeys.all, 'list'] as const,
  list: (filters?: any) => [...checkinQueryKeys.lists(), filters] as const,
  details: () => [...checkinQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...checkinQueryKeys.details(), id] as const,
  byPhone: (telefone: string) => [...checkinQueryKeys.all, 'phone', telefone] as const,
  stats: () => [...checkinQueryKeys.all, 'stats'] as const,
};

export function useCheckins() {
  return useQuery({
    queryKey: checkinQueryKeys.lists(),
    queryFn: () => checkinService.getAll(),
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
    staleTime: 20 * 1000, // Dados ficam "frescos" por 20 segundos
  });
}

export function useCheckinsWithPatient() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'with-patient'],
    queryFn: () => checkinService.getAllWithPatient(),
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos para dados atualizados
    staleTime: 20 * 1000, // Dados ficam "frescos" por 20 segundos
  });
}

// Hook para invalidar cache de checkins
export function useInvalidateCheckins() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: checkinQueryKeys.all });
  };
}

export function usePatientCheckins(telefone: string) {
  return useQuery({
    queryKey: checkinQueryKeys.byPhone(telefone),
    queryFn: () => checkinService.getByPhone(telefone),
    enabled: !!telefone, // Só executa se telefone estiver definido
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
    staleTime: 20 * 1000,
  });
}

export function useCurrentMonthCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'current-month'],
    queryFn: () => checkinService.getCurrentMonth(),
    refetchInterval: 30 * 1000,
    staleTime: 20 * 1000,
  });
}

export function useCheckinStats() {
  return useQuery({
    queryKey: checkinQueryKeys.stats(),
    queryFn: () => checkinService.getStats(),
    refetchInterval: 30 * 1000,
    staleTime: 20 * 1000,
  });
}

export function usePatientEvolution(telefone: string, months: number = 12) {
  return useQuery({
    queryKey: [...checkinQueryKeys.byPhone(telefone), 'evolution', months],
    queryFn: () => checkinService.getPatientEvolution(telefone, months),
    enabled: !!telefone,
    staleTime: 60 * 1000, // Evolução pode ter cache maior (1 minuto)
  });
}

export function useCheckinsByFillDate(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'by-date', startDate, endDate],
    queryFn: () => checkinService.getByFillDate(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 30 * 1000,
  });
}

export function useFilledTodayCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'filled-today'],
    queryFn: () => checkinService.getFilledToday(),
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
    staleTime: 20 * 1000,
  });
}

export function useFilledLastWeekCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'filled-last-week'],
    queryFn: () => checkinService.getFilledLastWeek(),
    refetchInterval: 60 * 1000, // Refetch a cada 1 minuto (menos frequente)
    staleTime: 30 * 1000,
  });
}
