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

// Função helper para refetch condicional baseado em visibilidade da página
// Retorna uma função que o React Query reavalia dinamicamente
const getRefetchInterval = (baseInterval: number) => {
  return () => {
    // Se a página não está visível, não refetch
    if (typeof document !== 'undefined' && document.hidden) {
      return false;
    }
    return baseInterval;
  };
};

export function useCheckins() {
  return useQuery({
    queryKey: checkinQueryKeys.lists(),
    queryFn: () => checkinService.getAll(),
    refetchInterval: getRefetchInterval(2 * 60 * 1000), // 2 minutos (checkins podem mudar mais frequentemente)
    staleTime: 90 * 1000, // 1.5 minutos - dados ficam "frescos" por mais tempo
  });
}

export function useCheckinsWithPatient() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'with-patient'],
    queryFn: () => checkinService.getAllWithPatient(),
    refetchInterval: getRefetchInterval(2 * 60 * 1000), // 2 minutos para dados atualizados
    staleTime: 90 * 1000, // 1.5 minutos - dados ficam "frescos" por mais tempo
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
    refetchInterval: getRefetchInterval(2 * 60 * 1000), // 2 minutos
    staleTime: 90 * 1000, // 1.5 minutos
  });
}

export function useCurrentMonthCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'current-month'],
    queryFn: () => checkinService.getCurrentMonth(),
    refetchInterval: getRefetchInterval(2 * 60 * 1000), // 2 minutos
    staleTime: 90 * 1000, // 1.5 minutos
  });
}

export function useCheckinStats() {
  return useQuery({
    queryKey: checkinQueryKeys.stats(),
    queryFn: () => checkinService.getStats(),
    refetchInterval: getRefetchInterval(2 * 60 * 1000), // 2 minutos
    staleTime: 90 * 1000, // 1.5 minutos
  });
}

export function usePatientEvolution(telefone: string, months: number = 12) {
  return useQuery({
    queryKey: [...checkinQueryKeys.byPhone(telefone), 'evolution', months],
    queryFn: () => checkinService.getPatientEvolution(telefone, months),
    enabled: !!telefone,
    staleTime: 5 * 60 * 1000, // Evolução pode ter cache maior (5 minutos) - dados históricos mudam pouco
  });
}

export function useCheckinsByFillDate(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'by-date', startDate, endDate],
    queryFn: () => checkinService.getByFillDate(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useFilledTodayCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'filled-today'],
    queryFn: () => checkinService.getFilledToday(),
    refetchInterval: getRefetchInterval(2 * 60 * 1000), // 2 minutos
    staleTime: 90 * 1000, // 1.5 minutos
  });
}

export function useFilledLastWeekCheckins() {
  return useQuery({
    queryKey: [...checkinQueryKeys.lists(), 'filled-last-week'],
    queryFn: () => checkinService.getFilledLastWeek(),
    refetchInterval: getRefetchInterval(5 * 60 * 1000), // 5 minutos (dados históricos)
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}
