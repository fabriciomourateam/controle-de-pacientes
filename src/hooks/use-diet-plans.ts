import { useState, useEffect } from 'react';
import { dietService } from '@/lib/diet-service';

export function useDietPlans(patientId: string | null) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await dietService.getByPatientId(patientId);
      setPlans(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planos alimentares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [patientId]);

  const createPlan = async (planData: any) => {
    try {
      const newPlan = await dietService.create(planData);
      setPlans(prev => [newPlan, ...prev]);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar plano');
      throw err;
    }
  };

  const updatePlan = async (planId: string, updates: any) => {
    try {
      const updatedPlan = await dietService.update(planId, updates);
      setPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      return updatedPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar plano');
      throw err;
    }
  };

  const releasePlan = async (planId: string) => {
    try {
      const releasedPlan = await dietService.release(planId);
      setPlans(prev => prev.map(p => p.id === planId ? releasedPlan : p));
      return releasedPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao liberar plano');
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
    releasePlan
  };
}


