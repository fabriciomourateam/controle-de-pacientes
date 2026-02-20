import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/integrations/supabase/client';
import { dietService } from './diet-service';

// Types
export interface DietAdjustmentResult {
    id: string;
    checkinId: string;
    patientId: string;
    originalPlanId: string;
    suggestedPlanId: string;
    adjustmentSummary: string;
    feedbackText: string;
    status: 'pending' | 'approved' | 'rejected' | 'applied';
    rawAiResponse: any;
    createdAt: string;
}

export interface DietAdjustmentPromptTemplate {
    id: string;
    name: string;
    description: string;
    prompt_template: string;
    ai_model: string;
    max_tokens: number;
    temperature: number;
    is_active?: boolean;
    is_default?: boolean;
}

interface MealAdjustment {
    meal_name: string;
    action: 'modified' | 'added' | 'removed';
    changes: string;
    foods_changed: Array<{
        food_name: string;
        action: 'added' | 'removed' | 'modified';
        old_value?: string;
        new_value?: string;
        reason: string;
    }>;
}

interface AIAdjustmentResponse {
    adjustments: MealAdjustment[];
    macro_changes: {
        calories: { old: number; new: number; reason: string };
        protein: { old: number; new: number; reason: string };
        carbs: { old: number; new: number; reason: string };
        fats: { old: number; new: number; reason: string };
    };
    feedback_text: string;
    confidence: 'high' | 'medium' | 'low';
    summary: string;
}

// Default prompt template
const DEFAULT_DIET_ADJUSTMENT_PROMPT = `Você é um assistente de nutrição esportiva especializado em ajustes de dieta baseados em check-ins semanais de pacientes.

## DADOS DO PACIENTE
Nome: {patientName}

## CHECK-IN ATUAL
{checkinData}

## DIETA ATUAL DO PACIENTE
{currentDiet}

## DADOS DE EVOLUÇÃO (comparação com check-in anterior)
{evolutionData}

## INSTRUÇÕES
Analise os dados do check-in e a dieta atual. Baseado nas informações, sugira ajustes na dieta.

### REGRAS DE AJUSTE:
1. Se o paciente relata GANHO MUSCULAR ou está no objetivo de HIPERTROFIA → considere AUMENTAR carboidratos
2. Se o paciente relata PERDA DE GORDURA ou está em CUTTING → considere DIMINUIR carboidratos
3. Se o paciente pediu para INCLUIR algum alimento → faça a substituição mantendo macros similares
4. Se o paciente relata FOME em algum horário → redistribua calorias ou aumente fibras/proteínas naquele horário
5. Se o paciente NÃO está conseguindo seguir as refeições → simplifique as opções
6. Se o paciente relata muito stress ou pouco sono → considere manter ou reduzir levemente a restrição calórica
7. Se não houver necessidade de mudança significativa → mantenha a dieta e explique por quê

### FORMATO DE RESPOSTA (OBRIGATÓRIO - RESPONDA EXCLUSIVAMENTE EM JSON):
\`\`\`json
{
  "adjustments": [
    {
      "meal_name": "Nome da refeição modificada",
      "action": "modified|added|removed",
      "changes": "Descrição breve da mudança",
      "foods_changed": [
        {
          "food_name": "Nome do alimento",
          "action": "added|removed|modified",
          "old_value": "valor anterior (se modificado)",
          "new_value": "novo valor (se modificado ou adicionado)",
          "reason": "motivo da mudança"
        }
      ]
    }
  ],
  "macro_changes": {
    "calories": { "old": 0, "new": 0, "reason": "explicação" },
    "protein": { "old": 0, "new": 0, "reason": "explicação" },
    "carbs": { "old": 0, "new": 0, "reason": "explicação" },
    "fats": { "old": 0, "new": 0, "reason": "explicação" }
  },
  "feedback_text": "Texto completo de feedback para o paciente, explicando as mudanças de forma empática e motivacional. Use parágrafos bem estruturados.",
  "confidence": "high|medium|low",
  "summary": "Resumo de 1-2 frases das principais mudanças"
}
\`\`\`

## ESTILO DO FEEDBACK
Use o seguinte modelo como referência de estilo, tom e estrutura para o feedback_text:
{feedbackTemplate}

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional antes ou depois.`;

