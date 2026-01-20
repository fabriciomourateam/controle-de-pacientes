import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GuidelineTemplate {
  id: string;
  guideline_type: string;
  title: string;
  content: string;
  priority: number;
  is_active: boolean;
  created_at: string | null;
}

export function useGuidelineTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<GuidelineTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar templates do usuário
  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('diet_guidelines')
        .select('*')
        .eq('is_template', true)
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates de orientações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar novo template
  const createTemplate = async (templateData: {
    guideline_type: string;
    title: string;
    content: string;
    priority?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('diet_guidelines')
        .insert({
          ...templateData,
          is_template: true,
          is_active: true,
          user_id: user.id,
          diet_plan_id: null, // NULL para templates
          priority: templateData.priority || 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Template criado',
        description: 'A orientação foi salva como template e aparecerá em novos planos',
      });

      await loadTemplates();
      return data;
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o template',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Atualizar template
  const updateTemplate = async (id: string, updates: Partial<GuidelineTemplate>) => {
    try {
      const { error } = await supabase
        .from('diet_guidelines')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Template atualizado',
        description: 'As alterações foram salvas',
      });

      await loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o template',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Deletar template
  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('diet_guidelines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Template removido',
        description: 'O template foi excluído permanentemente',
      });

      await loadTemplates();
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o template',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Ativar/desativar template
  const toggleTemplateActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('diet_guidelines')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isActive ? 'Template ativado' : 'Template desativado',
        description: isActive 
          ? 'Este template aparecerá em novos planos' 
          : 'Este template não aparecerá em novos planos',
      });

      await loadTemplates();
    } catch (error) {
      console.error('Erro ao alterar status do template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do template',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Copiar templates para um plano
  const copyTemplatesToPlan = async (dietPlanId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Chamar função do banco de dados
      const { error } = await supabase.rpc('copy_guideline_templates_to_plan', {
        p_diet_plan_id: dietPlanId,
        p_user_id: user.id
      });

      if (error) throw error;

      console.log('✅ Templates copiados para o plano:', dietPlanId);
    } catch (error) {
      console.error('Erro ao copiar templates para o plano:', error);
      // Não mostrar toast de erro aqui, pois é chamado automaticamente
      throw error;
    }
  };

  // Ativar/desativar orientação em um plano específico
  const toggleGuidelineInPlan = async (guidelineId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('diet_guidelines')
        .update({ is_active: isActive })
        .eq('id', guidelineId);

      if (error) throw error;

      toast({
        title: isActive ? 'Orientação ativada' : 'Orientação desativada',
        description: isActive 
          ? 'A orientação voltará a aparecer no plano' 
          : 'A orientação foi ocultada deste plano',
      });
    } catch (error) {
      console.error('Erro ao alterar status da orientação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da orientação',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive,
    copyTemplatesToPlan,
    toggleGuidelineInPlan
  };
}
