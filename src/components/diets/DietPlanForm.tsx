import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { dietService } from "@/lib/diet-service";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Calculator, Utensils, Clock, Star, Copy, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { TMBCalculator } from "./TMBCalculator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const mealTypes = [
  { value: "breakfast", label: "Café da Manhã" },
  { value: "snack_1", label: "Lanche da Manhã" },
  { value: "lunch", label: "Almoço" },
  { value: "snack_2", label: "Lanche da Tarde" },
  { value: "dinner", label: "Jantar" },
  { value: "pre_workout", label: "Pré-Treino" },
  { value: "post_workout", label: "Pós-Treino" },
];

const guidelineTypes = [
  { value: "general", label: "Geral" },
  { value: "hydration", label: "Hidratação" },
  { value: "supplement", label: "Suplementação" },
  { value: "timing", label: "Horários" },
  { value: "preparation", label: "Preparação" },
];

const dietPlanSchema = z.object({
  name: z.string().min(1, "Nome do plano é obrigatório"),
  notes: z.string().optional(),
  total_calories: z.number().min(0).optional(),
  total_protein: z.number().min(0).optional(),
  total_carbs: z.number().min(0).optional(),
  total_fats: z.number().min(0).optional(),
  meals: z.array(
    z.object({
      meal_type: z.string(),
      meal_name: z.string().min(1, "Nome da refeição é obrigatório"),
      meal_order: z.number(),
      day_of_week: z.number().nullable().optional(),
      suggested_time: z.string().optional(),
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fats: z.number().optional(),
      instructions: z.string().optional(),
      foods: z.array(
        z.object({
          food_name: z.string().min(1, "Nome do alimento é obrigatório"),
          quantity: z.number().min(0.1, "Quantidade deve ser maior que zero"),
          unit: z.string().min(1, "Unidade é obrigatória"),
          calories: z.number().optional(),
          protein: z.number().optional(),
          carbs: z.number().optional(),
          fats: z.number().optional(),
          notes: z.string().optional(),
        })
      ).optional(),
    })
  ).optional(),
  guidelines: z.array(
    z.object({
      guideline_type: z.string(),
      title: z.string().min(1, "Título é obrigatório"),
      content: z.string().min(1, "Conteúdo é obrigatório"),
      priority: z.number().default(0),
    })
  ).optional(),
  observations: z.array(
    z.object({
      text: z.string().min(1, "Texto da observação é obrigatório"),
      order: z.number(),
      position: z.string().optional(), // "before_meal" ou "after_meal" + meal_order
    })
  ).optional(),
});

type DietPlanFormData = z.infer<typeof dietPlanSchema>;

interface DietPlanFormProps {
  patientId: string;
  patientUserId: string | null;
  planId?: string; // ID do plano para edição (opcional)
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DietPlanForm({
  patientId,
  patientUserId,
  planId,
  open,
  onOpenChange,
  onSuccess,
}: DietPlanFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [foodDatabase, setFoodDatabase] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [tmbDialogOpen, setTmbDialogOpen] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set());
  const [patientData, setPatientData] = useState<any>(null);
  
  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<DietPlanFormData>({
    resolver: zodResolver(dietPlanSchema),
    defaultValues: {
      name: "",
      notes: "",
      total_calories: undefined,
      total_protein: undefined,
      total_carbs: undefined,
      total_fats: undefined,
      meals: [],
      guidelines: [],
      observations: [],
    },
  });

  const {
    fields: mealFields,
    append: appendMeal,
    remove: removeMeal,
  } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  const {
    fields: guidelineFields,
    append: appendGuideline,
    remove: removeGuideline,
  } = useFieldArray({
    control: form.control,
    name: "guidelines",
  });

  const {
    fields: observationFields,
    append: appendObservation,
    remove: removeObservation,
  } = useFieldArray({
    control: form.control,
    name: "observations",
  });

  // Carregar banco de alimentos e dados do plano (se estiver editando)
  useEffect(() => {
    if (open) {
      loadFoodDatabase();
      loadPatientData();
      if (planId) {
        loadPlanData();
      } else {
        // Resetar formulário para criação
        form.reset({
          name: "",
          notes: "",
          total_calories: undefined,
          total_protein: undefined,
          total_carbs: undefined,
          total_fats: undefined,
          meals: [],
          guidelines: [],
        });
        setIsEditing(false);
      }
    }
  }, [open, planId]);

  const loadPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('peso_inicial, altura_inicial, data_nascimento, genero')
        .eq('id', patientId)
        .single();
      
      if (!error && data) {
        // Calcular idade
        let idade: number | undefined;
        if (data.data_nascimento) {
          const hoje = new Date();
          const nascimento = new Date(data.data_nascimento);
          idade = hoje.getFullYear() - nascimento.getFullYear();
          const mesAtual = hoje.getMonth();
          const mesNascimento = nascimento.getMonth();
          if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
            idade--;
          }
        }

