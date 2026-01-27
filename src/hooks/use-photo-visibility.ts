import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PhotoVisibilitySetting {
  id: string;
  patient_telefone: string;
  photo_id: string;
  visible: boolean;
  zoom_level: number;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface PhotoVisibilityUpdate {
  visible?: boolean;
  zoom_level?: number;
  position_x?: number;
  position_y?: number;
}

export function usePhotoVisibility(patientTelefone: string | null | undefined) {
  const [settings, setSettings] = useState<PhotoVisibilitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar configurações do banco
  const loadSettings = async () => {
    if (!patientTelefone) {
      setSettings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('photo_visibility_settings')
        .select('*')
        .eq('patient_telefone', patientTelefone);

      if (error) throw error;

      setSettings(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações de visibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações das fotos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar e quando telefone mudar
  useEffect(() => {
    loadSettings();
  }, [patientTelefone]);

  // Obter configuração de uma foto específica
  const getSetting = (photoId: string): PhotoVisibilitySetting | null => {
    return settings.find(s => s.photo_id === photoId) || null;
  };

  // Verificar se uma foto está visível (padrão: true se não houver configuração)
  const isPhotoVisible = (photoId: string): boolean => {
    const setting = getSetting(photoId);
    return setting ? setting.visible : true; // Padrão: visível
  };

  // Atualizar ou criar configuração de uma foto
  const updateSetting = async (
    photoId: string,
    updates: PhotoVisibilityUpdate
  ): Promise<boolean> => {
    if (!patientTelefone) return false;

    try {
      const existingSetting = getSetting(photoId);

      if (existingSetting) {
        // Atualizar existente
        const { error } = await supabase
          .from('photo_visibility_settings')
          .update(updates)
          .eq('id', existingSetting.id);

        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('photo_visibility_settings')
          .insert({
            patient_telefone: patientTelefone,
            photo_id: photoId,
            ...updates
          });

        if (error) throw error;
      }

      // Recarregar configurações
      await loadSettings();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Toggle de visibilidade
  const toggleVisibility = async (photoId: string): Promise<boolean> => {
    const currentVisibility = isPhotoVisible(photoId);
    return await updateSetting(photoId, { visible: !currentVisibility });
  };

  // Atualizar zoom
  const updateZoom = async (photoId: string, zoomLevel: number): Promise<boolean> => {
    // Limitar zoom entre 0.5 e 3.0
    const clampedZoom = Math.max(0.5, Math.min(3.0, zoomLevel));
    return await updateSetting(photoId, { zoom_level: clampedZoom });
  };

  // Atualizar posição
  const updatePosition = async (
    photoId: string,
    positionX: number,
    positionY: number
  ): Promise<boolean> => {
    // Limitar posição entre -100 e 100
    const clampedX = Math.max(-100, Math.min(100, positionX));
    const clampedY = Math.max(-100, Math.min(100, positionY));
    return await updateSetting(photoId, {
      position_x: clampedX,
      position_y: clampedY
    });
  };

  // Resetar configuração de uma foto (voltar ao padrão)
  const resetSetting = async (photoId: string): Promise<boolean> => {
    if (!patientTelefone) return false;

    try {
      const existingSetting = getSetting(photoId);
      if (!existingSetting) return true; // Já está no padrão

      const { error } = await supabase
        .from('photo_visibility_settings')
        .delete()
        .eq('id', existingSetting.id);

      if (error) throw error;

      await loadSettings();
      return true;
    } catch (error) {
      console.error('Erro ao resetar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar as configurações',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Resetar todas as configurações do paciente
  const resetAllSettings = async (): Promise<boolean> => {
    if (!patientTelefone) return false;

    try {
      const { error } = await supabase
        .from('photo_visibility_settings')
        .delete()
        .eq('patient_telefone', patientTelefone);

      if (error) throw error;

      await loadSettings();
      toast({
        title: 'Configurações resetadas',
        description: 'Todas as fotos voltaram ao padrão'
      });
      return true;
    } catch (error) {
      console.error('Erro ao resetar todas as configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar as configurações',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    settings,
    loading,
    getSetting,
    isPhotoVisible,
    updateSetting,
    toggleVisibility,
    updateZoom,
    updatePosition,
    resetSetting,
    resetAllSettings,
    reload: loadSettings
  };
}
