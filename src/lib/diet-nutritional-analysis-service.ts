import { supabase } from '@/integrations/supabase/client';

export interface NutritionalAnalysis {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_fiber: number;
  total_sodium: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  fiber_per_1000kcal: number;
  nutritional_density_score: number; // Score de 0-100
  recommendations: string[];
}

export interface PlanForAnalysis {
  meals?: Array<{
    foods?: Array<{
      food_name: string;
      quantity: number;
      unit: string;
    }>;
  }>;
}

export const nutritionalAnalysisService = {
  /**
   * Analisa valor nutricional completo do plano
   */
  async analyzePlan(plan: PlanForAnalysis): Promise<NutritionalAnalysis> {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sodium: 0,
    };

    // Buscar todos os alimentos únicos
    const foodNames = new Set<string>();
    (plan.meals || []).forEach(meal => {
      meal.foods?.forEach(food => {
        foodNames.add(food.food_name);
      });
    });

    // Buscar informações nutricionais
    const { data: foods } = await supabase
      .from('food_database')
      .select('*')
      .in('name', Array.from(foodNames))
      .eq('is_active', true);

    const foodsMap = new Map(foods?.map(f => [f.name, f]) || []);

    // Calcular totais
    (plan.meals || []).forEach(meal => {
      meal.foods?.forEach(food => {
        const foodData = foodsMap.get(food.food_name);
        if (foodData) {
          const quantityInGrams = this.convertToGrams(food.quantity, food.unit);
          const multiplier = quantityInGrams / 100;

          totals.calories += foodData.calories_per_100g * multiplier;
          totals.protein += foodData.protein_per_100g * multiplier;
          totals.carbs += foodData.carbs_per_100g * multiplier;
          totals.fats += foodData.fats_per_100g * multiplier;
          totals.fiber += (foodData.fiber_per_100g || 0) * multiplier;
          totals.sodium += (foodData.sodium_per_100g || 0) * multiplier;
        }
      });
    });

    // Calcular percentuais
    const totalMacroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fats * 9;
    const proteinPercentage = totalMacroCalories > 0
      ? (totals.protein * 4 / totalMacroCalories) * 100
      : 0;
    const carbsPercentage = totalMacroCalories > 0
      ? (totals.carbs * 4 / totalMacroCalories) * 100
      : 0;
    const fatsPercentage = totalMacroCalories > 0
      ? (totals.fats * 9 / totalMacroCalories) * 100
      : 0;

    // Calcular densidade nutricional
    const nutritionalDensityScore = this.calculateNutritionalDensity(totals);

    // Gerar recomendações
    const recommendations = this.generateRecommendations(totals, proteinPercentage, carbsPercentage, fatsPercentage);

    return {
      total_calories: Math.round(totals.calories),
      total_protein: Math.round(totals.protein * 10) / 10,
      total_carbs: Math.round(totals.carbs * 10) / 10,
      total_fats: Math.round(totals.fats * 10) / 10,
      total_fiber: Math.round(totals.fiber * 10) / 10,
      total_sodium: Math.round(totals.sodium * 10) / 10,
      protein_percentage: Math.round(proteinPercentage * 10) / 10,
      carbs_percentage: Math.round(carbsPercentage * 10) / 10,
      fats_percentage: Math.round(fatsPercentage * 10) / 10,
      fiber_per_1000kcal: totals.calories > 0
        ? Math.round((totals.fiber / totals.calories) * 1000 * 10) / 10
        : 0,
      nutritional_density_score: nutritionalDensityScore,
      recommendations,
    };
  },

  /**
   * Calcula score de densidade nutricional (0-100)
   */
  calculateNutritionalDensity(totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sodium: number;
  }): number {
    let score = 50; // Score base

    // Bonus por proteína (meta: 1.6-2.2g por kg, assumindo 70kg = 112-154g)
    if (totals.protein >= 100 && totals.protein <= 200) {
      score += 15;
    } else if (totals.protein >= 80 && totals.protein < 100) {
      score += 10;
    } else if (totals.protein < 80) {
      score -= 10;
    }

    // Bonus por fibra (meta: 25-30g por dia)
    const fiberPer1000kcal = totals.calories > 0 ? (totals.fiber / totals.calories) * 1000 : 0;
    if (fiberPer1000kcal >= 10) {
      score += 15;
    } else if (fiberPer1000kcal >= 7) {
      score += 10;
    } else if (fiberPer1000kcal < 5) {
      score -= 10;
    }

    // Penalidade por sódio excessivo (meta: < 2300mg)
    if (totals.sodium > 3000) {
      score -= 15;
    } else if (totals.sodium > 2300) {
      score -= 5;
    }

    // Bonus por distribuição equilibrada de macros
    const totalMacroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fats * 9;
    if (totalMacroCalories > 0) {
      const proteinPct = (totals.protein * 4 / totalMacroCalories) * 100;
      const carbsPct = (totals.carbs * 4 / totalMacroCalories) * 100;
      const fatsPct = (totals.fats * 9 / totalMacroCalories) * 100;

      // Distribuição ideal: 25-35% proteína, 40-50% carboidratos, 20-30% gorduras
      if (proteinPct >= 25 && proteinPct <= 35) score += 5;
      if (carbsPct >= 40 && carbsPct <= 50) score += 5;
      if (fatsPct >= 20 && fatsPct <= 30) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  },

  /**
   * Gera recomendações baseadas na análise
   */
  generateRecommendations(
    totals: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      fiber: number;
      sodium: number;
    },
    proteinPercentage: number,
    carbsPercentage: number,
    fatsPercentage: number
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações de proteína
    if (totals.protein < 80) {
      recommendations.push('Considere aumentar a ingestão de proteínas para melhor recuperação muscular');
    } else if (totals.protein > 200) {
      recommendations.push('A ingestão de proteínas está muito alta, considere reduzir');
    }

    // Recomendações de fibra
    const fiberPer1000kcal = totals.calories > 0 ? (totals.fiber / totals.calories) * 1000 : 0;
    if (fiberPer1000kcal < 7) {
      recommendations.push('Adicione mais alimentos ricos em fibras (frutas, vegetais, grãos integrais)');
    }

    // Recomendações de sódio
    if (totals.sodium > 2300) {
      recommendations.push('Atenção: ingestão de sódio acima do recomendado (2300mg/dia)');
    }

    // Recomendações de distribuição de macros
    if (proteinPercentage < 20) {
      recommendations.push('A proporção de proteínas está baixa, considere aumentar');
    }
    if (carbsPercentage < 35) {
      recommendations.push('A proporção de carboidratos está baixa, pode afetar energia');
    }
    if (fatsPercentage < 15) {
      recommendations.push('A proporção de gorduras está muito baixa, importante para absorção de vitaminas');
    }

    if (recommendations.length === 0) {
      recommendations.push('Plano bem balanceado! Continue assim.');
    }

    return recommendations;
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
      return quantity * 100;
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
      return quantity;
    }

    return quantity;
  },
};










