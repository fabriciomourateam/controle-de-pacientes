/**
 * Serviço de validação e alertas para planos alimentares
 */

export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  type: 'missing_macro' | 'low_meal_count' | 'repeated_food' | 'imbalanced_distribution' | 'missing_fiber';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface ValidationError {
  type: 'total_mismatch' | 'invalid_macro' | 'missing_required';
  message: string;
  fix?: string;
}

export interface PlanData {
  total_calories?: number | null;
  total_protein?: number | null;
  total_carbs?: number | null;
  total_fats?: number | null;
  meals?: Array<{
    meal_type: string;
    meal_name: string;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
    foods?: Array<{
      food_name: string;
      quantity: number;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fats?: number | null;
    }>;
  }>;
}

export const dietValidationService = {
  /**
   * Valida plano completo
   */
  validatePlan(plan: PlanData): ValidationResult {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // Validar totais
    if (plan.total_calories || plan.total_protein || plan.total_carbs || plan.total_fats) {
      const totalsValidation = this.validateTotals(plan);
      errors.push(...totalsValidation.errors);
      warnings.push(...totalsValidation.warnings);
    }

    // Validar refeições
    if (plan.meals && plan.meals.length > 0) {
      const mealsValidation = this.validateMeals(plan.meals);
      warnings.push(...mealsValidation.warnings);
      errors.push(...mealsValidation.errors);
    }

    // Validar distribuição
    if (plan.meals && plan.meals.length > 0) {
      const distributionValidation = this.validateDistribution(plan.meals);
      warnings.push(...distributionValidation);
    }

    // Validar alimentos repetidos
    if (plan.meals) {
      const repeatedFoods = this.checkRepeatedFoods(plan.meals);
      if (repeatedFoods.length > 0) {
        warnings.push({
          type: 'repeated_food',
          message: `Alimentos repetidos muitas vezes: ${repeatedFoods.join(', ')}`,
          severity: 'medium',
          suggestion: 'Considere variar os alimentos para melhorar a qualidade nutricional',
        });
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },

  /**
   * Valida se totais batem com soma das refeições
   */
  validateTotals(plan: PlanData): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!plan.meals || plan.meals.length === 0) {
      return { errors, warnings };
    }

    // Calcular totais das refeições
    const calculatedTotals = plan.meals.reduce(
      (acc, meal) => {
        if (meal.calories) acc.calories += meal.calories;
        if (meal.protein) acc.protein += meal.protein;
        if (meal.carbs) acc.carbs += meal.carbs;
        if (meal.fats) acc.fats += meal.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Verificar diferenças
    const tolerance = 50; // Tolerância de 50 calorias

    if (plan.total_calories) {
      const diff = Math.abs(plan.total_calories - calculatedTotals.calories);
      if (diff > tolerance) {
        errors.push({
          type: 'total_mismatch',
          message: `Total de calorias (${plan.total_calories}) não corresponde à soma das refeições (${Math.round(calculatedTotals.calories)})`,
          fix: `Ajuste para ${Math.round(calculatedTotals.calories)} calorias`,
        });
      }
    }

    if (plan.total_protein) {
      const diff = Math.abs(plan.total_protein - calculatedTotals.protein);
      if (diff > 5) {
        warnings.push({
          type: 'imbalanced_distribution',
          message: `Total de proteínas (${plan.total_protein}g) não corresponde à soma (${Math.round(calculatedTotals.protein * 10) / 10}g)`,
          severity: 'medium',
        });
      }
    }

    if (plan.total_carbs) {
      const diff = Math.abs(plan.total_carbs - calculatedTotals.carbs);
      if (diff > 5) {
        warnings.push({
          type: 'imbalanced_distribution',
          message: `Total de carboidratos (${plan.total_carbs}g) não corresponde à soma (${Math.round(calculatedTotals.carbs * 10) / 10}g)`,
          severity: 'medium',
        });
      }
    }

    if (plan.total_fats) {
      const diff = Math.abs(plan.total_fats - calculatedTotals.fats);
      if (diff > 5) {
        warnings.push({
          type: 'imbalanced_distribution',
          message: `Total de gorduras (${plan.total_fats}g) não corresponde à soma (${Math.round(calculatedTotals.fats * 10) / 10}g)`,
          severity: 'medium',
        });
      }
    }

    return { errors, warnings };
  },

  /**
   * Valida refeições
   */
  validateMeals(meals: PlanData['meals']): { warnings: ValidationWarning[]; errors: ValidationError[] } {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    if (!meals || meals.length === 0) {
      errors.push({
        type: 'missing_required',
        message: 'Plano deve ter pelo menos uma refeição',
      });
      return { warnings, errors };
    }

    // Verificar quantidade mínima de refeições
    if (meals.length < 3) {
      warnings.push({
        type: 'low_meal_count',
        message: `Plano tem apenas ${meals.length} refeição(ões). Recomenda-se pelo menos 3 refeições por dia`,
        severity: 'medium',
        suggestion: 'Considere adicionar mais refeições para melhor distribuição nutricional',
      });
    }

    // Verificar se cada refeição tem alimentos
    meals.forEach((meal, index) => {
      if (!meal.foods || meal.foods.length === 0) {
        warnings.push({
          type: 'missing_macro',
          message: `Refeição "${meal.meal_name}" não tem alimentos`,
          severity: 'high',
          suggestion: 'Adicione alimentos a esta refeição',
        });
      }

      // Verificar se refeição tem macros
      if (!meal.calories && !meal.protein && !meal.carbs && !meal.fats) {
        if (meal.foods && meal.foods.length > 0) {
          warnings.push({
            type: 'missing_macro',
            message: `Refeição "${meal.meal_name}" não tem macros calculados`,
            severity: 'medium',
            suggestion: 'Os macros serão calculados automaticamente quando você salvar',
          });
        }
      }
    });

    return { warnings, errors };
  },

  /**
   * Valida distribuição de macros
   */
  validateDistribution(meals: PlanData['meals']): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!meals || meals.length === 0) return warnings;

    // Calcular totais
    const totals = meals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories || 0;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fats += meal.fats || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Verificar se alguma refeição está muito desbalanceada
    meals.forEach(meal => {
      const mealCalories = meal.calories || 0;
      const mealProtein = meal.protein || 0;
      const mealCarbs = meal.carbs || 0;
      const mealFats = meal.fats || 0;

      if (totals.calories > 0) {
        const mealPercentage = (mealCalories / totals.calories) * 100;

        // Alerta se uma refeição tem mais de 50% das calorias
        if (mealPercentage > 50) {
          warnings.push({
            type: 'imbalanced_distribution',
            message: `Refeição "${meal.meal_name}" concentra ${Math.round(mealPercentage)}% das calorias totais`,
            severity: 'medium',
            suggestion: 'Considere redistribuir as calorias entre as refeições',
          });
        }

        // Alerta se uma refeição tem menos de 5% das calorias
        if (mealPercentage < 5 && mealCalories > 0) {
          warnings.push({
            type: 'imbalanced_distribution',
            message: `Refeição "${meal.meal_name}" tem apenas ${Math.round(mealPercentage)}% das calorias totais`,
            severity: 'low',
            suggestion: 'Esta refeição pode ser muito pequena',
          });
        }
      }
    });

    return warnings;
  },

  /**
   * Verifica alimentos repetidos
   */
  checkRepeatedFoods(meals: PlanData['meals']): string[] {
    if (!meals) return [];

    const foodCount = new Map<string, number>();

    meals.forEach(meal => {
      meal.foods?.forEach(food => {
        const count = foodCount.get(food.food_name) || 0;
        foodCount.set(food.food_name, count + 1);
      });
    });

    // Retornar alimentos que aparecem mais de 3 vezes
    return Array.from(foodCount.entries())
      .filter(([_, count]) => count > 3)
      .map(([name, _]) => name);
  },

  /**
   * Valida macros individuais
   */
  validateMacros(macros: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    if (macros.calories !== null && macros.calories !== undefined && macros.calories < 0) {
      errors.push({
        type: 'invalid_macro',
        message: 'Calorias não podem ser negativas',
      });
    }

    if (macros.protein !== null && macros.protein !== undefined && macros.protein < 0) {
      errors.push({
        type: 'invalid_macro',
        message: 'Proteínas não podem ser negativas',
      });
    }

    if (macros.carbs !== null && macros.carbs !== undefined && macros.carbs < 0) {
      errors.push({
        type: 'invalid_macro',
        message: 'Carboidratos não podem ser negativos',
      });
    }

    if (macros.fats !== null && macros.fats !== undefined && macros.fats < 0) {
      errors.push({
        type: 'invalid_macro',
        message: 'Gorduras não podem ser negativas',
      });
    }

    return errors;
  },
};










