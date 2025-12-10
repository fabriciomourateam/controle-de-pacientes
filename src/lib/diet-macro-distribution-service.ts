/**
 * Serviço para distribuição automática de macros entre refeições
 */

export interface MacroDistribution {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealMacroTarget {
  mealType: string;
  mealName: string;
  target: MacroDistribution;
}

export type DistributionStrategy = 
  | 'balanced'           // Distribuição equilibrada
  | 'protein_focused'    // Proteína concentrada no almoço/jantar
  | 'carb_strategic'     // Carboidrato estratégico (pré/pós-treino)
  | 'custom';            // Personalizado

export const macroDistributionService = {
  /**
   * Distribui macros automaticamente entre refeições baseado em estratégia
   */
  distributeMacros(
    totalMacros: MacroDistribution,
    mealTypes: string[],
    strategy: DistributionStrategy = 'balanced'
  ): MealMacroTarget[] {
    const mealCount = mealTypes.length;
    
    if (mealCount === 0) return [];

    switch (strategy) {
      case 'balanced':
        return this.balancedDistribution(totalMacros, mealTypes);
      
      case 'protein_focused':
        return this.proteinFocusedDistribution(totalMacros, mealTypes);
      
      case 'carb_strategic':
        return this.carbStrategicDistribution(totalMacros, mealTypes);
      
      default:
        return this.balancedDistribution(totalMacros, mealTypes);
    }
  },

  /**
   * Distribuição equilibrada - mesma proporção para todas as refeições
   */
  balancedDistribution(
    totalMacros: MacroDistribution,
    mealTypes: string[]
  ): MealMacroTarget[] {
    const mealCount = mealTypes.length;
    const portion = 1 / mealCount;

    return mealTypes.map((mealType, index) => ({
      mealType,
      mealName: this.getMealName(mealType, index),
      target: {
        calories: Math.round(totalMacros.calories * portion),
        protein: Math.round(totalMacros.protein * portion * 10) / 10,
        carbs: Math.round(totalMacros.carbs * portion * 10) / 10,
        fats: Math.round(totalMacros.fats * portion * 10) / 10,
      },
    }));
  },

  /**
   * Distribuição com foco em proteína - mais proteína no almoço e jantar
   */
  proteinFocusedDistribution(
    totalMacros: MacroDistribution,
    mealTypes: string[]
  ): MealMacroTarget[] {
    const mealCount = mealTypes.length;
    const isMainMeal = (type: string) => 
      type === 'lunch' || type === 'dinner';
    
    const mainMeals = mealTypes.filter(isMainMeal);
    const otherMeals = mealTypes.filter(m => !isMainMeal(m));
    
    const mainMealCount = mainMeals.length;
    const otherMealCount = otherMeals.length;

    // 40% das calorias para refeições principais, 60% para outras
    const mainMealCalories = totalMacros.calories * 0.4 / mainMealCount;
    const otherMealCalories = totalMacros.calories * 0.6 / otherMealCount;

    // 50% da proteína para refeições principais
    const mainMealProtein = totalMacros.protein * 0.5 / mainMealCount;
    const otherMealProtein = totalMacros.protein * 0.5 / otherMealCount;

    // Carboidratos e gorduras distribuídos proporcionalmente
    const mainMealCarbs = totalMacros.carbs * 0.4 / mainMealCount;
    const otherMealCarbs = totalMacros.carbs * 0.6 / otherMealCount;
    const mainMealFats = totalMacros.fats * 0.4 / mainMealCount;
    const otherMealFats = totalMacros.fats * 0.6 / otherMealCount;

    const result: MealMacroTarget[] = [];

    mealTypes.forEach((mealType, index) => {
      const isMain = isMainMeal(mealType);
      result.push({
        mealType,
        mealName: this.getMealName(mealType, index),
        target: {
          calories: Math.round(isMain ? mainMealCalories : otherMealCalories),
          protein: Math.round((isMain ? mainMealProtein : otherMealProtein) * 10) / 10,
          carbs: Math.round((isMain ? mainMealCarbs : otherMealCarbs) * 10) / 10,
          fats: Math.round((isMain ? mainMealFats : otherMealFats) * 10) / 10,
        },
      });
    });

    return result;
  },

  /**
   * Distribuição estratégica de carboidratos - mais carboidrato no pré/pós-treino
   */
  carbStrategicDistribution(
    totalMacros: MacroDistribution,
    mealTypes: string[]
  ): MealMacroTarget[] {
    const mealCount = mealTypes.length;
    const isWorkoutMeal = (type: string) => 
      type === 'pre_workout' || type === 'post_workout';
    
    const workoutMeals = mealTypes.filter(isWorkoutMeal);
    const regularMeals = mealTypes.filter(m => !isWorkoutMeal(m));
    
    const workoutMealCount = workoutMeals.length || 1;
    const regularMealCount = regularMeals.length || 1;

    // 50% dos carboidratos para refeições de treino
    const workoutMealCarbs = totalMacros.carbs * 0.5 / workoutMealCount;
    const regularMealCarbs = totalMacros.carbs * 0.5 / regularMealCount;

    // Calorias, proteínas e gorduras distribuídos proporcionalmente
    const workoutMealCalories = totalMacros.calories * 0.3 / workoutMealCount;
    const regularMealCalories = totalMacros.calories * 0.7 / regularMealCount;
    const workoutMealProtein = totalMacros.protein * 0.3 / workoutMealCount;
    const regularMealProtein = totalMacros.protein * 0.7 / regularMealCount;
    const workoutMealFats = totalMacros.fats * 0.3 / workoutMealCount;
    const regularMealFats = totalMacros.fats * 0.7 / regularMealCount;

    const result: MealMacroTarget[] = [];

    mealTypes.forEach((mealType, index) => {
      const isWorkout = isWorkoutMeal(mealType);
      result.push({
        mealType,
        mealName: this.getMealName(mealType, index),
        target: {
          calories: Math.round(isWorkout ? workoutMealCalories : regularMealCalories),
          protein: Math.round((isWorkout ? workoutMealProtein : regularMealProtein) * 10) / 10,
          carbs: Math.round((isWorkout ? workoutMealCarbs : regularMealCarbs) * 10) / 10,
          fats: Math.round((isWorkout ? workoutMealFats : regularMealFats) * 10) / 10,
        },
      });
    });

    return result;
  },

  /**
   * Ajusta distribuição manualmente
   */
  adjustDistribution(
    currentDistribution: MealMacroTarget[],
    mealIndex: number,
    newMacros: Partial<MacroDistribution>
  ): MealMacroTarget[] {
    const updated = [...currentDistribution];
    const meal = updated[mealIndex];
    
    if (meal) {
      meal.target = {
        ...meal.target,
        ...newMacros,
      };
    }

    return updated;
  },

  /**
   * Valida se a distribuição soma corretamente
   */
  validateDistribution(
    distribution: MealMacroTarget[],
    totalMacros: MacroDistribution,
    tolerance: number = 50 // Tolerância em calorias
  ): { valid: boolean; differences: MacroDistribution } {
    const totals = distribution.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.target.calories,
        protein: acc.protein + meal.target.protein,
        carbs: acc.carbs + meal.target.carbs,
        fats: acc.fats + meal.target.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const differences = {
      calories: totalMacros.calories - totals.calories,
      protein: totalMacros.protein - totals.protein,
      carbs: totalMacros.carbs - totals.carbs,
      fats: totalMacros.fats - totals.fats,
    };

    const valid = 
      Math.abs(differences.calories) <= tolerance &&
      Math.abs(differences.protein) <= 5 &&
      Math.abs(differences.carbs) <= 5 &&
      Math.abs(differences.fats) <= 5;

    return { valid, differences };
  },

  /**
   * Normaliza distribuição para somar exatamente os totais
   */
  normalizeDistribution(
    distribution: MealMacroTarget[],
    totalMacros: MacroDistribution
  ): MealMacroTarget[] {
    const totals = distribution.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.target.calories,
        protein: acc.protein + meal.target.protein,
        carbs: acc.carbs + meal.target.carbs,
        fats: acc.fats + meal.target.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const differences = {
      calories: totalMacros.calories - totals.calories,
      protein: totalMacros.protein - totals.protein,
      carbs: totalMacros.carbs - totals.carbs,
      fats: totalMacros.fats - totals.fats,
    };

    // Distribuir diferenças proporcionalmente
    const mealCount = distribution.length;
    const portion = 1 / mealCount;

    return distribution.map(meal => ({
      ...meal,
      target: {
        calories: Math.round(meal.target.calories + differences.calories * portion),
        protein: Math.round((meal.target.protein + differences.protein * portion) * 10) / 10,
        carbs: Math.round((meal.target.carbs + differences.carbs * portion) * 10) / 10,
        fats: Math.round((meal.target.fats + differences.fats * portion) * 10) / 10,
      },
    }));
  },

  /**
   * Obtém nome padrão da refeição baseado no tipo
   */
  getMealName(mealType: string, index: number): string {
    const mealTypeNames: Record<string, string> = {
      breakfast: 'Café da Manhã',
      snack_1: 'Lanche da Manhã',
      lunch: 'Almoço',
      snack_2: 'Lanche da Tarde',
      dinner: 'Jantar',
      pre_workout: 'Pré-Treino',
      post_workout: 'Pós-Treino',
    };

    return mealTypeNames[mealType] || `Refeição ${index + 1}`;
  },
};








