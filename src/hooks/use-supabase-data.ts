import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService, planService, feedbackService, dashboardService } from '@/lib/supabase-services';
import type { Patient, Plan, Feedback } from '@/lib/supabase-services';
import { getCurrentUserId } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useScheduledDataRefetch } from '@/hooks/use-scheduled-refetch';

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

// Chaves de query para invalidação de cache
export const patientQueryKeys = {
  all: ['patients'] as const,
  lists: () => [...patientQueryKeys.all, 'list'] as const,
  details: () => [...patientQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientQueryKeys.details(), id] as const,
  expiring: (days: number) => [...patientQueryKeys.all, 'expiring', days] as const,
};

// Hook para pacientes com React Query
// @param limit - Limite opcional (null = todos os pacientes)
export function usePatients(limit?: number | null) {
  const queryClient = useQueryClient();
  
  // Usar atualização agendada (4x ao dia) em vez de refetchInterval
  useScheduledDataRefetch();
  
  const query = useQuery({
    queryKey: [...patientQueryKeys.lists(), 'limit', limit],
    queryFn: () => patientService.getAll(limit ?? undefined),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos - dados ficam "frescos" por mais tempo
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });

  const createMutation = useMutation({
    mutationFn: (patientData: any) => patientService.create(patientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      patientService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });
    },
  });

  return {
    patients: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Erro ao carregar pacientes') : null,
    refetch: query.refetch,
    createPatient: createMutation.mutateAsync,
    updatePatient: updateMutation.mutateAsync,
    deletePatient: deleteMutation.mutateAsync,
  };
}

// Hook para planos
export function usePlans() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.getAll(),
    staleTime: 5 * 60 * 1000, // Planos mudam pouco, cache maior (5 minutos)
  });

  const createMutation = useMutation({
    mutationFn: (planData: any) => planService.create(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      planService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => planService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  return {
    plans: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Erro ao carregar planos') : null,
    refetch: query.refetch,
    createPlan: createMutation.mutateAsync,
    updatePlan: updateMutation.mutateAsync,
    deletePlan: deleteMutation.mutateAsync,
  };
}

// Hook para feedbacks
// Hook para feedbacks
// @param limit - Limite opcional (padrão: 1000, null = todos)
export function useFeedbacks(limit?: number | null) {
  const queryClient = useQueryClient();
  
  // Usar atualização agendada (4x ao dia) em vez de refetchInterval
  useScheduledDataRefetch();
  
  const query = useQuery({
    queryKey: ['feedbacks', 'limit', limit],
    queryFn: () => feedbackService.getAll(limit ?? undefined),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });

  const createMutation = useMutation({
    mutationFn: (feedbackData: any) => feedbackService.create(feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      feedbackService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feedbackService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  return {
    feedbacks: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Erro ao carregar feedbacks') : null,
    refetch: query.refetch,
    createFeedback: createMutation.mutateAsync,
    updateFeedback: updateMutation.mutateAsync,
    deleteFeedback: deleteMutation.mutateAsync,
  };
}

// Hook para métricas do dashboard
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useDashboardMetrics(filterThisMonth: boolean = false) {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['dashboard-metrics', filterThisMonth],
    queryFn: () => dashboardService.getMetrics(filterThisMonth),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });
}

// Hook para dados dos gráficos
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useChartData(filterThisMonth: boolean = false) {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: ['chart-data', filterThisMonth],
    queryFn: () => dashboardService.getChartData(filterThisMonth),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });
}

// Hook para pacientes expirando
// Otimizado: usa atualização agendada em vez de refetchInterval
export function useExpiringPatients(days: number = 7) {
  // Usar atualização agendada (4x ao dia)
  useScheduledDataRefetch();
  
  return useQuery({
    queryKey: patientQueryKeys.expiring(days),
    queryFn: () => patientService.getExpiring(days),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });
}

// Hook para feedbacks recentes
export function useRecentFeedbacks(limit: number = 5) {
  return useQuery({
    queryKey: ['feedbacks', 'recent', limit],
    queryFn: () => feedbackService.getRecent(limit),
    // ❌ REMOVIDO: refetchInterval - agora usa atualização agendada + Realtime
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar na janela
  });
}

// Hook para checkins recentes (alias para compatibilidade)
export function useRecentCheckins(limit: number = 5) {
  const query = useRecentFeedbacks(limit);
  return {
    checkins: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Erro ao carregar checkins recentes') : null,
    refetch: query.refetch
  };
}