        // Converter genero para M/F
        let sexo: "M" | "F" = "M";
        if (data.genero) {
          const generoLower = data.genero.toLowerCase();
          if (generoLower.includes('f') || generoLower.includes('feminino')) {
            sexo = "F";
          }
        }

        setPatientData({
          peso: data.peso_inicial,
          altura: data.altura_inicial,
          idade,
          sexo,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do paciente:", error);
    }
  };

  const loadFoodDatabase = async () => {
    try {
      const foods = await dietService.getFoodDatabase();
      setFoodDatabase(foods || []);
    } catch (error) {
      console.error("Erro ao carregar banco de alimentos:", error);
    }
  };

  const loadPlanData = async () => {
    if (!planId) return;
    
    try {
      setLoading(true);
      const planData = await dietService.getById(planId);
      setIsEditing(true);

      // Preencher formulário com dados do plano
      form.reset({
        name: planData.name || "",
        notes: planData.notes || "",
        total_calories: planData.total_calories || undefined,
        total_protein: planData.total_protein || undefined,
        total_carbs: planData.total_carbs || undefined,
        total_fats: planData.total_fats || undefined,
        meals: (planData.diet_meals || []).map((meal: any) => ({
          meal_type: meal.meal_type || "",
          meal_name: meal.meal_name || "",
          meal_order: meal.meal_order || 0,
          day_of_week: meal.day_of_week || null,
          suggested_time: meal.suggested_time || undefined,
          calories: meal.calories || undefined,
          protein: meal.protein || undefined,
          carbs: meal.carbs || undefined,
          fats: meal.fats || undefined,
          instructions: meal.instructions || "",
          foods: (meal.diet_foods || []).map((food: any) => ({
            food_name: food.food_name || "",
            quantity: food.quantity || 0,
            unit: food.unit || "g",
            calories: food.calories || 0,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fats: food.fats || 0,
            notes: food.notes || null,
          })),
        })),
        guidelines: (planData.diet_guidelines || [])
          .filter((g: any) => g.guideline_type !== "between_meals")
          .map((guideline: any) => ({
            guideline_type: guideline.guideline_type || "general",
            title: guideline.title || "",
            content: guideline.content || "",
            priority: guideline.priority || 0,
          })),
        observations: (planData.diet_guidelines || [])
          .filter((g: any) => g.guideline_type === "between_meals")
          .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
          .map((guideline: any, index: number) => ({
            text: guideline.content || "",
            order: guideline.priority || index + 1,
            position: guideline.title || "",
          })),
      });
    } catch (error) {
      console.error("Erro ao carregar dados do plano:", error);
      toast({
        title: "Erro ao carregar plano",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao carregar os dados do plano.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular macros totais
  const calculateTotals = () => {
    const meals = form.watch("meals") || [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    meals.forEach((meal) => {
      if (meal.foods && meal.foods.length > 0) {
        meal.foods.forEach((food) => {
          totalCalories += food.calories || 0;
          totalProtein += food.protein || 0;
          totalCarbs += food.carbs || 0;
          totalFats += food.fats || 0;
        });
      } else {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbs || 0;
        totalFats += meal.fats || 0;
      }
    });

    form.setValue("total_calories", Math.round(totalCalories));
    form.setValue("total_protein", Math.round(totalProtein * 10) / 10);
    form.setValue("total_carbs", Math.round(totalCarbs * 10) / 10);
    form.setValue("total_fats", Math.round(totalFats * 10) / 10);
  };

  const addMeal = () => {
    appendMeal({
      meal_type: "breakfast",
      meal_name: "Café da Manhã",
      meal_order: mealFields.length + 1,
      day_of_week: null,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      instructions: "",
      foods: [],
    });
  };

  const addFoodToMeal = (mealIndex: number) => {
    const meals = form.getValues("meals") || [];
    const currentMeal = meals[mealIndex];
    const currentFoods = currentMeal?.foods || [];

    form.setValue(`meals.${mealIndex}.foods`, [
      ...currentFoods,
      {
        food_name: "",
        quantity: 100,
        unit: "g",
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        notes: "",
      },
    ]);
  };

  const removeFoodFromMeal = (mealIndex: number, foodIndex: number) => {
    const meals = form.getValues("meals") || [];
    const currentMeal = meals[mealIndex];
    const currentFoods = currentMeal?.foods || [];
    currentFoods.splice(foodIndex, 1);
    form.setValue(`meals.${mealIndex}.foods`, currentFoods);
    calculateTotals();
  };

  const addGuideline = () => {
    appendGuideline({
      guideline_type: "general",
      title: "",
      content: "",
      priority: guidelineFields.length,
    });
  };

  // Handler para drag end de refeições
  const handleMealDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = mealFields.findIndex((meal) => meal.id === active.id);
    const newIndex = mealFields.findIndex((meal) => meal.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const meals = form.getValues("meals") || [];
      const reorderedMeals = arrayMove(meals, oldIndex, newIndex);
      
      // Atualizar ordem
      reorderedMeals.forEach((meal, index) => {
        meal.meal_order = index + 1;
      });
      
      form.setValue("meals", reorderedMeals);
    }
  };

  // Handler para drag end de alimentos
  const handleFoodDragEnd = (event: DragEndEvent, mealIndex: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const foods = form.watch(`meals.${mealIndex}.foods`) || [];
    const oldIndex = foods.findIndex((food: any, idx: number) => `food-${mealIndex}-${idx}` === active.id);
    const newIndex = foods.findIndex((food: any, idx: number) => `food-${mealIndex}-${idx}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedFoods = arrayMove(foods, oldIndex, newIndex);
      form.setValue(`meals.${mealIndex}.foods`, reorderedFoods);
    }
  };

  const handleFoodSelect = (mealIndex: number, foodIndex: number, foodName: string) => {
    const selectedFood = foodDatabase.find((f) => f.name === foodName);
    if (selectedFood) {
      const quantity = form.watch(`meals.${mealIndex}.foods.${foodIndex}.quantity`) || 100;
      const multiplier = quantity / 100;

      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.food_name`, selectedFood.name);
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.calories`,
        Math.round(selectedFood.calories_per_100g * multiplier)
      );
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.protein`,
        Math.round(selectedFood.protein_per_100g * multiplier * 10) / 10
      );
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.carbs`,
        Math.round(selectedFood.carbs_per_100g * multiplier * 10) / 10
      );
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.fats`,
        Math.round(selectedFood.fats_per_100g * multiplier * 10) / 10
      );

      // Recalcular macros da refeição e totais
      setTimeout(() => {
        calculateMealMacros(mealIndex);
        calculateTotals();
      }, 100);
    }
  };

  const calculateMealMacros = (mealIndex: number) => {
    const meals = form.getValues("meals") || [];
    const meal = meals[mealIndex];
    if (!meal?.foods || meal.foods.length === 0) return;

    let mealCalories = 0;
    let mealProtein = 0;
    let mealCarbs = 0;
    let mealFats = 0;

    meal.foods.forEach((food) => {
      mealCalories += food.calories || 0;
      mealProtein += food.protein || 0;
      mealCarbs += food.carbs || 0;
      mealFats += food.fats || 0;
    });

    form.setValue(`meals.${mealIndex}.calories`, Math.round(mealCalories));
    form.setValue(`meals.${mealIndex}.protein`, Math.round(mealProtein * 10) / 10);
    form.setValue(`meals.${mealIndex}.carbs`, Math.round(mealCarbs * 10) / 10);
    form.setValue(`meals.${mealIndex}.fats`, Math.round(mealFats * 10) / 10);
  };

  const onSubmit = async (data: DietPlanFormData) => {
    try {
      setLoading(true);

      // Obter user_id do usuário autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || patientUserId;

      let currentPlanId: string;

      if (isEditing && planId) {
        // Atualizar plano existente
        const planData = {
          name: data.name,
          notes: data.notes || null,
          total_calories: data.total_calories || null,
          total_protein: data.total_protein || null,
          total_carbs: data.total_carbs || null,
          total_fats: data.total_fats || null,
        };

        await dietService.update(planId, planData);
        currentPlanId = planId;

        // Deletar refeições antigas (isso também deleta os alimentos relacionados por CASCADE)
        const existingPlan = await dietService.getById(planId);
        if (existingPlan.diet_meals) {
          for (const meal of existingPlan.diet_meals) {
            await supabase.from('diet_meals').delete().eq('id', meal.id);
          }
        }

        // Deletar orientações antigas (exceto observações)
        if (existingPlan.diet_guidelines) {
          const guidelinesToDelete = existingPlan.diet_guidelines.filter((g: any) => g.guideline_type !== "between_meals");
          for (const guideline of guidelinesToDelete) {
            await supabase.from('diet_guidelines').delete().eq('id', guideline.id);
          }
        }
        
        // Deletar observações antigas
        const oldObservations = existingPlan.diet_guidelines?.filter((g: any) => g.guideline_type === "between_meals") || [];
        for (const obs of oldObservations) {
          await supabase.from('diet_guidelines').delete().eq('id', obs.id);
        }
      } else {
        // Criar novo plano
        const planData = {
          patient_id: patientId,
          user_id: userId,
          name: data.name,
          status: "draft",
          notes: data.notes || null,
          total_calories: data.total_calories || null,
          total_protein: data.total_protein || null,
          total_carbs: data.total_carbs || null,
          total_fats: data.total_fats || null,
          created_by: userId,
        };

        const newPlan = await dietService.create(planData);
        currentPlanId = newPlan.id;
      }

      // Criar refeições e alimentos
      if (data.meals && data.meals.length > 0) {
        for (const meal of data.meals) {
          const mealData = {
            diet_plan_id: currentPlanId,
            meal_type: meal.meal_type,
            meal_name: meal.meal_name,
            meal_order: meal.meal_order,
            day_of_week: meal.day_of_week || null,
            suggested_time: meal.suggested_time || null,
            calories: meal.calories || null,
            protein: meal.protein || null,
            carbs: meal.carbs || null,
            fats: meal.fats || null,
            instructions: meal.instructions || null,
          };

          const newMeal = await dietService.createMeal(mealData);

          // Criar alimentos da refeição
          if (meal.foods && meal.foods.length > 0) {
            for (let i = 0; i < meal.foods.length; i++) {
              const food = meal.foods[i];
              await dietService.createFood({
                meal_id: newMeal.id,
                food_name: food.food_name,
                quantity: food.quantity,
                unit: food.unit,
                calories: food.calories || null,
                protein: food.protein || null,
                carbs: food.carbs || null,
                fats: food.fats || null,
                notes: food.notes || null,
                food_order: i,
              });
            }
          }
        }
      }

      // Criar orientações
      if (data.guidelines && data.guidelines.length > 0) {
        for (const guideline of data.guidelines) {
          await dietService.createGuideline({
            diet_plan_id: currentPlanId,
            guideline_type: guideline.guideline_type,
            title: guideline.title,
            content: guideline.content,
            priority: guideline.priority,
          });
        }
      }

      // Criar observações entre refeições
      if (data.observations && data.observations.length > 0) {
        for (const observation of data.observations) {
          await dietService.createGuideline({
            diet_plan_id: currentPlanId,
            guideline_type: "between_meals",
            title: observation.position || "",
            content: observation.text,
            priority: observation.order,
          });
        }
      }

      toast({
        title: "Plano criado!",
        description: "O plano alimentar foi criado com sucesso.",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      toast({
        title: "Erro ao criar plano",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o plano.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Utensils className="w-5 h-5 text-cyan-400" />
            Criar Novo Plano Alimentar
          </DialogTitle>
          <DialogDescription className="text-cyan-200/70">
            Preencha as informações do plano alimentar do paciente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="meals">Refeições</TabsTrigger>
                <TabsTrigger value="observations">Observações</TabsTrigger>
                <TabsTrigger value="guidelines">Orientações</TabsTrigger>
                <TabsTrigger value="summary">Resumo</TabsTrigger>
              </TabsList>
              <div className="mt-4 space-y-4">
                {/* ABA 1: Informações Básicas */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-200/70">Nome do Plano *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Plano Semanal - Perda de Peso" 
                            className="border-cyan-500/30 bg-slate-950/50 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-200/70">Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações gerais sobre o plano..."
                            className="resize-none border-cyan-500/30 bg-slate-950/50 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="total_calories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-cyan-200/70">Calorias Totais</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="border-cyan-500/30 bg-slate-950/50 text-white"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-cyan-200/60">kcal</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_protein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-cyan-200/70">Proteína Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              className="border-cyan-500/30 bg-slate-950/50 text-white"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-cyan-200/60">gramas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_carbs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-cyan-200/70">Carboidratos Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              className="border-cyan-500/30 bg-slate-950/50 text-white"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-cyan-200/60">gramas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_fats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-cyan-200/70">Gorduras Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              className="border-cyan-500/30 bg-slate-950/50 text-white"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-cyan-200/60">gramas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTmbDialogOpen(true)}
                      className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg text-white"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Calcular TMB/GET
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={calculateTotals}
                      className="flex items-center gap-2 border-cyan-500/30 bg-slate-950/50 text-cyan-200 hover:bg-slate-800/50"
                    >
                      <Calculator className="w-4 h-4" />
                      Calcular Totais dos Alimentos
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      (Baseado nos alimentos adicionados)
                    </span>
                  </div>
                </div>
                )}

                {/* ABA 2: Refeições */}
                {activeTab === "meals" && (
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Refeições</h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione as refeições do plano alimentar
                      </p>
                    </div>
                    <Button type="button" onClick={addMeal} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Refeição
                    </Button>
                  </div>

                  {mealFields.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground mb-4">
                          Nenhuma refeição adicionada ainda.
                        </p>
                        <Button type="button" onClick={addMeal} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeira Refeição
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleMealDragEnd}
                    >
                      <SortableContext
                        items={mealFields.map((meal) => meal.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {mealFields.map((meal, mealIndex) => {
                        const isExpanded = expandedMeals.has(mealIndex);
                        const mealTotals = form.watch(`meals.${mealIndex}`);
                        const mealCalories = mealTotals?.calories || 0;
                        const mealProtein = mealTotals?.protein || 0;
                        const mealCarbs = mealTotals?.carbs || 0;
                        const mealFats = mealTotals?.fats || 0;
                        
                        const MealItem = () => {
                          const {
                            attributes,
                            listeners,
                            setNodeRef,
                            transform,
                            transition,
                            isDragging,
                          } = useSortable({ id: meal.id });

                          const style = {
                            transform: CSS.Transform.toString(transform),
                            transition,
                            opacity: isDragging ? 0.5 : 1,
                          };

                          return (
                            <div ref={setNodeRef} style={style}>
                              <Collapsible
                                open={isExpanded}
                                onOpenChange={(open) => {
                                  const newExpanded = new Set(expandedMeals);
                                  if (open) {
                                    newExpanded.add(mealIndex);
                                  } else {
                                    newExpanded.delete(mealIndex);
                                  }
                                  setExpandedMeals(newExpanded);
                                }}
                              >
                                <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                                  <CardHeader>
                                    <div className="flex items-center justify-between">
                                      <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-2 flex-1 cursor-pointer">
                                          <div
                                            {...attributes}
                                            {...listeners}
                                            className="cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="w-4 h-4 text-cyan-400/50" />
                                          </div>
                                    <CardTitle className="text-base text-cyan-300">
                                      {form.watch(`meals.${mealIndex}.meal_name`) || `Refeição ${mealIndex + 1}`}
                                    </CardTitle>
                                    {form.watch(`meals.${mealIndex}.suggested_time`) && (
                                      <div className="flex items-center gap-1 text-xs text-cyan-200/70">
                                        <Clock className="w-3 h-3" />
                                        {form.watch(`meals.${mealIndex}.suggested_time`)}
                                      </div>
                                    )}
                                    {!isExpanded && (
                                      <div className="flex items-center gap-2 text-xs text-cyan-200/60">
                                        <span>{mealCalories} kcal</span>
                                        <span>•</span>
                                        <span>P: {mealProtein}g</span>
                                        <span>C: {mealCarbs}g</span>
                                        <span>G: {mealFats}g</span>
                                      </div>
                                    )}
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                                    )}
                                  </div>
                                </CollapsibleTrigger>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Duplicar refeição
                                      const meals = form.getValues("meals") || [];
                                      const mealToDuplicate = meals[mealIndex];
                                      const newMeal = {
                                        ...mealToDuplicate,
                                        meal_name: `${mealToDuplicate.meal_name} (Cópia)`,
                                        meal_order: meals.length + 1,
                                        foods: mealToDuplicate.foods?.map((food: any) => ({ ...food })) || [],
                                      };
                                      appendMeal(newMeal);
                                      toast({
                                        title: "Refeição duplicada!",
                                        description: "A refeição foi duplicada com sucesso.",
                                      });
                                    }}
                                    className="text-cyan-400 hover:text-cyan-300"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMeal(mealIndex)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CollapsibleContent>
                              <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.meal_type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-cyan-200/70">Tipo de Refeição</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        const selected = mealTypes.find((m) => m.value === value);
                                        if (selected) {
                                          form.setValue(`meals.${mealIndex}.meal_name`, selected.label);
                                        }
                                      }}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="border-cyan-500/30 bg-slate-950/50 text-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {mealTypes.map((type) => (
                                          <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.meal_name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-cyan-200/70">Nome da Refeição</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Ex: Café da Manhã" 
                                        className="border-cyan-500/30 bg-slate-950/50 text-white"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.suggested_time`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-cyan-200/70">Horário Sugerido</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="time"
                                        className="border-cyan-500/30 bg-slate-950/50 text-white"
                                        {...field}
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.meal_order`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-cyan-200/70">Ordem</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="border-cyan-500/30 bg-slate-950/50 text-white"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(parseInt(e.target.value) || 0);
                                        }}
                                        value={field.value || 0}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`meals.${mealIndex}.instructions`}
                              render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-cyan-200/70">Instruções (opcional)</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Instruções específicas para esta refeição..."
                                        className="resize-none border-cyan-500/30 bg-slate-950/50 text-white"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                              )}
                            />

                            {/* Alimentos da Refeição */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <FormLabel>Alimentos</FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addFoodToMeal(mealIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Alimento
                                </Button>
                              </div>

                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => handleFoodDragEnd(e, mealIndex)}
                              >
                                <SortableContext
                                  items={form.watch(`meals.${mealIndex}.foods`)?.map((_: any, idx: number) => `food-${mealIndex}-${idx}`) || []}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {form.watch(`meals.${mealIndex}.foods`)?.map((food: any, foodIndex: number) => {
                                    const FoodItem = () => {
                                      const {
                                        attributes,
                                        listeners,
                                        setNodeRef,
                                        transform,
                                        transition,
                                        isDragging,
                                      } = useSortable({ id: `food-${mealIndex}-${foodIndex}` });

                                      const style = {
                                        transform: CSS.Transform.toString(transform),
                                        transition,
                                        opacity: isDragging ? 0.5 : 1,
                                      };

                                      return (
                                        <Card 
                                          ref={setNodeRef} 
                                          style={style}
                                          className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20"
                                        >
                                          <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                              <div className="flex items-center gap-2 flex-1">
                                                <div
                                                  {...attributes}
                                                  {...listeners}
                                                  className="cursor-grab active:cursor-grabbing"
                                                >
                                                  <GripVertical className="w-4 h-4 text-cyan-400/50" />
                                                </div>
                                                <h4 className="font-medium">Alimento {foodIndex + 1}</h4>
                                              </div>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  removeFoodFromMeal(mealIndex, foodIndex);
                                                }}
                                                className="text-destructive hover:text-destructive h-6 w-6 p-0"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <FormField
                                        control={form.control}
                                        name={`meals.${mealIndex}.foods.${foodIndex}.food_name`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-cyan-200/70">Alimento *</FormLabel>
                                            <div className="space-y-2">
                                              <Input
                                                placeholder="Digite o nome do alimento"
                                                className="mb-2 border-cyan-500/30 bg-slate-950/50 text-white"
                                                {...field}
                                                onChange={(e) => {
                                                  field.onChange(e.target.value);
                                                }}
                                                value={field.value || ""}
                                              />
                                              <Select
                                                onValueChange={(value) => {
                                                  field.onChange(value);
                                                  handleFoodSelect(mealIndex, foodIndex, value);
                                                }}
                                                value=""
                                              >
                                                <FormControl>
                                                  <SelectTrigger className="border-cyan-500/30 bg-slate-950/50 text-white">
                                                    <SelectValue placeholder="Ou selecione do banco de alimentos" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="max-h-60">
                                                  {foodDatabase.map((food) => (
                                                    <SelectItem key={food.id} value={food.name}>
                                                      {food.name}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                          control={form.control}
                                          name={`meals.${mealIndex}.foods.${foodIndex}.quantity`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-cyan-200/70">Quantidade *</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  step="0.1"
                                                  placeholder="100"
                                                  className="border-cyan-500/30 bg-slate-950/50 text-white"
                                                  {...field}
                                                  onChange={(e) => {
                                                    const value = parseFloat(e.target.value) || 0;
                                                    field.onChange(value);
                                                    const foodName = form.watch(
                                                      `meals.${mealIndex}.foods.${foodIndex}.food_name`
                                                    );
                                                    if (foodName && foodDatabase.length > 0) {
                                                      handleFoodSelect(mealIndex, foodIndex, foodName);
                                                    }
                                                  }}
                                                  value={field.value || ""}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name={`meals.${mealIndex}.foods.${foodIndex}.unit`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-cyan-200/70">Unidade *</FormLabel>
                                              <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                  <SelectTrigger className="border-cyan-500/30 bg-slate-950/50 text-white">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  <SelectItem value="g">g (gramas)</SelectItem>
                                                  <SelectItem value="ml">ml (mililitros)</SelectItem>
                                                  <SelectItem value="unidade">unidade</SelectItem>
                                                  <SelectItem value="colher">colher</SelectItem>
                                                  <SelectItem value="xicara">xicara</SelectItem>
                                                  <SelectItem value="fatia">fatia</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                      <FormField
                                        control={form.control}
                                        name={`meals.${mealIndex}.foods.${foodIndex}.calories`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-xs text-cyan-200/70">Calorias</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                placeholder="0"
                                                className="border-cyan-500/30 bg-slate-950/50 text-white"
                                                {...field}
                                                onChange={(e) => {
                                                  field.onChange(e.target.value ? parseFloat(e.target.value) : 0);
                                                  calculateMealMacros(mealIndex);
                                                  calculateTotals();
                                                }}
                                                value={field.value || ""}
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`meals.${mealIndex}.foods.${foodIndex}.protein`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-xs text-cyan-200/70">Proteína (g)</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="0"
                                                className="border-cyan-500/30 bg-slate-950/50 text-white"
                                                {...field}
                                                onChange={(e) => {
                                                  field.onChange(e.target.value ? parseFloat(e.target.value) : 0);
                                                  calculateMealMacros(mealIndex);
                                                  calculateTotals();
                                                }}
                                                value={field.value || ""}
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`meals.${mealIndex}.foods.${foodIndex}.carbs`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-xs text-cyan-200/70">Carboidratos (g)</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="0"
                                                className="border-cyan-500/30 bg-slate-950/50 text-white"
                                                {...field}
                                                onChange={(e) => {
                                                  field.onChange(e.target.value ? parseFloat(e.target.value) : 0);
                                                  calculateMealMacros(mealIndex);
                                                  calculateTotals();
                                                }}
                                                value={field.value || ""}
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name={`meals.${mealIndex}.foods.${foodIndex}.fats`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-xs text-cyan-200/70">Gorduras (g)</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="0"
                                                className="border-cyan-500/30 bg-slate-950/50 text-white"
                                                {...field}
                                                onChange={(e) => {
                                                  field.onChange(e.target.value ? parseFloat(e.target.value) : 0);
                                                  calculateMealMacros(mealIndex);
                                                  calculateTotals();
                                                }}
                                                value={field.value || ""}
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    <FormField
                                      control={form.control}
                                      name={`meals.${mealIndex}.foods.${foodIndex}.notes`}
                                      render={({ field }) => (
                                        <FormItem className="mt-2">
                                          <FormLabel className="text-xs text-cyan-200/70">Observações (opcional)</FormLabel>
                                          <FormControl>
                                            <Input 
                                              placeholder="Ex: sem açúcar, grelhado..." 
                                              className="border-cyan-500/30 bg-slate-950/50 text-white"
                                              {...field} 
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                          </CardContent>
                                        </Card>
                                      );
                                    };

                                    return <FoodItem key={foodIndex} food={food} foodIndex={foodIndex} />;
                                  })}
                                </SortableContext>
                              </DndContext>

                              {form.watch(`meals.${mealIndex}.foods`)?.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhum alimento adicionado. Clique em "Adicionar Alimento" para começar.
                                </p>
                              )}

                              {/* Macros da Refeição */}
                              {(form.watch(`meals.${mealIndex}.calories`) ||
                                form.watch(`meals.${mealIndex}.protein`) ||
                                form.watch(`meals.${mealIndex}.carbs`) ||
                                form.watch(`meals.${mealIndex}.fats`)) && (
                                <div className="grid grid-cols-4 gap-2 p-3 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Calorias</p>
                                    <p className="font-semibold">
                                      {form.watch(`meals.${mealIndex}.calories`) || 0} kcal
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Proteína</p>
                                    <p className="font-semibold">
                                      {form.watch(`meals.${mealIndex}.protein`) || 0}g
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Carboidratos</p>
                                    <p className="font-semibold">
                                      {form.watch(`meals.${mealIndex}.carbs`) || 0}g
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Gorduras</p>
                                    <p className="font-semibold">
                                      {form.watch(`meals.${mealIndex}.fats`) || 0}g
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            </CardContent>
                            </CollapsibleContent>
                                </Card>
                              </Collapsible>
                            </div>
                          );
                        };

                        return <MealItem key={meal.id} />;
                      })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
                )}

                {/* ABA 3: Observações entre Refeições */}
                {activeTab === "observations" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-300">Observações entre Refeições</h3>
                        <p className="text-sm text-cyan-200/70">
                          Adicione observações que aparecerão entre as refeições na ordem definida
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => {
                          const meals = form.getValues("meals") || [];
                          const maxOrder = observationFields.length > 0 
                            ? Math.max(...observationFields.map((obs: any) => obs.order || 0))
                            : meals.length;
                          appendObservation({
                            text: "",
                            order: maxOrder + 1,
                            position: "",
                          });
                        }} 
                        size="sm"
                        className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Observação
                      </Button>
                    </div>

                    {observationFields.length === 0 ? (
                      <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                        <CardContent className="p-6 text-center">
                          <p className="text-cyan-200/70 mb-4">
                            Nenhuma observação adicionada ainda.
                          </p>
                          <Button 
                            type="button" 
                            onClick={() => {
                              appendObservation({
                                text: "",
                                order: 1,
                                position: "",
                              });
                            }} 
                            variant="outline"
                            className="border-cyan-500/30 bg-slate-950/50 text-cyan-200 hover:bg-slate-800/50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Primeira Observação
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => {
                          const { active, over } = event;
                          if (!over || active.id === over.id) return;

                          const oldIndex = observationFields.findIndex((obs) => obs.id === active.id);
                          const newIndex = observationFields.findIndex((obs) => obs.id === over.id);

                          if (oldIndex !== -1 && newIndex !== -1) {
                            const observations = form.getValues("observations") || [];
                            const reordered = arrayMove(observations, oldIndex, newIndex);
                            
                            // Atualizar ordem
                            reordered.forEach((obs, index) => {
                              obs.order = index + 1;
                            });
                            
                            form.setValue("observations", reordered);
                          }
                        }}
                      >
                        <SortableContext
                          items={observationFields.map((obs) => obs.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-4">
                            {observationFields.map((observation, index) => {
                              const ObservationItem = () => {
                                const {
                                  attributes,
                                  listeners,
                                  setNodeRef,
                                  transform,
                                  transition,
                                  isDragging,
                                } = useSortable({ id: observation.id });

                                const style = {
                                  transform: CSS.Transform.toString(transform),
                                  transition,
                                  opacity: isDragging ? 0.5 : 1,
                                };

                                return (
                                  <Card 
                                    ref={setNodeRef} 
                                    style={style}
                                    className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20"
                                  >
                                    <CardHeader>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                          <div
                                            {...attributes}
                                            {...listeners}
                                            className="cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="w-4 h-4 text-cyan-400/50" />
                                          </div>
                                          <CardTitle className="text-base text-cyan-300">
                                            Observação {index + 1}
                                          </CardTitle>
                                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-200">
                                            Ordem: {observation.order || index + 1}
                                          </Badge>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeObservation(index)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <FormField
                                        control={form.control}
                                        name={`observations.${index}.text`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-cyan-200/70">Texto da Observação *</FormLabel>
                                            <FormControl>
                                              <Textarea
                                                placeholder="Ex: Beber água entre as refeições. Evitar líquidos durante as refeições..."
                                                className="resize-none border-cyan-500/30 bg-slate-950/50 text-white min-h-[100px]"
                                                {...field}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                          control={form.control}
                                          name={`observations.${index}.order`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-cyan-200/70">Ordem</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  className="border-cyan-500/30 bg-slate-950/50 text-white"
                                                  {...field}
                                                  onChange={(e) => {
                                                    field.onChange(parseInt(e.target.value) || 0);
                                                  }}
                                                  value={field.value || index + 1}
                                                />
                                              </FormControl>
                                              <FormDescription className="text-xs text-cyan-200/60">
                                                Define a posição da observação entre as refeições
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`observations.${index}.position`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-cyan-200/70">Posição (opcional)</FormLabel>
                                              <FormControl>
                                                <Input
                                                  placeholder="Ex: Após café da manhã"
                                                  className="border-cyan-500/30 bg-slate-950/50 text-white"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <FormDescription className="text-xs text-cyan-200/60">
                                                Descrição opcional da posição
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              };

                              return <ObservationItem key={observation.id} />;
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                )}

                {/* ABA 4: Orientações */}
                {activeTab === "guidelines" && (
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Orientações</h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione orientações gerais para o paciente seguir o plano
                      </p>
                    </div>
                    <Button type="button" onClick={addGuideline} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Orientação
                    </Button>
                  </div>

                  {guidelineFields.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground mb-4">
                          Nenhuma orientação adicionada ainda.
                        </p>
                        <Button type="button" onClick={addGuideline} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeira Orientação
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {guidelineFields.map((guideline, index) => (
                        <Card key={guideline.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Orientação {index + 1}</CardTitle>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGuideline(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`guidelines.${index}.guideline_type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-cyan-200/70">Tipo de Orientação</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="border-cyan-500/30 bg-slate-950/50 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {guidelineTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`guidelines.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-cyan-200/70">Título *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Ex: Hidratação" 
                                      className="border-cyan-500/30 bg-slate-950/50 text-white"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`guidelines.${index}.content`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-cyan-200/70">Conteúdo *</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Ex: Beber 2-3L de água por dia..."
                                      className="resize-none border-cyan-500/30 bg-slate-950/50 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                )}

                {/* ABA 4: Resumo */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo do Plano</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Informações Básicas</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Nome:</span>{" "}
                            {form.watch("name") || "Não definido"}
                          </p>
                          {form.watch("notes") && (
                            <p>
                              <span className="text-muted-foreground">Observações:</span>{" "}
                              {form.watch("notes")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Macros Totais</h4>
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">Calorias</p>
                            <p className="text-lg font-semibold">
                              {form.watch("total_calories") || 0} kcal
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Proteína</p>
                            <p className="text-lg font-semibold">
                              {form.watch("total_protein") || 0}g
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Carboidratos</p>
                            <p className="text-lg font-semibold">
                              {form.watch("total_carbs") || 0}g
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Gorduras</p>
                            <p className="text-lg font-semibold">
                              {form.watch("total_fats") || 0}g
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">
                          Refeições ({form.watch("meals")?.length || 0})
                        </h4>
                        <div className="space-y-2">
                          {form.watch("meals")?.map((meal: any, index: number) => (
                            <div key={index} className="p-3 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                              <p className="font-medium">{meal.meal_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {meal.foods?.length || 0} alimento(s) |{" "}
                                {meal.calories || 0} kcal
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">
                          Observações entre Refeições ({form.watch("observations")?.length || 0})
                        </h4>
                        <div className="space-y-2">
                          {form.watch("observations")?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((observation: any, index: number) => (
                            <div key={index} className="p-3 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                              <p className="font-medium text-cyan-300">Observação {index + 1} (Ordem: {observation.order || index + 1})</p>
                              <p className="text-xs text-cyan-200/70 mt-1">{observation.text}</p>
                              {observation.position && (
                                <p className="text-xs text-cyan-200/60 mt-1">Posição: {observation.position}</p>
                              )}
                            </div>
                          ))}
                          {(!form.watch("observations") || form.watch("observations")?.length === 0) && (
                            <p className="text-sm text-cyan-200/60">Nenhuma observação adicionada</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">
                          Orientações ({form.watch("guidelines")?.length || 0})
                        </h4>
                        <div className="space-y-2">
                          {form.watch("guidelines")?.map((guideline: any, index: number) => (
                            <div key={index} className="p-3 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-lg">
                              <p className="font-medium text-cyan-300">{guideline.title}</p>
                              <p className="text-xs text-cyan-200/70">{guideline.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                )}
              </div>
            </Tabs>

            <DialogFooter className="mt-6 pt-4 border-t border-slate-700">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (isEditing ? "Atualizando..." : "Criando...") : (isEditing ? "Atualizar Plano" : "Criar Plano")}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Calculadora TMB/GET */}
        <TMBCalculator
          open={tmbDialogOpen}
          onOpenChange={setTmbDialogOpen}
          onApplyMacros={(macros) => {
            form.setValue("total_calories", macros.calorias);
            form.setValue("total_protein", macros.proteinas);
            form.setValue("total_carbs", macros.carboidratos);
            form.setValue("total_fats", macros.gorduras);
            toast({
              title: "Macros aplicados!",
              description: "Os macros foram calculados e aplicados ao plano.",
            });
          }}
          patientData={patientData}
        />
      </DialogContent>
    </Dialog>
  );
}

