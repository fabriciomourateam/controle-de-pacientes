import { supabase } from '@/integrations/supabase/client';

export interface PlanVersion {
  id: string;
  plan_id: string;
  version_number: number;
  name: string;
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fats: number | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  meals: Array<{
    id: string;
    meal_type: string;
    meal_name: string;
    meal_order: number;
    suggested_time: string | null;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fats: number | null;
    instructions: string | null;
    foods: Array<{
      id: string;
      food_name: string;
      quantity: number;
      unit: string;
      calories: number | null;
      protein: number | null;
      carbs: number | null;
      fats: number | null;
      notes: string | null;
      food_order: number;
    }>;
  }>;
}

export const dietVersionHistoryService = {
  /**
   * Cria versão do plano atual
   */
  async createVersion(planId: string, versionName?: string): Promise<PlanVersion> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar versão atual do plano
    const { data: latestVersion } = await supabase
      .from('diet_plan_versions')
      .select('version_number')
      .eq('plan_id', planId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

    // Buscar plano completo
    const { data: plan, error: planError } = await supabase
      .from('diet_plans')
      .select(`
        *,
        diet_meals (
          *,
          diet_foods (*)
        )
      `)
      .eq('id', planId)
      .single();

    if (planError || !plan) throw new Error('Plano não encontrado');

    // Criar versão
    const { data: version, error: versionError } = await supabase
      .from('diet_plan_versions')
      .insert({
        plan_id: planId,
        version_number: nextVersionNumber,
        name: versionName || `Versão ${nextVersionNumber}`,
        total_calories: plan.total_calories,
        total_protein: plan.total_protein,
        total_carbs: plan.total_carbs,
        total_fats: plan.total_fats,
        notes: plan.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (versionError) throw versionError;

    // Copiar refeições e alimentos
    const meals = (plan as any).diet_meals || [];
    for (const meal of meals) {
      const { data: versionMeal, error: mealError } = await supabase
        .from('diet_plan_version_meals')
        .insert({
          version_id: version.id,
          meal_type: meal.meal_type,
          meal_name: meal.meal_name,
          meal_order: meal.meal_order,
          suggested_time: meal.suggested_time || null,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          instructions: meal.instructions || null,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Copiar alimentos
      const foods = meal.diet_foods || [];
      if (foods.length > 0) {
        const foodsToInsert = foods.map((food: any) => ({
          version_meal_id: versionMeal.id,
          food_name: food.food_name,
          quantity: food.quantity,
          unit: food.unit,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
          notes: food.notes || null,
          food_order: food.food_order,
        }));

        const { error: foodsError } = await supabase
          .from('diet_plan_version_foods')
          .insert(foodsToInsert);

        if (foodsError) throw foodsError;
      }
    }

    return await this.getVersionById(version.id) as PlanVersion;
  },

  /**
   * Busca todas as versões de um plano
   */
  async getVersions(planId: string): Promise<PlanVersion[]> {
    const { data, error } = await supabase
      .from('diet_plan_versions')
      .select(`
        *,
        meals:diet_plan_version_meals (
          *,
          foods:diet_plan_version_foods (*)
        )
      `)
      .eq('plan_id', planId)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return (data || []).map(version => ({
      id: version.id,
      plan_id: version.plan_id,
      version_number: version.version_number,
      name: version.name,
      total_calories: version.total_calories,
      total_protein: version.total_protein,
      total_carbs: version.total_carbs,
      total_fats: version.total_fats,
      notes: version.notes,
      created_at: version.created_at,
      created_by: version.created_by,
      meals: ((version as any).meals || []).map((meal: any) => ({
        id: meal.id,
        meal_type: meal.meal_type,
        meal_name: meal.meal_name,
        meal_order: meal.meal_order,
        suggested_time: meal.suggested_time,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        instructions: meal.instructions,
        foods: ((meal.foods || []) as any[]).sort((a, b) => a.food_order - b.food_order),
      })).sort((a: any, b: any) => a.meal_order - b.meal_order),
    }));
  },

  /**
   * Busca versão por ID
   */
  async getVersionById(versionId: string): Promise<PlanVersion | null> {
    const { data, error } = await supabase
      .from('diet_plan_versions')
      .select(`
        *,
        meals:diet_plan_version_meals (
          *,
          foods:diet_plan_version_foods (*)
        )
      `)
      .eq('id', versionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      plan_id: data.plan_id,
      version_number: data.version_number,
      name: data.name,
      total_calories: data.total_calories,
      total_protein: data.total_protein,
      total_carbs: data.total_carbs,
      total_fats: data.total_fats,
      notes: data.notes,
      created_at: data.created_at,
      created_by: data.created_by,
      meals: ((data as any).meals || []).map((meal: any) => ({
        id: meal.id,
        meal_type: meal.meal_type,
        meal_name: meal.meal_name,
        meal_order: meal.meal_order,
        suggested_time: meal.suggested_time,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        instructions: meal.instructions,
        foods: ((meal.foods || []) as any[]).sort((a, b) => a.food_order - b.food_order),
      })).sort((a: any, b: any) => a.meal_order - b.meal_order),
    };
  },

  /**
   * Restaura plano para uma versão anterior
   */
  async restoreVersion(versionId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar versão
    const version = await this.getVersionById(versionId);
    if (!version) throw new Error('Versão não encontrada');

    // Criar nova versão do estado atual antes de restaurar
    await this.createVersion(version.plan_id, 'Backup antes de restaurar');

    // Deletar refeições atuais
    const { data: currentMeals } = await supabase
      .from('diet_meals')
      .select('id')
      .eq('diet_plan_id', version.plan_id);

    if (currentMeals && currentMeals.length > 0) {
      for (const meal of currentMeals) {
        await supabase.from('diet_meals').delete().eq('id', meal.id);
      }
    }

    // Atualizar plano com dados da versão
    await supabase
      .from('diet_plans')
      .update({
        total_calories: version.total_calories,
        total_protein: version.total_protein,
        total_carbs: version.total_carbs,
        total_fats: version.total_fats,
        notes: version.notes,
      })
      .eq('id', version.plan_id);

    // Restaurar refeições e alimentos
    for (const meal of version.meals) {
      const { data: restoredMeal, error: mealError } = await supabase
        .from('diet_meals')
        .insert({
          diet_plan_id: version.plan_id,
          meal_type: meal.meal_type,
          meal_name: meal.meal_name,
          meal_order: meal.meal_order,
          suggested_time: meal.suggested_time || null,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          instructions: meal.instructions || null,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Restaurar alimentos
      if (meal.foods.length > 0) {
        const foodsToInsert = meal.foods.map(food => ({
          meal_id: restoredMeal.id,
          food_name: food.food_name,
          quantity: food.quantity,
          unit: food.unit,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
          notes: food.notes || null,
          food_order: food.food_order,
        }));

        const { error: foodsError } = await supabase
          .from('diet_foods')
          .insert(foodsToInsert);

        if (foodsError) throw foodsError;
      }
    }

    return version.plan_id;
  },

  /**
   * Deleta versão
   */
  async deleteVersion(versionId: string): Promise<void> {
    const { error } = await supabase
      .from('diet_plan_versions')
      .delete()
      .eq('id', versionId);

    if (error) throw error;
  },
};








