import { useState, useEffect, useCallback } from "react";
import { userPreferencesService, PatientViewPreferences } from "@/lib/user-preferences-service";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientSorting } from "@/components/patients/PatientSorting";

const USER_ID = "default_user"; // Em produção, usar o ID do usuário logado

// Preferências padrão locais
const getDefaultPreferences = (): PatientViewPreferences => ({
  user_id: USER_ID,
  filters: {
    search: '',
    status: 'all',
    plan: 'all',
    dateRange: { start: '', end: '' }
  },
  sorting: {
    field: 'created_at',
    direction: 'desc'
  },
  visible_columns: ['nome', 'apelido', 'telefone', 'email', 'plano', 'data_vencimento', 'status', 'created_at'],
  page_size: 20
});

export function usePatientPreferences() {
  const [preferences, setPreferences] = useState<PatientViewPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar preferências
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      
      // Tentar carregar preferências salvas
      const savedPreferences = await userPreferencesService.getPatientPreferences?.(USER_ID);
      
      if (savedPreferences) {
        setPreferences(savedPreferences);
      } else {
        // Usar preferências padrão se não houver salvas
        const defaultPrefs = getDefaultPreferences();
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      // Usar preferências padrão em caso de erro
      const defaultPrefs = getDefaultPreferences();
      setPreferences(defaultPrefs);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar preferências
  const savePreferences = useCallback(async (newPreferences: Partial<PatientViewPreferences>) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const updatedPreferences = {
        ...preferences,
        ...newPreferences,
        updated_at: new Date().toISOString()
      };

      const saved = await userPreferencesService.savePatientPreferences?.(updatedPreferences) || updatedPreferences;
      setPreferences(saved);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  // Atualizar filtros
  const updateFilters = useCallback(async (filters: PatientFilters) => {
    await savePreferences({ filters });
  }, [savePreferences]);

  // Atualizar ordenação
  const updateSorting = useCallback(async (sorting: PatientSorting) => {
    await savePreferences({ sorting });
  }, [savePreferences]);

  // Atualizar colunas visíveis
  const updateVisibleColumns = useCallback(async (visibleColumns: string[]) => {
    await savePreferences({ visible_columns: visibleColumns });
  }, [savePreferences]);

  // Atualizar ordem das colunas
  const updateColumnOrder = useCallback(async (columnOrder: string[]) => {
    await savePreferences({ column_order: columnOrder });
  }, [savePreferences]);

  // Atualizar tamanho da página
  const updatePageSize = useCallback(async (pageSize: number) => {
    await savePreferences({ page_size: pageSize });
  }, [savePreferences]);

  // Resetar para padrão
  const resetToDefault = useCallback(async () => {
    const defaultPrefs = getDefaultPreferences();
    await savePreferences(defaultPrefs);
  }, [savePreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    saving,
    updateFilters,
    updateSorting,
    updateVisibleColumns,
    updateColumnOrder,
    updatePageSize,
    resetToDefault,
    refetch: loadPreferences
  };
}

