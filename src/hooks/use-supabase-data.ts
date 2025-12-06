import { useState, useEffect } from 'react';
import { patientService, planService, feedbackService, dashboardService } from '@/lib/supabase-services';
import type { Patient, Plan, Feedback } from '@/lib/supabase-services';
import { getCurrentUserId } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';

// Hook para pacientes
export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getAll();
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const createPatient = async (patientData: any) => {
    try {
      const newPatient = await patientService.create(patientData);
      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar paciente');
      throw err;
    }
  };

  const updatePatient = async (id: string, updates: any) => {
    try {
      const updatedPatient = await patientService.update(id, updates);
      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));
      return updatedPatient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar paciente');
      throw err;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await patientService.delete(id);
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar paciente');
      throw err;
    }
  };

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    createPatient,
    updatePatient,
    deletePatient
  };
}

// Hook para planos
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await planService.getAll();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const createPlan = async (planData: any) => {
    try {
      const newPlan = await planService.create(planData);
      setPlans(prev => [newPlan, ...prev]);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar plano');
      throw err;
    }
  };

  const updatePlan = async (id: string, updates: any) => {
    try {
      const updatedPlan = await planService.update(id, updates);
      setPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
      return updatedPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar plano');
      throw err;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await planService.delete(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar plano');
      throw err;
    }
  };

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan
  };
}

// Hook para feedbacks
export function useFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getAll();
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const createFeedback = async (feedbackData: any) => {
    try {
      const newFeedback = await feedbackService.create(feedbackData);
      setFeedbacks(prev => [newFeedback, ...prev]);
      return newFeedback;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar feedback');
      throw err;
    }
  };

  const updateFeedback = async (id: string, updates: any) => {
    try {
      const updatedFeedback = await feedbackService.update(id, updates);
      setFeedbacks(prev => prev.map(f => f.id === id ? updatedFeedback : f));
      return updatedFeedback;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar feedback');
      throw err;
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      await feedbackService.delete(id);
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar feedback');
      throw err;
    }
  };

  return {
    feedbacks,
    loading,
    error,
    refetch: fetchFeedbacks,
    createFeedback,
    updateFeedback,
    deleteFeedback
  };
}

// Hook para métricas do dashboard
export function useDashboardMetrics(filterThisMonth: boolean = false) {
  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    activePatients: 0,
    expiringPatients: 0,
    pendingFeedbacks: 0,
    avgOverallScore: '0.0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getMetrics(filterThisMonth);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [filterThisMonth]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
}

// Hook para dados dos gráficos
export function useChartData(filterThisMonth: boolean = false) {
  const [chartData, setChartData] = useState({
    monthlyData: [],
    planDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getChartData(filterThisMonth);
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados dos gráficos');
    } finally {
      setLoading(false);
    }
  };

  // Buscar user_id atual
  useEffect(() => {
    async function getUserId() {
      const id = await getCurrentUserId();
      setUserId(id);
    }
    getUserId();
  }, []);

  // Recarregar dados quando filterThisMonth ou userId mudar
  useEffect(() => {
    if (userId) {
      // Limpar dados anteriores antes de buscar novos
      setChartData({ monthlyData: [], planDistribution: [] });
      fetchChartData();
    } else {
      // Se não houver userId, limpar dados
      setChartData({ monthlyData: [], planDistribution: [] });
      setLoading(false);
    }
  }, [filterThisMonth, userId]);

  // Escutar mudanças de autenticação para recarregar dados
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const id = await getCurrentUserId();
          setUserId(id);
          // Recarregar dados quando usuário mudar
          if (id) {
            fetchChartData();
          }
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setChartData({ monthlyData: [], planDistribution: [] });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    chartData,
    loading,
    error,
    refetch: fetchChartData
  };
}

// Hook para pacientes expirando
export function useExpiringPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringPatients = async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getExpiring(days);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes expirando');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringPatients(7); // Buscar apenas pacientes expirando em 7 dias
  }, []);

  return {
    patients,
    loading,
    error,
    refetch: fetchExpiringPatients
  };
}

// Hook para feedbacks recentes
export function useRecentFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentFeedbacks = async (limit: number = 5) => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getRecent(limit);
      setFeedbacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feedbacks recentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentFeedbacks();
  }, []);

  return {
    feedbacks,
    loading,
    error,
    refetch: fetchRecentFeedbacks
  };
}

// Hook para checkins recentes (alias para compatibilidade)
export function useRecentCheckins() {
  const [checkins, setCheckins] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentCheckins = async (limit: number = 5) => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getRecent(limit);
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins recentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentCheckins();
  }, []);

  return {
    checkins,
    loading,
    error,
    refetch: fetchRecentCheckins
  };
}
