import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DietPlan = Database['public']['Tables']['diet_plans']['Row'];
type DietPlanInsert = Database['public']['Tables']['diet_plans']['Insert'];
type DietPlanUpdate = Database['public']['Tables']['diet_plans']['Update'];

export const dietService = {
  // Buscar planos de um paciente
  async getByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('diet_plans')
      .select(`
        *,
        diet_meals (
          *,
          diet_foods (*)
        ),
        diet_guidelines (*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Buscar plano por ID
  async getById(planId: string) {
    // Primeiro, buscar o plano básico
    const { data: planData, error: planError } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('Erro ao buscar plano por ID:', planError);
      throw planError;
    }

    // Depois, buscar as refeições
    const { data: mealsData, error: mealsError } = await supabase
      .from('diet_meals')
      .select('*')
      .eq('diet_plan_id', planId)
      .order('meal_order', { ascending: true });

    if (mealsError) {
      console.error('Erro ao buscar refeições:', mealsError);
      // Não lançar erro, apenas logar - pode não ter refeições ainda
    }

    // Buscar alimentos para cada refeição
    let mealsWithFoods: any[] = [];
    if (mealsData && mealsData.length > 0) {
      const mealIds = mealsData.map((meal: any) => meal.id);
      
      const { data: foodsData, error: foodsError } = await supabase
        .from('diet_foods')
        .select('*')
        .in('meal_id', mealIds)
        .order('food_order', { ascending: true });

      if (foodsError) {
        console.error('Erro ao buscar alimentos:', foodsError);
      }

      // Combinar refeições com seus alimentos
      mealsWithFoods = mealsData.map((meal: any) => ({
        ...meal,
        diet_foods: (foodsData || []).filter((food: any) => food.meal_id === meal.id)
      }));
    } else {
      mealsWithFoods = [];
    }

    // Buscar orientações
    const { data: guidelinesData, error: guidelinesError } = await supabase
      .from('diet_guidelines')
      .select('*')
      .eq('diet_plan_id', planId)
      .order('priority', { ascending: true });

    if (guidelinesError) {
      console.error('Erro ao buscar orientações:', guidelinesError);
      // Não lançar erro, apenas logar
    }

    // Combinar os dados
    const combinedData = {
      ...planData,
      diet_meals: mealsWithFoods,
      diet_guidelines: guidelinesData || []
    };
    
    // Log para debug
    console.log('📦 Plano retornado do banco (método combinado):', {
      planId: combinedData?.id,
      planName: combinedData?.name,
      hasDietMeals: !!combinedData?.diet_meals,
      dietMealsCount: combinedData?.diet_meals?.length || 0,
      dietMeals: combinedData?.diet_meals?.map((meal: any) => ({
        id: meal.id,
        meal_name: meal.meal_name,
        hasFoods: !!meal.diet_foods,
        foodsCount: meal.diet_foods?.length || 0,
        foods: meal.diet_foods?.map((food: any) => ({
          id: food.id,
          food_name: food.food_name,
          quantity: food.quantity,
          unit: food.unit
        })) || []
      })) || []
    });
    
    return combinedData;
  },

  // Criar novo plano
  async create(planData: DietPlanInsert) {
    const { data, error } = await supabase
      .from('diet_plans')
      .insert(planData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar plano
  async update(planId: string, updates: DietPlanUpdate) {
    const { data, error } = await supabase
      .from('diet_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Liberar plano para paciente
  async release(planId: string) {
    const { data, error } = await supabase
      .from('diet_plans')
      .update({ 
        status: 'active',
        is_released: true,
        active: true,
        released_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar banco de alimentos
  async getFoodDatabase() {
    console.log('🔍 [diet-service] getFoodDatabase() chamado');
    const { data, error } = await supabase
      .from('food_database')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [diet-service] Erro ao buscar alimentos:', error);
      throw error;
    }
    
    console.log('✅ [diet-service] Alimentos retornados:', {
      count: data?.length || 0,
      firstFoods: data?.slice(0, 3).map(f => f.name) || []
    });
    
    return data;
  },

  // Criar refeição
  async createMeal(mealData: Database['public']['Tables']['diet_meals']['Insert']) {
    const { data, error } = await supabase
      .from('diet_meals')
      .insert(mealData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Criar alimento
  async createFood(foodData: Database['public']['Tables']['diet_foods']['Insert']) {
    const { data, error } = await supabase
      .from('diet_foods')
      .insert(foodData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Criar orientação
  async createGuideline(guidelineData: Database['public']['Tables']['diet_guidelines']['Insert']) {
    const { data, error } = await supabase
      .from('diet_guidelines')
      .insert(guidelineData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar plano (deleta em cascata refeições, alimentos e orientações)
  async delete(planId: string) {
    const { error } = await supabase
      .from('diet_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
    return true;
  }
};

