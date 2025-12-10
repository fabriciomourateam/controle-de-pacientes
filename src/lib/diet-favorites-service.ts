import { supabase } from '@/integrations/supabase/client';

export const dietFavoritesService = {
  /**
   * Adiciona alimento aos favoritos
   */
  async addFavorite(foodName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Verificar se já existe
      const { data: existing, error: selectError } = await supabase
        .from('user_favorite_foods')
        .select('*')
        .eq('user_id', user.id)
        .eq('food_name', foodName)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 = nenhum resultado encontrado, o que é OK
        throw selectError;
      }

      if (existing) {
        // Atualizar contador
        await supabase
          .from('user_favorite_foods')
          .update({
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Criar novo favorito
        await supabase
          .from('user_favorite_foods')
          .insert({
            user_id: user.id,
            food_name: foodName,
            usage_count: 1,
            last_used_at: new Date().toISOString(),
          });
      }
    } catch (error: any) {
      // Tabela pode não existir ou não ter permissões - ignorar erro silenciosamente
      if (error?.code !== 'PGRST116' && error?.code !== '42P01') {
        console.warn('Erro ao adicionar favorito:', error);
      }
    }
  },

  /**
   * Remove alimento dos favoritos
   */
  async removeFavorite(foodName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      await supabase
        .from('user_favorite_foods')
        .delete()
        .eq('user_id', user.id)
        .eq('food_name', foodName);
    } catch (error) {
      // Tabela pode não existir ou não ter permissões - ignorar erro
      console.warn('Erro ao remover favorito:', error);
    }
  },

  /**
   * Verifica se alimento é favorito
   */
  async isFavorite(foodName: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_favorite_foods')
        .select('id')
        .eq('user_id', user.id)
        .eq('food_name', foodName)
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      // Tabela pode não existir ou não ter permissões - retornar false
      console.warn('Erro ao verificar favorito:', error);
      return false;
    }
  },

  /**
   * Busca todos os favoritos do usuário
   */
  async getAll(): Promise<Array<{ food_name: string; usage_count: number; last_used_at: string | null }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('user_favorite_foods')
        .select('food_name, usage_count, last_used_at')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .order('last_used_at', { ascending: false });

      if (error) return [];
      return data || [];
    } catch (error) {
      // Tabela pode não existir ou não ter permissões - retornar array vazio
      console.warn('Erro ao buscar favoritos:', error);
      return [];
    }
  },

  /**
   * Incrementa contador de uso
   */
  async incrementUsage(foodName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: existing, error: selectError } = await supabase
        .from('user_favorite_foods')
        .select('*')
        .eq('user_id', user.id)
        .eq('food_name', foodName)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 = nenhum resultado encontrado, o que é OK
        throw selectError;
      }

      if (existing) {
        await supabase
          .from('user_favorite_foods')
          .update({
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      }
    } catch (error: any) {
      // Tabela pode não existir ou não ter permissões - ignorar erro silenciosamente
      if (error?.code !== 'PGRST116' && error?.code !== '42P01') {
        console.warn('Erro ao incrementar uso:', error);
      }
    }
  },
};


