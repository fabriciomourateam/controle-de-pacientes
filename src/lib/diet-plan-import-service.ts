import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

export interface DietPlanImportResult {
  success: boolean;
  totalPlans: number;
  importedPlans: number;
  totalMeals: number;
  importedMeals: number;
  totalFoods: number;
  importedFoods: number;
  errors: string[];
  warnings: string[];
}

interface SimplifiedFoodRow {
  'Nome do Plano': string;
  'Tipo Refeição': string;
  'Nome Refeição': string;
  'Horário'?: string;
  'Alimento': string;
  'Quantidade': number | string;
  'Unidade': string;
  'Calorias'?: number | string;
  'Proteínas'?: number | string;
  'Carboidratos'?: number | string;
  'Gorduras'?: number | string;
  'Instruções'?: string;
}

interface FoodDatabaseItem {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

export class DietPlanImportService {
  // Mapear tipos de refeição
  // Valores permitidos: breakfast, snack_1, lunch, snack_2, dinner, pre_workout, post_workout
  private static mealTypeMapping: { [key: string]: string } = {
    'Café da Manhã': 'breakfast',
    'Café da manhã': 'breakfast',
    'Café da Manha': 'breakfast',
    'Café da manha': 'breakfast',
    'Lanche da Manhã': 'snack_1',
    'Lanche da manhã': 'snack_1',
    'Lanche da Manha': 'snack_1',
    'Lanche da manha': 'snack_1',
    'Almoço': 'lunch',
    'Almoco': 'lunch',
    'Lanche da Tarde': 'snack_2',
    'Lanche da tarde': 'snack_2',
    'Jantar': 'dinner',
    'Ceia': 'snack_2', // Ceia mapeada como lanche da tarde
    'ceia': 'snack_2',
    'Pré-Treino': 'pre_workout',
    'Pré-treino': 'pre_workout',
    'Pre-Treino': 'pre_workout',
    'Pre-treino': 'pre_workout',
    'Pós-Treino': 'post_workout',
    'Pós-treino': 'post_workout',
    'Pos-Treino': 'post_workout',
    'Pos-treino': 'post_workout',
  };

  // Cache do banco de alimentos
  private static foodDatabaseCache: FoodDatabaseItem[] | null = null;

  // Buscar alimento no banco TACO
  private static async findFoodInDatabase(foodName: string): Promise<FoodDatabaseItem | null> {
    // Carregar cache se necessário
    if (!this.foodDatabaseCache) {
      const { data, error } = await supabase
        .from('food_database')
        .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
        .eq('is_active', true);

      if (error) {
        console.error('Erro ao buscar banco de alimentos:', error);
        return null;
      }

      this.foodDatabaseCache = data || [];
    }

    // Buscar alimento (busca exata primeiro, depois busca parcial case-insensitive)
    const normalizedSearch = foodName.trim().toLowerCase();
    
    // Tentar busca exata
    let found = this.foodDatabaseCache.find(
      f => f.name.toLowerCase() === normalizedSearch
    );

    // Se não encontrou, tentar busca parcial
    if (!found) {
      found = this.foodDatabaseCache.find(
        f => f.name.toLowerCase().includes(normalizedSearch) || 
             normalizedSearch.includes(f.name.toLowerCase())
      );
    }

    return found || null;
  }

  // Calcular macros baseado na quantidade
  private static calculateMacros(
    food: FoodDatabaseItem,
    quantity: number,
    unit: string
  ): { calories: number; protein: number; carbs: number; fats: number } {
    // Converter quantidade para gramas se necessário
    let quantityInGrams = quantity;

    // Conversões básicas de unidades comuns
    const unitLower = unit.toLowerCase().trim();
    if (unitLower === 'kg' || unitLower === 'kilograma' || unitLower === 'kilogramas') {
      quantityInGrams = quantity * 1000;
    } else if (unitLower === 'unidade' || unitLower === 'unidades' || unitLower === 'un' || unitLower === 'und') {
      // Assumir que 1 unidade = 100g (pode ser ajustado)
      quantityInGrams = quantity * 100;
    } else if (unitLower.includes('colher')) {
      // Colher de sopa ~15g, colher de chá ~5g
      if (unitLower.includes('sopa')) {
        quantityInGrams = quantity * 15;
      } else if (unitLower.includes('chá')) {
        quantityInGrams = quantity * 5;
      }
    } else if (unitLower.includes('xícara') || unitLower.includes('xicara')) {
      quantityInGrams = quantity * 240; // ~240ml
    }

    // Calcular macros
    const multiplier = quantityInGrams / 100;
    
    return {
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fats: Math.round(food.fats_per_100g * multiplier * 10) / 10,
    };
  }

