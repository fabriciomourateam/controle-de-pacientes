import { supabase } from '@/integrations/supabase/client';

export interface FoodSubstitution {
  food_name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  similarity_score: number; // Quão similar são os macros (0-100)
  quantity_adjustment: number; // Fator de ajuste de quantidade para manter macros similares
}

export interface FoodMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const foodSubstitutionService = {
  /**
   * Encontra substituições para um alimento mantendo macros similares
   */
  async findSubstitutions(
    originalFood: {
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    },
    limit: number = 10
  ): Promise<FoodSubstitution[]> {
    const originalMacros: FoodMacros = {
      calories: originalFood.calories,
      protein: originalFood.protein,
      carbs: originalFood.carbs,
      fats: originalFood.fats,
    };

    // Buscar alimentos do banco
    const { data: foods, error } = await supabase
      .from('food_database')
      .select('*')
      .eq('is_active', true)
      .neq('name', originalFood.name); // Excluir o próprio alimento

    if (error) throw error;
    if (!foods || foods.length === 0) return [];

    // Calcular similaridade para cada alimento
    const substitutions: FoodSubstitution[] = foods.map(food => {
      // Calcular macros por 100g do alimento original
      const originalQuantityInGrams = this.convertToGrams(originalFood.quantity, originalFood.unit);
      const originalMacrosPer100g = {
        calories: (originalMacros.calories / originalQuantityInGrams) * 100,
        protein: (originalMacros.protein / originalQuantityInGrams) * 100,
        carbs: (originalMacros.carbs / originalQuantityInGrams) * 100,
        fats: (originalMacros.fats / originalQuantityInGrams) * 100,
      };

      // Calcular similaridade
      const similarity = this.calculateSimilarity(
        originalMacrosPer100g,
        {
          calories: food.calories_per_100g,
          protein: food.protein_per_100g,
          carbs: food.carbs_per_100g,
          fats: food.fats_per_100g,
        }
      );

      // Calcular ajuste de quantidade necessário
      const quantityAdjustment = this.calculateQuantityAdjustment(
        originalMacrosPer100g,
        {
          calories: food.calories_per_100g,
          protein: food.protein_per_100g,
          carbs: food.carbs_per_100g,
          fats: food.fats_per_100g,
        },
        originalQuantityInGrams
      );

      return {
        food_name: food.name,
        category: food.category,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fats_per_100g: food.fats_per_100g,
        similarity_score: similarity,
        quantity_adjustment: quantityAdjustment,
      };
    });

    // Ordenar por similaridade e retornar top N
    return substitutions
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
  },

  /**
   * Calcula similaridade entre dois alimentos baseado em macros
   */
  calculateSimilarity(
    food1: FoodMacros,
    food2: FoodMacros
  ): number {
    // Calcular diferenças percentuais
    const calorieDiff = Math.abs(food1.calories - food2.calories) / Math.max(food1.calories, food2.calories, 1);
    const proteinDiff = Math.abs(food1.protein - food2.protein) / Math.max(food1.protein, food2.protein, 1);
    const carbsDiff = Math.abs(food1.carbs - food2.carbs) / Math.max(food1.carbs, food2.carbs, 1);
    const fatsDiff = Math.abs(food1.fats - food2.fats) / Math.max(food1.fats, food2.fats, 1);

    // Média ponderada (calorias têm mais peso)
    const avgDiff = (
      calorieDiff * 0.4 +
      proteinDiff * 0.25 +
      carbsDiff * 0.2 +
      fatsDiff * 0.15
    );

    // Converter para score de 0-100 (quanto menor a diferença, maior o score)
    return Math.max(0, Math.min(100, (1 - avgDiff) * 100));
  },

  /**
   * Calcula ajuste de quantidade necessário para manter macros similares
   */
  calculateQuantityAdjustment(
    originalMacrosPer100g: FoodMacros,
    substituteMacrosPer100g: FoodMacros,
    originalQuantityInGrams: number
  ): number {
    // Usar calorias como base para cálculo
    if (substituteMacrosPer100g.calories === 0) return originalQuantityInGrams;

    const ratio = originalMacrosPer100g.calories / substituteMacrosPer100g.calories;
    return originalQuantityInGrams * ratio;
  },

  /**
   * Converte quantidade para gramas
   */
  convertToGrams(quantity: number, unit: string): number {
    const unitLower = unit.toLowerCase().trim();
    
    if (unitLower === 'g' || unitLower === 'grama' || unitLower === 'gramas') {
      return quantity;
    }
    if (unitLower === 'kg' || unitLower === 'kilograma' || unitLower === 'kilogramas') {
      return quantity * 1000;
    }
    if (unitLower === 'unidade' || unitLower === 'unidades' || unitLower === 'un' || unitLower === 'und') {
      return quantity * 100; // Assumir 100g por unidade
    }
    if (unitLower.includes('colher')) {
      if (unitLower.includes('sopa')) {
        return quantity * 15;
      } else if (unitLower.includes('chá')) {
        return quantity * 5;
      }
    }
    if (unitLower.includes('xícara') || unitLower.includes('xicara')) {
      return quantity * 240;
    }
    if (unitLower === 'ml' || unitLower === 'mililitro' || unitLower === 'mililitros') {
      return quantity; // Assumir 1ml = 1g para líquidos
    }

    // Padrão: assumir gramas
    return quantity;
  },

  /**
   * Substitui alimento em uma refeição mantendo macros totais
   */
  async substituteFood(
    mealId: string,
    oldFoodId: string,
    newFoodName: string,
    newQuantity: number,
    newUnit: string
  ): Promise<void> {
    // Buscar alimento no banco
    const { data: food, error: foodError } = await supabase
      .from('food_database')
      .select('*')
      .eq('name', newFoodName)
      .eq('is_active', true)
      .single();

    if (foodError || !food) {
      throw new Error('Alimento não encontrado no banco de dados');
    }

    // Calcular macros do novo alimento
    const quantityInGrams = this.convertToGrams(newQuantity, newUnit);
    const multiplier = quantityInGrams / 100;

    const newCalories = Math.round(food.calories_per_100g * multiplier);
    const newProtein = Math.round(food.protein_per_100g * multiplier * 10) / 10;
    const newCarbs = Math.round(food.carbs_per_100g * multiplier * 10) / 10;
    const newFats = Math.round(food.fats_per_100g * multiplier * 10) / 10;

    // Atualizar alimento na refeição
    const { error: updateError } = await supabase
      .from('diet_foods')
      .update({
        food_name: newFoodName,
        quantity: newQuantity,
        unit: newUnit,
        calories: newCalories,
        protein: newProtein,
        carbs: newCarbs,
        fats: newFats,
      })
      .eq('id', oldFoodId);

    if (updateError) throw updateError;

    // Recalcular macros da refeição (será feito pelo serviço de refeições)
  },
};















