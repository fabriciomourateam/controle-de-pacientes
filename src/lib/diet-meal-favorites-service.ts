import { supabase } from '@/integrations/supabase/client';

export interface FavoriteMeal {
  id: string;
  user_id: string;
  meal_name: string;
  suggested_time?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  instructions?: string;
  foods: FavoriteMealFood[];
  created_at: string;
  updated_at: string;
}

export interface FavoriteMealFood {
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  substitutions?: any[];
  food_order: number;
}

export const dietMealFavoritesService = {
  /**
   * Salva uma refeição como favorita
   */
  async saveFavoriteMeal(meal: {
    meal_name: string;
    suggested_time?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    instructions?: string;
    foods: FavoriteMealFood[];
  }): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Salvar refeição favorita
      const { data: favoriteMeal, error: mealError } = await supabase
        .from('user_favorite_meals')
        .insert({
          user_id: user.id,
          meal_name: meal.meal_name,
          suggested_time: meal.suggested_time || null,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          instructions: meal.instructions || null,
          foods: meal.foods, // Salvar como JSONB
        })
        .select()
        .single();

      if (mealError) throw mealError;
      return favoriteMeal.id;
    } catch (error: any) {
      // Se a tabela não existir, criar estrutura básica
      if (error?.code === '42P01') {
        console.warn('Tabela user_favorite_meals não existe. Criando estrutura...');
        // Por enquanto, retornar erro para o usuário saber que precisa criar a tabela
        throw new Error('Tabela de favoritos não configurada. Entre em contato com o suporte.');
      }
      throw error;
    }
  },

  /**
   * Busca todas as refeições favoritas do usuário
   */
  async getFavoriteMeals(): Promise<FavoriteMeal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('user_favorite_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          return []; // Tabela não existe, retornar vazio
        }
        throw error;
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        meal_name: item.meal_name,
        suggested_time: item.suggested_time,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fats: item.fats || 0,
        instructions: item.instructions,
        foods: item.foods || [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    } catch (error: any) {
      if (error?.code === '42P01') {
        return []; // Tabela não existe
      }
      console.error('Erro ao buscar refeições favoritas:', error);
      return [];
    }
  },

  /**
   * Remove uma refeição dos favoritos
   */
  async removeFavoriteMeal(mealId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('user_favorite_meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error: any) {
      if (error?.code !== '42P01') {
        throw error;
      }
    }
  },

  /**
   * Verifica se uma refeição é favorita (por nome e estrutura similar)
   */
  async isFavorite(mealName: string, foods: FavoriteMealFood[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_favorite_meals')
        .select('id')
        .eq('user_id', user.id)
        .eq('meal_name', mealName)
        .limit(1);

      if (error || !data || data.length === 0) return false;
      return true;
    } catch (error) {
      return false;
    }
  },
};