  // Ler arquivo Excel simplificado (uma única planilha)
  static async parseExcel(file: File): Promise<SimplifiedFoodRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const result: SimplifiedFoodRow[] = [];

          // Processar primeira planilha (ou planilha ativa)
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ''
          }) as any[][];

          if (jsonData.length < 2) {
            resolve(result);
            return;
          }

          const headers = jsonData[0].map((h: any) => String(h || '').trim());
          
          // Verificar se tem as colunas obrigatórias
          const requiredHeaders = ['Nome do Plano', 'Tipo Refeição', 'Nome Refeição', 'Alimento', 'Quantidade', 'Unidade'];
          const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));

          if (!hasRequiredHeaders) {
            reject(new Error(`Planilha deve conter as colunas: ${requiredHeaders.join(', ')}`));
            return;
          }

          // Processar linhas
          for (let i = 1; i < jsonData.length; i++) {
            const values = jsonData[i];
            const row: any = {};

            headers.forEach((header, index) => {
              if (header) {
                const value = values[index];
                
                // Converter números
                if (header === 'Quantidade' || header.includes('Calorias') || 
                    header.includes('Proteínas') || header.includes('Carboidratos') || 
                    header.includes('Gorduras')) {
                  const num = parseFloat(String(value || '0').replace(',', '.'));
                  row[header] = isNaN(num) ? 0 : num;
                } else {
                  row[header] = String(value || '').trim();
                }
              }
            });

            // Validar linha obrigatória
            if (row['Nome do Plano'] && row['Tipo Refeição'] && 
                row['Nome Refeição'] && row['Alimento'] && 
                row['Quantidade'] && row['Unidade']) {
              result.push(row);
            }
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Gerar template Excel simplificado
  static generateTemplate(): void {
    const wb = XLSX.utils.book_new();

    // Uma única planilha com todas as informações
    const headers = [
      'Nome do Plano',
      'Tipo Refeição',
      'Nome Refeição',
      'Horário',
      'Alimento',
      'Quantidade',
      'Unidade',
      'Calorias',
      'Proteínas',
      'Carboidratos',
      'Gorduras',
      'Instruções'
    ];

    // Exemplo de dados
    const exampleData = [
      ['Plano Emagrecimento', 'Café da Manhã', 'Café da Manhã 1', '07:00', 'Ovos', 2, 'unidade', '', '', '', '', ''],
      ['Plano Emagrecimento', 'Café da Manhã', 'Café da Manhã 1', '07:00', 'Aveia', 50, 'g', '', '', '', '', ''],
      ['Plano Emagrecimento', 'Almoço', 'Almoço 1', '12:00', 'Arroz Integral', 100, 'g', '', '', '', '', ''],
      ['Plano Emagrecimento', 'Almoço', 'Almoço 1', '12:00', 'Frango', 150, 'g', '', '', '', '', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 25 }, // Nome do Plano
      { wch: 18 }, // Tipo Refeição
      { wch: 20 }, // Nome Refeição
      { wch: 10 }, // Horário
      { wch: 25 }, // Alimento
      { wch: 12 }, // Quantidade
      { wch: 12 }, // Unidade
      { wch: 12 }, // Calorias
      { wch: 12 }, // Proteínas
      { wch: 14 }, // Carboidratos
      { wch: 12 }, // Gorduras
      { wch: 30 }, // Instruções
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Planos Alimentares');

    // Baixar arquivo
    XLSX.writeFile(wb, 'modelo-importacao-planos-alimentares.xlsx');
  }

  // Importar planos alimentares
  static async importFile(file: File, patientId: string): Promise<DietPlanImportResult> {
    const result: DietPlanImportResult = {
      success: false,
      totalPlans: 0,
      importedPlans: 0,
      totalMeals: 0,
      importedMeals: 0,
      totalFoods: 0,
      importedFoods: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Obter user_id do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        result.errors.push('Usuário não autenticado. Faça login novamente.');
        return result;
      }

      // Limpar cache do banco de alimentos
      this.foodDatabaseCache = null;

      // Ler arquivo Excel
      const rows = await this.parseExcel(file);
      
      if (rows.length === 0) {
        result.errors.push('Nenhum dado encontrado no arquivo. Verifique se a planilha está no formato correto.');
        return result;
      }

      // Agrupar por plano e refeição
      const plansMap = new Map<string, Map<string, SimplifiedFoodRow[]>>();

      for (const row of rows) {
        const planName = row['Nome do Plano'];
        const mealKey = `${row['Tipo Refeição']}|||${row['Nome Refeição']}`;

        if (!plansMap.has(planName)) {
          plansMap.set(planName, new Map());
        }

        const planMeals = plansMap.get(planName)!;
        if (!planMeals.has(mealKey)) {
          planMeals.set(mealKey, []);
        }

        planMeals.get(mealKey)!.push(row);
      }

      result.totalPlans = plansMap.size;

      // Processar cada plano
      for (const [planName, mealsMap] of plansMap) {
        try {
          // Criar plano (totais serão calculados depois)
          const planData = {
            patient_id: patientId,
            user_id: user.id,
            name: planName,
            status: 'draft',
            total_calories: null,
            total_protein: null,
            total_carbs: null,
            total_fats: null,
            notes: null,
          };

          const { data: createdPlan, error: planError } = await supabase
            .from('diet_plans')
            .insert(planData)
            .select('id')
            .single();

          if (planError) {
            result.errors.push(`Erro ao criar plano "${planName}": ${planError.message}`);
            continue;
          }

          result.importedPlans++;
          result.totalMeals += mealsMap.size;

          let mealOrder = 0;
          let totalPlanCalories = 0;
          let totalPlanProtein = 0;
          let totalPlanCarbs = 0;
          let totalPlanFats = 0;

          // Processar cada refeição
          for (const [mealKey, foods] of mealsMap) {
            try {
              const [mealTypeName, mealName] = mealKey.split('|||');
              const firstFood = foods[0];
              
              // Mapear tipo de refeição - usar mapeamento ou fallback seguro
              let mealType = this.mealTypeMapping[mealTypeName];
              if (!mealType) {
                // Tentar busca case-insensitive
                const normalized = mealTypeName.trim();
                mealType = this.mealTypeMapping[normalized] || 
                          Object.keys(this.mealTypeMapping).find(
                            key => key.toLowerCase() === normalized.toLowerCase()
                          ) ? this.mealTypeMapping[Object.keys(this.mealTypeMapping).find(
                            key => key.toLowerCase() === normalized.toLowerCase()
                          )!] : null;
              }
              
              // Se ainda não encontrou, usar fallback seguro (snack_2 como padrão)
              if (!mealType) {
                console.warn(`⚠️ Tipo de refeição "${mealTypeName}" não encontrado no mapeamento. Usando "snack_2" como padrão.`);
                mealType = 'snack_2';
              }

              let mealCalories = 0;
              let mealProtein = 0;
              let mealCarbs = 0;
              let mealFats = 0;

              // Criar refeição
              // Nota: suggested_time não está na definição da tabela diet_meals no Supabase
              // Se precisar adicionar, será necessário atualizar a tabela primeiro
              const instructionsValue = firstFood['Instruções'];
              const mealData = {
                diet_plan_id: createdPlan.id,
                meal_type: mealType,
                meal_name: mealName,
                meal_order: mealOrder++,
                calories: null, // Será calculado
                protein: null,
                carbs: null,
                fats: null,
                instructions: instructionsValue && instructionsValue.trim() ? instructionsValue.trim() : null,
              };

              console.log('📝 Dados da refeição a serem inseridos:', mealData);

              const { data: createdMeal, error: mealError } = await supabase
                .from('diet_meals')
                .insert(mealData)
                .select('id')
                .single();

              if (mealError) {
                console.error('❌ Erro detalhado ao criar refeição:', {
                  mealName,
                  mealData,
                  error: mealError,
                  message: mealError.message,
                  details: mealError.details,
                  hint: mealError.hint,
                });
                result.errors.push(`Erro ao criar refeição "${mealName}": ${mealError.message}${mealError.details ? ' - ' + mealError.details : ''}${mealError.hint ? ' - ' + mealError.hint : ''}`);
                continue;
              }

              result.importedMeals++;
              result.totalFoods += foods.length;

              // Processar cada alimento
              let foodOrder = 0;
              for (const foodRow of foods) {
                try {
                  const foodName = foodRow['Alimento'];
                  const quantity = this.parseNumber(foodRow['Quantidade']) || 0;
                  const unit = foodRow['Unidade'] || 'g';

                  // Tentar buscar no banco TACO
                  const foodFromDb = await this.findFoodInDatabase(foodName);

                  let calories: number;
                  let protein: number;
                  let carbs: number;
                  let fats: number;

                  if (foodFromDb) {
                    // Calcular automaticamente
                    const macros = this.calculateMacros(foodFromDb, quantity, unit);
                    calories = macros.calories;
                    protein = macros.protein;
                    carbs = macros.carbs;
                    fats = macros.fats;
                  } else {
                    // Usar valores manuais se fornecidos
                    const manualCalories = this.parseNumber(foodRow['Calorias']);
                    const manualProtein = this.parseNumber(foodRow['Proteínas']);
                    const manualCarbs = this.parseNumber(foodRow['Carboidratos']);
                    const manualFats = this.parseNumber(foodRow['Gorduras']);

                    if (manualCalories !== null && manualProtein !== null && 
                        manualCarbs !== null && manualFats !== null) {
                      calories = manualCalories;
                      protein = manualProtein;
                      carbs = manualCarbs;
                      fats = manualFats;
                    } else {
                      // Alimento não encontrado e sem valores manuais
                      result.warnings.push(
                        `Alimento "${foodName}" não encontrado no banco TACO e sem valores manuais. ` +
                        `Preencha as colunas Calorias, Proteínas, Carboidratos e Gorduras para este alimento.`
                      );
                      continue;
                    }
                  }

                  // Adicionar aos totais
                  mealCalories += calories;
                  mealProtein += protein;
                  mealCarbs += carbs;
                  mealFats += fats;

                  // Criar alimento
                  const foodData = {
                    meal_id: createdMeal.id,
                    food_name: foodName,
                    quantity: quantity,
                    unit: unit,
                    calories: calories,
                    protein: protein,
                    carbs: carbs,
                    fats: fats,
                    notes: null,
                    food_order: foodOrder++,
                  };

                  const { error: foodError } = await supabase
                    .from('diet_foods')
                    .insert(foodData);

                  if (foodError) {
                    result.errors.push(`Erro ao criar alimento "${foodName}": ${foodError.message}`);
                  } else {
                    result.importedFoods++;
                  }
                } catch (error: any) {
                  result.errors.push(`Erro ao processar alimento "${foodRow['Alimento']}": ${error.message}`);
                }
              }

              // Atualizar refeição com totais calculados
              await supabase
                .from('diet_meals')
                .update({
                  calories: Math.round(mealCalories),
                  protein: Math.round(mealProtein * 10) / 10,
                  carbs: Math.round(mealCarbs * 10) / 10,
                  fats: Math.round(mealFats * 10) / 10,
                })
                .eq('id', createdMeal.id);

              // Adicionar aos totais do plano
              totalPlanCalories += mealCalories;
              totalPlanProtein += mealProtein;
              totalPlanCarbs += mealCarbs;
              totalPlanFats += mealFats;

            } catch (error: any) {
              result.errors.push(`Erro ao processar refeição "${mealKey}": ${error.message}`);
            }
          }

          // Atualizar plano com totais calculados
          await supabase
            .from('diet_plans')
            .update({
              total_calories: Math.round(totalPlanCalories),
              total_protein: Math.round(totalPlanProtein * 10) / 10,
              total_carbs: Math.round(totalPlanCarbs * 10) / 10,
              total_fats: Math.round(totalPlanFats * 10) / 10,
            })
            .eq('id', createdPlan.id);

        } catch (error: any) {
          result.errors.push(`Erro ao processar plano "${planName}": ${error.message}`);
        }
      }

      result.success = result.importedPlans > 0;
    } catch (error: any) {
      result.errors.push(`Erro geral: ${error.message}`);
    }

    return result;
  }

  // Helper para converter valores numéricos
  private static parseNumber(value: number | string | undefined): number | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return value;
    const num = parseFloat(String(value).replace(',', '.').replace(/[^\d.,-]/g, ''));
    return isNaN(num) ? null : num;
  }
}
