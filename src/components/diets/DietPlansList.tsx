import { useDietPlans } from '@/hooks/use-diet-plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Utensils, Calendar, Eye, Edit, X, CheckCircle, History, Star, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DietPlanForm } from './DietPlanForm';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { dietService } from '@/lib/diet-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calcularTotaisPlano } from '@/utils/diet-calculations';

interface DietPlansListProps {
  patientId: string;
}

export function DietPlansList({ patientId }: DietPlansListProps) {
  const { plans, loading, error, releasePlan, refetch } = useDietPlans(patientId);
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [patientUserId, setPatientUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [activePlan, setActivePlan] = useState<any>(null);
  const [patientWeight, setPatientWeight] = useState<number | null>(null);

  // Buscar user_id e peso do paciente
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const { data } = await supabase
          .from('patients')
          .select('user_id, peso_inicial, telefone')
          .eq('id', patientId)
          .single();
        
        if (data) {
          setPatientUserId(data.user_id);
          // Tentar obter peso do paciente (peso_inicial ou do último checkin)
          if (data.peso_inicial) {
            const peso = parseFloat(data.peso_inicial.toString().replace(',', '.'));
            if (!isNaN(peso) && peso > 0) {
              setPatientWeight(peso);
            }
          }
          
          // Se não tiver peso_inicial, buscar do último checkin
          if (!data.peso_inicial && data.telefone) {
            const { data: checkins } = await supabase
              .from('checkin')
              .select('peso')
              .eq('telefone', data.telefone)
              .order('data_checkin', { ascending: false })
              .limit(1)
              .single();
            
            if (checkins?.peso) {
              const peso = parseFloat(checkins.peso.toString().replace(',', '.'));
              if (!isNaN(peso) && peso > 0) {
                setPatientWeight(peso);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do paciente:', error);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  // Listener para evento de abrir formulário
  useEffect(() => {
    const handleOpenForm = (event: CustomEvent) => {
      if (event.detail.patientId === patientId) {
        setIsFormOpen(true);
      }
    };

    window.addEventListener('open-diet-plan-form' as any, handleOpenForm as EventListener);
    return () => {
      window.removeEventListener('open-diet-plan-form' as any, handleOpenForm as EventListener);
    };
  }, [patientId]);

  // Encontrar plano ativo
  useEffect(() => {
    const active = plans.find((p: any) => p.status === 'active' || p.active);
    setActivePlan(active || null);
  }, [plans]);

  const handleRelease = async (planId: string, planName: string) => {
    if (!confirm(`Deseja liberar o plano "${planName}" para o paciente?`)) {
      return;
    }

    try {
      await releasePlan(planId);
      toast({
        title: 'Plano liberado!',
        description: `O plano "${planName}" foi liberado para o paciente.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Erro ao liberar plano',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao liberar o plano.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = async (plan: any) => {
    try {
      setSelectedPlan(plan);
      // Buscar detalhes completos do plano
      const details = await dietService.getById(plan.id);
      setPlanDetails(details);
      setIsDetailsOpen(true);
    } catch (err) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao carregar os detalhes do plano.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditOpen(true);
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${planName}"?\n\nEsta ação não pode ser desfeita e irá deletar todas as refeições, alimentos e orientações associadas.`)) {
      return;
    }

    try {
      await dietService.delete(planId);
      toast({
        title: 'Plano deletado!',
        description: `O plano "${planName}" foi deletado com sucesso.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Erro ao deletar plano',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao deletar o plano.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro: {error}</p>
          <Button onClick={refetch} variant="outline" className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Separar planos ativos e inativos
  const activePlans = plans.filter((p: any) => p.status === 'active' || p.active);
  const inactivePlans = plans.filter((p: any) => p.status !== 'active' && !p.active);

  // Calcular totais do plano ativo
  const calcularTotais = (plan: any) => {
    if (!plan) return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
    return calcularTotaisPlano(plan);
  };

  return (
    <div className="space-y-4">
      {/* Botão para criar novo plano */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Plano
        </Button>
      </div>

      {/* Tabs para Plano Ativo e Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            <CheckCircle className="h-4 w-4 mr-2" />
            Plano Ativo
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Histórico ({inactivePlans.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Plano Ativo */}
        <TabsContent value="active" className="space-y-4">
          {activePlans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Utensils className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Nenhum plano alimentar cadastrado ainda.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Os planos criados via N8N ou manualmente aparecerão aqui.
            </p>
            <Button
              onClick={() => setIsFormOpen(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activePlans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2 text-cyan-300">
                  {plan.name}
                  <Badge 
                    variant={
                      plan.status === 'active' ? 'default' :
                      plan.status === 'draft' ? 'secondary' : 'outline'
                    }
                    className="border-cyan-500/30"
                  >
                    {plan.status === 'active' ? 'Ativo' :
                     plan.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                  </Badge>
                </CardTitle>
                {plan.notes && (
                  <CardDescription className="mt-2 text-cyan-200/70">
                    {plan.notes}
                  </CardDescription>
                )}
                {plan.released_at && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-cyan-200/60">
                    <Calendar className="w-3 h-3" />
                    <span>Liberado em: {new Date(plan.released_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // Calcular totais reais da dieta
              const totais = calcularTotaisPlano(plan);
              
              // Calcular gramas por kg se tiver peso do paciente
              const proteinPerKg = patientWeight && patientWeight > 0 
                ? (totais.proteinas / patientWeight).toFixed(1) 
                : null;
              const carbsPerKg = patientWeight && patientWeight > 0 
                ? (totais.carboidratos / patientWeight).toFixed(1) 
                : null;
              const fatsPerKg = patientWeight && patientWeight > 0 
                ? (totais.gorduras / patientWeight).toFixed(1) 
                : null;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                  <div>
                    <p className="text-sm text-cyan-200/70">Calorias</p>
                    <p className="text-lg font-semibold text-cyan-300">{totais.calorias} kcal</p>
                    <p className="text-xs text-cyan-200/60 mt-1">Total da dieta</p>
                  </div>
                  <div>
                    <p className="text-sm text-cyan-200/70">Proteína</p>
                    <p className="text-lg font-semibold text-cyan-300">{totais.proteinas.toFixed(1)}g</p>
                    {proteinPerKg && (
                      <p className="text-xs text-cyan-200/60 mt-1">{proteinPerKg}g/kg</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-cyan-200/70">Carboidratos</p>
                    <p className="text-lg font-semibold text-cyan-300">{totais.carboidratos.toFixed(1)}g</p>
                    {carbsPerKg && (
                      <p className="text-xs text-cyan-200/60 mt-1">{carbsPerKg}g/kg</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-cyan-200/70">Gorduras</p>
                    <p className="text-lg font-semibold text-cyan-300">{totais.gorduras.toFixed(1)}g</p>
                    {fatsPerKg && (
                      <p className="text-xs text-cyan-200/60 mt-1">{fatsPerKg}g/kg</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {plan.diet_meals && plan.diet_meals.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-cyan-200/70">Refeições ({plan.diet_meals.length})</p>
                <div className="flex flex-wrap gap-2">
                  {plan.diet_meals.map((meal: any) => (
                    <Badge key={meal.id} variant="outline" className="text-xs border-cyan-500/30 text-cyan-200">
                      {meal.meal_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {plan.diet_guidelines && plan.diet_guidelines.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-cyan-200/70">Orientações ({plan.diet_guidelines.length})</p>
                <div className="space-y-1">
                  {plan.diet_guidelines.slice(0, 3).map((guideline: any) => (
                    <p key={guideline.id} className="text-xs text-cyan-200/60">
                      • {guideline.title}
                    </p>
                  ))}
                  {plan.diet_guidelines.length > 3 && (
                    <p className="text-xs text-cyan-200/60">
                      +{plan.diet_guidelines.length - 3} mais orientações
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-cyan-500/20">
              {plan.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={() => handleRelease(plan.id, plan.name)}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg text-white"
                >
                  Liberar para Paciente
                </Button>
              )}
              {plan.status === 'active' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      await supabase
                        .from('diet_plans')
                        .update({ status: 'draft', active: false })
                        .eq('id', plan.id);
                      
                      toast({
                        title: 'Plano desativado!',
                        description: 'O plano foi desativado com sucesso.',
                      });
                      refetch();
                    } catch (err) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao desativar plano',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Desativar
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  try {
                    await supabase
                      .from('diet_plans')
                      .update({ favorite: !plan.favorite })
                      .eq('id', plan.id);
                    
                    toast({
                      title: plan.favorite ? 'Removido dos favoritos!' : 'Adicionado aos favoritos!',
                      description: plan.favorite 
                        ? 'O plano foi removido dos favoritos.' 
                        : 'O plano foi adicionado aos favoritos.',
                    });
                    refetch();
                  } catch (err) {
                    toast({
                      title: 'Erro',
                      description: 'Erro ao atualizar favorito',
                      variant: 'destructive',
                    });
                  }
                }}
                className={plan.favorite ? "text-yellow-400 hover:text-yellow-300" : ""}
              >
                <Star className={`w-4 h-4 mr-2 ${plan.favorite ? 'fill-yellow-400' : ''}`} />
                {plan.favorite ? 'Favorito' : 'Favoritar'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  try {
                    // Buscar dados completos do plano
                    const planData = await dietService.getById(plan.id);
                    if (!planData) return;
                    
                    // Criar novo plano duplicado
                    const newPlan = {
                      patient_id: patientId,
                      name: `${planData.name} (Cópia)`,
                      notes: planData.notes || null,
                      total_calories: planData.total_calories || null,
                      total_protein: planData.total_protein || null,
                      total_carbs: planData.total_carbs || null,
                      total_fats: planData.total_fats || null,
                      status: 'draft' as const,
                      active: false,
                      favorite: false,
                    };
                    
                    const createdPlan = await dietService.create(newPlan);
                    
                    // Duplicar refeições
                    if (planData.diet_meals && planData.diet_meals.length > 0) {
                      for (const meal of planData.diet_meals) {
                        const newMeal = {
                          diet_plan_id: createdPlan.id,
                          meal_type: meal.meal_type,
                          meal_name: meal.meal_name,
                          meal_order: meal.meal_order,
                          suggested_time: meal.suggested_time || null,
                          calories: meal.calories || null,
                          protein: meal.protein || null,
                          carbs: meal.carbs || null,
                          fats: meal.fats || null,
                          instructions: meal.instructions || null,
                          day_of_week: meal.day_of_week || null,
                        };
                        
                        const createdMeal = await dietService.createMeal(newMeal);
                        
                        // Duplicar alimentos
                        if (meal.diet_foods && meal.diet_foods.length > 0) {
                          for (const food of meal.diet_foods) {
                            await dietService.createFood({
                              diet_meal_id: createdMeal.id,
                              food_name: food.food_name || food.name,
                              quantity: food.quantity,
                              unit: food.unit,
                              calories: food.calories || null,
                              protein: food.protein || null,
                              carbs: food.carbs || null,
                              fats: food.fats || null,
                              notes: food.notes || null,
                              food_order: food.food_order || 0,
                            });
                          }
                        }
                      }
                    }
                    
                    // Duplicar orientações
                    if (planData.diet_guidelines && planData.diet_guidelines.length > 0) {
                      for (const guideline of planData.diet_guidelines) {
                        await dietService.createGuideline({
                          diet_plan_id: createdPlan.id,
                          guideline_type: guideline.guideline_type,
                          title: guideline.title,
                          content: guideline.content,
                          priority: guideline.priority || 'medium',
                        });
                      }
                    }
                    
                    toast({
                      title: 'Plano duplicado!',
                      description: 'O plano foi duplicado com sucesso.',
                    });
                    refetch();
                  } catch (err) {
                    console.error('Erro ao duplicar plano:', err);
                    toast({
                      title: 'Erro',
                      description: 'Erro ao duplicar plano',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleViewDetails(plan)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleEdit(plan)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDelete(plan.id, plan.name)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            </div>
          </CardContent>
        </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history" className="space-y-4">
          {inactivePlans.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <History className="w-12 h-12 mx-auto mb-4 text-cyan-200/60" />
                <p className="text-cyan-200/70">Nenhum plano no histórico.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {inactivePlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          {plan.name}
                          <Badge variant="outline">Inativo</Badge>
                        </CardTitle>
                        {plan.notes && (
                          <CardDescription className="mt-2">{plan.notes}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            // Ativar plano
                            try {
                              // Desativar todos os planos
                              await supabase
                                .from('diet_plans')
                                .update({ status: 'draft', active: false })
                                .eq('patient_id', patientId);
                              
                              // Ativar este plano
                              await supabase
                                .from('diet_plans')
                                .update({ status: 'active', active: true })
                                .eq('id', plan.id);
                              
                              toast({
                                title: 'Plano ativado!',
                                description: 'O plano foi ativado com sucesso.',
                              });
                              refetch();
                              setActiveTab('active');
                            } catch (err) {
                              toast({
                                title: 'Erro',
                                description: 'Erro ao ativar plano',
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ativar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(plan.id, plan.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Calcular totais reais da dieta
                      const totais = calcularTotaisPlano(plan);
                      
                      // Calcular gramas por kg se tiver peso do paciente
                      const proteinPerKg = patientWeight && patientWeight > 0 
                        ? (totais.proteinas / patientWeight).toFixed(1) 
                        : null;
                      const carbsPerKg = patientWeight && patientWeight > 0 
                        ? (totais.carboidratos / patientWeight).toFixed(1) 
                        : null;
                      const fatsPerKg = patientWeight && patientWeight > 0 
                        ? (totais.gorduras / patientWeight).toFixed(1) 
                        : null;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                          <div>
                            <p className="text-sm text-cyan-200/70">Calorias</p>
                            <p className="text-lg font-semibold text-cyan-300">{totais.calorias} kcal</p>
                            <p className="text-xs text-cyan-200/60 mt-1">Total da dieta</p>
                          </div>
                          <div>
                            <p className="text-sm text-cyan-200/70">Proteína</p>
                            <p className="text-lg font-semibold text-cyan-300">{totais.proteinas.toFixed(1)}g</p>
                            {proteinPerKg && (
                              <p className="text-xs text-cyan-200/60 mt-1">{proteinPerKg}g/kg</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-cyan-200/70">Carboidratos</p>
                            <p className="text-lg font-semibold text-cyan-300">{totais.carboidratos.toFixed(1)}g</p>
                            {carbsPerKg && (
                              <p className="text-xs text-cyan-200/60 mt-1">{carbsPerKg}g/kg</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-cyan-200/70">Gorduras</p>
                            <p className="text-lg font-semibold text-cyan-300">{totais.gorduras.toFixed(1)}g</p>
                            {fatsPerKg && (
                              <p className="text-xs text-cyan-200/60 mt-1">{fatsPerKg}g/kg</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Barra Fixa com Totais vs Metas */}
      {activePlan && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/30 shadow-lg">
          <div className="container max-w-7xl mx-auto p-4">
            {(() => {
              const totais = calcularTotais(activePlan);
              // Garantir que as metas sejam números - verificar se existem no plano
              const metas = {
                calorias: activePlan?.total_calories ? Number(activePlan.total_calories) : 0,
                proteinas: activePlan?.total_protein ? Number(activePlan.total_protein) : 0,
                carboidratos: activePlan?.total_carbs ? Number(activePlan.total_carbs) : 0,
                gorduras: activePlan?.total_fats ? Number(activePlan.total_fats) : 0,
              };

              const porcentagens = {
                calorias: metas.calorias > 0 ? (totais.calorias / metas.calorias) * 100 : 0,
                proteinas: metas.proteinas > 0 ? (totais.proteinas / metas.proteinas) * 100 : 0,
                carboidratos: metas.carboidratos > 0 ? (totais.carboidratos / metas.carboidratos) * 100 : 0,
                gorduras: metas.gorduras > 0 ? (totais.gorduras / metas.gorduras) * 100 : 0,
              };

              const getCorPorcentagem = (porcentagem: number) => {
                if (porcentagem >= 95 && porcentagem <= 105) return "text-green-400";
                if (porcentagem >= 85 && porcentagem < 95) return "text-yellow-400";
                if (porcentagem > 105 && porcentagem <= 115) return "text-yellow-400";
                return "text-red-400";
              };

              return (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1.5">Calorias</p>
                    <p className="text-sm font-semibold mb-1">
                      <span className={getCorPorcentagem(porcentagens.calorias)}>
                        {totais.calorias}
                      </span>
                      <span className="text-muted-foreground">/{metas.calorias > 0 ? metas.calorias : 'N/A'}</span>
                    </p>
                    <div className="w-full bg-slate-800/50 rounded-full h-1 mt-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${
                          porcentagens.calorias >= 95 && porcentagens.calorias <= 105
                            ? "bg-green-500"
                            : porcentagens.calorias >= 85 && porcentagens.calorias < 115
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(porcentagens.calorias, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-cyan-200/70 mb-1.5">Proteínas</p>
                    <p className="text-sm font-semibold mb-1">
                      <span className={getCorPorcentagem(porcentagens.proteinas)}>
                        {totais.proteinas.toFixed(1)}g
                      </span>
                      <span className="text-cyan-200/60">/{metas.proteinas > 0 ? metas.proteinas : 'N/A'}g</span>
                    </p>
                    <div className="w-full bg-slate-800/50 rounded-full h-1 mt-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${
                          porcentagens.proteinas >= 95 && porcentagens.proteinas <= 105
                            ? "bg-green-500"
                            : porcentagens.proteinas >= 85 && porcentagens.proteinas < 115
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(porcentagens.proteinas, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-cyan-200/70 mb-1.5">Carboidratos</p>
                    <p className="text-sm font-semibold mb-1">
                      <span className={getCorPorcentagem(porcentagens.carboidratos)}>
                        {totais.carboidratos.toFixed(1)}g
                      </span>
                      <span className="text-cyan-200/60">/{metas.carboidratos > 0 ? metas.carboidratos : 'N/A'}g</span>
                    </p>
                    <div className="w-full bg-slate-800/50 rounded-full h-1 mt-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${
                          porcentagens.carboidratos >= 95 && porcentagens.carboidratos <= 105
                            ? "bg-green-500"
                            : porcentagens.carboidratos >= 85 && porcentagens.carboidratos < 115
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(porcentagens.carboidratos, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-cyan-200/70 mb-1.5">Gorduras</p>
                    <p className="text-sm font-semibold mb-1">
                      <span className={getCorPorcentagem(porcentagens.gorduras)}>
                        {totais.gorduras.toFixed(1)}g
                      </span>
                      <span className="text-cyan-200/60">/{metas.gorduras > 0 ? metas.gorduras : 'N/A'}g</span>
                    </p>
                    <div className="w-full bg-slate-800/50 rounded-full h-1 mt-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full ${
                          porcentagens.gorduras >= 95 && porcentagens.gorduras <= 105
                            ? "bg-green-500"
                            : porcentagens.gorduras >= 85 && porcentagens.gorduras < 115
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(porcentagens.gorduras, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Espaçamento para a barra fixa */}
      {activePlan && <div className="h-24" />}

      {/* Modal de Criação de Plano */}
      <DietPlanForm
        patientId={patientId}
        patientUserId={patientUserId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
        }}
      />

      {/* Modal de Edição de Plano */}
      <DietPlanForm
        patientId={patientId}
        patientUserId={patientUserId}
        planId={selectedPlan?.id}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedPlan(null);
          }
        }}
        onSuccess={() => {
          refetch();
          setIsEditOpen(false);
          setSelectedPlan(null);
        }}
      />

      {/* Modal de Detalhes do Plano */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl text-white">{planDetails?.name || selectedPlan?.name}</DialogTitle>
                <DialogDescription className="mt-2 text-cyan-200/70">
                  {planDetails?.notes || selectedPlan?.notes}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {planDetails && (
            <div className="space-y-6 mt-4">
              {/* Macros Totais */}
              {(planDetails.total_calories || planDetails.total_protein || planDetails.total_carbs || planDetails.total_fats) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                  <div>
                    <p className="text-sm text-cyan-200/70">Calorias</p>
                    <p className="text-xl font-semibold text-cyan-300">{planDetails.total_calories || '-'} kcal</p>
                  </div>
                  <div>
                    <p className="text-sm text-cyan-200/70">Proteína</p>
                    <p className="text-xl font-semibold text-cyan-300">{planDetails.total_protein || '-'}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-cyan-200/70">Carboidratos</p>
                    <p className="text-xl font-semibold text-cyan-300">{planDetails.total_carbs || '-'}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-cyan-200/70">Gorduras</p>
                    <p className="text-xl font-semibold text-cyan-300">{planDetails.total_fats || '-'}g</p>
                  </div>
                </div>
              )}

              {/* Refeições */}
              {planDetails.diet_meals && planDetails.diet_meals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300">Refeições ({planDetails.diet_meals.length})</h3>
                  <div className="space-y-4">
                    {planDetails.diet_meals.map((meal: any) => (
                      <Card key={meal.id} className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                        <CardHeader>
                          <CardTitle className="text-base text-cyan-300">{meal.meal_name}</CardTitle>
                          {meal.instructions && (
                            <CardDescription className="text-cyan-200/70">{meal.instructions}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          {(meal.calories || meal.protein || meal.carbs || meal.fats) && (
                            <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                              <div>
                                <p className="text-xs text-cyan-200/70">Calorias</p>
                                <p className="font-semibold text-cyan-300">{meal.calories || '-'} kcal</p>
                              </div>
                              <div>
                                <p className="text-xs text-cyan-200/70">Proteína</p>
                                <p className="font-semibold text-cyan-300">{meal.protein || '-'}g</p>
                              </div>
                              <div>
                                <p className="text-xs text-cyan-200/70">Carboidratos</p>
                                <p className="font-semibold text-cyan-300">{meal.carbs || '-'}g</p>
                              </div>
                              <div>
                                <p className="text-xs text-cyan-200/70">Gorduras</p>
                                <p className="font-semibold text-cyan-300">{meal.fats || '-'}g</p>
                              </div>
                            </div>
                          )}

                          {meal.diet_foods && meal.diet_foods.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2 text-cyan-200/70">Alimentos:</p>
                              <div className="space-y-2">
                                {meal.diet_foods.map((food: any) => (
                                  <div key={food.id} className="flex items-center justify-between p-2 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded">
                                    <div className="flex-1">
                                      <p className="font-medium text-cyan-200">{food.food_name || food.name}</p>
                                      <p className="text-xs text-cyan-200/60">
                                        {food.quantity} {food.unit}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-cyan-300">{food.calories || 0} kcal</p>
                                      <p className="text-xs text-cyan-200/60">
                                        P: {food.protein || 0}g | C: {food.carbs || 0}g | G: {food.fats || 0}g
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Orientações */}
              {planDetails.diet_guidelines && planDetails.diet_guidelines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300">Orientações ({planDetails.diet_guidelines.length})</h3>
                  <div className="space-y-3">
                    {planDetails.diet_guidelines.map((guideline: any) => (
                      <Card key={guideline.id} className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                        <CardHeader>
                          <CardTitle className="text-base text-cyan-300">{guideline.title}</CardTitle>
                        </CardHeader>
                        {guideline.content && (
                          <CardContent>
                            <p className="text-sm text-cyan-200/70 whitespace-pre-wrap">
                              {guideline.content}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações Adicionais */}
              <div className="pt-4 border-t border-cyan-500/20">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-cyan-200/70">Status</p>
                    <Badge 
                      variant={
                        planDetails.status === 'active' ? 'default' :
                        planDetails.status === 'draft' ? 'secondary' : 'outline'
                      }
                      className="mt-1"
                    >
                      {planDetails.status === 'active' ? 'Ativo' :
                       planDetails.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                    </Badge>
                  </div>
                  {planDetails.released_at && (
                    <div>
                      <p className="text-cyan-200/70">Liberado em</p>
                      <p className="mt-1 text-cyan-200">
                        {new Date(planDetails.released_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {planDetails.created_at && (
                    <div>
                      <p className="text-cyan-200/70">Criado em</p>
                      <p className="mt-1 text-cyan-200">
                        {new Date(planDetails.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-4 border-t border-cyan-500/20">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleEdit(planDetails);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Plano
                </Button>
                {planDetails.status === 'draft' && (
                  <Button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleRelease(planDetails.id, planDetails.name);
                    }}
                    className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg text-white"
                  >
                    Liberar para Paciente
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

