import { supabase } from '@/integrations/supabase/client';

export interface FoodSuggestion {
  food_name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  match_score: number; // Score de compatibilidade (0-100)
  reason: string; // Razão da sugestão
}

export interface MealContext {
  mealType: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  existingFoods?: string[]; // Alimentos já na refeição
  restrictions?: string[]; // Restrições alimentares
}

export const foodSuggestionsService = {
  /**
   * Sugere alimentos baseado no contexto da refeição
   */
  async suggestFoods(
    context: MealContext,
    limit: number = 10
  ): Promise<FoodSuggestion[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar alimentos do banco TACO
    let query = supabase
      .from('food_database')
      .select('*')
      .eq('is_active', true);

    // Buscar favoritos do usuário (com tratamento de erro)
    let favorites: any[] = [];
    try {
      const { data, error } = await supabase
        .from('user_favorite_foods')
        .select('food_name, usage_count')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        favorites = data;
      }
    } catch (error) {
      // Tabela pode não existir ou não ter permissões - ignorar erro
      console.warn('Erro ao buscar favoritos:', error);
    }

    const favoriteNames = new Set(favorites?.map(f => f.food_name.toLowerCase()) || []);

    // Buscar estatísticas de uso (com tratamento de erro)
    let stats: any[] = [];
    try {
      const { data, error } = await supabase
        .from('food_usage_stats')
        .select('food_name, usage_count')
        .eq('user_id', user.id)
        .eq('meal_type', context.mealType)
        .order('usage_count', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        stats = data;
      }
    } catch (error) {
      // Tabela pode não existir ou não ter permissões - ignorar erro
      console.warn('Erro ao buscar estatísticas de uso:', error);
    }

    const statsMap = new Map(
      stats?.map(s => [s.food_name.toLowerCase(), s.usage_count]) || []
    );

    const { data: foods, error } = await query;
    if (error) throw error;

    if (!foods || foods.length === 0) return [];

    // Filtrar alimentos já existentes
    const existingFoodsLower = (context.existingFoods || []).map(f => f.toLowerCase());
    const availableFoods = foods.filter(
      f => !existingFoodsLower.includes(f.name.toLowerCase())
    );

    // Calcular score para cada alimento
    const suggestions: FoodSuggestion[] = availableFoods.map(food => {
      let score = 50; // Score base

      // Bonus por ser favorito
      if (favoriteNames.has(food.name.toLowerCase())) {
        score += 20;
      }

      // Bonus por uso frequente neste tipo de refeição
      const usageCount = statsMap.get(food.name.toLowerCase()) || 0;
      score += Math.min(usageCount * 2, 15);

      // Bonus por compatibilidade com macros
      if (context.targetProtein && food.protein_per_100g > 10) {
        score += 5;
      }
      if (context.targetCarbs && food.carbs_per_100g > 20) {
        score += 5;
      }

      // Bonus por tipo de refeição
      score += this.getMealTypeBonus(food, context.mealType);

      // Penalidade por restrições
      if (context.restrictions) {
        const hasRestriction = context.restrictions.some(r =>
          food.name.toLowerCase().includes(r.toLowerCase()) ||
          food.category.toLowerCase().includes(r.toLowerCase())
        );
        if (hasRestriction) {
          score -= 30;
        }
      }

      return {
        food_name: food.name,
        category: food.category,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fats_per_100g: food.fats_per_100g,
        match_score: Math.max(0, Math.min(100, score)),
        reason: this.getSuggestionReason(food, context, favoriteNames.has(food.name.toLowerCase()), usageCount),
      };
    });

    // Ordenar por score e retornar top N
    return suggestions
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);
  },

  /**
   * Calcula bonus baseado no tipo de refeição
   */
  getMealTypeBonus(food: any, mealType: string): number {
    const breakfastFoods = ['aveia', 'ovo', 'pão', 'leite', 'iogurte', 'fruta', 'cereal'];
    const lunchFoods = ['arroz', 'feijão', 'frango', 'carne', 'peixe', 'salada', 'legume'];
    const snackFoods = ['fruta', 'castanha', 'iogurte', 'queijo', 'biscoito'];
    const workoutFoods = ['banana', 'batata', 'pão', 'whey', 'dextrose'];

    const foodNameLower = food.name.toLowerCase();

    switch (mealType) {
      case 'breakfast':
        return breakfastFoods.some(f => foodNameLower.includes(f)) ? 10 : 0;
      case 'lunch':
      case 'dinner':
        return lunchFoods.some(f => foodNameLower.includes(f)) ? 10 : 0;
      case 'snack_1':
      case 'snack_2':
        return snackFoods.some(f => foodNameLower.includes(f)) ? 10 : 0;
      case 'pre_workout':
      case 'post_workout':
        return workoutFoods.some(f => foodNameLower.includes(f)) ? 10 : 0;
      default:
        return 0;
    }
  },

  /**
   * Gera razão da sugestão
   */
  getSuggestionReason(
    food: any,
    context: MealContext,
    isFavorite: boolean,
    usageCount: number
  ): string {
    const reasons: string[] = [];

    if (isFavorite) {
      reasons.push('Seu alimento favorito');
    }
    if (usageCount > 5) {
      reasons.push(`Muito usado em ${this.getMealTypeName(context.mealType)}`);
    }
    if (food.protein_per_100g > 15) {
      reasons.push('Alto teor de proteína');
    }
    if (food.carbs_per_100g > 30) {
      reasons.push('Boa fonte de carboidratos');
    }
    if (reasons.length === 0) {
      reasons.push('Alimento nutritivo');
    }

    return reasons.join(' • ');
  },

  /**
   * Obtém nome do tipo de refeição
   */
  getMealTypeName(mealType: string): string {
    const names: Record<string, string> = {
      breakfast: 'Café da Manhã',
      snack_1: 'Lanche da Manhã',
      lunch: 'Almoço',
      snack_2: 'Lanche da Tarde',
      dinner: 'Jantar',
      pre_workout: 'Pré-Treino',
      post_workout: 'Pós-Treino',
    };
    return names[mealType] || mealType;
  },

  /**
   * Registra uso de alimento para melhorar sugestões futuras
   */
  async recordFoodUsage(
    foodName: string,
    mealType: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Atualizar ou criar estatística
      const { data: existing, error: selectError } = await supabase
        .from('food_usage_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('food_name', foodName)
        .eq('meal_type', mealType)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 = nenhum resultado encontrado, o que é OK
        throw selectError;
      }

      if (existing) {
        await supabase
          .from('food_usage_stats')
          .update({
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('food_usage_stats')
          .insert({
            user_id: user.id,
            food_name: foodName,
            meal_type: mealType,
            usage_count: 1,
            last_used_at: new Date().toISOString(),
          });
      }
    } catch (error: any) {
      // Tabela pode não existir ou não ter permissões - ignorar erro silenciosamente
      if (error?.code !== 'PGRST116' && error?.code !== '42P01') {
        console.warn('Erro ao registrar uso de alimento:', error);
      }
    }
  },
};


