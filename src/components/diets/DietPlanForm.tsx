import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { Plus, Trash2, Calculator, Utensils, Clock, Star, Copy, ChevronDown, ChevronUp, GripVertical, BookOpen, RefreshCw, TrendingUp, BarChart3, History, GitCompare, AlertTriangle, Sparkles, Package } from "lucide-react";
import { TMBCalculator } from "./TMBCalculator";
import { MacroDistributionModal } from "./MacroDistributionModal";
import { TemplateLibraryModal } from "./TemplateLibraryModal";
import { FoodSuggestionsDropdown } from "./FoodSuggestionsDropdown";
import { FoodSubstitutionModal } from "./FoodSubstitutionModal";
import { FoodSubstitutionsModal } from "./FoodSubstitutionsModal";
import { ProportionalAdjustmentModal } from "./ProportionalAdjustmentModal";
import { NutritionalAnalysisCard } from "./NutritionalAnalysisCard";
import { PlanVersionHistoryModal } from "./PlanVersionHistoryModal";
import { PlanComparatorModal } from "./PlanComparatorModal";
import { DietValidationAlerts } from "./DietValidationAlerts";
import { FoodGroupsModal } from "./FoodGroupsModal";
import { macroDistributionService, MealMacroTarget } from "@/lib/diet-macro-distribution-service";
import { dietTemplateService } from "@/lib/diet-template-service";
import { foodSubstitutionService } from "@/lib/diet-food-substitution-service";
import { proportionalAdjustmentService } from "@/lib/diet-proportional-adjustment-service";
import { dietValidationService } from "@/lib/diet-validation-service";
import { dietVersionHistoryService } from "@/lib/diet-version-history-service";
import { dietFavoritesService } from "@/lib/diet-favorites-service";
import { foodGroupsService } from "@/lib/diet-food-groups-service";
import { foodSuggestionsService } from "@/lib/diet-food-suggestions-service";
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
          substitutions: z.array(
            z.object({
              food_name: z.string().min(1, "Nome do substituto é obrigatório"),
              quantity: z.number().min(0.1, "Quantidade deve ser maior que zero"),
              unit: z.string().min(1, "Unidade é obrigatória"),
            })
          ).optional(),
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
  
  // Estados para novos modais e funcionalidades
  const [macroDistributionOpen, setMacroDistributionOpen] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [substitutionsModalOpen, setSubstitutionsModalOpen] = useState(false);
  const [proportionalAdjustmentOpen, setProportionalAdjustmentOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [comparatorOpen, setComparatorOpen] = useState(false);
  const [substitutionFoodIndex, setSubstitutionFoodIndex] = useState<{ mealIndex: number; foodIndex: number } | null>(null);
  const [substitutionsFoodIndex, setSubstitutionsFoodIndex] = useState<{ mealIndex: number; foodIndex: number } | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [foodGroupsModalOpen, setFoodGroupsModalOpen] = useState(false);
  const [foodGroupsMealIndex, setFoodGroupsMealIndex] = useState<number | null>(null);
  
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
          foods: (meal.diet_foods || []).map((food: any) => {
            // Tentar parsear substituições do campo notes se existir
            let substitutions = [];
            try {
              if (food.notes) {
                const parsed = JSON.parse(food.notes);
                if (parsed.substitutions && Array.isArray(parsed.substitutions)) {
                  substitutions = parsed.substitutions;
                }
              }
            } catch (e) {
              // Se não for JSON válido, usar notes como string normal
            }
            
            return {
              food_name: food.food_name || "",
              quantity: food.quantity || 0,
              unit: food.unit || "g",
              calories: food.calories || 0,
              protein: food.protein || 0,
              carbs: food.carbs || 0,
              fats: food.fats || 0,
              notes: food.notes || null,
              substitutions: substitutions,
            };
          }),
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
  // Validar plano
  const validatePlan = useCallback(() => {
    const planData = form.getValues();
    const validation = dietValidationService.validatePlan({
      total_calories: planData.total_calories,
      total_protein: planData.total_protein,
      total_carbs: planData.total_carbs,
      total_fats: planData.total_fats,
      meals: planData.meals,
    });
    setValidationResult(validation);
    return validation.valid;
  }, [form]);

  // Observar mudanças nos campos para validação (sem causar re-renderizações)
  const watchedMeals = useWatch({ control: form.control, name: 'meals' });
  const watchedCalories = useWatch({ control: form.control, name: 'total_calories' });
  const watchedProtein = useWatch({ control: form.control, name: 'total_protein' });
  const watchedCarbs = useWatch({ control: form.control, name: 'total_carbs' });
  const watchedFats = useWatch({ control: form.control, name: 'total_fats' });
  
  // Validar quando o plano muda (com debounce)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (open && watchedMeals?.length > 0) {
      // Limpar timeout anterior
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      // Criar novo timeout
      validationTimeoutRef.current = setTimeout(() => {
        validatePlan();
      }, 500);
      
      return () => {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
      };
    }
  }, [watchedMeals, watchedCalories, watchedProtein, watchedCarbs, watchedFats, open, validatePlan]);

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

  const handleFoodSelect = async (mealIndex: number, foodIndex: number, foodName: string) => {
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

      // Registrar uso e favorito
      try {
        const mealType = form.watch(`meals.${mealIndex}.meal_type`) || '';
        await foodSuggestionsService.recordFoodUsage(foodName, mealType);
        await dietFavoritesService.addFavorite(foodName);
      } catch (error) {
        // Silenciar erros de favoritos
      }

      // Recalcular macros da refeição e totais
      setTimeout(() => {
        calculateMealMacros(mealIndex);
        calculateTotals();
        validatePlan();
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

  // Aplicar distribuição de macros
  const handleApplyMacroDistribution = (distribution: MealMacroTarget[]) => {
    const meals = form.getValues('meals') || [];
    distribution.forEach((dist, index) => {
      if (meals[index]) {
        form.setValue(`meals.${index}.calories`, dist.target.calories);
        form.setValue(`meals.${index}.protein`, dist.target.protein);
        form.setValue(`meals.${index}.carbs`, dist.target.carbs);
        form.setValue(`meals.${index}.fats`, dist.target.fats);
      }
    });
    calculateTotals();
    validatePlan();
  };

  // Handler para substituição de alimento
  const handleSubstituteFood = async (substitution: any, newQuantity: number) => {
    if (!substitutionFoodIndex) return;
    
    const { mealIndex, foodIndex } = substitutionFoodIndex;
    const food = foodDatabase.find(f => f.name === substitution.food_name);
    
    if (food) {
      const quantityInGrams = foodSubstitutionService.convertToGrams(newQuantity, form.watch(`meals.${mealIndex}.foods.${foodIndex}.unit`) || 'g');
      const multiplier = quantityInGrams / 100;
      
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.food_name`, substitution.food_name);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.quantity`, newQuantity);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.calories`, Math.round(substitution.calories_per_100g * multiplier));
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.protein`, Math.round(substitution.protein_per_100g * multiplier * 10) / 10);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.carbs`, Math.round(substitution.carbs_per_100g * multiplier * 10) / 10);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.fats`, Math.round(substitution.fats_per_100g * multiplier * 10) / 10);
      
      calculateMealMacros(mealIndex);
      calculateTotals();
      validatePlan();
      setSubstitutionFoodIndex(null);
    }
  };

  // Handler para ajuste proporcional
  const handleApplyProportionalAdjustment = (adjustedPlan: any) => {
    form.setValue('total_calories', adjustedPlan.total_calories);
    form.setValue('total_protein', adjustedPlan.total_protein);
    form.setValue('total_carbs', adjustedPlan.total_carbs);
    form.setValue('total_fats', adjustedPlan.total_fats);
    
    if (adjustedPlan.meals) {
      adjustedPlan.meals.forEach((meal: any, mealIndex: number) => {
        if (form.getValues(`meals.${mealIndex}`)) {
          form.setValue(`meals.${mealIndex}.calories`, meal.calories);
          form.setValue(`meals.${mealIndex}.protein`, meal.protein);
          form.setValue(`meals.${mealIndex}.carbs`, meal.carbs);
          form.setValue(`meals.${mealIndex}.fats`, meal.fats);
          
          if (meal.foods) {
            meal.foods.forEach((food: any, foodIndex: number) => {
              if (form.getValues(`meals.${mealIndex}.foods.${foodIndex}`)) {
                form.setValue(`meals.${mealIndex}.foods.${foodIndex}.quantity`, food.quantity);
                form.setValue(`meals.${mealIndex}.foods.${foodIndex}.calories`, food.calories);
                form.setValue(`meals.${mealIndex}.foods.${foodIndex}.protein`, food.protein);
                form.setValue(`meals.${mealIndex}.foods.${foodIndex}.carbs`, food.carbs);
                form.setValue(`meals.${mealIndex}.foods.${foodIndex}.fats`, food.fats);
              }
            });
            calculateMealMacros(mealIndex);
          }
        }
      });
    }
    
    calculateTotals();
    validatePlan();
  };

  // Aplicar template
  const handleTemplateSelected = async (templatePlanId: string) => {
    try {
      const templatePlan = await dietService.getById(templatePlanId);
      if (templatePlan) {
        form.setValue('name', templatePlan.name);
        form.setValue('total_calories', templatePlan.total_calories);
        form.setValue('total_protein', templatePlan.total_protein);
        form.setValue('total_carbs', templatePlan.total_carbs);
        form.setValue('total_fats', templatePlan.total_fats);
        form.setValue('notes', templatePlan.notes || '');
        
        // Copiar refeições
        if (templatePlan.diet_meals) {
          const mealsData = templatePlan.diet_meals.map((meal: any) => ({
            meal_type: meal.meal_type,
            meal_name: meal.meal_name,
            meal_order: meal.meal_order,
            suggested_time: meal.suggested_time || '',
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            instructions: meal.instructions || '',
            foods: meal.diet_foods?.map((food: any) => ({
              food_name: food.food_name,
              quantity: food.quantity,
              unit: food.unit,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              notes: food.notes || '',
            })) || [],
          }));
          form.setValue('meals', mealsData);
        }
        
        calculateTotals();
        validatePlan();
        toast({
          title: 'Template aplicado',
          description: 'Template carregado com sucesso',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aplicar template',
        variant: 'destructive',
      });
    }
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
              
              // Preparar notes com substituições se existirem
              let notesValue = food.notes || null;
              if (food.substitutions && food.substitutions.length > 0) {
                const notesObj: any = {};
                if (food.notes) {
                  try {
                    const parsed = JSON.parse(food.notes);
                    Object.assign(notesObj, parsed);
                  } catch (e) {
                    // Se notes não for JSON, usar como texto
                    notesObj.original_notes = food.notes;
                  }
                }
                notesObj.substitutions = food.substitutions;
                notesValue = JSON.stringify(notesObj);
              }
              
              await dietService.createFood({
                meal_id: newMeal.id,
                food_name: food.food_name,
                quantity: food.quantity,
                unit: food.unit,
                calories: food.calories || null,
                protein: food.protein || null,
                carbs: food.carbs || null,
                fats: food.fats || null,
                notes: notesValue,
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border border-slate-700/50 bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl text-white shadow-2xl shadow-slate-900/50">
        <DialogHeader className="pb-4 border-b border-slate-700/50">
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <Utensils className="w-6 h-6 text-orange-400" />
            {isEditing ? "Editar Plano Alimentar" : "Criar Novo Plano Alimentar"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 mt-2">
            Preencha as informações do plano alimentar do paciente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 gap-1">
                <TabsTrigger 
                  value="basic"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/50 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Básico
                </TabsTrigger>
                <TabsTrigger 
                  value="meals"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20 data-[state=active]:text-orange-300 data-[state=active]:border-orange-500/50 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20 transition-all duration-300"
                >
                  <Utensils className="w-4 h-4 mr-2" />
                  Refeições
                </TabsTrigger>
                <TabsTrigger 
                  value="observations"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/50 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 transition-all duration-300"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Observações
                </TabsTrigger>
                <TabsTrigger 
                  value="guidelines"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/50 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 transition-all duration-300"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Orientações
                </TabsTrigger>
                <TabsTrigger 
                  value="summary"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600/20 data-[state=active]:to-slate-500/20 data-[state=active]:text-slate-200 data-[state=active]:border-slate-500/50 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-500/20 transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Resumo
                </TabsTrigger>
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
                        <FormLabel className="text-white font-medium">Nome do Plano *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Plano Semanal - Perda de Peso" 
                            className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
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
                        <FormLabel className="text-white font-medium">Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações gerais sobre o plano..."
                            className="resize-none border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
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
                          <FormLabel className="text-white font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400" />
                            Calorias Totais
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">kcal</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_protein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            Proteína Total
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">gramas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_carbs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            Carboidratos Total
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">gramas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_fats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            Gorduras Total
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">gramas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    {/* Validação */}
                    {validationResult && (
                      <DietValidationAlerts validation={validationResult} />
                    )}

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTmbDialogOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 text-white"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calcular TMB/GET
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTemplateLibraryOpen(true)}
                        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/50 text-purple-300 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Biblioteca
                      </Button>
                      {form.watch('total_calories') && form.watch('meals') && form.watch('meals').length > 0 && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMacroDistributionOpen(true)}
                            className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/50 text-blue-300 hover:from-blue-500/20 hover:to-indigo-500/20 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Distribuir Macros
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setProportionalAdjustmentOpen(true)}
                            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/50 text-emerald-300 hover:from-emerald-500/20 hover:to-teal-500/20 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Ajustar %
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={calculateTotals}
                        className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/50 text-slate-300 hover:from-slate-600/70 hover:to-slate-500/70 hover:border-slate-500/70 transition-all duration-300"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calcular Totais
                      </Button>
                      {isEditing && planId && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVersionHistoryOpen(true)}
                            className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/50 text-slate-300 hover:from-slate-600/70 hover:to-slate-500/70 hover:border-slate-500/70 transition-all duration-300"
                          >
                            <History className="w-4 h-4 mr-2" />
                            Versões
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setComparatorOpen(true)}
                            className="bg-gradient-to-r from-slate-600/10 to-slate-500/10 border-slate-500/50 text-slate-300 hover:from-slate-600/20 hover:to-slate-500/20 hover:border-slate-400/70 hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300"
                          >
                            <GitCompare className="w-4 h-4 mr-2" />
                            Comparar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* ABA 2: Refeições */}
                {activeTab === "meals" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-orange-400" />
                          Refeições
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          Adicione as refeições do plano alimentar
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={addMeal} 
                        size="sm"
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Refeição
                      </Button>
                    </div>

                    {mealFields.length === 0 ? (
                      <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
                        <CardContent className="p-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-4">
                            <Utensils className="w-8 h-8 text-orange-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma refeição adicionada ainda</h3>
                          <p className="text-slate-400 mb-6">
                            Comece adicionando refeições ao plano alimentar. Você pode adicionar alimentos e definir macros para cada refeição.
                          </p>
                          <Button 
                            type="button" 
                            onClick={addMeal} 
                            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300"
                          >
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
                              
                              // Componente MealItem movido para fora do map para evitar redefinição
                              return <MealItemComponent 
                                key={meal.id}
                                meal={meal}
                                mealIndex={mealIndex}
                                isExpanded={isExpanded}
                                form={form}
                                expandedMeals={expandedMeals}
                                setExpandedMeals={setExpandedMeals}
                                removeMeal={removeMeal}
                                appendMeal={appendMeal}
                                toast={toast}
                                sensors={sensors}
                                handleFoodDragEnd={handleFoodDragEnd}
                                handleMealDragEnd={handleMealDragEnd}
                                foodDatabase={foodDatabase}
                                handleFoodSelect={handleFoodSelect}
                                addFoodToMeal={addFoodToMeal}
                                removeFoodFromMeal={removeFoodFromMeal}
                                calculateMealMacros={calculateMealMacros}
                                calculateTotals={calculateTotals}
                                setFoodGroupsMealIndex={setFoodGroupsMealIndex}
                                setFoodGroupsModalOpen={setFoodGroupsModalOpen}
                                setSubstitutionFoodIndex={setSubstitutionFoodIndex}
                                setSubstitutionModalOpen={setSubstitutionModalOpen}
                                setSubstitutionsFoodIndex={setSubstitutionsFoodIndex}
                                setSubstitutionsModalOpen={setSubstitutionsModalOpen}
                              />;
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
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-purple-400" />
                        Observações entre Refeições
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Observação
                    </Button>
                  </div>

                    {observationFields.length === 0 ? (
                      <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                        <CardContent className="p-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
                            <AlertTriangle className="w-8 h-8 text-purple-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma observação adicionada ainda</h3>
                          <p className="text-slate-400 mb-6">
                            Adicione observações que aparecerão entre as refeições para orientar o paciente.
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
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
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
                                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:from-purple-500/15 hover:to-pink-500/15 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                                  >
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                          <div
                                            {...attributes}
                                            {...listeners}
                                            className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
                                          >
                                            <GripVertical className="w-4 h-4 text-purple-400/50" />
                                          </div>
                                          <CardTitle className="text-base font-semibold text-purple-300">
                                            Observação {index + 1}
                                          </CardTitle>
                                          <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/20">
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
                                    <FormLabel className="text-white font-medium">Texto da Observação *</FormLabel>
                                            <FormControl>
                                              <Textarea
                                                placeholder="Ex: Beber água entre as refeições. Evitar líquidos durante as refeições..."
                                                className="resize-none border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300 min-h-[100px]"
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
                                              <FormLabel className="text-white font-medium">Ordem</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                                                  {...field}
                                                  onChange={(e) => {
                                                    field.onChange(parseInt(e.target.value) || 0);
                                                  }}
                                                  value={field.value || index + 1}
                                                />
                                              </FormControl>
                                              <FormDescription className="text-xs text-slate-400">
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
                                              <FormLabel className="text-white font-medium">Posição (opcional)</FormLabel>
                                              <FormControl>
                                                <Input
                                                  placeholder="Ex: Após café da manhã"
                                                  className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <FormDescription className="text-xs text-slate-400">
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
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                        Orientações
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Adicione orientações gerais para o paciente seguir o plano
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={addGuideline} 
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Orientação
                    </Button>
                  </div>

                  {guidelineFields.length === 0 ? (
                    <Card className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
                      <CardContent className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 mb-4">
                          <BookOpen className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Nenhuma orientação adicionada ainda</h3>
                        <p className="text-slate-400 mb-6">
                          Adicione orientações para ajudar o paciente a seguir o plano corretamente.
                        </p>
                        <Button 
                          type="button" 
                          onClick={addGuideline} 
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeira Orientação
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {guidelineFields.map((guideline, index) => (
                        <Card 
                          key={guideline.id}
                          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-semibold text-emerald-300">Orientação {index + 1}</CardTitle>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGuideline(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
                                    <FormLabel className="text-white font-medium">Tipo de Orientação</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="border-slate-600/50 bg-slate-800/50 text-white focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300">
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
                                  <FormLabel className="text-white font-medium">Título *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Ex: Hidratação" 
                                      className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
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
                                  <FormLabel className="text-white font-medium">Conteúdo *</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Ex: Beber 2-3L de água por dia..."
                                      className="resize-none border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
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

                {/* ABA 5: Resumo */}
                {activeTab === "summary" && (
                  <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/40">
                    <CardHeader className="pb-4 border-b border-slate-700/50">
                      <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        Resumo do Plano
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="bg-gradient-to-br from-slate-800/30 to-slate-700/30 rounded-lg p-4 border border-slate-700/50">
                        <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Informações Básicas
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-slate-300">
                            <span className="text-slate-500 font-medium">Nome:</span>{" "}
                            <span className="text-white font-semibold">{form.watch("name") || "Não definido"}</span>
                          </p>
                          {form.watch("notes") && (
                            <p className="text-slate-300">
                              <span className="text-slate-500 font-medium">Observações:</span>{" "}
                              <span className="text-white">{form.watch("notes")}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          Macros Totais
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4 hover:from-orange-500/15 hover:to-red-500/15 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Calorias</p>
                            </div>
                            <p className="text-2xl font-bold text-orange-300">
                              {form.watch("total_calories") || 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">kcal</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-4 hover:from-blue-500/15 hover:to-indigo-500/15 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Proteína</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-300">
                              {form.watch("total_protein") || 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">gramas</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 hover:from-purple-500/15 hover:to-pink-500/15 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-purple-400" />
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Carboidratos</p>
                            </div>
                            <p className="text-2xl font-bold text-purple-300">
                              {form.watch("total_carbs") || 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">gramas</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-4 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Gorduras</p>
                            </div>
                            <p className="text-2xl font-bold text-emerald-300">
                              {form.watch("total_fats") || 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">gramas</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-orange-400" />
                          Refeições ({form.watch("meals")?.length || 0})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {form.watch("meals")?.map((meal: any, index: number) => {
                            // Calcular cores baseadas no índice (de cima para baixo: claro -> escuro)
                            const totalMeals = form.watch("meals")?.length || 1;
                            const getMealCardColors = (idx: number, total: number) => {
                              if (total === 1) {
                                return 'from-slate-700/50 to-slate-800/50 border-slate-600/60';
                              }
                              const progress = idx / (total - 1);
                              if (progress <= 0.2) {
                                return 'from-slate-500/50 to-slate-600/50 border-slate-500/60';
                              } else if (progress <= 0.4) {
                                return 'from-slate-600/50 to-slate-700/50 border-slate-600/60';
                              } else if (progress <= 0.6) {
                                return 'from-slate-700/50 to-slate-800/50 border-slate-700/60';
                              } else if (progress <= 0.8) {
                                return 'from-slate-800/50 to-slate-900/50 border-slate-800/60';
                              } else {
                                return 'from-slate-900/50 to-slate-950/50 border-slate-900/60';
                              }
                            };
                            const colors = getMealCardColors(index, totalMeals);
                            return (
                              <div key={index} className={`p-4 bg-gradient-to-br ${colors} rounded-lg hover:shadow-lg hover:shadow-slate-700/40 transition-all duration-300`}>
                                <p className="font-semibold mb-2 text-white">{meal.meal_name}</p>
                                <div className="flex items-center gap-3 text-xs">
                                  <Badge variant="outline" className="border-slate-600/50 text-slate-400 bg-slate-800/50">
                                    {meal.foods?.length || 0} alimento(s)
                                  </Badge>
                                  <Badge variant="outline" className="border-orange-500/30 text-orange-300 bg-orange-500/10">
                                    {meal.calories || 0} kcal
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-purple-400" />
                          Observações entre Refeições ({form.watch("observations")?.length || 0})
                        </h4>
                        <div className="space-y-3">
                          {form.watch("observations")?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((observation: any, index: number) => (
                            <div key={index} className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-300">
                                  Observação {index + 1}
                                </Badge>
                                <Badge variant="outline" className="border-slate-600/50 text-slate-400">
                                  Ordem: {observation.order || index + 1}
                                </Badge>
                              </div>
                              <p className="text-sm text-white mb-1">{observation.text}</p>
                              {observation.position && (
                                <p className="text-xs text-slate-400 mt-2">📍 Posição: {observation.position}</p>
                              )}
                            </div>
                          ))}
                          {(!form.watch("observations") || form.watch("observations")?.length === 0) && (
                            <p className="text-sm text-slate-400 text-center py-4">Nenhuma observação adicionada</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4 text-white flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          Orientações ({form.watch("guidelines")?.length || 0})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {form.watch("guidelines")?.map((guideline: any, index: number) => (
                            <div key={index} className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
                              <p className="font-semibold text-emerald-300 mb-2">{guideline.title}</p>
                              <p className="text-sm text-slate-300">{guideline.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Análise Nutricional */}
                      {form.watch("meals")?.length > 0 && (
                        <div className="mt-4">
                          <NutritionalAnalysisCard
                            plan={{
                              meals: form.watch("meals")?.map((meal: any) => ({
                                foods: meal.foods?.map((food: any) => ({
                                  food_name: food.food_name,
                                  quantity: food.quantity,
                                  unit: food.unit,
                                })),
                              })),
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                )}
              </div>
            </Tabs>
          </form>
        </Form>

        {/* Modais e Componentes Avançados */}
        <TemplateLibraryModal
          open={templateLibraryOpen}
          onOpenChange={setTemplateLibraryOpen}
          patientId={patientId}
          onTemplateSelected={handleTemplateSelected}
        />

        {form.watch('total_calories') && form.watch('meals')?.length > 0 && (
          <MacroDistributionModal
            open={macroDistributionOpen}
            onOpenChange={setMacroDistributionOpen}
            totalMacros={{
              calories: form.watch('total_calories') || 0,
              protein: form.watch('total_protein') || 0,
              carbs: form.watch('total_carbs') || 0,
              fats: form.watch('total_fats') || 0,
            }}
            mealTypes={form.watch('meals')?.map((m: any) => m.meal_type) || []}
            onApply={handleApplyMacroDistribution}
          />
        )}

        {substitutionFoodIndex && (
          <FoodSubstitutionModal
            open={substitutionModalOpen}
            onOpenChange={(open) => {
              setSubstitutionModalOpen(open);
              if (!open) setSubstitutionFoodIndex(null);
            }}
            originalFood={{
              name: form.watch(`meals.${substitutionFoodIndex.mealIndex}.foods.${substitutionFoodIndex.foodIndex}.food_name`) || '',
              quantity: form.watch(`meals.${substitutionFoodIndex.mealIndex}.foods.${substitutionFoodIndex.foodIndex}.quantity`) || 0,
              unit: form.watch(`meals.${substitutionFoodIndex.mealIndex}.foods.${substitutionFoodIndex.foodIndex}.unit`) || 'g',
              calories: form.watch(`meals.${substitutionFoodIndex.mealIndex}.foods.${substitutionFoodIndex.foodIndex}.calories`) || 0,
              protein: form.watch(`meals.${substitutionFoodIndex.mealIndex}.foods.${substitutionFoodIndex.foodIndex}.protein`) || 0,
              carbs: form.watch(`meals.${substitutionFoodIndex.mealIndex}.foods.${substitutionFoodIndex.foodIndex}.carbs`) || 0,
              fats: form.watch(`meals.${substitutionFoodIndex.mealIndex}.foods.${substitutionFoodIndex.foodIndex}.fats`) || 0,
            }}
            onSubstitute={handleSubstituteFood}
          />
        )}

        <FoodSubstitutionsModal
          open={substitutionsModalOpen}
          onOpenChange={(open) => {
            setSubstitutionsModalOpen(open);
            if (!open) setSubstitutionsFoodIndex(null);
          }}
          originalFoodName={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.food_name`) || '' : ''}
          substitutions={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.substitutions`) || [] : []}
          onSave={(substitutions) => {
            if (substitutionsFoodIndex) {
              form.setValue(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.substitutions`, substitutions);
            }
          }}
        />

        <ProportionalAdjustmentModal
          open={proportionalAdjustmentOpen}
          onOpenChange={setProportionalAdjustmentOpen}
          plan={{
            total_calories: form.watch('total_calories'),
            total_protein: form.watch('total_protein'),
            total_carbs: form.watch('total_carbs'),
            total_fats: form.watch('total_fats'),
            meals: form.watch('meals')?.map((meal: any) => ({
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fats: meal.fats,
              foods: meal.foods?.map((food: any) => ({
                quantity: food.quantity,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
              })),
            })),
          }}
          onApply={handleApplyProportionalAdjustment}
        />

        {planId && (
          <>
            <PlanVersionHistoryModal
              open={versionHistoryOpen}
              onOpenChange={setVersionHistoryOpen}
              planId={planId}
              onVersionRestored={() => {
                loadPlanData();
                onSuccess?.();
              }}
            />

            <PlanComparatorModal
              open={comparatorOpen}
              onOpenChange={setComparatorOpen}
              currentPlanId={planId}
            />
          </>
        )}

        <TMBCalculator
          open={tmbDialogOpen}
          onOpenChange={setTmbDialogOpen}
          onApplyMacros={(macros) => {
            form.setValue("total_calories", macros.calorias);
            form.setValue("total_protein", macros.proteinas);
            form.setValue("total_carbs", macros.carboidratos);
            form.setValue("total_fats", macros.gorduras);
            validatePlan();
            toast({
              title: "Macros aplicados!",
              description: "Os macros foram calculados e aplicados ao plano.",
            });
          }}
          patientData={patientData}
        />

        {foodGroupsMealIndex !== null && (
          <FoodGroupsModal
            open={foodGroupsModalOpen}
            onOpenChange={(open) => {
              setFoodGroupsModalOpen(open);
              if (!open) setFoodGroupsMealIndex(null);
            }}
            mealIndex={foodGroupsMealIndex}
            onGroupAdded={(foods) => {
              const currentFoods = form.watch(`meals.${foodGroupsMealIndex}.foods`) || [];
              form.setValue(`meals.${foodGroupsMealIndex}.foods`, [...currentFoods, ...foods]);
              calculateMealMacros(foodGroupsMealIndex);
              calculateTotals();
              validatePlan();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente FoodItem memoizado para evitar re-renderizações e perda de foco
const FoodItem = memo(function FoodItem({
  mealIndex,
  foodIndex,
  form,
  foodDatabase,
  handleFoodSelect,
  removeFoodFromMeal,
  setSubstitutionFoodIndex,
  setSubstitutionModalOpen,
  setSubstitutionsFoodIndex,
  setSubstitutionsModalOpen: setSubstitutionsModalOpenProp,
  mealType,
  mealCalories,
  mealProtein,
  mealCarbs,
  mealFats,
  existingFoods,
  calculateMealMacros,
  calculateTotals,
}: any) {
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
      className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
            >
              <GripVertical className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <h4 className="font-semibold text-white">Alimento {foodIndex + 1}</h4>
            </div>
          </div>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name={`meals.${mealIndex}.foods.${foodIndex}.food_name`}
              render={({ field: foodNameField }) => (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSubstitutionsFoodIndex({ mealIndex, foodIndex });
                      setSubstitutionsModalOpenProp(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 px-2 rounded-lg transition-all duration-300 text-xs"
                    title="Gerenciar substitutos"
                    disabled={!foodNameField.value}
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Substitutos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const foodData = form.getValues(`meals.${mealIndex}.foods.${foodIndex}`);
                      if (foodData?.food_name && foodData?.calories) {
                        setSubstitutionFoodIndex({ mealIndex, foodIndex });
                        setSubstitutionModalOpen(true);
                      }
                    }}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-8 w-8 p-0 rounded-lg transition-all duration-300"
                    title="Substituir alimento"
                    disabled={!foodNameField.value}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                removeFoodFromMeal(mealIndex, foodIndex);
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name={`meals.${mealIndex}.foods.${foodIndex}.food_name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  Alimento *
                </FormLabel>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o nome do alimento"
                      className="flex-1 border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300"
                      {...field}
                    />
                    <FoodSuggestionsDropdown
                      mealType={mealType || ''}
                      targetCalories={mealCalories || undefined}
                      targetProtein={mealProtein || undefined}
                      targetCarbs={mealCarbs || undefined}
                      targetFats={mealFats || undefined}
                      existingFoods={existingFoods}
                      onSelect={(foodName) => {
                        field.onChange(foodName);
                        handleFoodSelect(mealIndex, foodIndex, foodName);
                      }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/50 text-purple-300 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </FoodSuggestionsDropdown>
                  </div>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFoodSelect(mealIndex, foodIndex, value);
                    }}
                    value={foodDatabase.some((food: any) => food.name === field.value) ? field.value : ""}
                  >
                    <FormControl>
                      <SelectTrigger className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300">
                        <SelectValue placeholder="Ou selecione do banco de alimentos" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {foodDatabase.map((food: any) => (
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

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name={`meals.${mealIndex}.foods.${foodIndex}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Quantidade *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="100"
                      className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        const currentFoodName = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.food_name`);
                        if (currentFoodName && foodDatabase.length > 0) {
                          handleFoodSelect(mealIndex, foodIndex, currentFoodName);
                        }
                      }}
                      value={field.value ?? ""}
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
                  <FormLabel className="text-white font-medium">Unidade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger className="border-slate-600/50 bg-slate-800/50 text-white focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300">
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

        {/* Macros do Alimento */}
        <div className="pt-3 border-t border-slate-700/50">
          <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">Informações Nutricionais</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FormField
              control={form.control}
              name={`meals.${mealIndex}.foods.${foodIndex}.calories`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Calorias
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      className="border-orange-500/30 bg-orange-500/5 text-orange-300 placeholder:text-slate-500 focus:border-orange-400 focus:ring-orange-400/20 transition-all duration-300"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                        calculateMealMacros(mealIndex);
                        calculateTotals();
                      }}
                      value={field.value ?? ""}
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
                  <FormLabel className="text-xs text-slate-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Proteína (g)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                        calculateMealMacros(mealIndex);
                        calculateTotals();
                      }}
                      value={field.value ?? ""}
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
                  <FormLabel className="text-xs text-slate-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Carboidratos (g)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="border-purple-500/30 bg-purple-500/5 text-purple-300 placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                        calculateMealMacros(mealIndex);
                        calculateTotals();
                      }}
                      value={field.value ?? ""}
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
                  <FormLabel className="text-xs text-slate-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Gorduras (g)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="border-emerald-500/30 bg-emerald-500/5 text-emerald-300 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all duration-300"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                        calculateMealMacros(mealIndex);
                        calculateTotals();
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name={`meals.${mealIndex}.foods.${foodIndex}.notes`}
          render={({ field }) => (
            <FormItem className="mt-2">
              <FormLabel className="text-xs text-white font-medium">Observações (opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: sem açúcar, grelhado..." 
                  className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
});

// Componente MealItem separado para evitar redefinição e perda de foco
function MealItemComponent({
  meal,
  mealIndex,
  isExpanded,
  form,
  expandedMeals,
  setExpandedMeals,
  removeMeal,
  appendMeal,
  toast,
  sensors,
  handleFoodDragEnd,
  handleMealDragEnd,
  foodDatabase,
  handleFoodSelect,
  addFoodToMeal,
  removeFoodFromMeal,
  calculateMealMacros,
  calculateTotals,
  setFoodGroupsMealIndex,
  setFoodGroupsModalOpen,
  setSubstitutionFoodIndex,
  setSubstitutionModalOpen,
  setSubstitutionsFoodIndex,
  setSubstitutionsModalOpen: setSubstitutionsModalOpenProp,
}: any) {
  // Usar useWatch apenas uma vez para evitar múltiplas re-renderizações
  const mealData = useWatch({ control: form.control, name: `meals.${mealIndex}` });
  const mealName = mealData?.meal_name || `Refeição ${mealIndex + 1}`;
  const suggestedTime = mealData?.suggested_time;
  const mealCalories = mealData?.calories || 0;
  const mealProtein = mealData?.protein || 0;
  const mealCarbs = mealData?.carbs || 0;
  const mealFats = mealData?.fats || 0;
  const mealFoods = mealData?.foods || [];
  
  // Memoizar existingFoods para evitar re-renderizações desnecessárias
  const existingFoods = useMemo(() => {
    return mealFoods?.map((f: any) => f.food_name).filter(Boolean) || [];
  }, [mealFoods]);

  // Obter total de refeições para calcular progressão de cores
  const totalMeals = form.watch("meals")?.length || 1;
  
  // Função para calcular cores baseadas no índice (de cima para baixo: claro -> escuro)
  const getMealCardColors = (index: number, total: number) => {
    if (total === 1) {
      return 'from-slate-700/50 to-slate-800/50 border-slate-600/60 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-slate-700/40';
    }
    
    // Progressão de tons: slate-500 (mais claro) até slate-900 (mais escuro)
    const progress = index / (total - 1); // 0 a 1
    
    // Mapear progress para classes estáticas do Tailwind
    if (progress <= 0.2) {
      return 'from-slate-500/50 to-slate-600/50 border-slate-500/60 hover:from-slate-500/60 hover:to-slate-600/60 hover:shadow-slate-500/40';
    } else if (progress <= 0.4) {
      return 'from-slate-600/50 to-slate-700/50 border-slate-600/60 hover:from-slate-600/60 hover:to-slate-700/60 hover:shadow-slate-600/40';
    } else if (progress <= 0.6) {
      return 'from-slate-700/50 to-slate-800/50 border-slate-700/60 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-slate-700/40';
    } else if (progress <= 0.8) {
      return 'from-slate-800/50 to-slate-900/50 border-slate-800/60 hover:from-slate-800/60 hover:to-slate-900/60 hover:shadow-slate-800/40';
    } else {
      return 'from-slate-900/50 to-slate-950/50 border-slate-900/60 hover:from-slate-900/60 hover:to-slate-950/60 hover:shadow-slate-900/40';
    }
  };

  const cardColors = getMealCardColors(mealIndex, totalMeals);

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
                                <Card className={`bg-gradient-to-br border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${cardColors}`}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-3 flex-1 cursor-pointer group">
                                          <div
                                            {...attributes}
                                            {...listeners}
                                            className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
                                          >
                                            <GripVertical className="w-4 h-4 text-slate-500" />
                                          </div>
                                    <CardTitle className="text-base font-semibold text-white transition-colors">
                                      {mealName}
                                    </CardTitle>
                                    {suggestedTime && (
                                      <Badge variant="outline" className="border-slate-600/50 text-slate-400 text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {suggestedTime}
                                      </Badge>
                                    )}
                                    {!isExpanded && (
                                      <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <Badge variant="outline" className="border-slate-500/40 text-slate-200 bg-slate-700/30">
                                          {mealCalories} kcal
                                        </Badge>
                                        <Badge variant="outline" className="border-slate-500/40 text-slate-200 bg-slate-700/30">
                                          P: {mealProtein}g
                                        </Badge>
                                        <Badge variant="outline" className="border-slate-500/40 text-slate-200 bg-slate-700/30">
                                          C: {mealCarbs}g
                                        </Badge>
                                        <Badge variant="outline" className="border-slate-500/40 text-slate-200 bg-slate-700/30">
                                          G: {mealFats}g
                                        </Badge>
                                      </div>
                                    )}
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-slate-400 transition-transform" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
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
                                    className="text-purple-400 hover:text-purple-300"
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
                                    <FormLabel className="text-white font-medium">Tipo de Refeição</FormLabel>
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
                                        <SelectTrigger className="border-slate-600/50 bg-slate-800/50 text-white focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300">
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
                                    <FormLabel className="text-white font-medium">Nome da Refeição</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Ex: Café da Manhã" 
                                        className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
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
                                    <FormLabel className="text-white font-medium flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-blue-400" />
                                      Horário Sugerido
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="time"
                                        className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                                        {...field}
                                        value={field.value ?? ""}
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
                                    <FormLabel className="text-white font-medium">Ordem</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(parseInt(e.target.value) || 0);
                                        }}
                                        value={field.value ?? 0}
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
                                    <FormLabel className="text-white font-medium flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                                      Instruções (opcional)
                                    </FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Instruções específicas para esta refeição..."
                                        className="resize-none border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-400/20 transition-all duration-300 min-h-[80px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                              )}
                            />

                            {/* Alimentos da Refeição */}
                            <div className="space-y-4 pt-2 border-t border-slate-700/50">
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-white font-semibold flex items-center gap-2">
                                  <Package className="w-4 h-4 text-purple-400" />
                                  Alimentos
                                </FormLabel>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setFoodGroupsMealIndex(mealIndex);
                                      setFoodGroupsModalOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/50 text-emerald-300 hover:from-emerald-500/20 hover:to-teal-500/20 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
                                  >
                                    <Package className="w-4 h-4 mr-2" />
                                    Adicionar Grupo
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFoodToMeal(mealIndex)}
                                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/50 text-purple-300 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Alimento
                                  </Button>
                                </div>
                              </div>

                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => handleFoodDragEnd(e, mealIndex)}
                              >
                                <SortableContext
                                  items={mealFoods.map((_: any, idx: number) => `food-${mealIndex}-${idx}`)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {mealFoods.map((food: any, foodIndex: number) => (
                                    <FoodItem
                                      key={`food-${mealIndex}-${foodIndex}`}
                                      mealIndex={mealIndex}
                                      foodIndex={foodIndex}
                                      form={form}
                                      foodDatabase={foodDatabase}
                                      handleFoodSelect={handleFoodSelect}
                                      removeFoodFromMeal={removeFoodFromMeal}
                                      setSubstitutionFoodIndex={setSubstitutionFoodIndex}
                                      setSubstitutionModalOpen={setSubstitutionModalOpen}
                                      setSubstitutionsFoodIndex={setSubstitutionsFoodIndex}
                                      setSubstitutionsModalOpen={setSubstitutionsModalOpenProp}
                                      mealType={mealData?.meal_type || ''}
                                      mealCalories={mealCalories}
                                      mealProtein={mealProtein}
                                      mealCarbs={mealCarbs}
                                      mealFats={mealFats}
                                      existingFoods={existingFoods}
                                      calculateMealMacros={calculateMealMacros}
                                      calculateTotals={calculateTotals}
                                    />
                                  ))}
                                </SortableContext>
                              </DndContext>

                              {mealFoods.length === 0 && (
                                <div className="p-8 text-center bg-gradient-to-br from-slate-800/30 to-slate-700/30 rounded-lg border border-slate-700/50">
                                  <Package className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                                  <p className="text-sm text-slate-400 mb-1">Nenhum alimento adicionado</p>
                                  <p className="text-xs text-slate-500">Clique em "Adicionar Alimento" para começar</p>
                                </div>
                              )}

                              {/* Macros da Refeição */}
                              {(mealCalories || mealProtein || mealCarbs || mealFats) && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-600/50">
                                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-lg p-3 hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Calorias</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-200">
                                      {mealCalories} kcal
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-lg p-3 hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Proteína</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-200">
                                      {mealProtein}g
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-lg p-3 hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Carboidratos</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-200">
                                      {mealCarbs}g
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-lg p-3 hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Gorduras</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-200">
                                      {mealFats}g
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
}