class DietAIAdjustmentService {
    private anthropic: Anthropic | null = null;

    private getAnthropicClient(): Anthropic {
        if (this.anthropic) return this.anthropic;

        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('VITE_ANTHROPIC_API_KEY não configurada.');
        }

        this.anthropic = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true,
        });

        return this.anthropic;
    }

    private normalizeModel(model: string): string {
        if (model.includes('sonnet')) {
            return 'claude-sonnet-4-5-20250929';
        }
        return model;
    }

    /**
     * Duplica um plano de dieta completo (refeições, alimentos, orientações)
     */
    async duplicateDietPlan(
        planId: string,
        patientId: string,
        newName: string
    ): Promise<string> {
        const planData = await dietService.getById(planId);
        if (!planData) throw new Error('Plano não encontrado');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Create new plan as draft
        const createdPlan = await dietService.create({
            patient_id: patientId,
            user_id: user.id,
            name: newName,
            notes: planData.notes || null,
            total_calories: planData.total_calories || null,
            total_protein: planData.total_protein || null,
            total_carbs: planData.total_carbs || null,
            total_fats: planData.total_fats || null,
            status: 'draft',
        });

        if (!createdPlan?.id) throw new Error('Falha ao criar plano duplicado');

        // Duplicate meals + foods
        if (planData.diet_meals?.length) {
            for (const meal of planData.diet_meals) {
                const createdMeal = await dietService.createMeal({
                    diet_plan_id: createdPlan.id,
                    meal_type: meal.meal_type,
                    meal_name: meal.meal_name,
                    meal_order: meal.meal_order || 0,
                    suggested_time: meal.suggested_time || null,
                    calories: meal.calories || null,
                    protein: meal.protein || null,
                    carbs: meal.carbs || null,
                    fats: meal.fats || null,
                    instructions: meal.instructions || null,
                    day_of_week: meal.day_of_week || null,
                } as any);

                if (!createdMeal?.id) continue;

                if (meal.diet_foods?.length) {
                    for (const food of meal.diet_foods) {
                        try {
                            await dietService.createFood({
                                meal_id: createdMeal.id,
                                food_name: food.food_name || '',
                                quantity: food.quantity || 0,
                                unit: food.unit || 'g',
                                calories: food.calories || null,
                                protein: food.protein || null,
                                carbs: food.carbs || null,
                                fats: food.fats || null,
                                notes: food.notes || null,
                                food_order: food.food_order || 0,
                            });
                        } catch (e) {
                            console.error('Erro ao duplicar alimento:', e);
                        }
                    }
                }
            }
        }

        // Duplicate guidelines
        if (planData.diet_guidelines?.length) {
            for (const g of planData.diet_guidelines) {
                try {
                    await dietService.createGuideline({
                        diet_plan_id: createdPlan.id,
                        guideline_type: g.guideline_type,
                        title: g.title,
                        content: g.content,
                        priority: g.priority || 0,
                    });
                } catch (e) {
                    console.error('Erro ao duplicar orientação:', e);
                }
            }
        }

        return createdPlan.id;
    }

    /**
     * Format checkin data for the AI prompt
     */
    private formatCheckinData(checkin: any): string {
        if (!checkin) return 'Dados do check-in não disponíveis.';

        const lines: string[] = [];
        if (checkin.peso) lines.push(`Peso: ${checkin.peso}kg`);
        if (checkin.medida) lines.push(`Medidas: ${checkin.medida}`);
        if (checkin.treino) lines.push(`Treinos: ${checkin.treino}`);
        if (checkin.cardio) lines.push(`Cardio: ${checkin.cardio}`);
        if (checkin.agua) lines.push(`Água: ${checkin.agua}`);
        if (checkin.sono) lines.push(`Sono: ${checkin.sono}`);
        if (checkin.ref_livre) lines.push(`Refeições livres: ${checkin.ref_livre}`);
        if (checkin.beliscos) lines.push(`Beliscos: ${checkin.beliscos}`);
        if (checkin.oq_comeu_ref_livre) lines.push(`O que comeu na ref. livre: ${checkin.oq_comeu_ref_livre}`);
        if (checkin.oq_beliscou) lines.push(`O que beliscou: ${checkin.oq_beliscou}`);
        if (checkin.comeu_menos) lines.push(`Comeu menos que o planejado: ${checkin.comeu_menos}`);
        if (checkin.fome_algum_horario) lines.push(`Fome em algum horário: ${checkin.fome_algum_horario}`);
        if (checkin.alimento_para_incluir) lines.push(`Alimento para incluir: ${checkin.alimento_para_incluir}`);
        if (checkin.melhora_visual) lines.push(`Melhora visual: ${checkin.melhora_visual}`);
        if (checkin.quais_pontos) lines.push(`Pontos de melhora: ${checkin.quais_pontos}`);
        if (checkin.objetivo) lines.push(`Objetivo: ${checkin.objetivo}`);
        if (checkin.dificuldades) lines.push(`Dificuldades: ${checkin.dificuldades}`);
        if (checkin.stress) lines.push(`Stress: ${checkin.stress}`);
        if (checkin.libido) lines.push(`Libido: ${checkin.libido}`);
        if (checkin.total_pontuacao) lines.push(`Pontuação total: ${checkin.total_pontuacao}`);
        if (checkin.percentual_aproveitamento) lines.push(`Aproveitamento: ${checkin.percentual_aproveitamento}%`);

        return lines.length > 0 ? lines.join('\n') : 'Sem dados relevantes.';
    }

    /**
     * Format diet data for the AI prompt
     */
    private formatDietData(plan: any): string {
        if (!plan) return 'Nenhuma dieta encontrada.';

        const lines: string[] = [];
        lines.push(`Nome: ${plan.name}`);

        if (plan.total_calories) lines.push(`Calorias totais: ${plan.total_calories}kcal`);
        if (plan.total_protein) lines.push(`Proteína total: ${plan.total_protein}g`);
        if (plan.total_carbs) lines.push(`Carboidratos totais: ${plan.total_carbs}g`);
        if (plan.total_fats) lines.push(`Gorduras totais: ${plan.total_fats}g`);

        if (plan.diet_meals?.length) {
            lines.push('\nREFEIÇÕES:');
            for (const meal of plan.diet_meals) {
                lines.push(`\n--- ${meal.meal_name} (${meal.suggested_time || 'sem horário'}) ---`);
                if (meal.calories) lines.push(`  Macros: ${meal.calories}kcal | P:${meal.protein || 0}g | C:${meal.carbs || 0}g | G:${meal.fats || 0}g`);

                if (meal.diet_foods?.length) {
                    for (const food of meal.diet_foods) {
                        const macros = food.calories ? ` (${food.calories}kcal)` : '';
                        lines.push(`  • ${food.food_name}: ${food.quantity}${food.unit}${macros}`);
                    }
                }

                if (meal.instructions) {
                    lines.push(`  Instruções: ${meal.instructions}`);
                }
            }
        }

        return lines.join('\n');
    }

    /**
     * Format evolution data for the AI prompt
     */
    private formatEvolutionData(evolution: any): string {
        if (!evolution) return 'Sem dados de evolução disponíveis.';

        const lines: string[] = [];
        if (evolution.peso_diferenca !== undefined) {
            const sign = evolution.peso_diferenca > 0 ? '+' : '';
            lines.push(`Variação de peso: ${sign}${evolution.peso_diferenca}kg`);
        }
        if (evolution.cintura_diferenca !== undefined) {
            const sign = evolution.cintura_diferenca > 0 ? '+' : '';
            lines.push(`Variação medida: ${sign}${evolution.cintura_diferenca}cm`);
        }
        if (evolution.aderencia !== undefined) {
            lines.push(`Aproveitamento geral: ${evolution.aderencia}%`);
        }

        return lines.length > 0 ? lines.join('\n') : 'Sem dados comparativos.';
    }

    /**
     * Build the AI prompt from template
     */
    private buildPrompt(
        template: string,
        patientName: string,
        checkinData: any,
        dietData: any,
        evolutionData: any,
        feedbackTemplateText?: string
    ): string {
        return template
            .replace(/{patientName}/g, patientName || 'Paciente')
            .replace(/{checkinData}/g, this.formatCheckinData(checkinData))
            .replace(/{currentDiet}/g, this.formatDietData(dietData))
            .replace(/{evolutionData}/g, this.formatEvolutionData(evolutionData))
            .replace(/{objetivo}/g, checkinData?.objetivo || 'Não informado')
            .replace(/{fome_horario}/g, checkinData?.fome_algum_horario || 'Não informado')
            .replace(/{alimento_incluir}/g, checkinData?.alimento_para_incluir || 'Nenhum')
            .replace(/{feedbackTemplate}/g, feedbackTemplateText || 'Gere o feedback com tom motivacional, empático e profissional.');
    }

    /**
     * Parse AI response JSON
     */
    private parseAIResponse(text: string): AIAdjustmentResponse {
        // Try to extract JSON from response
        let jsonStr = text.trim();

        // Remove markdown code fences if present
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        try {
            return JSON.parse(jsonStr);
        } catch {
            // If JSON parsing fails, create a minimal response
            console.error('Failed to parse AI response as JSON, raw response:', text);
            return {
                adjustments: [],
                macro_changes: {
                    calories: { old: 0, new: 0, reason: 'Erro ao processar resposta da IA' },
                    protein: { old: 0, new: 0, reason: '' },
                    carbs: { old: 0, new: 0, reason: '' },
                    fats: { old: 0, new: 0, reason: '' },
                },
                feedback_text: text, // Use raw text as feedback
                confidence: 'low',
                summary: 'A IA não retornou no formato esperado. Revise manualmente.',
            };
        }
    }

    /**
     * Main method: analyze checkin and generate diet adjustment suggestions
     */
    async analyzeAndSuggest(
        checkinId: string,
        patientId: string,
        checkinData: any,
        evolutionData: any,
        patientName: string,
        template?: DietAdjustmentPromptTemplate
    ): Promise<DietAdjustmentResult> {
        // 1. Get the latest active diet plan for this patient
        const plans = await dietService.getByPatientId(patientId);
        const activePlan = plans?.find((p: any) => p.status === 'active') || plans?.[0];

        if (!activePlan) {
            throw new Error('Nenhuma dieta encontrada para este paciente. Crie uma dieta primeiro.');
        }

        // 2. Get full plan data
        const fullPlan = await dietService.getById(activePlan.id);
        if (!fullPlan) throw new Error('Erro ao carregar dados da dieta.');

        // 3. Duplicate the diet
        const today = new Date().toLocaleDateString('pt-BR');
        const suggestedPlanId = await this.duplicateDietPlan(
            activePlan.id,
            patientId,
            `${activePlan.name} - Ajuste IA ${today}`
        );

        // 4. Fetch the user's active checkin feedback template for style reference
        let feedbackTemplateText: string | undefined;
        try {
            const { data: feedbackTpl } = await supabase
                .from('feedback_prompt_templates' as any)
                .select('prompt_template')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();
            if ((feedbackTpl as any)?.prompt_template) {
                feedbackTemplateText = (feedbackTpl as any).prompt_template;
            }
        } catch (e) {
            console.warn('Não foi possível carregar template de feedback:', e);
        }

        // 5. Build prompt and call AI
        const promptTemplate = template?.prompt_template || DEFAULT_DIET_ADJUSTMENT_PROMPT;
        const prompt = this.buildPrompt(
            promptTemplate,
            patientName,
            checkinData,
            fullPlan,
            evolutionData,
            feedbackTemplateText
        );

        const client = this.getAnthropicClient();
        const model = this.normalizeModel(template?.ai_model || 'claude-sonnet-4-5-20250929');

        const response = await client.messages.create({
            model,
            max_tokens: template?.max_tokens || 4096,
            temperature: template?.temperature || 0.3,
            messages: [{ role: 'user', content: prompt }],
        });

        const firstContent = response.content[0];
        if (firstContent.type !== 'text') {
            throw new Error('Resposta da IA não contém texto');
        }

        const aiResponse = this.parseAIResponse(firstContent.text);

        // 6. Apply AI changes to the duplicated diet in the database
        await this.applyAIChangesToDiet(suggestedPlanId, aiResponse);

        // 7. Save the adjustment record
        const { data: { user } } = await supabase.auth.getUser();

        const { data: adjustment, error } = await supabase
            .from('diet_ai_adjustments' as any)
            .insert({
                checkin_id: checkinId,
                patient_id: patientId,
                original_plan_id: activePlan.id,
                suggested_plan_id: suggestedPlanId,
                adjustment_summary: aiResponse.summary,
                feedback_text: aiResponse.feedback_text,
                status: 'pending',
                ai_model: model,
                prompt_template_id: template?.id || null,
                raw_ai_response: aiResponse,
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao salvar ajuste:', error);
            throw new Error('Erro ao salvar sugestão de ajuste.');
        }

        return {
            id: (adjustment as any).id,
            checkinId,
            patientId,
            originalPlanId: activePlan.id,
            suggestedPlanId,
            adjustmentSummary: aiResponse.summary,
            feedbackText: aiResponse.feedback_text,
            status: 'pending',
            rawAiResponse: aiResponse,
            createdAt: (adjustment as any).created_at,
        };
    }

    /**
     * Apply AI-suggested food changes to the duplicated diet plan in the database
     */
    private async applyAIChangesToDiet(suggestedPlanId: string, aiResponse: AIAdjustmentResponse): Promise<void> {
        console.log('🤖 [DietAI] Aplicando ajustes ao plano:', suggestedPlanId);
        console.log('🤖 [DietAI] Ajustes da IA:', JSON.stringify(aiResponse.adjustments, null, 2));

        if (!aiResponse.adjustments?.length) {
            console.log('🤖 [DietAI] Nenhum ajuste para aplicar');
            return;
        }

        // Load the duplicated diet with meals and foods
        const suggestedPlan = await dietService.getById(suggestedPlanId);
        if (!suggestedPlan?.diet_meals?.length) {
            console.warn('🤖 [DietAI] Plano duplicado não tem refeições');
            return;
        }

        console.log('🤖 [DietAI] Refeições no plano duplicado:', suggestedPlan.diet_meals.map((m: any) => m.meal_name));

        for (const adjustment of aiResponse.adjustments) {
            // Fuzzy match: find meal by partial name match (normalize removing accents + lowercase)
            const normalizedAdjMeal = this.normalizeText(adjustment.meal_name);
            const targetMeal = suggestedPlan.diet_meals.find((m: any) => {
                const normalizedDbMeal = this.normalizeText(m.meal_name || '');
                return normalizedDbMeal === normalizedAdjMeal
                    || normalizedDbMeal.includes(normalizedAdjMeal)
                    || normalizedAdjMeal.includes(normalizedDbMeal);
            });

            if (!targetMeal) {
                console.warn(`🤖 [DietAI] Refeição "${adjustment.meal_name}" NÃO encontrada. Disponíveis:`, suggestedPlan.diet_meals.map((m: any) => m.meal_name));
                continue;
            }

            console.log(`🤖 [DietAI] Match: "${adjustment.meal_name}" → "${targetMeal.meal_name}" (${targetMeal.diet_foods?.length || 0} alimentos)`);

            if (!adjustment.foods_changed?.length) continue;

            for (const foodChange of adjustment.foods_changed) {
                console.log(`🤖 [DietAI] Processando: ${foodChange.action} "${foodChange.food_name}" → "${foodChange.new_value || 'N/A'}"`);

                if (foodChange.action === 'modified' && foodChange.new_value) {
                    const targetFood = this.findFoodByName(targetMeal.diet_foods || [], foodChange.food_name);

                    if (targetFood?.id) {
                        const updates = this.parseNewFoodValue(foodChange.new_value);
                        console.log(`🤖 [DietAI] Atualizando "${targetFood.food_name}" (${targetFood.id}):`, updates);

                        if (Object.keys(updates).length > 0) {
                            const { error } = await supabase
                                .from('diet_foods')
                                .update(updates)
                                .eq('id', targetFood.id);

                            if (error) {
                                console.error('🤖 [DietAI] Erro ao atualizar alimento:', error);
                            } else {
                                console.log('🤖 [DietAI] ✅ Alimento atualizado com sucesso');
                            }
                        } else {
                            console.warn(`🤖 [DietAI] Não conseguiu parsear new_value: "${foodChange.new_value}"`);
                        }
                    } else {
                        console.warn(`🤖 [DietAI] Alimento "${foodChange.food_name}" NÃO encontrado na refeição "${targetMeal.meal_name}". Disponíveis:`,
                            (targetMeal.diet_foods || []).map((f: any) => f.food_name));
                    }
                } else if (foodChange.action === 'added') {
                    const parsed = this.parseNewFoodValue(foodChange.new_value || '100g');
                    console.log(`🤖 [DietAI] Adicionando "${foodChange.food_name}" à refeição "${targetMeal.meal_name}":`, parsed);
                    try {
                        await dietService.createFood({
                            meal_id: targetMeal.id,
                            food_name: foodChange.food_name,
                            quantity: parsed.quantity || 0,
                            unit: parsed.unit || 'g',
                            calories: parsed.calories || null,
                            protein: null,
                            carbs: null,
                            fats: null,
                            notes: foodChange.reason || null,
                            food_order: (targetMeal.diet_foods?.length || 0) + 1,
                        });
                        console.log('🤖 [DietAI] ✅ Alimento adicionado com sucesso');
                    } catch (e) {
                        console.error('🤖 [DietAI] Erro ao adicionar alimento:', e);
                    }
                } else if (foodChange.action === 'removed') {
                    const targetFood = this.findFoodByName(targetMeal.diet_foods || [], foodChange.food_name);
                    if (targetFood?.id) {
                        console.log(`🤖 [DietAI] Removendo "${targetFood.food_name}" (${targetFood.id})`);
                        const { error } = await supabase
                            .from('diet_foods')
                            .delete()
                            .eq('id', targetFood.id);

                        if (error) {
                            console.error('🤖 [DietAI] Erro ao remover alimento:', error);
                        } else {
                            console.log('🤖 [DietAI] ✅ Alimento removido com sucesso');
                        }
                    }
                }
            }
        }

        // Update plan-level macro totals if AI provided them
        if (aiResponse.macro_changes) {
            const mc = aiResponse.macro_changes;
            if (mc.calories?.new || mc.protein?.new || mc.carbs?.new || mc.fats?.new) {
                console.log('🤖 [DietAI] Atualizando macros do plano:', {
                    calories: mc.calories?.new,
                    protein: mc.protein?.new,
                    carbs: mc.carbs?.new,
                    fats: mc.fats?.new,
                });
                await dietService.update(suggestedPlanId, {
                    total_calories: mc.calories?.new || null,
                    total_protein: mc.protein?.new || null,
                    total_carbs: mc.carbs?.new || null,
                    total_fats: mc.fats?.new || null,
                });
            }
        }
    }

    /**
     * Normalize text for comparison: lowercase, remove accents, trim
     */
    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    /**
     * Find a food by fuzzy name matching (partial match, accent-insensitive)
     */
    private findFoodByName(foods: any[], searchName: string): any | null {
        const normalized = this.normalizeText(searchName);

        // 1. Exact match (normalized)
        let found = foods.find((f: any) => this.normalizeText(f.food_name || '') === normalized);
        if (found) return found;

        // 2. DB food name contains AI food name
        found = foods.find((f: any) => this.normalizeText(f.food_name || '').includes(normalized));
        if (found) return found;

        // 3. AI food name contains DB food name
        found = foods.find((f: any) => normalized.includes(this.normalizeText(f.food_name || '')));
        if (found) return found;

        // 4. First word match (e.g. "Arroz" matches "Arroz branco ou integral cozido")
        const firstWord = normalized.split(/\s+/)[0];
        if (firstWord.length >= 4) {
            found = foods.find((f: any) => this.normalizeText(f.food_name || '').startsWith(firstWord));
            if (found) return found;
        }

        return null;
    }

    /**
     * Parse a food value string into database updates
     * Handles formats: "120g", "80g", "3unidade", "50g (80kcal)", "30g · 180kcal", 
     * "reduzir para 80g", "aumentar para 150g", etc.
     */
    private parseNewFoodValue(value: string): Record<string, any> {
        const updates: Record<string, any> = {};
        const cleaned = value.toLowerCase().trim();

        // Extract calories: "80kcal", "· 180kcal", "(80kcal)"
        const calMatch = cleaned.match(/(\d+)\s*kcal/i);
        if (calMatch) {
            updates.calories = parseInt(calMatch[1]);
        }

        // Extract quantity and unit from various formats
        // "120g", "80g", "3unidade", "2 unidade", "50ml"
        // Also: "reduzir para 80g", "aumentar para 150g"
        const qtyPatterns = [
            /(\d+(?:[.,]\d+)?)\s*(g|ml|unidade|un|fatia|colher|xicara|copo|livre|porcao|kg)\b/i,
            /para\s+(\d+(?:[.,]\d+)?)\s*(g|ml|unidade|un|fatia|colher|xicara|copo|livre|porcao|kg)\b/i,
            /^(\d+(?:[.,]\d+)?)\s*(g|ml|unidade|un|fatia|colher|xicara|copo|livre|porcao|kg)?\s*[·\-\(]/i,
            /(\d+(?:[.,]\d+)?)\s*(g)\b/i, // Fallback: just number + g
        ];

        for (const pattern of qtyPatterns) {
            const match = cleaned.match(pattern);
            if (match) {
                updates.quantity = parseFloat(match[1].replace(',', '.'));
                if (match[2]) {
                    updates.unit = match[2].toLowerCase();
                }
                break;
            }
        }

        console.log(`🤖 [DietAI] parseNewFoodValue("${value}") →`, updates);
        return updates;
    }

    /**
     * Get existing adjustment for a checkin
     */
    async getAdjustmentForCheckin(checkinId: string): Promise<DietAdjustmentResult | null> {
        const { data, error } = await supabase
            .from('diet_ai_adjustments' as any)
            .select('*')
            .eq('checkin_id', checkinId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;

        const d = data as any;
        return {
            id: d.id,
            checkinId: d.checkin_id,
            patientId: d.patient_id,
            originalPlanId: d.original_plan_id,
            suggestedPlanId: d.suggested_plan_id,
            adjustmentSummary: d.adjustment_summary,
            feedbackText: d.feedback_text,
            status: d.status,
            rawAiResponse: d.raw_ai_response,
            createdAt: d.created_at,
        };
    }

    /**
     * Approve an adjustment and optionally activate the suggested diet
     */
    async approveAdjustment(adjustmentId: string, activateDiet: boolean = false): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('diet_ai_adjustments' as any)
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.id,
            })
            .eq('id', adjustmentId);

        if (error) throw error;

        if (activateDiet) {
            // Get the adjustment to know the suggested plan
            const { data } = await supabase
                .from('diet_ai_adjustments' as any)
                .select('suggested_plan_id')
                .eq('id', adjustmentId)
                .single();

            if (data) {
                await dietService.release((data as any).suggested_plan_id);
            }
        }
    }

    /**
     * Reject an adjustment
     */
    async rejectAdjustment(adjustmentId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('diet_ai_adjustments' as any)
            .update({
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.id,
            })
            .eq('id', adjustmentId);

        if (error) throw error;
    }

    /**
     * Update the feedback text of an existing adjustment
     */
    async updateFeedbackText(adjustmentId: string, feedbackText: string): Promise<void> {
        const { error } = await supabase
            .from('diet_ai_adjustments' as any)
            .update({ feedback_text: feedbackText })
            .eq('id', adjustmentId);

        if (error) throw error;
    }

    /**
     * Get active prompt template
     */
    async getActiveTemplate(): Promise<DietAdjustmentPromptTemplate | null> {
        const { data, error } = await supabase
            .from('diet_adjustment_prompt_templates' as any)
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;
        return data as any;
    }
}

export const dietAIAdjustmentService = new DietAIAdjustmentService();
export { DEFAULT_DIET_ADJUSTMENT_PROMPT };
export type { AIAdjustmentResponse, MealAdjustment };
