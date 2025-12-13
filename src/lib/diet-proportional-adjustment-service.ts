/**
 * Serviço para ajuste proporcional de planos alimentares
 */

export interface ProportionalAdjustment {
  percentage: number; // Porcentagem de ajuste (ex: 20 = +20%, -10 = -10%)
  adjustCalories: boolean;
  adjustProtein: boolean;
  adjustCarbs: boolean;
  adjustFats: boolean;
  maintainRatios: boolean; // Manter proporções entre macros
}

export interface AdjustedPlan {
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fats: number | null;
  meals: Array<{
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fats: number | null;
    foods: Array<{
      quantity: number;
      calories: number | null;
      protein: number | null;
      carbs: number | null;
      fats: number | null;
    }>;
  }>;
}

export const proportionalAdjustmentService = {
  /**
   * Ajusta plano proporcionalmente
   */
  adjustPlan(
    plan: {
      total_calories?: number | null;
      total_protein?: number | null;
      total_carbs?: number | null;
      total_fats?: number | null;
      meals?: Array<{
        calories?: number | null;
        protein?: number | null;
        carbs?: number | null;
        fats?: number | null;
        foods?: Array<{
          quantity: number;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fats?: number | null;
        }>;
      }>;
    },
    adjustment: ProportionalAdjustment
  ): AdjustedPlan {
    const multiplier = 1 + (adjustment.percentage / 100);

    // Ajustar totais
    const adjustedTotals = {
      total_calories: adjustment.adjustCalories && plan.total_calories
        ? Math.round(plan.total_calories * multiplier)
        : plan.total_calories,
      total_protein: adjustment.adjustProtein && plan.total_protein
        ? Math.round(plan.total_protein * multiplier * 10) / 10
        : plan.total_protein,
      total_carbs: adjustment.adjustCarbs && plan.total_carbs
        ? Math.round(plan.total_carbs * multiplier * 10) / 10
        : plan.total_carbs,
      total_fats: adjustment.adjustFats && plan.total_fats
        ? Math.round(plan.total_fats * multiplier * 10) / 10
        : plan.total_fats,
    };

    // Ajustar refeições
    const adjustedMeals = (plan.meals || []).map(meal => ({
      calories: adjustment.adjustCalories && meal.calories
        ? Math.round(meal.calories * multiplier)
        : meal.calories,
      protein: adjustment.adjustProtein && meal.protein
        ? Math.round(meal.protein * multiplier * 10) / 10
        : meal.protein,
      carbs: adjustment.adjustCarbs && meal.carbs
        ? Math.round(meal.carbs * multiplier * 10) / 10
        : meal.carbs,
      fats: adjustment.adjustFats && meal.fats
        ? Math.round(meal.fats * multiplier * 10) / 10
        : meal.fats,
      foods: (meal.foods || []).map(food => {
        // Ajustar quantidade proporcionalmente
        const adjustedQuantity = food.quantity * multiplier;

        return {
          quantity: adjustedQuantity,
          calories: adjustment.adjustCalories && food.calories
            ? Math.round(food.calories * multiplier)
            : food.calories,
          protein: adjustment.adjustProtein && food.protein
            ? Math.round(food.protein * multiplier * 10) / 10
            : food.protein,
          carbs: adjustment.adjustCarbs && food.carbs
            ? Math.round(food.carbs * multiplier * 10) / 10
            : food.carbs,
          fats: adjustment.adjustFats && food.fats
            ? Math.round(food.fats * multiplier * 10) / 10
            : food.fats,
        };
      }),
    }));

    // Se manter proporções, garantir que os totais batam
    if (adjustment.maintainRatios) {
      const calculatedTotals = adjustedMeals.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs: acc.carbs + (meal.carbs || 0),
          fats: acc.fats + (meal.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      // Ajustar totais para bater com soma das refeições
      if (adjustment.adjustCalories) {
        adjustedTotals.total_calories = Math.round(calculatedTotals.calories);
      }
      if (adjustment.adjustProtein) {
        adjustedTotals.total_protein = Math.round(calculatedTotals.protein * 10) / 10;
      }
      if (adjustment.adjustCarbs) {
        adjustedTotals.total_carbs = Math.round(calculatedTotals.carbs * 10) / 10;
      }
      if (adjustment.adjustFats) {
        adjustedTotals.total_fats = Math.round(calculatedTotals.fats * 10) / 10;
      }
    }

    return {
      ...adjustedTotals,
      meals: adjustedMeals,
    };
  },

  /**
   * Calcula porcentagem de ajuste necessária para atingir meta
   */
  calculateAdjustmentPercentage(
    current: number,
    target: number
  ): number {
    if (current === 0) return 0;
    return ((target - current) / current) * 100;
  },

  /**
   * Ajusta apenas calorias mantendo proporções de macros
   */
  adjustCaloriesOnly(
    plan: {
      total_calories?: number | null;
      total_protein?: number | null;
      total_carbs?: number | null;
      total_fats?: number | null;
      meals?: Array<{
        calories?: number | null;
        protein?: number | null;
        carbs?: number | null;
        fats?: number | null;
        foods?: Array<{
          quantity: number;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fats?: number | null;
        }>;
      }>;
    },
    targetCalories: number
  ): AdjustedPlan {
    if (!plan.total_calories || plan.total_calories === 0) {
      throw new Error('Plano não tem calorias totais definidas');
    }

    const percentage = this.calculateAdjustmentPercentage(
      plan.total_calories,
      targetCalories
    );

    return this.adjustPlan(plan, {
      percentage,
      adjustCalories: true,
      adjustProtein: true,
      adjustCarbs: true,
      adjustFats: true,
      maintainRatios: true,
    });
  },
};















