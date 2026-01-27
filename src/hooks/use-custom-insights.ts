import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisInsight } from '@/lib/ai-analysis-service';

export interface CustomInsight {
  id: string;
  telefone: string;
  user_id: string;
  section: 'strengths' | 'warnings' | 'goals';
  icon: string;
  title: string;
  description: string;
  recommendation?: string;
  priority?: 'high' | 'medium' | 'low';
  order_index: number;
  is_manual: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsightData {
  section: 'strengths' | 'warnings' | 'goals';
  icon: string;
  title: string;
  description: string;
  recommendation?: string;
  priority?: 'high' | 'medium' | 'low';
  order_index?: number;
}

// Função para gerar hash de um insight da IA
function generateInsightHash(insight: AnalysisInsight): string {
  const content = `${insight.title}|${insight.description}`;
  // Simples hash (em produção, usar crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function useCustomInsights(telefone: string) {
  const { toast } = useToast();
  const [customInsights, setCustomInsights] = useState<CustomInsight[]>([]);
  const [hiddenAIInsights, setHiddenAIInsights] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Buscar insights customizados e ocultos
  const fetchCustomInsights = async () => {
    if (!telefone) return;

    try {
      setLoading(true);
      
      // Buscar insights customizados
      const { data: customData, error: customError } = await supabase
        .from('ai_insights_custom' as any)
        .select('*')
        .eq('telefone', telefone)
        .eq('is_hidden', false)
        .order('order_index', { ascending: true });

      if (customError) throw customError;

      setCustomInsights(customData || []);

      // Buscar insights da IA que foram ocultados
      const { data: hiddenData, error: hiddenError } = await supabase
        .from('ai_insights_hidden' as any)
        .select('ai_insight_hash')
        .eq('telefone', telefone);

      if (hiddenError) {
        // Tabela pode não existir ainda, ignorar erro
        console.warn('Tabela ai_insights_hidden não encontrada:', hiddenError);
      } else {
        const hiddenHashes = new Set(hiddenData?.map(h => h.ai_insight_hash) || []);
        setHiddenAIInsights(hiddenHashes);
      }
    } catch (error) {
      console.error('Erro ao buscar insights customizados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar insights customizados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar novo insight
  const saveInsight = async (data: InsightData): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado',
          variant: 'destructive'
        });
        return false;
      }

      // Buscar maior order_index da seção para adicionar no final
      const { data: existingInsights } = await supabase
        .from('ai_insights_custom' as any)
        .select('order_index')
        .eq('telefone', telefone)
        .eq('section', data.section)
        .eq('is_hidden', false)
        .order('order_index', { ascending: false })
        .limit(1);

      const maxOrderIndex = existingInsights && existingInsights.length > 0 
        ? existingInsights[0].order_index 
        : 0;

      const { error } = await supabase
        .from('ai_insights_custom' as any)
        .insert({
          telefone,
          user_id: user.id,
          section: data.section,
          icon: data.icon,
          title: data.title,
          description: data.description,
          recommendation: data.recommendation || null,
          priority: data.priority || null,
          order_index: data.order_index !== undefined ? data.order_index : maxOrderIndex + 1,
          is_manual: true
        });

      if (error) throw error;

      toast({
        title: 'Card adicionado!',
        description: 'O novo card foi criado com sucesso'
      });

      await fetchCustomInsights();
      return true;
    } catch (error) {
      console.error('Erro ao salvar insight:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível criar o card',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Atualizar insight existente
  const updateInsight = async (id: string, data: Partial<InsightData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_insights_custom' as any)
        .update({
          icon: data.icon,
          title: data.title,
          description: data.description,
          recommendation: data.recommendation || null,
          priority: data.priority || null,
          order_index: data.order_index
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Card atualizado!',
        description: 'As alterações foram salvas'
      });

      await fetchCustomInsights();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar insight:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Deletar insight (soft delete)
  const deleteInsight = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_insights_custom' as any)
        .update({ is_hidden: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Card excluído',
        description: 'O card foi removido da análise'
      });

      await fetchCustomInsights();
      return true;
    } catch (error) {
      console.error('Erro ao deletar insight:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o card',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Reordenar insights
  const reorderInsights = async (section: string, reorderedIds: string[]): Promise<boolean> => {
    try {
      // Atualizar order_index de cada insight
      const updates = reorderedIds.map((id, index) => 
        supabase
          .from('ai_insights_custom' as any)
          .update({ order_index: index })
          .eq('id', id)
      );

      await Promise.all(updates);

      await fetchCustomInsights();
      return true;
    } catch (error) {
      console.error('Erro ao reordenar insights:', error);
      toast({
        title: 'Erro ao reordenar',
        description: 'Não foi possível salvar a nova ordem',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Carregar insights ao montar
  useEffect(() => {
    if (telefone) {
      fetchCustomInsights();
    }
  }, [telefone]);

  // Ocultar card da IA
  const hideAIInsight = async (insight: AnalysisInsight, section: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado',
          variant: 'destructive'
        });
        return false;
      }

      const hash = generateInsightHash(insight);

      const { error } = await supabase
        .from('ai_insights_hidden' as any)
        .insert({
          telefone,
          user_id: user.id,
          section,
          ai_insight_hash: hash
        });

      if (error) {
        // Se erro é de duplicata, ignorar (já está oculto)
        if (error.code === '23505') {
          return true;
        }
        throw error;
      }

      toast({
        title: 'Card ocultado',
        description: 'O card da IA foi ocultado da visualização'
      });

      await fetchCustomInsights();
      return true;
    } catch (error) {
      console.error('Erro ao ocultar insight da IA:', error);
      toast({
        title: 'Erro ao ocultar',
        description: 'Não foi possível ocultar o card',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Mostrar card da IA novamente
  const showAIInsight = async (insight: AnalysisInsight): Promise<boolean> => {
    try {
      const hash = generateInsightHash(insight);

      const { error } = await supabase
        .from('ai_insights_hidden' as any)
        .delete()
        .eq('telefone', telefone)
        .eq('ai_insight_hash', hash);

      if (error) throw error;

      toast({
        title: 'Card restaurado',
        description: 'O card da IA voltou a ser exibido'
      });

      await fetchCustomInsights();
      return true;
    } catch (error) {
      console.error('Erro ao mostrar insight da IA:', error);
      toast({
        title: 'Erro ao restaurar',
        description: 'Não foi possível restaurar o card',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Verificar se um card da IA está oculto
  const isAIInsightHidden = (insight: AnalysisInsight): boolean => {
    const hash = generateInsightHash(insight);
    return hiddenAIInsights.has(hash);
  };

  return {
    customInsights,
    loading,
    fetchCustomInsights,
    saveInsight,
    updateInsight,
    deleteInsight,
    reorderInsights,
    hideAIInsight,
    showAIInsight,
    isAIInsightHidden
  };
}
