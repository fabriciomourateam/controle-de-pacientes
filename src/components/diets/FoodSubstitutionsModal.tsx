import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface FoodSubstitution {
  food_name: string;
  quantity: number;
  unit: string;
  custom_unit_name?: string;
  custom_unit_grams?: number;
}

interface FoodSubstitutionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFoodName: string;
  originalFoodQuantity?: number;
  originalFoodUnit?: string;
  originalFoodCalories?: number;
  originalFoodProtein?: number;
  originalFoodCarbs?: number;
  originalFoodFats?: number;
  substitutions: FoodSubstitution[];
  onSave: (substitutions: FoodSubstitution[]) => void;
}

interface FoodData {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

const units = ['g', 'kg', 'ml', 'unidade', 'unidades', 'colher de sopa', 'colher de chá', 'xícara', 'fatia', 'pedaço', 'porção', 'medida personalizada'];

export function FoodSubstitutionsModal({
  open,
  onOpenChange,
  originalFoodName,
  originalFoodQuantity = 100,
  originalFoodUnit = 'g',
  originalFoodCalories,
  originalFoodProtein,
  originalFoodCarbs,
  originalFoodFats,
  substitutions: initialSubstitutions,
  onSave,
}: FoodSubstitutionsModalProps) {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>(initialSubstitutions || []);
  const [foodDatabase, setFoodDatabase] = useState<FoodData[]>([]);
  const [originalFoodData, setOriginalFoodData] = useState<FoodData | null>(null);
  const [substitutionsFoodData, setSubstitutionsFoodData] = useState<Map<number, FoodData>>(new Map());
  const [newSubstitution, setNewSubstitution] = useState<FoodSubstitution>({
    food_name: '',
    quantity: originalFoodQuantity,
    unit: originalFoodUnit,
  });
  const [customUnitGrams, setCustomUnitGrams] = useState<Map<number, number>>(new Map());
  const [customUnitNames, setCustomUnitNames] = useState<Map<number, string>>(new Map());
  const [showCustomUnitInput, setShowCustomUnitInput] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSubstitutions(initialSubstitutions || []);
      setNewSubstitution({
        food_name: '',
        quantity: originalFoodQuantity,
        unit: originalFoodUnit,
      });
      
      // Carregar medidas personalizadas das substituições existentes
      const gramsMap = new Map<number, number>();
      const namesMap = new Map<number, string>();
      initialSubstitutions?.forEach((sub, index) => {
        if (sub.custom_unit_grams) {
          gramsMap.set(index, sub.custom_unit_grams);
        }
        if (sub.custom_unit_name) {
          namesMap.set(index, sub.custom_unit_name);
        }
      });
      setCustomUnitGrams(gramsMap);
      setCustomUnitNames(namesMap);
      
      loadFoodDatabase();
      loadOriginalFoodData();
    }
  }, [open, initialSubstitutions, originalFoodQuantity, originalFoodUnit]);

  const loadFoodDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('food_database')
        .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setFoodDatabase(data || []);
    } catch (error) {
      console.error('Erro ao carregar banco de alimentos:', error);
    }
  };

  const loadOriginalFoodData = async () => {
    try {
      // Tentar busca exata primeiro
      let { data, error } = await supabase
        .from('food_database')
        .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
        .ilike('name', originalFoodName)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      // Se não encontrar, tentar busca parcial com primeira palavra
      if (!data || error) {
        const cleanName = originalFoodName.split(/[,\(]/)[0].trim();
        const firstWords = cleanName.split(' ').slice(0, 2).join(' ');
        
        const result = await supabase
          .from('food_database')
          .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
          .ilike('name', `%${firstWords}%`)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (!error && data) {
        setOriginalFoodData(data);
      } else {
        setOriginalFoodData(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do alimento original:', error);
    }
  };

  const loadSubstitutionFoodData = async (index: number, foodName: string) => {
    try {
      const { data, error } = await supabase
        .from('food_database')
        .select('name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g')
        .ilike('name', `%${foodName}%`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSubstitutionsFoodData(prev => {
          const newMap = new Map(prev);
          newMap.set(index, data);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da substituição:', error);
    }
  };

  const addSubstitution = () => {
    if (!newSubstitution.food_name.trim() || newSubstitution.quantity <= 0) {
      toast({
        title: 'Erro',
        description: 'Preencha o nome e quantidade do alimento antes de adicionar',
        variant: 'destructive',
      });
      return;
    }
    
    const newIndex = substitutions.length;
    setSubstitutions([...substitutions, newSubstitution]);
    
    // Carregar dados nutricionais da nova substituição
    loadSubstitutionFoodData(newIndex, newSubstitution.food_name);
    
    // Limpar formulário
    setNewSubstitution({
      food_name: '',
      quantity: originalFoodQuantity,
      unit: originalFoodUnit,
    });
  };

  const removeSubstitution = (index: number) => {
    setSubstitutions(substitutions.filter((_, i) => i !== index));
    setSubstitutionsFoodData(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  const updateSubstitution = (index: number, field: keyof FoodSubstitution, value: string | number) => {
    const updated = [...substitutions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSubstitutions(updated);
    
    if (field === 'food_name' && typeof value === 'string' && value.length > 0) {
      loadSubstitutionFoodData(index, value);
    }
  };

  const calculateMacros = (foodData: FoodData | null, quantity: number, unit: string, customGrams?: number) => {
    if (!foodData) return null;
    
    let quantityInGrams = quantity;
    if (unit === 'kg') quantityInGrams = quantity * 1000;
    else if (unit === 'ml') quantityInGrams = quantity;
    else if (unit === 'unidade' || unit === 'unidades') quantityInGrams = quantity * 100;
    else if (unit === 'colher de sopa') quantityInGrams = quantity * 15;
    else if (unit === 'colher de chá') quantityInGrams = quantity * 5;
    else if (unit === 'xícara') quantityInGrams = quantity * 240;
    else if (unit === 'fatia') quantityInGrams = quantity * (customGrams || 30);
    else if (unit === 'pedaço') quantityInGrams = quantity * (customGrams || 50);
    else if (unit === 'porção') quantityInGrams = quantity * (customGrams || 100);
    else if (unit === 'medida personalizada') quantityInGrams = quantity * (customGrams || 100);
    
    const factor = quantityInGrams / 100;
    
    return {
      calories: Math.round(foodData.calories_per_100g * factor),
      protein: Math.round(foodData.protein_per_100g * factor * 10) / 10,
      carbs: Math.round(foodData.carbs_per_100g * factor * 10) / 10,
      fats: Math.round(foodData.fats_per_100g * factor * 10) / 10,
    };
  };

  const handleSave = () => {
    const invalid = substitutions.some(
      (sub) => !sub.food_name.trim() || sub.quantity <= 0 || !sub.unit.trim()
    );

    if (invalid) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos das substituições corretamente',
        variant: 'destructive',
      });
      return;
    }

    // Adicionar informações de medidas personalizadas às substituições
    const substitutionsWithCustomUnits = substitutions.map((sub, index) => ({
      ...sub,
      custom_unit_grams: customUnitGrams.get(index),
      custom_unit_name: customUnitNames.get(index),
    }));

    onSave(substitutionsWithCustomUnits);
    onOpenChange(false);
    toast({
      title: 'Substituições salvas!',
      description: `${substitutions.length} substituição(ões) adicionada(s) para ${originalFoodName}`,
    });
  };

  // Calcular diferença percentual
  const getDiff = (original: number, substitution: number) => {
    if (!original || original === 0) return 0;
    return ((substitution - original) / original) * 100;
  };

  // Renderizar badge de diferença (removido - não mostrar mais)

  // Determinar cor de fundo baseada na similaridade
  const getBackgroundColor = (avgDiff: number) => {
    if (avgDiff <= 10) return 'bg-green-50'; // Muito similar
    if (avgDiff <= 20) return 'bg-yellow-50'; // Moderadamente diferente
    return 'bg-orange-50'; // Muito diferente
  };

  // Usar macros do alimento da dieta se fornecidos, senão calcular do banco de dados
  const originalMacros = (originalFoodCalories !== undefined && 
                          originalFoodProtein !== undefined && 
                          originalFoodCarbs !== undefined && 
                          originalFoodFats !== undefined) 
    ? {
        calories: originalFoodCalories,
        protein: originalFoodProtein,
        carbs: originalFoodCarbs,
        fats: originalFoodFats,
      }
    : calculateMacros(originalFoodData, originalFoodQuantity, originalFoodUnit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#222222] text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#00C98A]" />
            Substituições para {originalFoodName}
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Adicione alimentos substitutos que o paciente pode usar no lugar de <strong>{originalFoodName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabela de Comparação */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#777777]">Alimento</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Qtd</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Calorias</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Proteínas</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Carbos</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-[#777777]">Gorduras</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {/* Linha do Alimento Original - Sempre mostrar */}
                <tr className="bg-green-100 border-b-2 border-green-300">
                  <td className="py-3 px-4 font-bold text-[#222222]">{originalFoodName}</td>
                  <td className="py-3 px-3 text-center text-sm font-medium text-[#777777]">{originalFoodQuantity}{originalFoodUnit}</td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.calories || '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.protein ? `${originalMacros.protein}g` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.carbs ? `${originalMacros.carbs}g` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#00A875]">
                    {originalMacros?.fats ? `${originalMacros.fats}g` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-xs bg-[#00C98A] text-white px-2 py-1 rounded font-medium">Base</span>
                  </td>
                </tr>
                
                {/* Linhas das Substituições */}
                {substitutions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#777777]">
                      <p>Nenhuma opção de substituição adicionada ainda.</p>
                      <p className="text-sm mt-2">Clique em "Adicionar Substituição" para começar.</p>
                    </td>
                  </tr>
                ) : (
                  substitutions.map((sub, index) => {
                    const substitutionMacros = calculateMacros(
                      substitutionsFoodData.get(index) || null,
                      sub.quantity,
                      sub.unit,
                      customUnitGrams.get(index) || sub.custom_unit_grams
                    );

                    // Calcular diferença para cor de fundo
                    let bgColor = 'bg-white';
                    if (originalMacros && substitutionMacros) {
                      const caloriesDiff = getDiff(originalMacros.calories, substitutionMacros.calories);
                      const proteinDiff = getDiff(originalMacros.protein, substitutionMacros.protein);
                      const carbsDiff = getDiff(originalMacros.carbs, substitutionMacros.carbs);
                      const fatsDiff = getDiff(originalMacros.fats, substitutionMacros.fats);
                      const avgDiff = Math.abs((Math.abs(caloriesDiff) + Math.abs(proteinDiff) + Math.abs(carbsDiff) + Math.abs(fatsDiff)) / 4);
                      bgColor = getBackgroundColor(avgDiff);
                    }

                    return (
                      <tr key={index} className={`${bgColor} border-b border-gray-200 hover:opacity-90 transition-all`}>
                        <td className="py-3 px-4 font-medium text-[#222222]">
                          <Input
                            type="text"
                            value={sub.food_name}
                            onChange={(e) => updateSubstitution(index, 'food_name', e.target.value)}
                            onBlur={() => loadSubstitutionFoodData(index, sub.food_name)}
                            className="border-gray-300 bg-white text-[#222222] h-8 text-sm"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 justify-center">
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={sub.quantity}
                                onChange={(e) => updateSubstitution(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="border-gray-300 bg-white text-[#222222] h-8 w-16 text-sm text-center"
                              />
                              <Select
                                value={sub.unit}
                                onValueChange={(value) => {
                                  updateSubstitution(index, 'unit', value);
                                  if (['fatia', 'pedaço', 'porção', 'medida personalizada'].includes(value)) {
                                    setShowCustomUnitInput(index);
                                  }
                                }}
                              >
                                <SelectTrigger className="border-gray-300 bg-white text-[#222222] h-8 w-24 text-xs">
                                  <SelectValue>
                                    {sub.unit === 'medida personalizada' && (customUnitNames.get(index) || sub.custom_unit_name)
                                      ? (customUnitNames.get(index) || sub.custom_unit_name)
                                      : sub.unit}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {units.map((unit) => (
                                    <SelectItem key={unit} value={unit} className="text-[#222222] text-xs">
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {['fatia', 'pedaço', 'porção', 'medida personalizada'].includes(sub.unit) && (
                              <div className="flex items-center gap-1">
                                {sub.unit === 'medida personalizada' && (
                                  <Input
                                    type="text"
                                    placeholder="nome da medida"
                                    value={customUnitNames.get(index) || sub.custom_unit_name || ''}
                                    onChange={(e) => {
                                      const newMap = new Map(customUnitNames);
                                      newMap.set(index, e.target.value);
                                      setCustomUnitNames(newMap);
                                    }}
                                    className="border-green-300 bg-white text-[#222222] h-7 w-28 text-xs"
                                  />
                                )}
                                <Input
                                  type="number"
                                  step="1"
                                  min="1"
                                  placeholder="gramas"
                                  value={customUnitGrams.get(index) || sub.custom_unit_grams || ''}
                                  onChange={(e) => {
                                    const newMap = new Map(customUnitGrams);
                                    newMap.set(index, parseFloat(e.target.value) || 0);
                                    setCustomUnitGrams(newMap);
                                  }}
                                  className="border-green-300 bg-white text-[#222222] h-7 w-16 text-xs text-center"
                                />
                                <span className="text-xs text-[#777777]">g</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.calories || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.protein || '-'}g
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.carbs || '-'}g
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#00A875]">
                            {substitutionMacros?.fats || '-'}g
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubstitution(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0 rounded-lg transition-all duration-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Formulário para Adicionar Nova Substituição */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-[#222222] mb-3">Adicionar Nova Substituição</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <Label className="text-[#777777] text-sm mb-1 block">Nome do Alimento *</Label>
                <div className="relative">
                  <style>{`
                    input[list]::-webkit-calendar-picker-indicator {
                      filter: invert(0.5);
                    }
                    input[list] {
                      border: 1px solid #86efac !important;
                      outline: none !important;
                      box-shadow: none !important;
                    }
                    input[list]:focus {
                      border-color: #4ade80 !important;
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}</style>
                  <Input
                    type="text"
                    value={newSubstitution.food_name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewSubstitution({ ...newSubstitution, food_name: value });
                    }}
                    placeholder="Digite o nome do alimento..."
                    className="!border-green-300 bg-white text-[#222222] placeholder:text-[#777777]"
                    style={{ 
                      borderColor: '#86efac !important', 
                      borderWidth: '1px',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                    list="food-datalist-new"
                  />
                  <datalist id="food-datalist-new">
                    {foodDatabase.map((food, i) => (
                      <option key={i} value={food.name}>
                        {food.name} - {Math.round(food.calories_per_100g)} kcal
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="col-span-3">
                <Label className="text-[#777777] text-sm mb-1 block">Quantidade *</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={newSubstitution.quantity}
                  onChange={(e) => {
                    setNewSubstitution({ ...newSubstitution, quantity: parseFloat(e.target.value) || 0 });
                  }}
                  className="!border-green-300 bg-white text-[#222222] placeholder:text-[#777777]"
                  style={{ 
                    borderColor: '#86efac !important', 
                    borderWidth: '1px',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                />
              </div>

              <div className="col-span-3">
                <Label className="text-[#777777] text-sm mb-1 block">Unidade *</Label>
                <Select
                  value={newSubstitution.unit}
                  onValueChange={(value) => {
                    setNewSubstitution({ ...newSubstitution, unit: value });
                  }}
                >
                  <SelectTrigger className="!border-green-300 bg-white text-[#222222]" style={{ 
                    borderColor: '#86efac !important', 
                    borderWidth: '1px',
                    outline: 'none',
                    boxShadow: 'none'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit} className="text-[#222222]">
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={addSubstitution}
            className="w-full bg-[#00C98A] hover:bg-[#00A875] text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Substituição
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-[#222222] hover:bg-[#333333] text-white border-0"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#00C98A] hover:bg-[#00A875] text-white"
          >
            Salvar Substituições
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
