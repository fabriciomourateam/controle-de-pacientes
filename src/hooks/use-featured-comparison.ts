import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeaturedComparison {
  id: string;
  telefone: string;
  before_photo_url: string;
  before_photo_date: string;
  before_weight?: number;
  before_zoom?: number;
  before_position_x?: number;
  before_position_y?: number;
  after_photo_url: string;
  after_photo_date: string;
  after_weight?: number;
  after_zoom?: number;
  after_position_x?: number;
  after_position_y?: number;
  is_visible: boolean;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFeaturedComparisonData {
  telefone: string;
  before_photo_url: string;
  before_photo_date: string;
  before_weight?: number;
  before_zoom?: number;
  before_position_x?: number;
  before_position_y?: number;
  after_photo_url: string;
  after_photo_date: string;
  after_weight?: number;
  after_zoom?: number;
  after_position_x?: number;
  after_position_y?: number;
  title?: string;
  description?: string;
  is_visible?: boolean;
}

export function useFeaturedComparison(telefone?: string) {
  const { toast } = useToast();
  const [comparison, setComparison] = useState<FeaturedComparison | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar comparação destacada
  async function fetchComparison() {
    if (!telefone) {
      console.log('🎯 FeaturedComparison: Telefone não fornecido');
      return;
    }

    try {
      setLoading(true);
      console.log('🎯 FeaturedComparison: Buscando comparação para telefone:', telefone);
      
      const { data, error } = await supabase
        .from('featured_photo_comparison')
        .select('*')
        .eq('telefone', telefone)
        .maybeSingle();

      if (error) {
        console.error('🎯 FeaturedComparison: Erro ao buscar:', error);
        throw error;
      }
      
      console.log('🎯 FeaturedComparison: Dados recebidos:', data);
      console.log('🎯 FeaturedComparison: is_visible?', data?.is_visible);
      setComparison(data);
    } catch (error: any) {
      console.error('🎯 FeaturedComparison: Erro ao buscar comparação destacada:', error);
    } finally {
      setLoading(false);
    }
  }

  // Criar ou atualizar comparação
  async function saveComparison(data: CreateFeaturedComparisonData) {
    try {
      setLoading(true);

      const comparisonData = {
        telefone: data.telefone,
        before_photo_url: data.before_photo_url,
        before_photo_date: data.before_photo_date,
        before_weight: data.before_weight,
        before_zoom: data.before_zoom || 1.0,
        before_position_x: data.before_position_x || 0,
        before_position_y: data.before_position_y || 0,
        after_photo_url: data.after_photo_url,
        after_photo_date: data.after_photo_date,
        after_weight: data.after_weight,
        after_zoom: data.after_zoom || 1.0,
        after_position_x: data.after_position_x || 0,
        after_position_y: data.after_position_y || 0,
        title: data.title || 'Minha Transformação',
        description: data.description,
        is_visible: data.is_visible !== undefined ? data.is_visible : true,
      };

      const { data: result, error } = await supabase
        .from('featured_photo_comparison')
        .upsert(comparisonData, {
          onConflict: 'telefone',
        })
        .select()
        .single();

      if (error) throw error;

      setComparison(result);
      toast({
        title: 'Comparação salva!',
        description: 'Sua comparação Antes/Depois foi configurada com sucesso',
      });

      return result;
    } catch (error: any) {
      console.error('Erro ao salvar comparação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a comparação',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Alternar visibilidade
  async function toggleVisibility() {
    if (!comparison) return;

    try {
      const { data, error } = await supabase
        .from('featured_photo_comparison')
        .update({ is_visible: !comparison.is_visible })
        .eq('id', comparison.id)
        .select()
        .single();

      if (error) throw error;

      setComparison(data);
      toast({
        title: data.is_visible ? 'Comparação visível' : 'Comparação oculta',
        description: data.is_visible 
          ? 'A comparação será exibida no portal público'
          : 'A comparação foi ocultada do portal público',
      });
    } catch (error: any) {
      console.error('Erro ao alternar visibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a visibilidade',
        variant: 'destructive',
      });
    }
  }

  // Deletar comparação
  async function deleteComparison() {
    if (!comparison) return;

    try {
      const { error } = await supabase
        .from('featured_photo_comparison')
        .delete()
        .eq('id', comparison.id);

      if (error) throw error;

      setComparison(null);
      toast({
        title: 'Comparação removida',
        description: 'A comparação Antes/Depois foi removida',
      });
    } catch (error: any) {
      console.error('Erro ao deletar comparação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a comparação',
        variant: 'destructive',
      });
    }
  }

  // Atualizar comparação existente (apenas campos editáveis)
  async function updateComparison(updates: Partial<FeaturedComparison>) {
    if (!comparison) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('featured_photo_comparison')
        .update(updates)
        .eq('id', comparison.id)
        .select()
        .single();

      if (error) throw error;

      setComparison(data);
      toast({
        title: 'Comparação atualizada!',
        description: 'As alterações foram salvas com sucesso',
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar comparação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a comparação',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComparison();
  }, [telefone]);

  return {
    comparison,
    loading,
    saveComparison,
    updateComparison,
    toggleVisibility,
    deleteComparison,
    refetch: fetchComparison,
  };
}
