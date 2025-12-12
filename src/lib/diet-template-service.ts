import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DietPlanTemplate = Database['public']['Tables']['diet_plan_templates']['Row'];
type DietPlanTemplateInsert = Database['public']['Tables']['diet_plan_templates']['Insert'];
type DietPlanTemplateUpdate = Database['public']['Tables']['diet_plan_templates']['Update'];

export interface TemplateWithMeals extends DietPlanTemplate {
  template_meals: Array<{
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
    template_foods: Array<{
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

export const dietTemplateService = {
  // Buscar todos os templates do usuário
  async getAll(userId?: string): Promise<TemplateWithMeals[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id;

    if (!currentUserId) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('diet_plan_templates')
      .select(`
        *,
        template_meals (
          *,
          template_foods (*)
        )
      `)
      .eq('user_id', currentUserId)
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as TemplateWithMeals[];
  },

  // Buscar templates públicos
  async getPublic(category?: string): Promise<TemplateWithMeals[]> {
    let query = supabase
      .from('diet_plan_templates')
      .select(`
        *,
        template_meals (
          *,
          template_foods (*)
        )
      `)
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TemplateWithMeals[];
  },

  // Buscar template por ID
  async getById(templateId: string): Promise<TemplateWithMeals | null> {
    const { data, error } = await supabase
      .from('diet_plan_templates')
      .select(`
        *,
        template_meals (
          *,
          template_foods (*)
        )
      `)
      .eq('id', templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TemplateWithMeals;
  },

  // Criar template a partir de um plano existente
  async createFromPlan(
    planId: string,
    templateData: {
      name: string;
      category: string;
      description?: string;
      is_public?: boolean;
    }
  ): Promise<TemplateWithMeals> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

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

    // Criar template
    const { data: template, error: templateError } = await supabase
      .from('diet_plan_templates')
      .insert({
        user_id: user.id,
        name: templateData.name,
        category: templateData.category,
        description: templateData.description || null,
        total_calories: plan.total_calories,
        total_protein: plan.total_protein,
        total_carbs: plan.total_carbs,
        total_fats: plan.total_fats,
        is_public: templateData.is_public || false,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Copiar refeições e alimentos
    const meals = (plan as any).diet_meals || [];
    for (const meal of meals) {
      const { data: templateMeal, error: mealError } = await supabase
        .from('diet_template_meals')
        .insert({
          template_id: template.id,
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
          template_meal_id: templateMeal.id,
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
          .from('diet_template_foods')
          .insert(foodsToInsert);

        if (foodsError) throw foodsError;
      }
    }

    // Buscar template completo
    return await this.getById(template.id) as TemplateWithMeals;
  },

  // Criar plano a partir de template
  async createPlanFromTemplate(
    templateId: string,
    patientId: string,
    planName?: string
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar template completo
    const template = await this.getById(templateId);
    if (!template) throw new Error('Template não encontrado');

    // Incrementar contador de uso
    await supabase
      .from('diet_plan_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    // Criar plano
    const { data: plan, error: planError } = await supabase
      .from('diet_plans')
      .insert({
        patient_id: patientId,
        user_id: user.id,
        name: planName || template.name,
        status: 'draft',
        total_calories: template.total_calories,
        total_protein: template.total_protein,
        total_carbs: template.total_carbs,
        total_fats: template.total_fats,
        notes: template.description || null,
        template_id: templateId,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Copiar refeições e alimentos
    const meals = template.template_meals || [];
    for (const meal of meals) {
      const { data: createdMeal, error: mealError } = await supabase
        .from('diet_meals')
        .insert({
          diet_plan_id: plan.id,
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
      const foods = meal.template_foods || [];
      if (foods.length > 0) {
        const foodsToInsert = foods.map((food) => ({
          meal_id: createdMeal.id,
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

    return plan.id;
  },

  // Atualizar template
  async update(
    templateId: string,
    updates: DietPlanTemplateUpdate
  ): Promise<TemplateWithMeals> {
    const { error } = await supabase
      .from('diet_plan_templates')
      .update(updates)
      .eq('id', templateId);

    if (error) throw error;
    return await this.getById(templateId) as TemplateWithMeals;
  },

  // Deletar template
  async delete(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('diet_plan_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  // Favoritar/desfavoritar template
  async toggleFavorite(templateId: string): Promise<boolean> {
    const template = await this.getById(templateId);
    if (!template) throw new Error('Template não encontrado');

    const newFavoriteStatus = !template.is_favorite;
    await this.update(templateId, { is_favorite: newFavoriteStatus });
    return newFavoriteStatus;
  },

  // Buscar por categoria
  async getByCategory(category: string, userId?: string): Promise<TemplateWithMeals[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id;

    if (!currentUserId) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('diet_plan_templates')
      .select(`
        *,
        template_meals (
          *,
          template_foods (*)
        )
      `)
      .eq('user_id', currentUserId)
      .eq('category', category)
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as TemplateWithMeals[];
  },
};










