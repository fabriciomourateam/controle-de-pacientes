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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { dietService } from "@/lib/diet-service";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Calculator, Utensils, Clock, Star, Copy, ChevronDown, ChevronUp, GripVertical, BookOpen, RefreshCw, TrendingUp, BarChart3, History, GitCompare, AlertTriangle, Sparkles, Package, MoreVertical, CheckCircle, Eye, Layers, Heart, X } from "lucide-react";
import { TMBCalculator } from "./TMBCalculator";
import { MacroDistributionModal } from "./MacroDistributionModal";
import { TemplateLibraryModal } from "./TemplateLibraryModal";
import { GuidelineTemplatesModal } from "./GuidelineTemplatesModal";
import { FoodSuggestionsDropdown } from "./FoodSuggestionsDropdown";
import { FoodSearchInput } from "./FoodSearchInput";
import { FoodSelectionModal } from "./FoodSelectionModal";
import { RichTextEditor } from "./RichTextEditor";
import { foodSuggestionsService } from "@/lib/diet-food-suggestions-service";
import FoodCacheService from "@/lib/food-cache-service";

import { FoodSubstitutionsModal } from "./FoodSubstitutionsModal";
import { ProportionalAdjustmentModal } from "./ProportionalAdjustmentModal";
import { QuickPortionAdjustment } from "./QuickPortionAdjustment";
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
import { dietMealFavoritesService, type FavoriteMeal } from "@/lib/diet-meal-favorites-service";
import { foodGroupsService } from "@/lib/diet-food-groups-service";
import { useGuidelineTemplates } from "@/hooks/use-guideline-templates";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  is_released: z.boolean().optional(),
  total_calories: z.number().min(0).optional(),
  total_protein: z.number().min(0).optional(),
  total_carbs: z.number().min(0).optional(),
  total_fats: z.number().min(0).optional(),
  target_calories: z.number().min(0).optional(),
  target_protein: z.number().min(0).optional(),
  target_carbs: z.number().min(0).optional(),
  target_fats: z.number().min(0).optional(),
  meals: z.array(
    z.object({
      meal_type: z.string(),
      meal_name: z.string().min(1, "Nome da refeição é obrigatório"),
      meal_order: z.number(),
      day_of_week: z.number().nullable().optional(),
      suggested_time: z.string().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fats: z.number().optional(),
      instructions: z.string().optional(),
      exclude_from_macros: z.boolean().optional().default(false),
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
      guideline_type: z.string().optional().default("general"),
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
  patientUserId?: string | null;
  planId?: string; // ID do plano para edição (opcional)
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onSaveSuccess?: () => void;
  isPageMode?: boolean; // Se true, renderiza sem Dialog
}

export function DietPlanForm({
  patientId,
  patientUserId,
  planId,
  open,
  onOpenChange,
  onSuccess,
  onSaveSuccess,
  isPageMode = false,
}: DietPlanFormProps) {
  const { toast } = useToast();
  const { copyTemplatesToPlan, createTemplate } = useGuidelineTemplates();
  const [loading, setLoading] = useState(false);
  const [foodDatabase, setFoodDatabase] = useState<any[]>([]);
  const [foodDatabaseLoaded, setFoodDatabaseLoaded] = useState(false);
  const [foodDatabaseLoading, setFoodDatabaseLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  // Map para armazenar quantidades originais dos alimentos (para recalcular quando não está no banco)
  const originalQuantitiesRef = useRef<Map<string, number>>(new Map());
  // Map para armazenar macros originais dos alimentos (para recalcular proporcionalmente)
  const originalMacrosRef = useRef<Map<string, { calories: number; protein: number; carbs: number; fats: number }>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [tmbDialogOpen, setTmbDialogOpen] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set());
  const [expandedObservations, setExpandedObservations] = useState<Set<number>>(new Set());
  const [expandedGuidelines, setExpandedGuidelines] = useState<Set<number>>(new Set());
  const [patientData, setPatientData] = useState<any>(null);
  
  // Estados para novos modais e funcionalidades
  const [macroDistributionOpen, setMacroDistributionOpen] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [guidelineTemplatesOpen, setGuidelineTemplatesOpen] = useState(false);
  const [isSelectTemplateOpen, setIsSelectTemplateOpen] = useState(false);
  const [substitutionsModalOpen, setSubstitutionsModalOpen] = useState(false);
  const [proportionalAdjustmentOpen, setProportionalAdjustmentOpen] = useState(false);
  const [quickPortionAdjustmentOpen, setQuickPortionAdjustmentOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [comparatorOpen, setComparatorOpen] = useState(false);
  const [substitutionsFoodIndex, setSubstitutionsFoodIndex] = useState<{ mealIndex: number; foodIndex: number } | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [foodGroupsModalOpen, setFoodGroupsModalOpen] = useState(false);
  const [foodGroupsMealIndex, setFoodGroupsMealIndex] = useState<number | null>(null);
  const [foodSelectionModalOpen, setFoodSelectionModalOpen] = useState(false);
  const [favoriteMealsModalOpen, setFavoriteMealsModalOpen] = useState(false);
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMeal[]>([]);
  const [favoriteMealsLoading, setFavoriteMealsLoading] = useState(false);
  const [favoriteMealsMealIndex, setFavoriteMealsMealIndex] = useState<number | null>(null);
  const [foodSelectionMealIndex, setFoodSelectionMealIndex] = useState<number | null>(null);
  const [mealsSortBy, setMealsSortBy] = useState<'order' | 'time' | 'name' | 'calories' | 'protein'>('order');
  const [allMealsExpanded, setAllMealsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<{ mealIndex: number; foodIndex: number } | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  
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
      is_released: false,
      total_calories: undefined,
      total_protein: undefined,
      total_carbs: undefined,
      total_fats: undefined,
      target_calories: undefined,
      target_protein: undefined,
      target_carbs: undefined,
      target_fats: undefined,
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
      // Limpar refs de macros originais ao abrir o modal
      originalQuantitiesRef.current.clear();
      originalMacrosRef.current.clear();
      
      loadPatientData();
      // Lazy load: não carregar alimentos imediatamente, apenas quando necessário
      if (planId) {
        loadPlanData();
      } else {
        // Resetar formulário para criação
        form.reset({
          name: "",
          notes: "",
          is_released: false,
          total_calories: undefined,
          total_protein: undefined,
          total_carbs: undefined,
          total_fats: undefined,
          target_calories: undefined,
          target_protein: undefined,
          target_carbs: undefined,
          target_fats: undefined,
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
        .select('peso_inicial, altura_inicial, data_nascimento, genero, telefone')
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

        // Buscar peso mais recente dos check-ins
        let pesoAtual = data.peso_inicial;
        
        // Só buscar checkin se o paciente tiver telefone
        if (data.telefone) {
          try {
            const { data: checkinData, error: checkinError } = await supabase
              .from('checkin')
              .select('peso')
              .eq('telefone', data.telefone)
              .not('peso', 'is', null)
              .order('data_checkin', { ascending: false })
              .limit(1)
              .single();
            
            if (!checkinError && checkinData?.peso) {
              pesoAtual = checkinData.peso;
            }
          } catch (checkinError) {
            // Se não houver check-ins, usar peso_inicial
            console.log("Nenhum check-in encontrado, usando peso_inicial");
          }
        } else {
          console.log("Paciente sem telefone cadastrado, usando peso_inicial");
        }

        setPatientData({
          peso: pesoAtual,
          altura: data.altura_inicial,
          idade,
          sexo,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do paciente:", error);
    }
  };

  // Lazy loading: carregar alimentos apenas quando necessário
  const loadFoodDatabase = useCallback(async (force = false) => {
    console.log('🔍 [DietPlanForm] loadFoodDatabase() chamado, force:', force);
    // Verificar cache primeiro
    if (!force) {
      const cached = FoodCacheService.getCachedFoods();
      console.log('💾 [DietPlanForm] Cache verificado:', {
        hasCached: !!cached,
        cachedCount: cached?.length || 0
      });
      
      if (cached && cached.length > 0) {
        console.log('✅ [DietPlanForm] Usando alimentos do cache');
        setFoodDatabase(cached);
        setFoodDatabaseLoaded(true);
        // Carregar em background para atualizar cache
        console.log('🔄 [DietPlanForm] Atualizando cache em background');
        loadFoodDatabaseFromServer();
        return;
      }
    }

    console.log('📡 [DietPlanForm] Carregando alimentos do servidor');
    await loadFoodDatabaseFromServer();
  }, []);

  const loadFoodDatabaseFromServer = async () => {
    console.log('🔍 [DietPlanForm] loadFoodDatabaseFromServer() chamado');
    if (foodDatabaseLoading) {
      console.log('⏸️ [DietPlanForm] Já está carregando, abortando');
      return;
    }
    
    setFoodDatabaseLoading(true);
    try {
      console.log('📡 [DietPlanForm] Chamando dietService.getFoodDatabase()...');
      const foods = await dietService.getFoodDatabase();
      console.log('📦 [DietPlanForm] Resposta recebida:', {
        foodsCount: foods?.length || 0,
        firstFoods: foods?.slice(0, 3).map((f: any) => f.name) || []
      });
      
      // Buscar alimentos customizados do usuário
      console.log('📡 [DietPlanForm] Buscando alimentos customizados...');
      const { customFoodsService } = await import("@/lib/custom-foods-service");
      const customFoods = await customFoodsService.getCustomFoods();
      console.log('📦 [DietPlanForm] Alimentos customizados:', {
        count: customFoods?.length || 0,
      });
      
      // Converter alimentos customizados para o formato do banco de dados
      const customFoodsFormatted = customFoods.map((food) => ({
        name: food.name,
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fats_per_100g: food.fats_per_100g,
        fiber_per_100g: food.fiber_per_100g || 0,
        category: food.category || "Customizado",
        is_custom: true, // Flag para identificar alimentos customizados
      }));
      
      // Combinar alimentos do banco com alimentos customizados
      // Alimentos customizados aparecem primeiro (ordenados por favoritos)
      const customFoodsSorted = customFoodsFormatted.sort((a, b) => {
        const foodA = customFoods.find(f => f.name === a.name);
        const foodB = customFoods.find(f => f.name === b.name);
        if (foodA?.is_favorite && !foodB?.is_favorite) return -1;
        if (!foodA?.is_favorite && foodB?.is_favorite) return 1;
        return a.name.localeCompare(b.name);
      });
      
      const allFoods = [...customFoodsSorted, ...(foods || [])];
      
      if (allFoods && allFoods.length > 0) {
        console.log('✅ [DietPlanForm] Salvando alimentos no state');
        setFoodDatabase(allFoods);
        setFoodDatabaseLoaded(true);
        // Salvar no cache
        FoodCacheService.cacheFoods(allFoods);
        console.log('✅ [DietPlanForm] Alimentos salvos com sucesso');
      } else {
        console.warn('⚠️ [DietPlanForm] Nenhum alimento retornado');
      }
    } catch (error) {
      console.error("❌ [DietPlanForm] Erro ao carregar banco de alimentos:", error);
    } finally {
      setFoodDatabaseLoading(false);
      console.log('🏁 [DietPlanForm] loadFoodDatabaseFromServer() finalizado');
    }
  };

  // Limpar cache expirado ao montar
  useEffect(() => {
    FoodCacheService.cleanExpiredCache();
  }, []);

  // Carregar alimentos quando o modal de seleção for aberto
  useEffect(() => {
    if (foodSelectionModalOpen && !foodDatabaseLoaded && !foodDatabaseLoading) {
      console.log('🔄 [DietPlanForm] Modal de seleção aberto, carregando alimentos...');
      loadFoodDatabase();
    }
  }, [foodSelectionModalOpen, foodDatabaseLoaded, foodDatabaseLoading, loadFoodDatabase]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Abrir modal de seleção de alimentos (se estiver na aba de refeições)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && activeTab === 'meals') {
        e.preventDefault();
        if (foodSelectionMealIndex === null && mealFields.length > 0) {
          setFoodSelectionMealIndex(0);
          setFoodSelectionModalOpen(true);
        }
      }
      
      // Escape: Fechar modais
      if (e.key === 'Escape') {
        if (foodSelectionModalOpen) {
          setFoodSelectionModalOpen(false);
          setFoodSelectionMealIndex(null);
        }
        if (favoriteMealsModalOpen) {
          setFavoriteMealsModalOpen(false);
        }
      }
      
      // Ctrl/Cmd + S: Salvar (se não estiver em input/textarea)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, foodSelectionModalOpen, favoriteMealsModalOpen, foodSelectionMealIndex, mealFields.length]);


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
        is_released: planData.is_released || false,
        total_calories: planData.total_calories || undefined,
        total_protein: planData.total_protein || undefined,
        total_carbs: planData.total_carbs || undefined,
        total_fats: planData.total_fats || undefined,
        target_calories: planData.target_calories || undefined,
        target_protein: planData.target_protein || undefined,
        target_carbs: planData.target_carbs || undefined,
        target_fats: planData.total_fats || undefined,
        meals: (planData.diet_meals || []).map((meal: any, mealIndex: number) => ({
          meal_type: meal.meal_type || "",
          meal_name: meal.meal_name || "",
          meal_order: meal.meal_order || 0,
          day_of_week: meal.day_of_week || null,
          suggested_time: meal.suggested_time || undefined,
          start_time: meal.start_time || undefined,
          end_time: meal.end_time || undefined,
          calories: meal.calories || undefined,
          protein: meal.protein || undefined,
          carbs: meal.carbs || undefined,
          fats: meal.fats || undefined,
          instructions: meal.instructions || "",
          foods: (meal.diet_foods || []).map((food: any, foodIndex: number) => {
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
            
            const foodKey = `${mealIndex}_${foodIndex}`;
            const foodQuantity = food.quantity || 0;
            // Armazenar quantidade original e macros originais para recalcular depois (quando alimento não está no banco)
            // Armazenar sempre que houver quantidade e macros, para poder recalcular proporcionalmente
            if (foodQuantity > 0 && (food.calories > 0 || food.protein > 0 || food.carbs > 0 || food.fats > 0)) {
              originalQuantitiesRef.current.set(foodKey, foodQuantity);
              originalMacrosRef.current.set(foodKey, {
                calories: food.calories || 0,
                protein: food.protein || 0,
                carbs: food.carbs || 0,
                fats: food.fats || 0,
              });
            }
            
            return {
              food_name: food.food_name || "",
              quantity: foodQuantity,
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

  // Observar mudanças apenas em meals para validação (otimização de performance)
  const watchedMeals = useWatch({ control: form.control, name: 'meals' });
  
  // Validar quando o plano muda (com debounce aumentado para melhor performance)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (open && watchedMeals?.length > 0) {
      // Limpar timeout anterior
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      // Aumentar debounce para 1000ms para reduzir validações frequentes
      validationTimeoutRef.current = setTimeout(() => {
        validatePlan();
      }, 1000);
      
      return () => {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
      };
    }
  }, [watchedMeals, open, validatePlan]);

  const calculateTotals = () => {
    const meals = form.watch("meals") || [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    meals.forEach((meal) => {
      // Pular refeições marcadas para não contar nos macros
      if (meal.exclude_from_macros) {
        return;
      }

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

    // Calorias arredondadas para inteiro, macros com 1 casa decimal
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
      exclude_from_macros: false,
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

  // Função para recalcular macros de um alimento baseado na quantidade
  const recalculateFoodMacros = (mealIndex: number, foodIndex: number) => {
    const foodName = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.food_name`);
    if (!foodName) return;

    const currentQuantity = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.quantity`) || 0;
    const currentCalories = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.calories`) || 0;
    const currentProtein = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.protein`) || 0;
    const currentCarbs = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.carbs`) || 0;
    const currentFats = form.getValues(`meals.${mealIndex}.foods.${foodIndex}.fats`) || 0;
    
    // Se quantidade é 0 ou negativa, zerar todos os macros
    if (currentQuantity <= 0) {
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.calories`, 0);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.protein`, 0);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.carbs`, 0);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.fats`, 0);
      calculateMealMacros(mealIndex);
      calculateTotals();
      return;
    }

    const foodKey = `${mealIndex}_${foodIndex}`;
    let originalQuantity = originalQuantitiesRef.current.get(foodKey);
    let originalMacros = originalMacrosRef.current.get(foodKey);
    
    // Se JÁ temos macros originais armazenados, SEMPRE usar eles para recalcular
    // Isso garante que o cálculo seja consistente mesmo após mudar o nome
    if (originalQuantity && originalQuantity > 0 && originalMacros) {
      // Calcular macros por unidade baseado nos macros originais e quantidade original
      const macrosPerUnit = {
        calories: originalMacros.calories / originalQuantity,
        protein: originalMacros.protein / originalQuantity,
        carbs: originalMacros.carbs / originalQuantity,
        fats: originalMacros.fats / originalQuantity,
      };
      
      // Recalcular para a nova quantidade
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.calories`,
        Math.round(macrosPerUnit.calories * currentQuantity)
      );
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.protein`,
        Math.round(macrosPerUnit.protein * currentQuantity * 10) / 10
      );
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.carbs`,
        Math.round(macrosPerUnit.carbs * currentQuantity * 10) / 10
      );
      form.setValue(
        `meals.${mealIndex}.foods.${foodIndex}.fats`,
        Math.round(macrosPerUnit.fats * currentQuantity * 10) / 10
      );
      
      // Recalcular macros da refeição e totais
      calculateMealMacros(mealIndex);
      calculateTotals();
      return;
    }
    
    // Se NÃO temos macros originais, tentar buscar no banco de dados
    const selectedFood = foodDatabase.find((f) => 
      f.name.toLowerCase() === foodName.toLowerCase()
    );

    if (selectedFood) {
      // Alimento encontrado no banco, usar valores do banco
      const multiplier = currentQuantity / 100;

      const newCalories = Math.round(selectedFood.calories_per_100g * multiplier);
      const newProtein = Math.round(selectedFood.protein_per_100g * multiplier * 10) / 10;
      const newCarbs = Math.round(selectedFood.carbs_per_100g * multiplier * 10) / 10;
      const newFats = Math.round(selectedFood.fats_per_100g * multiplier * 10) / 10;

      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.calories`, newCalories);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.protein`, newProtein);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.carbs`, newCarbs);
      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.fats`, newFats);
      
      // Armazenar como macros originais
      originalQuantitiesRef.current.set(foodKey, currentQuantity);
      originalMacrosRef.current.set(foodKey, {
        calories: newCalories,
        protein: newProtein,
        carbs: newCarbs,
        fats: newFats,
      });
    } else {
      // Alimento NÃO está no banco E não temos macros originais
      // Armazenar os valores atuais como referência original
      if (currentCalories > 0 || currentProtein > 0 || currentCarbs > 0 || currentFats > 0) {
        originalQuantitiesRef.current.set(foodKey, currentQuantity);
        originalMacrosRef.current.set(foodKey, {
          calories: currentCalories,
          protein: currentProtein,
          carbs: currentCarbs,
          fats: currentFats,
        });
      }
    }

    // Recalcular macros da refeição e totais
    calculateMealMacros(mealIndex);
    calculateTotals();
  };

  const handleFoodSelect = async (mealIndex: number, foodIndex: number, foodName: string) => {
    const selectedFood = foodDatabase.find((f) => f.name === foodName);
    if (selectedFood) {
      const quantity = form.watch(`meals.${mealIndex}.foods.${foodIndex}.quantity`) || 100;
      const multiplier = quantity / 100;

      // Armazenar quantidade original quando alimento é selecionado do banco
      const foodKey = `${mealIndex}_${foodIndex}`;
      originalQuantitiesRef.current.set(foodKey, quantity);

      form.setValue(`meals.${mealIndex}.foods.${foodIndex}.food_name`, selectedFood.name);
      // Calorias arredondadas para inteiro, macros com 1 casa decimal
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

      // Recalcular macros da refeição e totais (sem delay para melhor performance)
      calculateMealMacros(mealIndex);
      calculateTotals();
      // validatePlan() já tem debounce, não precisa chamar aqui
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

    // Calorias arredondadas para inteiro, macros com 1 casa decimal
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
            start_time: meal.start_time || '',
            end_time: meal.end_time || '',
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
    console.log('🔥 onSubmit chamado!', data);
    console.log('📝 Dados do formulário:', {
      meals: data.meals?.length,
      guidelines: data.guidelines?.length,
      observations: data.observations?.length
    });
    try {
      setLoading(true);
      console.log('⏳ Loading iniciado...');

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
          is_released: data.is_released || false,
          total_calories: data.total_calories || null,
          total_protein: data.total_protein || null,
          total_carbs: data.total_carbs || null,
          total_fats: data.total_fats || null,
          target_calories: data.target_calories || null,
          target_protein: data.target_protein || null,
          target_carbs: data.target_carbs || null,
          target_fats: data.target_fats || null,
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
          is_released: data.is_released || false,
          total_calories: data.total_calories || null,
          total_protein: data.total_protein || null,
          total_carbs: data.total_carbs || null,
          total_fats: data.total_fats || null,
          target_calories: data.target_calories || null,
          target_protein: data.target_protein || null,
          target_carbs: data.target_carbs || null,
          target_fats: data.target_fats || null,
          created_by: userId,
        };

        const newPlan = await dietService.create(planData);
        currentPlanId = newPlan.id;
        
        // Copiar templates de orientações para o novo plano
        try {
          await copyTemplatesToPlan(currentPlanId);
          console.log('✅ Templates de orientações copiados para o novo plano');
        } catch (error) {
          console.error('⚠️ Erro ao copiar templates:', error);
          // Não bloquear a criação do plano se houver erro ao copiar templates
        }
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
            start_time: meal.start_time || null,
            end_time: meal.end_time || null,
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

      console.log('✅ Plano salvo com sucesso!');
      toast({
        title: "Plano salvo!",
        description: "O plano alimentar foi salvo com sucesso.",
      });

      // Se estiver editando, manter na mesma aba e recarregar os dados
      if (isEditing && planId) {
        await loadPlanData();
        // Não fechar o modal nem resetar o formulário
        // Apenas chamar onSaveSuccess se existir
        onSaveSuccess?.();
      } else {
        // Se for novo plano, fechar o modal
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("❌ Erro ao salvar plano:", error);
      toast({
        title: "Erro ao criar plano",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o plano.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Conteúdo do formulário (usado tanto no Dialog quanto na página)
  const formContent = (
    <>
      <Form {...form}>
        <form id="diet-plan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-24">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg border border-gray-200 gap-1">
                <TabsTrigger 
                  value="basic"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Início
                </TabsTrigger>
                <TabsTrigger 
                  value="meals"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] transition-all duration-200"
                >
                  <Utensils className="w-4 h-4 mr-2" />
                  Refeições
                </TabsTrigger>
                <TabsTrigger 
                  value="guidelines"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#00C98A] data-[state=active]:shadow-sm text-[#777777] transition-all duration-200"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Orientações
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
                        <FormLabel className="text-[#222222] font-medium">Nome do Plano *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Plano Semanal - Perda de Peso" 
                            className="border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-200"
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
                        <FormLabel className="text-[#222222] font-medium">Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações gerais sobre o plano..."
                            className="resize-none border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  {/* Macros Totais e Metas em Mini Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Calorias Totais */}
                    <FormField
                      control={form.control}
                      name="total_calories"
                      render={({ field }) => (
                        <FormItem>
                          <Card className="border-orange-300 bg-orange-50">
                            <CardContent className="p-3">
                              <FormLabel className="text-xs text-gray-600 flex items-center gap-1.5 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                Calorias Totais
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="border-orange-300 bg-white text-gray-900 text-base font-semibold placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 h-10"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500 mt-1">kcal</FormDescription>
                            </CardContent>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Proteína Total */}
                    <FormField
                      control={form.control}
                      name="total_protein"
                      render={({ field }) => (
                        <FormItem>
                          <Card className="border-blue-300 bg-blue-50">
                            <CardContent className="p-3">
                              <FormLabel className="text-xs text-gray-600 flex items-center gap-1.5 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Proteínas
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="0"
                                  className="border-blue-300 bg-white text-gray-900 text-base font-semibold placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 h-10"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500 mt-1">gramas</FormDescription>
                            </CardContent>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Carboidratos Total */}
                    <FormField
                      control={form.control}
                      name="total_carbs"
                      render={({ field }) => (
                        <FormItem>
                          <Card className="border-purple-300 bg-purple-50">
                            <CardContent className="p-3">
                              <FormLabel className="text-xs text-gray-600 flex items-center gap-1.5 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                Carboidratos
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="0"
                                  className="border-purple-300 bg-white text-gray-900 text-base font-semibold placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500 mt-1">gramas</FormDescription>
                            </CardContent>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Gorduras Total */}
                    <FormField
                      control={form.control}
                      name="total_fats"
                      render={({ field }) => (
                        <FormItem>
                          <Card className="border-emerald-300 bg-emerald-50">
                            <CardContent className="p-3">
                              <FormLabel className="text-xs text-gray-600 flex items-center gap-1.5 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Gorduras
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="0"
                                  className="border-emerald-300 bg-white text-gray-900 text-base font-semibold placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 h-10"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500 mt-1">gramas</FormDescription>
                            </CardContent>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* GET (Gasto Diário) */}
                    <FormField
                      control={form.control}
                      name="target_calories"
                      render={({ field }) => (
                        <FormItem>
                          <Card className="border-cyan-300 bg-cyan-50">
                            <CardContent className="p-3">
                              <FormLabel className="text-xs text-gray-600 flex items-center gap-1.5 mb-2">
                                <TrendingUp className="w-3 h-3 text-cyan-600" />
                                GET (Gasto Diário)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="border-cyan-300 bg-white text-gray-900 text-base font-semibold placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20 h-10"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500 mt-1">kcal</FormDescription>
                            </CardContent>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Card de Comparação Calórica (Superávit/Déficit) */}
                  {(() => {
                    const totalCalories = form.watch("total_calories") || 0;
                    const targetCalories = form.watch("target_calories") || 0;
                    
                    if (totalCalories > 0 && targetCalories > 0) {
                      const difference = totalCalories - targetCalories;
                      const isSurplus = difference > 0;
                      const isDeficit = difference < 0;
                      
                      return (
                        <div className="mt-3">
                          <Card className={`border-2 ${isSurplus ? 'border-green-400 bg-green-50' : isDeficit ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <GitCompare className={`w-5 h-5 ${isSurplus ? 'text-green-600' : isDeficit ? 'text-red-600' : 'text-gray-600'}`} />
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Balanço Calórico</p>
                                    <p className={`text-lg ${isSurplus ? 'text-green-700' : isDeficit ? 'text-red-700' : 'text-gray-700'}`}>
                                      {isSurplus && <span className="font-semibold">Superávit Calórico:</span>}
                                      {isDeficit && <span className="font-semibold">Déficit Calórico:</span>}
                                      {' '}{Math.abs(difference).toFixed(0)} kcal
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Total vs GET</p>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {totalCalories.toFixed(0)} / {targetCalories.toFixed(0)} kcal
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="space-y-3">
                    {/* Validação */}
                    {validationResult && (
                      <DietValidationAlerts validation={validationResult} />
                    )}

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <Button
                        type="button"
                        onClick={() => setTmbDialogOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 text-white border-0"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calcular TMB/GET
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTemplateLibraryOpen(true)}
                        className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0 transition-all duration-300"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Biblioteca
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0 transition-all duration-300"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                          {form.watch('total_calories') && form.watch('meals') && form.watch('meals').length > 0 && (
                            <>
                              <DropdownMenuItem
                                onClick={() => setMacroDistributionOpen(true)}
                                className="text-white hover:bg-slate-700 cursor-pointer"
                              >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Distribuir Macros
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setQuickPortionAdjustmentOpen(true)}
                                className="text-white hover:bg-slate-700 cursor-pointer"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Ajuste Rápido
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setProportionalAdjustmentOpen(true)}
                                className="text-white hover:bg-slate-700 cursor-pointer"
                              >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Ajuste Avançado
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={calculateTotals}
                            className="text-white hover:bg-slate-700 cursor-pointer"
                          >
                            <Calculator className="w-4 h-4 mr-2" />
                            Calcular Totais
                          </DropdownMenuItem>
                          {isEditing && planId && (
                            <DropdownMenuItem
                              onClick={() => setComparatorOpen(true)}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <GitCompare className="w-4 h-4 mr-2" />
                              Comparar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {isEditing && planId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVersionHistoryOpen(true)}
                          className="bg-[#00C98A] hover:bg-[#00A875] text-white border-0 transition-all duration-300"
                        >
                          <History className="w-4 h-4 mr-2" />
                          Versões
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* ABA 2: Refeições */}
                {activeTab === "meals" && (
                  <div className="bg-white flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                    <div className="flex flex-col gap-3 flex-shrink-0 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-[#00C98A]" />
                          Refeições
                        </h3>
                        <p className="text-sm text-[#777777] mt-1">
                          Adicione as refeições do plano alimentar
                        </p>
                      </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setFavoriteMealsMealIndex(null); // Não sobrepor, adicionar nova
                              setFavoriteMealsLoading(true);
                              try {
                                const favorites = await dietMealFavoritesService.getFavoriteMeals();
                                setFavoriteMeals(favorites);
                                setFavoriteMealsModalOpen(true);
                              } catch (error: any) {
                                toast({
                                  title: "Erro",
                                  description: error.message || "Erro ao carregar favoritos",
                                  variant: "destructive",
                                });
                              } finally {
                                setFavoriteMealsLoading(false);
                              }
                            }}
                            className="bg-green-500/10 border-green-500/30 text-[#00C98A] hover:bg-green-500/15 hover:border-green-500/50 transition-all duration-300"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Adicionar Favoritos
                          </Button>
                      <Button 
                        type="button" 
                        onClick={addMeal} 
                        size="sm"
                        className="bg-[#00C98A] hover:bg-[#00A875] text-white transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Refeição
                      </Button>
                        </div>
                    </div>

                      {/* Controles: Expandir/Colapsar Todas e Ordenação */}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const meals = form.getValues("meals") || [];
                            if (allMealsExpanded) {
                              setExpandedMeals(new Set());
                            } else {
                              setExpandedMeals(new Set(meals.map((_: any, idx: number) => idx)));
                            }
                            setAllMealsExpanded(!allMealsExpanded);
                          }}
                          className="bg-green-500/10 border-green-500/30 text-[#00C98A] hover:bg-green-500/15 hover:border-green-500/50 transition-all duration-300 text-xs"
                        >
                          {allMealsExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              Colapsar Todas
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              Expandir Todas
                            </>
                          )}
                        </Button>
                        
                        <Select value={mealsSortBy} onValueChange={(value: any) => setMealsSortBy(value)}>
                          <SelectTrigger className="h-8 w-36 text-xs border-green-500/30 bg-white">
                            <SelectValue placeholder="Ordenar por..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="order">Ordem Original</SelectItem>
                            <SelectItem value="time">Horário</SelectItem>
                            <SelectItem value="name">Nome</SelectItem>
                            <SelectItem value="calories">Calorias</SelectItem>
                            <SelectItem value="protein">Proteína</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-24">
                    {mealFields.length === 0 ? (
                      <Card className="bg-green-500/10 border-green-500/30">
                        <CardContent className="p-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-[#00C98A]/50 mb-4">
                            <Utensils className="w-8 h-8 text-[#00C98A]" />
                          </div>
                          <h3 className="text-lg font-semibold text-[#222222] mb-2">Nenhuma refeição adicionada ainda</h3>
                          <p className="text-[#777777] mb-6">
                            Comece adicionando refeições ao plano alimentar. Você pode adicionar alimentos e definir macros para cada refeição.
                          </p>
                          <Button 
                            type="button" 
                            onClick={addMeal} 
                            className="bg-[#00C98A] hover:bg-[#00A875] text-white transition-all duration-300"
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
                            {(() => {
                              // Ordenar refeições baseado no critério selecionado
                              const meals = form.getValues("meals") || [];
                              const sortedMealFields = [...mealFields].sort((a, b) => {
                                const indexA = mealFields.indexOf(a);
                                const indexB = mealFields.indexOf(b);
                                const mealA = meals[indexA];
                                const mealB = meals[indexB];
                                
                                if (!mealA || !mealB) return 0;
                                
                                switch (mealsSortBy) {
                                  case 'time':
                                    const timeA = mealA.suggested_time || '';
                                    const timeB = mealB.suggested_time || '';
                                    return timeA.localeCompare(timeB);
                                  case 'name':
                                    const nameA = mealA.meal_name || '';
                                    const nameB = mealB.meal_name || '';
                                    return nameA.localeCompare(nameB);
                                  case 'calories':
                                    return (mealB.calories || 0) - (mealA.calories || 0);
                                  case 'protein':
                                    return (mealB.protein || 0) - (mealA.protein || 0);
                                  default:
                                    return (mealA.meal_order || 0) - (mealB.meal_order || 0);
                                }
                              });
                              
                              return sortedMealFields;
                            })().map((meal) => {
                              // Encontrar o índice original no array não ordenado
                              const mealIndex = mealFields.findIndex(m => m.id === meal.id);
                              if (mealIndex === -1) return null;
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
                                recalculateFoodMacros={recalculateFoodMacros}
                                addFoodToMeal={addFoodToMeal}
                                removeFoodFromMeal={removeFoodFromMeal}
                                calculateMealMacros={calculateMealMacros}
                                calculateTotals={calculateTotals}
                                setFoodGroupsMealIndex={setFoodGroupsMealIndex}
                                setFoodGroupsModalOpen={setFoodGroupsModalOpen}
                                setSubstitutionsFoodIndex={setSubstitutionsFoodIndex}
                                setSubstitutionsModalOpen={setSubstitutionsModalOpen}
                                setFoodSelectionMealIndex={setFoodSelectionMealIndex}
                                setFoodSelectionModalOpen={setFoodSelectionModalOpen}
                                setFavoriteMealsMealIndex={setFavoriteMealsMealIndex}
                                setFavoriteMealsModalOpen={setFavoriteMealsModalOpen}
                                setFavoriteMeals={setFavoriteMeals}
                                setFavoriteMealsLoading={setFavoriteMealsLoading}
                              />;
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}

                    </div>
                  </div>
                )}

                {/* ABA 3: Observações entre Refeições */}
                {activeTab === "observations" && (
                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-[#00C98A]" />
                        Observações entre Refeições
                      </h3>
                      <p className="text-sm text-[#777777] mt-1">
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
                      className="bg-[#00C98A] hover:bg-[#00A875] text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Observação
                    </Button>
                  </div>

                    {observationFields.length === 0 ? (
                      <Card className="bg-green-400/10 border-green-500/30">
                        <CardContent className="p-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-400/20 border border-green-500/30 mb-4">
                            <AlertTriangle className="w-8 h-8 text-[#00C98A]" />
                          </div>
                        <h3 className="text-lg font-semibold text-[#222222] mb-2">Nenhuma observação adicionada ainda</h3>
                        <p className="text-[#777777] mb-6">
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
                            className="bg-[#00C98A] hover:bg-[#00A875] text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
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

                                const isExpanded = expandedObservations.has(index);

                                return (
                                  <Card 
                                    ref={setNodeRef} 
                                    style={style}
                                    className="bg-green-50/40 border border-green-200/50 hover:bg-green-50/60 transition-all duration-300 hover:shadow-md"
                                  >
                                    <Collapsible
                                      open={isExpanded}
                                      onOpenChange={(open) => {
                                        const newExpanded = new Set(expandedObservations);
                                        if (open) {
                                          newExpanded.add(index);
                                        } else {
                                          newExpanded.delete(index);
                                        }
                                        setExpandedObservations(newExpanded);
                                      }}
                                  >
                                      <CardHeader className="pb-2 pt-3 px-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                          <div
                                            {...attributes}
                                            {...listeners}
                                            className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
                                          >
                                            <GripVertical className="w-4 h-4 text-[#777777]" />
                                          </div>
                                          <CardTitle className="text-base font-semibold text-[#222222]">
                                            Observação {index + 1}
                                          </CardTitle>
                                            <Badge className="bg-green-500/10 border-green-500/50 text-[#00A875] text-xs">
                                            Ordem: {observation.order || index + 1}
                                          </Badge>
                                        </div>
                                          <div className="flex items-center gap-1">
                                            <CollapsibleTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-[#777777] hover:text-[#222222] hover:bg-gray-100"
                                              >
                                                {isExpanded ? (
                                                  <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                  <ChevronDown className="w-4 h-4" />
                                                )}
                                              </Button>
                                            </CollapsibleTrigger>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeObservation(index)}
                                              className="h-7 w-7 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                          </div>
                                      </div>
                                    </CardHeader>
                                      <CollapsibleContent>
                                        <CardContent className="space-y-4 pt-0">
                                      <FormField
                                        control={form.control}
                                        name={`observations.${index}.text`}
                                        render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[#222222] font-medium">Texto da Observação *</FormLabel>
                                            <FormControl>
                                              <Textarea
                                                placeholder="Ex: Beber água entre as refeições. Evitar líquidos durante as refeições..."
                                                className="resize-none border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-300 min-h-[100px]"
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
                                              <FormLabel className="text-[#222222] font-medium">Ordem</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  className="border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-300"
                                                  {...field}
                                                  onChange={(e) => {
                                                    field.onChange(parseInt(e.target.value) || 0);
                                                  }}
                                                  value={field.value || index + 1}
                                                />
                                              </FormControl>
                                              <FormDescription className="text-xs text-[#777777]">
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
                                              <FormLabel className="text-[#222222] font-medium">Posição (opcional)</FormLabel>
                                              <FormControl>
                                                <Input
                                                  placeholder="Ex: Após café da manhã"
                                                  className="border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-300"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <FormDescription className="text-xs text-[#777777]">
                                                Descrição opcional da posição
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </CardContent>
                                      </CollapsibleContent>
                                    </Collapsible>
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
                      <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#00C98A]" />
                        Orientações
                      </h3>
                      <p className="text-sm text-[#777777] mt-1">
                        Adicione orientações gerais para o paciente seguir o plano
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        onClick={() => setGuidelineTemplatesOpen(true)} 
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-300"
                      >
                        <Star className="w-4 h-4 mr-2 fill-white" />
                        Gerenciar Favoritas
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setIsSelectTemplateOpen(true)}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Selecionar de Favoritas
                      </Button>
                      <Button 
                        type="button" 
                        onClick={addGuideline} 
                        size="sm"
                        className="bg-[#00C98A] hover:bg-[#00A875] text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Orientação
                      </Button>
                    </div>
                  </div>

                  {guidelineFields.length === 0 ? (
                    <Card className="bg-green-400/10 border-green-500/30">
                      <CardContent className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-400/20 border border-green-500/30 mb-4">
                          <BookOpen className="w-8 h-8 text-[#00C98A]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#222222] mb-2">Nenhuma orientação adicionada ainda</h3>
                        <p className="text-[#777777] mb-6">
                          Adicione orientações para ajudar o paciente a seguir o plano corretamente.
                        </p>
                        <Button 
                          type="button" 
                          onClick={addGuideline} 
                          className="bg-[#00C98A] hover:bg-[#00A875] text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeira Orientação
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {guidelineFields.map((guideline, index) => {
                        const titleValue = form.watch(`guidelines.${index}.title`);
                        const isExpanded = expandedGuidelines.has(index);
                        
                        // Extrair texto puro do HTML para exibir no header
                        const getTitleText = (html: string) => {
                          if (!html) return `Orientação ${index + 1}`;
                          const div = document.createElement('div');
                          div.innerHTML = html;
                          const text = div.textContent || div.innerText || '';
                          return text.trim() || `Orientação ${index + 1}`;
                        };
                        
                        return (
                          <Card 
                            key={guideline.id}
                            className="bg-green-400/10 border border-green-500/30 hover:bg-green-400/15 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
                          >
                            <CardHeader className="pb-3 cursor-pointer" onClick={() => {
                              const newExpanded = new Set(expandedGuidelines);
                              if (isExpanded) {
                                newExpanded.delete(index);
                              } else {
                                newExpanded.add(index);
                              }
                              setExpandedGuidelines(newExpanded);
                            }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-[#00C98A]" />
                                  ) : (
                                    <ChevronUp className="w-4 h-4 text-[#777777]" />
                                  )}
                                  <CardTitle className="text-base font-semibold text-[#222222]">
                                    {getTitleText(titleValue)}
                                  </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Salvar como template
                                      const guidelineData = form.getValues(`guidelines.${index}`);
                                      if (guidelineData.title && guidelineData.content) {
                                        createTemplate({
                                          guideline_type: guidelineData.guideline_type || 'general',
                                          title: guidelineData.title,
                                          content: guidelineData.content,
                                          priority: index
                                        }).then(() => {
                                          toast({
                                            title: 'Orientação favoritada!',
                                            description: 'Esta orientação aparecerá em novos planos',
                                          });
                                        }).catch((error) => {
                                          console.error('Erro ao favoritar:', error);
                                        });
                                      } else {
                                        toast({
                                          title: 'Erro',
                                          description: 'Preencha título e conteúdo antes de favoritar',
                                          variant: 'destructive'
                                        });
                                      }
                                    }}
                                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                    title="Salvar como favorita"
                                  >
                                    <Star className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeGuideline(index);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            
                            {isExpanded && (
                              <CardContent className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name={`guidelines.${index}.title`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-[#222222] font-medium">Título *</FormLabel>
                                      <FormControl>
                                        <RichTextEditor
                                          value={field.value || ''}
                                          onChange={field.onChange}
                                          placeholder="Ex: Hidratação"
                                          className="min-h-[60px]"
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
                                      <FormLabel className="text-[#222222] font-medium">Conteúdo *</FormLabel>
                                      <FormControl>
                                        <RichTextEditor
                                          value={field.value || ''}
                                          onChange={field.onChange}
                                          placeholder="Ex: Beber 2-3L de água por dia..."
                                          className="min-h-[120px]"
                                          resizable={true}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
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
                          <Utensils className="w-4 h-4 text-orange-400" />
                          Refeições ({form.watch("meals")?.length || 0})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {form.watch("meals")?.map((meal: any, index: number) => {
                            return (
                              <div key={index} className="p-4 bg-gradient-to-br from-slate-800/30 to-slate-700/30 border border-slate-700/50 rounded-lg hover:shadow-lg transition-all duration-300">
                                <p className="font-semibold mb-2 text-white">{meal.meal_name}</p>
                                <div className="flex items-center gap-3 text-xs">
                                  <Badge variant="outline" className="border-green-500/50 text-[#00A875] bg-green-500/10">
                                    {meal.foods?.length || 0} alimento(s)
                                  </Badge>
                                  <Badge variant="outline" className="border-orange-500/30 text-orange-600 bg-orange-500/10">
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
                                <Badge variant="outline" className="border-green-500/50 text-[#00A875] bg-green-500/10">
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
                              <div 
                                className="font-semibold text-emerald-300 mb-2"
                                dangerouslySetInnerHTML={{ __html: guideline.title || '' }}
                              />
                              <div 
                                className="text-sm text-slate-300 prose prose-sm prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: guideline.content || '' }}
                                style={{
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              />
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

            {/* Botões de ação */}
            <div className="pt-4 border-t border-gray-200 mt-4 flex justify-end gap-3">
              {!isPageMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-300 text-[#222222] hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="button"
                disabled={loading}
                onClick={async () => {
                  console.log('🖱️ Botão Salvar clicado!');
                  console.log('📝 Valores do formulário:', form.getValues());
                  
                  // Forçar submit sem validação
                  const values = form.getValues();
                  await onSubmit(values as DietPlanFormData);
                }}
                className="bg-[#00C98A] hover:bg-[#00A875] text-white"
              >
                {loading ? "Salvando..." : "Salvar Plano"}
              </Button>
            </div>

            {/* Rodapé Fixo com Macros Totais */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-800 to-slate-900 border-t-2 border-green-500/30 shadow-2xl z-50 px-6 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-white">Totais do Plano:</span>
                </div>
                <div className="flex items-center gap-6">
                  {/* Calorias */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                    <span className="text-sm text-slate-300">Calorias:</span>
                    <span className="text-base font-bold text-white">{Math.round(form.watch('total_calories') || 0)}</span>
                  </div>
                  
                  {/* Proteína */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span className="text-sm text-slate-300">Proteína:</span>
                    <span className="text-base font-bold text-white">{(form.watch('total_protein') || 0).toFixed(1)}g</span>
                    {patientData?.peso && (
                      <span className="text-xs text-slate-400">
                        ({((form.watch('total_protein') || 0) / patientData.peso).toFixed(1)}g/kg)
                      </span>
                    )}
                  </div>
                  
                  {/* Carboidrato */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    <span className="text-sm text-slate-300">Carboidrato:</span>
                    <span className="text-base font-bold text-white">{(form.watch('total_carbs') || 0).toFixed(1)}g</span>
                    {patientData?.peso && (
                      <span className="text-xs text-slate-400">
                        ({((form.watch('total_carbs') || 0) / patientData.peso).toFixed(1)}g/kg)
                      </span>
                    )}
                  </div>
                  
                  {/* Gordura */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    <span className="text-sm text-slate-300">Gordura:</span>
                    <span className="text-base font-bold text-white">{(form.watch('total_fats') || 0).toFixed(1)}g</span>
                    {patientData?.peso && (
                      <span className="text-xs text-slate-400">
                        ({((form.watch('total_fats') || 0) / patientData.peso).toFixed(1)}g/kg)
                      </span>
                    )}
                  </div>

                  {/* Balanço Calórico (Superávit/Déficit) */}
                  {(() => {
                    const totalCalories = form.watch("total_calories") || 0;
                    const targetCalories = form.watch("target_calories") || 0;
                    
                    if (totalCalories > 0 && targetCalories > 0) {
                      const difference = totalCalories - targetCalories;
                      const isSurplus = difference > 0;
                      const isDeficit = difference < 0;
                      
                      return (
                        <div className="flex items-center gap-2 pl-4 border-l border-slate-600">
                          <GitCompare className={`w-4 h-4 ${isSurplus ? 'text-green-400' : isDeficit ? 'text-red-400' : 'text-slate-400'}`} />
                          <span className="text-sm text-slate-300">
                            {isSurplus && 'Superávit: '}
                            {isDeficit && 'Déficit: '}
                          </span>
                          <span className={`text-base font-bold ${isSurplus ? 'text-green-400' : isDeficit ? 'text-red-400' : 'text-white'}`}>
                            {Math.abs(difference).toFixed(0)} kcal
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </>
    );

  // Modais (renderizados fora do formContent para evitar problemas de estrutura)
  const modalsContent = (
    <>
      {/* Modais e Componentes Avançados */}
      <TemplateLibraryModal
          open={templateLibraryOpen}
          onOpenChange={setTemplateLibraryOpen}
          patientId={patientId}
          onTemplateSelected={handleTemplateSelected}
        />

        <GuidelineTemplatesModal
          open={guidelineTemplatesOpen}
          onOpenChange={setGuidelineTemplatesOpen}
        />

        <GuidelineTemplatesModal
          open={isSelectTemplateOpen}
          onOpenChange={setIsSelectTemplateOpen}
          mode="select"
          onSelectTemplate={(template) => {
            appendGuideline({
              guideline_type: template.guideline_type,
              title: template.title,
              content: template.content,
              priority: guidelineFields.length,
            });
            setIsSelectTemplateOpen(false);
            toast({
              title: "Orientação adicionada!",
              description: `A orientação "${template.title}" foi adicionada ao plano.`,
            });
          }}
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



        <FoodSubstitutionsModal
          open={substitutionsModalOpen}
          onOpenChange={(open) => {
            setSubstitutionsModalOpen(open);
            if (!open) setSubstitutionsFoodIndex(null);
          }}
          originalFoodName={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.food_name`) || '' : ''}
          originalFoodQuantity={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.quantity`) || 100 : 100}
          originalFoodUnit={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.unit`) || 'g' : 'g'}
          originalFoodCalories={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.calories`) : undefined}
          originalFoodProtein={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.protein`) : undefined}
          originalFoodCarbs={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.carbs`) : undefined}
          originalFoodFats={substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.fats`) : undefined}
          substitutions={(substitutionsFoodIndex ? form.watch(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.substitutions`) || [] : []) as any}
          onSave={(substitutions) => {
            if (substitutionsFoodIndex) {
              form.setValue(`meals.${substitutionsFoodIndex.mealIndex}.foods.${substitutionsFoodIndex.foodIndex}.substitutions`, substitutions);
            }
          }}
          onSwapWithMain={(substitution, substitutionMacros) => {
            if (!substitutionsFoodIndex) return;
            
            const { mealIndex, foodIndex } = substitutionsFoodIndex;
            
            // Pegar dados do alimento principal atual
            const currentFood = {
              food_name: form.watch(`meals.${mealIndex}.foods.${foodIndex}.food_name`) || '',
              quantity: form.watch(`meals.${mealIndex}.foods.${foodIndex}.quantity`) || 100,
              unit: form.watch(`meals.${mealIndex}.foods.${foodIndex}.unit`) || 'g',
              calories: form.watch(`meals.${mealIndex}.foods.${foodIndex}.calories`) || 0,
              protein: form.watch(`meals.${mealIndex}.foods.${foodIndex}.protein`) || 0,
              carbs: form.watch(`meals.${mealIndex}.foods.${foodIndex}.carbs`) || 0,
              fats: form.watch(`meals.${mealIndex}.foods.${foodIndex}.fats`) || 0,
            };
            const currentSubstitutions = form.watch(`meals.${mealIndex}.foods.${foodIndex}.substitutions`) || [];
            
            // Atualizar o alimento principal com os dados da substituição
            form.setValue(`meals.${mealIndex}.foods.${foodIndex}.food_name`, substitution.food_name);
            form.setValue(`meals.${mealIndex}.foods.${foodIndex}.quantity`, substitution.quantity);
            form.setValue(`meals.${mealIndex}.foods.${foodIndex}.unit`, substitution.unit);
            
            // Usar macros calculados se disponíveis, senão zerar
            if (substitutionMacros) {
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.calories`, substitutionMacros.calories);
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.protein`, substitutionMacros.protein);
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.carbs`, substitutionMacros.carbs);
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.fats`, substitutionMacros.fats);
            } else {
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.calories`, 0);
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.protein`, 0);
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.carbs`, 0);
              form.setValue(`meals.${mealIndex}.foods.${foodIndex}.fats`, 0);
            }
            
            // Atualizar lista de substituições: remover a que virou principal e adicionar o antigo principal
            const newSubstitutions = currentSubstitutions
              .filter((sub: any) => sub.food_name !== substitution.food_name)
              .concat([{
                food_name: currentFood.food_name,
                quantity: currentFood.quantity,
                unit: currentFood.unit,
              }]);
            
            form.setValue(`meals.${mealIndex}.foods.${foodIndex}.substitutions`, newSubstitutions);
            
            // Atualizar macros originais para o novo alimento principal
            const foodKey = `${mealIndex}_${foodIndex}`;
            originalQuantitiesRef.current.set(foodKey, substitution.quantity);
            if (substitutionMacros) {
              originalMacrosRef.current.set(foodKey, {
                calories: substitutionMacros.calories,
                protein: substitutionMacros.protein,
                carbs: substitutionMacros.carbs,
                fats: substitutionMacros.fats,
              });
            }
            
            // Recalcular totais
            calculateMealMacros(mealIndex);
            calculateTotals();
          }}
        />

        <QuickPortionAdjustment
          open={quickPortionAdjustmentOpen}
          onOpenChange={setQuickPortionAdjustmentOpen}
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
            form.setValue("target_calories", macros.calorias);
            form.setValue("target_protein", macros.proteinas);
            form.setValue("target_carbs", macros.carboidratos);
            form.setValue("target_fats", macros.gorduras);
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

        <FoodSelectionModal
          open={foodSelectionModalOpen}
          onOpenChange={(open) => {
            setFoodSelectionModalOpen(open);
            if (!open) setFoodSelectionMealIndex(null);
          }}
          foodDatabase={foodDatabase}
          mealType={foodSelectionMealIndex !== null ? form.watch(`meals.${foodSelectionMealIndex}.meal_type`) || '' : ''}
          existingFoods={foodSelectionMealIndex !== null ? (form.watch(`meals.${foodSelectionMealIndex}.foods`) || []).map((f: any) => f.food_name) : []}
          targetCalories={foodSelectionMealIndex !== null ? form.watch(`meals.${foodSelectionMealIndex}.calories`) : undefined}
          targetProtein={foodSelectionMealIndex !== null ? form.watch(`meals.${foodSelectionMealIndex}.protein`) : undefined}
          targetCarbs={foodSelectionMealIndex !== null ? form.watch(`meals.${foodSelectionMealIndex}.carbs`) : undefined}
          targetFats={foodSelectionMealIndex !== null ? form.watch(`meals.${foodSelectionMealIndex}.fats`) : undefined}
          onSelect={(food) => {
            if (foodSelectionMealIndex !== null) {
              const meals = form.getValues("meals") || [];
              const currentMeal = meals[foodSelectionMealIndex];
              const currentFoods = currentMeal?.foods || [];
              
              // Adicionar novo alimento com os dados do alimento selecionado
              const newFood = {
                food_name: food.name,
                quantity: 100,
                unit: "g",
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
                notes: "",
              };

              form.setValue(`meals.${foodSelectionMealIndex}.foods`, [
                ...currentFoods,
                newFood,
              ]);

              // Calcular macros do alimento
              setTimeout(() => {
                const newFoodIndex = currentFoods.length;
                handleFoodSelect(foodSelectionMealIndex, newFoodIndex, food.name);
              }, 100);
            }
          }}
          onFoodSaved={async () => {
            // Recarregar banco de alimentos
            try {
              const { data } = await supabase
                .from('food_database')
                .select('*')
                .eq('is_active', true)
                .order('name');
              if (data) {
                setFoodDatabase(data);
              }
            } catch (error) {
              console.error('Erro ao recarregar banco de alimentos:', error);
            }
          }}
        />

        {/* Modal de Refeições Favoritas */}
        <Dialog open={favoriteMealsModalOpen} onOpenChange={setFavoriteMealsModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="text-[#222222] flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Refeições Favoritas
              </DialogTitle>
              <DialogDescription className="text-[#777777]">
                Selecione uma refeição favorita para adicionar ao plano
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {favoriteMealsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  <p className="text-sm text-[#777777]">Carregando favoritos...</p>
                </div>
              ) : favoriteMeals.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 mx-auto mb-3 text-[#777777] opacity-50" />
                  <p className="text-sm text-[#222222] font-medium mb-1">Nenhuma refeição favoritada ainda</p>
                  <p className="text-xs text-[#777777]">Use o ícone de estrela nas refeições para favoritá-las</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteMeals.map((favorite) => (
                    <Card
                      key={favorite.id}
                      className="bg-green-50/30 border border-green-200/50 hover:bg-green-50/50 transition-all cursor-pointer"
                      onClick={() => {
                        const meals = form.getValues("meals") || [];
                        const maxOrder = meals.length > 0 ? Math.max(...meals.map((m: any) => m.meal_order || 0)) : 0;
                        
                        const mealData = {
                          meal_name: favorite.meal_name,
                          suggested_time: favorite.suggested_time,
                          start_time: favorite.start_time,
                          end_time: favorite.end_time,
                          calories: favorite.calories,
                          protein: favorite.protein,
                          carbs: favorite.carbs,
                          fats: favorite.fats,
                          instructions: favorite.instructions,
                          foods: favorite.foods.map((food) => ({
                            food_name: food.food_name,
                            quantity: food.quantity,
                            unit: food.unit,
                            calories: food.calories,
                            protein: food.protein,
                            carbs: food.carbs,
                            fats: food.fats,
                            substitutions: food.substitutions || [],
                          })),
                          meal_type: '',
                          meal_order: maxOrder + 1,
                        };
                        
                        appendMeal(mealData);
                        setFavoriteMealsModalOpen(false);
                        toast({
                          title: "Refeição adicionada!",
                          description: "A refeição favorita foi adicionada ao plano.",
                        });
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-[#222222]">{favorite.meal_name}</h4>
                              {favorite.suggested_time && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-[#00A875]">
                                  {favorite.suggested_time}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#777777] mb-2">
                              <span>P: {favorite.protein.toFixed(1)}g</span>
                              <span>C: {favorite.carbs.toFixed(1)}g</span>
                              <span>G: {favorite.fats.toFixed(1)}g</span>
                              <span className="font-semibold text-[#222222]">{favorite.calories} Kcal</span>
                            </div>
                            <div className="text-xs text-[#777777]">
                              {favorite.foods.length} alimento(s): {favorite.foods.slice(0, 3).map(f => f.food_name).join(', ')}
                              {favorite.foods.length > 3 && '...'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="bg-[#00C98A] hover:bg-[#00A875] text-white"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const meals = form.getValues("meals") || [];
                                const maxOrder = meals.length > 0 ? Math.max(...meals.map((m: any) => m.meal_order || 0)) : 0;
                                
                                const mealData = {
                                  meal_name: favorite.meal_name,
                                  suggested_time: favorite.suggested_time,
                                  start_time: favorite.start_time,
                                  end_time: favorite.end_time,
                                  calories: favorite.calories,
                                  protein: favorite.protein,
                                  carbs: favorite.carbs,
                                  fats: favorite.fats,
                                  instructions: favorite.instructions,
                                  foods: favorite.foods.map((food) => ({
                                    food_name: food.food_name,
                                    quantity: food.quantity,
                                    unit: food.unit,
                                    calories: food.calories,
                                    protein: food.protein,
                                    carbs: food.carbs,
                                    fats: food.fats,
                                    substitutions: food.substitutions || [],
                                  })),
                                  meal_type: '',
                                  meal_order: maxOrder + 1,
                                };
                                
                                appendMeal(mealData);
                                setFavoriteMealsModalOpen(false);
                                toast({
                                  title: "Refeição adicionada!",
                                  description: "A refeição favorita foi adicionada ao plano.",
                                });
                              }}
                            >
                              Adicionar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await dietMealFavoritesService.removeFavoriteMeal(favorite.id);
                                  const updatedFavorites = favoriteMeals.filter(f => f.id !== favorite.id);
                                  setFavoriteMeals(updatedFavorites);
                                  toast({
                                    title: "Favorito removido",
                                    description: "A refeição foi removida dos seus favoritos.",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Erro",
                                    description: error.message || "Erro ao remover favorito",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
    </>
  );

  // Se estiver em modo página, renderiza sem Dialog
  if (isPageMode) {
    return (
      <div className="p-6 bg-white text-[#222222]">
        {formContent}
        {modalsContent}
      </div>
    );
  }

  // Modo Dialog (padrão)
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 bg-white text-[#222222] shadow-2xl">
          <DialogHeader className="pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle className="text-[#222222] text-2xl font-bold flex items-center gap-3">
              <Utensils className="w-6 h-6 text-[#00C98A]" />
              {isEditing ? "Editar Plano Alimentar" : "Criar Novo Plano Alimentar"}
            </DialogTitle>
            <DialogDescription className="text-[#777777] mt-2">
              Preencha as informações do plano alimentar do paciente
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
          {formContent}
          </div>
        </DialogContent>
      </Dialog>
      {modalsContent}
    </>
  );
}

// Componente FoodItem memoizado para evitar re-renderizações e perda de foco
const FoodItem = memo(function FoodItem({
  mealIndex,
  foodIndex,
  form,
  foodDatabase,
  handleFoodSelect,
  recalculateFoodMacros,
  removeFoodFromMeal,
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

  const foodData = useWatch({ control: form.control, name: `meals.${mealIndex}.foods.${foodIndex}` });
  const foodName = foodData?.food_name || "";
  const quantity = foodData?.quantity || 0;
  const unit = foodData?.unit || "";
  const carbs = foodData?.carbs || 0;
  const protein = foodData?.protein || 0;
  const fats = foodData?.fats || 0;
  const calories = foodData?.calories || 0;

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="bg-white border-0 shadow-none hover:bg-gray-50/50 transition-all duration-200"
    >
      <CardContent className="p-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-[#777777]" />
          </div>

          {/* Nome do alimento - editável livremente */}
          <FormField
            control={form.control}
            name={`meals.${mealIndex}.foods.${foodIndex}.food_name`}
            render={({ field }) => (
              <FormItem className="flex-1 min-w-[150px]">
                <FormControl>
                  <Input
                    type="text"
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    placeholder="Nome do alimento"
                    className="h-8 text-sm border-green-500/30 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-white focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-300"
                    title="Edite o nome livremente. Os valores nutricionais são vinculados à quantidade."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantidade */}
          <FormField
            control={form.control}
            name={`meals.${mealIndex}.foods.${foodIndex}.quantity`}
            render={({ field }) => (
              <FormItem className="w-20">
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="100"
                    className="h-8 text-sm border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-300"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                      // Cálculo em tempo real - atualiza imediatamente
                      recalculateFoodMacros(mealIndex, foodIndex);
                    }}
                    onBlur={(e) => {
                      // Garantir atualização final ao sair do campo
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                      recalculateFoodMacros(mealIndex, foodIndex);
                    }}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidade */}
          <FormField
            control={form.control}
            name={`meals.${mealIndex}.foods.${foodIndex}.unit`}
            render={({ field }) => (
              <FormItem className="w-24">
                <Select 
                  onValueChange={(value) => {
                    try {
                      field.onChange(value);
                      recalculateFoodMacros(mealIndex, foodIndex);
                    } catch (error) {
                      console.error('Erro ao alterar unidade:', error);
                    }
                  }} 
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger 
                      className="h-8 text-sm border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue placeholder="un" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent 
                    className="bg-white border-green-500/30 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectItem value="g" className="text-[#222222]">g</SelectItem>
                    <SelectItem value="ml" className="text-[#222222]">ml</SelectItem>
                    <SelectItem value="unidade" className="text-[#222222]">un</SelectItem>
                    <SelectItem value="colher" className="text-[#222222]">colher</SelectItem>
                    <SelectItem value="xicara" className="text-[#222222]">xícara</SelectItem>
                    <SelectItem value="fatia" className="text-[#222222]">fatia</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Separador */}
          <div className="w-px h-6 bg-gray-300" />

          {/* Macros - apenas exibição */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#222222] font-medium min-w-[60px]">
              kcal: <span className="text-orange-600">{calories}</span>
            </span>
            <span className="text-[#222222] font-medium min-w-[50px]">
              P: <span className="text-blue-600">{protein.toFixed(1)}g</span>
            </span>
            <span className="text-[#222222] font-medium min-w-[50px]">
              C: <span className="text-purple-600">{carbs.toFixed(1)}g</span>
            </span>
            <span className="text-[#222222] font-medium min-w-[50px]">
              G: <span className="text-emerald-600">{fats.toFixed(1)}g</span>
            </span>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-1 ml-auto">
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
                    className={`h-7 w-7 p-0 relative ${
                      foodData?.substitutions && foodData.substitutions.length > 0
                        ? 'text-[#00C98A] hover:text-[#00A875] hover:bg-green-500/20 bg-green-500/10'
                        : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                    }`}
                    title={foodData?.substitutions && foodData.substitutions.length > 0 
                      ? `${foodData.substitutions.length} substituição(ões) cadastrada(s)` 
                      : "Opções de Substituição"}
                    disabled={!foodNameField.value}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {foodData?.substitutions && foodData.substitutions.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#00C98A] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {foodData.substitutions.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeFoodFromMeal(mealIndex, foodIndex);
                    }}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                    title="Remover alimento"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            />
          </div>
        </div>

        {/* Campos de macros ocultos para edição (mantidos para funcionamento) */}
        <div className="hidden">
          <FormField
            control={form.control}
            name={`meals.${mealIndex}.foods.${foodIndex}.calories`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
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
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
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
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
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
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
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
      </CardContent>
    </Card>
  );
});

// Componente MealItem separado e memoizado para evitar redefinição e perda de foco
const MealItemComponent = memo(function MealItemComponent({
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
  recalculateFoodMacros,
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
  setFoodSelectionMealIndex,
  setFoodSelectionModalOpen,
  setFavoriteMealsMealIndex,
  setFavoriteMealsModalOpen,
  setFavoriteMeals,
  setFavoriteMealsLoading,
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
  
  // Função para calcular cores baseadas no índice - usando verde bem leve
  const getMealCardColors = (index: number, total: number) => {
    // Todos os cards usam fundo verde clarinho com borda verde suave
    return 'bg-green-50/40 border-green-200/50 hover:bg-green-50/60 hover:shadow-md';
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

  const isLastMeal = mealIndex === (totalMeals - 1);

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
                                <Card className={`border transition-all duration-300 hover:shadow-md ${cardColors}`}>
                                  <CardHeader className="pb-2 pt-3 px-4">
                                    <div className="flex items-center justify-between gap-3">
                                      {/* Lado esquerdo: Drag handle, horários editáveis, nome editável, macros compactados */}
                                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 flex-wrap md:flex-nowrap">
                                        {/* Drag handle */}
                                          <div
                                            {...attributes}
                                            {...listeners}
                                          className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
                                          onClick={(e) => e.stopPropagation()}
                                          title="Arrastar para reordenar"
                                          role="button"
                                          aria-label={`Arrastar para reordenar ${mealName}`}
                                          tabIndex={0}
                                          >
                                          <GripVertical className="w-4 h-4 text-[#555555]" aria-hidden="true" />
                                          </div>

                                        {/* Container de horários - responsivo */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {/* Horário inicial */}
                                          <FormField
                                            control={form.control}
                                            name={`meals.${mealIndex}.start_time`}
                                            render={({ field }) => (
                                              <FormItem className="flex-shrink-0">
                                                <FormControl>
                                                  <Input
                                                    type="text"
                                                    placeholder="08:00"
                                                    className="h-7 w-14 md:w-16 text-xs border-0 bg-transparent text-[#111111] placeholder:text-[#666666] focus:ring-0 focus:outline-none p-0 font-medium text-center"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label={`Horário inicial da ${mealName}`}
                                                  />
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                          
                                          {/* Separador */}
                                          <span className="text-xs text-[#666666] font-medium">-</span>
                                          
                                          {/* Horário final */}
                                          <FormField
                                            control={form.control}
                                            name={`meals.${mealIndex}.end_time`}
                                            render={({ field }) => (
                                              <FormItem className="flex-shrink-0">
                                                <FormControl>
                                                  <Input
                                                    type="text"
                                                    placeholder="09:00"
                                                    className="h-7 w-14 md:w-16 text-xs border-0 bg-transparent text-[#111111] placeholder:text-[#666666] focus:ring-0 focus:outline-none p-0 font-medium text-center"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label={`Horário final da ${mealName}`}
                                                  />
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                        </div>

                                        {/* Nome da refeição editável - ocupa linha inteira em mobile */}
                                        <FormField
                                          control={form.control}
                                          name={`meals.${mealIndex}.meal_name`}
                                          render={({ field }) => (
                                            <FormItem className="flex-1 min-w-0 w-full md:w-auto">
                                              <FormLabel className="sr-only">Nome da refeição {mealIndex + 1}</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="text"
                                                  placeholder={`REFEIÇÃO ${mealIndex + 1}`}
                                                  className="h-7 text-sm border-0 bg-transparent text-[#111111] font-medium placeholder:text-[#666666] focus:ring-0 focus:outline-none p-0"
                                                  {...field}
                                                  value={field.value || `REFEIÇÃO ${mealIndex + 1}`}
                                                  onClick={(e) => e.stopPropagation()}
                                                  aria-label={`Nome da refeição ${mealIndex + 1}`}
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />

                                        {/* Macros compactados - sempre visíveis com tooltip - oculto em mobile pequeno */}
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className={`hidden sm:flex items-center gap-2 md:gap-3 flex-shrink-0 cursor-help ${form.watch(`meals.${mealIndex}.exclude_from_macros`) ? 'opacity-40' : ''}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" aria-hidden="true"></div>
                                                <span className="text-xs md:text-sm text-[#111111] font-medium">{mealProtein.toFixed(1)}g</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600" aria-hidden="true"></div>
                                                <span className="text-xs md:text-sm text-[#111111] font-medium">{mealCarbs.toFixed(1)}g</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true"></div>
                                                <span className="text-xs md:text-sm text-[#111111] font-medium">{mealFats.toFixed(1)}g</span>
                                                <span className="text-xs md:text-sm font-semibold text-[#111111] ml-1">{mealCalories} Kcal</span>
                                          </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-900 text-white text-xs p-3 rounded-md shadow-lg">
                                              <div className="space-y-1">
                                                <p className="text-xs font-semibold">Macronutrientes:</p>
                                                <p className="text-xs">Proteínas: {mealProtein.toFixed(1)}g</p>
                                                <p className="text-xs">Carboidratos: {mealCarbs.toFixed(1)}g</p>
                                                <p className="text-xs">Gorduras: {mealFats.toFixed(1)}g</p>
                                                <p className="text-xs">Calorias: {mealCalories} Kcal</p>
                                                {form.watch(`meals.${mealIndex}.exclude_from_macros`) && (
                                                  <p className="text-xs text-orange-400 font-semibold mt-2">⚠️ Não contabilizada nos totais</p>
                                                )}
                                          </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                          </div>

                                      {/* Lado direito: Botões de ação */}
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* Botão expandir/colapsar */}
                                        <CollapsibleTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-[#777777] hover:text-[#222222] hover:bg-gray-100"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                    {isExpanded ? (
                                              <ChevronUp className="w-4 h-4" />
                                    ) : (
                                              <ChevronDown className="w-4 h-4" />
                                    )}
                                          </Button>
                                </CollapsibleTrigger>

                                        {/* Botão ver alimentos (verde) */}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                          className="h-7 px-2 bg-[#00C98A] hover:bg-[#00A875] text-white text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                            const newExpanded = new Set(expandedMeals);
                                            if (!isExpanded) {
                                              newExpanded.add(mealIndex);
                                            } else {
                                              newExpanded.delete(mealIndex);
                                            }
                                            setExpandedMeals(newExpanded);
                                          }}
                                          title={isExpanded ? "Ocultar alimentos" : "Ver alimentos"}
                                        >
                                          <Eye className="w-3 h-3 mr-1" />
                                          ver alimentos
                                        </Button>

                                        {/* Botão adicionar alimento (verde) */}
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 bg-[#00C98A] hover:bg-[#00A875] text-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFoodSelectionMealIndex(mealIndex);
                                            setFoodSelectionModalOpen(true);
                                          }}
                                          title="Adicionar alimento"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>

                                        {/* Botão para excluir dos macros */}
                                        <FormField
                                          control={form.control}
                                          name={`meals.${mealIndex}.exclude_from_macros`}
                                          render={({ field }) => (
                                            <FormItem className="flex items-center flex-shrink-0">
                                              <FormControl>
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-7 w-7 p-0 rounded ${
                                                          field.value 
                                                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          field.onChange(!field.value);
                                                          calculateTotals();
                                                        }}
                                                      >
                                                        <X className="w-4 h-4" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-gray-900 text-white text-xs p-2">
                                                      {field.value ? 'Não contabilizada nos totais' : 'Clique para não contabilizar nos totais'}
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />

                                        {/* Botão duplicar */}
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-[#777777] hover:text-blue-600 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
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
                                          title="Duplicar refeição"
                                  >
                                          <Layers className="w-4 h-4" />
                                  </Button>

                                        {/* Botão favoritar/star */}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                          className="h-7 w-7 p-0 text-[#777777] hover:text-yellow-500 hover:bg-yellow-50"
                                          title="Adicionar aos favoritos"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const mealData = form.getValues(`meals.${mealIndex}`);
                                              await dietMealFavoritesService.saveFavoriteMeal({
                                                meal_name: mealData.meal_name || `REFEIÇÃO ${mealIndex + 1}`,
                                                suggested_time: mealData.suggested_time,
                                                start_time: mealData.start_time,
                                                end_time: mealData.end_time,
                                                calories: mealCalories,
                                                protein: mealProtein,
                                                carbs: mealCarbs,
                                                fats: mealFats,
                                                instructions: mealData.instructions,
                                                foods: (mealData.foods || []).map((food: any, idx: number) => ({
                                                  food_name: food.food_name,
                                                  quantity: food.quantity || 0,
                                                  unit: food.unit || 'g',
                                                  calories: food.calories || 0,
                                                  protein: food.protein || 0,
                                                  carbs: food.carbs || 0,
                                                  fats: food.fats || 0,
                                                  substitutions: food.substitutions || [],
                                                  food_order: idx,
                                                })),
                                              });
                                              toast({
                                                title: "Refeição favoritada!",
                                                description: "A refeição foi salva nos seus favoritos.",
                                              });
                                            } catch (error: any) {
                                              toast({
                                                title: "Erro",
                                                description: error.message || "Erro ao favoritar refeição",
                                                variant: "destructive",
                                              });
                                            }
                                          }}
                                        >
                                          <Star className="w-4 h-4" aria-hidden="true" />
                                        </Button>

                                        {/* Botão remover */}
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeMeal(mealIndex);
                                          }}
                                          aria-label={`Remover ${mealName}`}
                                          title="Remover refeição"
                                  >
                                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CollapsibleContent>
                              <CardContent className="space-y-2 p-4">
                            {/* Campos ocultos mas mantidos no formulário (para estrutura n8n) */}
                            <div className="hidden">
                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.meal_type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
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
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {mealTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.meal_order`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? mealIndex + 1}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Alimentos da Refeição */}
                            <div className="space-y-2">

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
                                      recalculateFoodMacros={recalculateFoodMacros}
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
                                <div className="p-8 text-center bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/30">
                                  <Package className="w-10 h-10 mx-auto mb-3 text-[#777777]" />
                                  <p className="text-sm text-[#222222] mb-1">Nenhum alimento adicionado</p>
                                  <p className="text-xs text-[#777777]">Clique em "Adicionar Alimento" para começar</p>
                                </div>
                              )}

                              {/* Observação da Refeição - Minimizada por padrão */}
                              {mealFoods.length > 0 && (
                                <Collapsible defaultOpen={false}>
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="w-full justify-between pt-2 border-t border-green-200/30 text-[#222222] hover:bg-green-50/30"
                                    >
                                      <FormLabel className="text-[#222222] font-medium flex items-center gap-2 cursor-pointer">
                                        <BookOpen className="w-4 h-4 text-[#00C98A]" />
                                        Observação (opcional)
                                      </FormLabel>
                                      <ChevronDown className="w-4 h-4 text-[#777777]" />
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                <FormField
                                  control={form.control}
                                  name={`meals.${mealIndex}.instructions`}
                                  render={({ field }) => (
                                        <FormItem className="pt-2">
                                      <FormControl>
                                        <Textarea
                                          placeholder="Observações específicas para esta refeição..."
                                          className="resize-none border-green-500/30 bg-white text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-white focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-green-500/10 focus-visible:ring-offset-0 transition-all duration-300 min-h-[60px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                            </div>
                            </CardContent>
                            </CollapsibleContent>
                                </Card>
                              </Collapsible>
                              {!isLastMeal && (
                                <div className="my-4 border-t-2 border-green-500/30"></div>
                              )}
                            </div>
  );
});

