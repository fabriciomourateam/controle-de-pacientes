import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface RenewalCustomContent {
  id?: string;
  patient_telefone: string;
  user_id: string;
  summary_content?: string;
  achievements_content?: string;
  improvement_areas_content?: string;
  highlights_content?: string;
  next_cycle_goals_content?: string;
  created_at?: string;
  updated_at?: string;
}

export function useRenewalCustomContent(patientTelefone: string) {
  const [customContent, setCustomContent] = useState<RenewalCustomContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Carregar conteúdo personalizado existente
  const loadCustomContent = async () => {
    if (!user || !patientTelefone) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('renewal_custom_content')
        .select('*')
        .eq('patient_telefone', patientTelefone)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Erro ao carregar conteúdo personalizado:', error);
        return;
      }

      setCustomContent(data);
    } catch (error) {
      console.error('Erro ao carregar conteúdo personalizado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar ou atualizar conteúdo personalizado
  const saveCustomContent = async (content: Partial<RenewalCustomContent>) => {
    if (!user || !patientTelefone) return false;

    try {
      setSaving(true);

      const contentData = {
        patient_telefone: patientTelefone,
        user_id: user.id,
        ...content,
      };

      let result;

      if (customContent?.id) {
        // Atualizar existente
        result = await supabase
          .from('renewal_custom_content')
          .update(contentData)
          .eq('id', customContent.id)
          .select()
          .single();
      } else {
        // Criar novo
        result = await supabase
          .from('renewal_custom_content')
          .insert(contentData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setCustomContent(result.data);
      
      toast({
        title: 'Conteúdo salvo!',
        description: 'As personalizações foram salvas com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar conteúdo personalizado:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as personalizações.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Salvar seção específica
  const saveSectionContent = async (section: keyof RenewalCustomContent, content: string) => {
    return await saveCustomContent({ [section]: content });
  };

  // Obter conteúdo de uma seção específica
  const getSectionContent = (section: keyof RenewalCustomContent): string | undefined => {
    return customContent?.[section] as string | undefined;
  };

  // Verificar se uma seção tem conteúdo personalizado
  const hasSectionContent = (section: keyof RenewalCustomContent): boolean => {
    const content = getSectionContent(section);
    return !!(content && content.trim().length > 0);
  };

  // Resetar uma seção específica
  const resetSectionContent = async (section: keyof RenewalCustomContent) => {
    return await saveCustomContent({ [section]: null });
  };

  // Resetar todo o conteúdo personalizado
  const resetAllContent = async () => {
    if (!customContent?.id) return true;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('renewal_custom_content')
        .delete()
        .eq('id', customContent.id);

      if (error) {
        throw error;
      }

      setCustomContent(null);
      
      toast({
        title: 'Conteúdo resetado!',
        description: 'Todas as personalizações foram removidas.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao resetar conteúdo:', error);
      toast({
        title: 'Erro ao resetar',
        description: 'Não foi possível resetar as personalizações.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadCustomContent();
  }, [user, patientTelefone]);

  return {
    customContent,
    loading,
    saving,
    saveCustomContent,
    saveSectionContent,
    getSectionContent,
    hasSectionContent,
    resetSectionContent,
    resetAllContent,
    refreshContent: loadCustomContent,
  };
}