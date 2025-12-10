import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { DailyChallengesWidget } from '@/components/diets/DailyChallengesWidget';
import { WeeklyProgressChart } from '@/components/diets/WeeklyProgressChart';
import { GamificationWidget } from '@/components/diets/GamificationWidget';
import { PatientEvolutionTab } from '@/components/diets/PatientEvolutionTab';
import { 
  Utensils, 
  Calendar, 
  Check, 
  Plus, 
  ChevronRight, 
  CheckCircle, 
  Package, 
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { dietConsumptionService } from '@/lib/diet-consumption-service';
import { useToast } from '@/hooks/use-toast';

interface PatientDietPortalProps {
  patientId: string;
  patientName: string;
  checkins?: any[];
  patient?: any;
  bodyCompositions?: any[];
  achievements?: any[];
}

export function PatientDietPortal({ 
  patientId, 
  patientName,
  checkins,
  patient,
  bodyCompositions,
  achievements
}: PatientDietPortalProps) {
  const { toast } = useToast();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consumedMeals, setConsumedMeals] = useState<Set<string>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDietData();
  }, [patientId]);

  useEffect(() => {
    // Carregar refeições consumidas do localStorage
    const today = new Date().toISOString().split('T')[0];
    const key = `consumedMeals_${patientId}_${today}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setConsumedMeals(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Erro ao carregar refeições consumidas:', e);
      }
    }
  }, [patientId]);

  const loadDietData = async () => {
    try {
      setLoading(true);
      
      // Buscar planos do paciente
      const plans = await dietService.getByPatientId(patientId);
      
      // Encontrar plano ativo
      const active = plans.find((p: any) => p.status === 'active' || p.active);
      
      if (active) {
        setActivePlan(active);
        
        // Buscar detalhes completos do plano
        const details = await dietService.getById(active.id);
        setPlanDetails(details);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da dieta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da dieta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMealConsumed = async (mealId: string) => {
    const newConsumedMeals = new Set(consumedMeals);
    
    if (newConsumedMeals.has(mealId)) {
      newConsumedMeals.delete(mealId);
    } else {
      newConsumedMeals.add(mealId);
    }
    
    setConsumedMeals(newConsumedMeals);
    
    // Salvar no localStorage
    const today = new Date().toISOString().split('T')[0];
    const key = `consumedMeals_${patientId}_${today}`;
    localStorage.setItem(key, JSON.stringify(Array.from(newConsumedMeals)));
    
    // Sincronizar com banco de dados
    if (planDetails) {
      try {
        await dietConsumptionService.saveDailyConsumption(
          patientId,
          planDetails.id,
          Array.from(newConsumedMeals),
          planDetails
        );
        
        // Verificar conquistas
        await dietConsumptionService.checkAndUnlockAchievements(patientId);
      } catch (error) {
        console.error('Erro ao salvar consumo:', error);
      }
    }
  };

  const calcularTotais = (plan: any) => {
    if (!plan || !plan.diet_meals) {
      return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
    }
    return calcularTotaisPlano(plan);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!activePlan || !planDetails) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <CardContent className="p-8 text-center">
          <Utensils className="w-16 h-16 text-[#777777] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-[#222222] mb-2">Nenhum Plano Alimentar Ativo</h3>
          <p className="text-[#777777]">
            Seu nutricionista ainda não liberou um plano alimentar para você.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totais = calcularTotais(planDetails);
  const metaCalorias = totais.calorias;
  const metaCarboidratos = totais.carboidratos;
  const metaProteinas = totais.proteinas;
  const metaGorduras = totais.gorduras;

  let caloriasConsumidas = 0;
  let carboidratosConsumidos = 0;
  let proteinasConsumidas = 0;
  let gordurasConsumidas = 0;

  if (planDetails.diet_meals && consumedMeals.size > 0) {
    planDetails.diet_meals.forEach((meal: any) => {
      if (consumedMeals.has(meal.id)) {
        const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
        caloriasConsumidas += mealTotals.calorias;
        carboidratosConsumidos += mealTotals.carboidratos;
        proteinasConsumidas += mealTotals.proteinas;
        gordurasConsumidas += mealTotals.gorduras;
      }
    });
  }

  const caloriasRestantes = Math.max(0, metaCalorias - caloriasConsumidas);
  const percentualConsumido = metaCalorias > 0 ? Math.min(100, (caloriasConsumidas / metaCalorias) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Abas: Plano Alimentar, Metas, Progresso, Conquistas e Minha Evolução */}
      <Tabs defaultValue="diet" className="w-full">
        <TabsList className="sticky top-0 z-50 flex w-full flex-wrap bg-slate-800/95 backdrop-blur-md gap-1 p-1 border-b border-slate-700/50 shadow-lg">
          <TabsTrigger value="diet" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 flex-1 min-w-[120px]">
            Plano Alimentar
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 flex-1 min-w-[80px]">
            Metas
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 flex-1 min-w-[100px]">
            Progresso
          </TabsTrigger>
          <TabsTrigger value="gamification" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 flex-1 min-w-[100px]">
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="evolution" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 flex-1 min-w-[140px]">
            Minha Evolução
          </TabsTrigger>
        </TabsList>
        
        {/* Aba: Plano Alimentar */}
        <TabsContent value="diet" className="mt-6 space-y-6">
          {/* Resumo de Calorias e Macros */}
          <Card className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                {/* Círculo de Progresso de Calorias */}
                <div className="relative w-48 h-48 mb-4">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="#00C98A"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 84}`}
                      strokeDashoffset={`${2 * Math.PI * 84 * (1 - percentualConsumido / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-[#222222]">{Math.round(caloriasRestantes)}</p>
                    <p className="text-sm text-[#777777] mt-1">Kcal restantes</p>
                  </div>
                </div>
                
                {/* Informações de Consumo */}
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#222222]">{Math.round(caloriasConsumidas)}</p>
                    <p className="text-xs text-[#777777] mt-1">Consumidas</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div>
                    <p className="text-2xl font-bold text-[#222222]">{Math.round(metaCalorias)}</p>
                    <p className="text-xs text-[#777777] mt-1">Meta do dia</p>
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#222222]">
                    {carboidratosConsumidos.toFixed(0)} / {metaCarboidratos.toFixed(0)}g
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Carboidratos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#222222]">
                    {proteinasConsumidas.toFixed(0)} / {metaProteinas.toFixed(0)}g
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Proteínas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#222222]">
                    {gordurasConsumidas.toFixed(0)} / {metaGorduras.toFixed(0)}g
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Gorduras</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refeições */}
          {planDetails.diet_meals && planDetails.diet_meals.length > 0 && (
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#222222] flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-[#00C98A]" />
                      Hoje
                    </CardTitle>
                    <p className="text-sm text-[#777777] mt-1">
                      {consumedMeals.size} de {planDetails.diet_meals.length} refeições consumidas
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#777777]">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
                
                {/* Barra de Progresso Geral */}
                <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#00C98A] to-[#00A875] h-full rounded-full transition-all duration-500"
                    style={{ width: `${(consumedMeals.size / planDetails.diet_meals.length) * 100}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {planDetails.diet_meals
                    .sort((a: any, b: any) => (a.meal_order || 0) - (b.meal_order || 0))
                    .map((meal: any, index: number) => {
                      const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
                      const isConsumed = consumedMeals.has(meal.id);
                      const isExpanded = expandedMeals.has(meal.id);
                      
                      return (
                        <Collapsible
                          key={meal.id || index}
                          open={isExpanded}
                          onOpenChange={(open) => {
                            setExpandedMeals(prev => {
                              const newSet = new Set(prev);
                              if (open) {
                                newSet.add(meal.id);
                              } else {
                                newSet.delete(meal.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <div 
                            className={`bg-white rounded-xl border transition-all duration-200 ${
                              isConsumed 
                                ? 'border-[#00C98A]/50 bg-[#00C98A]/5' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-xl transition-colors">
                                <div className="flex items-center gap-3 flex-1">
                                  <div 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                      isConsumed
                                        ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875]'
                                        : 'bg-gray-200'
                                    }`}
                                  >
                                    {isConsumed ? (
                                      <Check className="w-5 h-5 text-white" />
                                    ) : (
                                      <Utensils className="w-5 h-5 text-[#777777]" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-base font-semibold transition-colors ${
                                      isConsumed ? 'text-[#00C98A]' : 'text-[#222222]'
                                    }`}>
                                      {meal.meal_name}
                                    </h4>
                                    {meal.suggested_time && (
                                      <p className="text-xs text-[#777777] mt-0.5">
                                        {meal.suggested_time}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3 flex-shrink-0">
                                  <div>
                                    <p className={`text-sm font-semibold transition-colors ${
                                      isConsumed ? 'text-[#00C98A]' : 'text-[#222222]'
                                    }`}>
                                      {isConsumed ? mealTotals.calorias : 0} / {mealTotals.calorias}kcal
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleMealConsumed(meal.id);
                                    }}
                                    className={`w-10 h-10 p-0 rounded-full transition-all duration-200 ${
                                      isConsumed
                                        ? 'bg-gradient-to-br from-[#00C98A] to-[#00A875] hover:from-[#00A875] hover:to-[#00C98A] text-white shadow-md'
                                        : 'bg-gray-200 hover:bg-gray-300 text-[#777777] border border-gray-300'
                                    }`}
                                  >
                                    {isConsumed ? (
                                      <Check className="w-5 h-5" />
                                    ) : (
                                      <Plus className="w-5 h-5" />
                                    )}
                                  </Button>
                                  <ChevronRight 
                                    className={`w-5 h-5 text-[#777777] transition-transform duration-200 ${
                                      isExpanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className={`px-4 pb-4 space-y-3 transition-all duration-300 ${isConsumed ? 'opacity-75' : ''}`}>
                                {meal.diet_foods && meal.diet_foods.length > 0 ? (
                                  <div className="space-y-2">
                                    {meal.diet_foods.map((food: any, foodIndex: number) => {
                                      let substitutions: any[] = [];
                                      try {
                                        if (food.notes) {
                                          const parsed = JSON.parse(food.notes);
                                          if (parsed.substitutions && Array.isArray(parsed.substitutions)) {
                                            substitutions = parsed.substitutions;
                                          }
                                        }
                                      } catch (e) {
                                        // Se não for JSON válido, não há substituições
                                      }
                                      
                                      return (
                                        <div 
                                          key={food.id || foodIndex} 
                                          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                            isConsumed
                                              ? 'bg-[#00C98A]/10 border-[#00C98A]/30'
                                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3 flex-1">
                                            {isConsumed && (
                                              <CheckCircle className="w-4 h-4 text-[#00C98A] flex-shrink-0" />
                                            )}
                                            <span className={`font-medium text-sm ${
                                              isConsumed ? 'text-[#00C98A] line-through' : 'text-[#222222]'
                                            }`}>
                                              {food.food_name} - {food.quantity} {food.unit}
                                            </span>
                                            {substitutions.length > 0 && !isConsumed && (
                                              <Badge className="bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30 text-xs">
                                                {substitutions.length} substitutos
                                              </Badge>
                                            )}
                                          </div>
                                          {food.calories && (
                                            <span className={`text-xs font-medium ${
                                              isConsumed ? 'text-[#00C98A]' : 'text-[#777777]'
                                            }`}>
                                              {food.calories} kcal
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-[#777777] text-center py-4">Nenhum alimento adicionado</p>
                                )}
                                {meal.instructions && (
                                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-700 font-medium mb-1 flex items-center gap-2">
                                      <AlertTriangle className="w-3 h-3" />
                                      Instruções:
                                    </p>
                                    <p className="text-sm text-amber-800 leading-relaxed">{meal.instructions}</p>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orientações */}
          {planDetails.diet_guidelines && planDetails.diet_guidelines.length > 0 && (
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader>
                <CardTitle className="text-[#222222] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#00C98A]" />
                  Orientações ({planDetails.diet_guidelines.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planDetails.diet_guidelines.map((guideline: any, index: number) => (
                    <div 
                      key={guideline.id || index} 
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                    >
                      <p className="font-semibold text-[#222222] mb-2">{guideline.title}</p>
                      <p className="text-sm text-[#777777] leading-relaxed mb-3">{guideline.content}</p>
                      <Badge className="bg-[#00C98A]/20 text-[#00C98A] border-[#00C98A]/30">
                        {guideline.guideline_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Aba: Metas */}
        <TabsContent value="challenges" className="mt-6">
          <DailyChallengesWidget patientId={patientId} />
        </TabsContent>
        
        {/* Aba: Progresso */}
        <TabsContent value="progress" className="mt-6">
          <WeeklyProgressChart patientId={patientId} />
        </TabsContent>
        
        {/* Aba: Conquistas */}
        <TabsContent value="gamification" className="mt-6">
          <GamificationWidget patientId={patientId} />
        </TabsContent>
        
        {/* Aba: Minha Evolução */}
        <TabsContent value="evolution" className="mt-6">
          <PatientEvolutionTab 
            patientId={patientId}
            checkins={checkins}
            patient={patient}
            bodyCompositions={bodyCompositions}
            achievements={achievements}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

