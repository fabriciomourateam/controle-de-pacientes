import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { foodSubstitutionService, FoodSubstitution } from '@/lib/diet-food-substitution-service';

interface FoodSubstitutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFood: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  onSubstitute: (substitution: FoodSubstitution, newQuantity: number) => void;
}

export function FoodSubstitutionModal({
  open,
  onOpenChange,
  originalFood,
  onSubstitute,
}: FoodSubstitutionModalProps) {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState<FoodSubstitution | null>(null);
  const [newQuantity, setNewQuantity] = useState(originalFood.quantity.toString());

  useEffect(() => {
    if (open) {
      loadSubstitutions();
      setNewQuantity(originalFood.quantity.toString());
      setSelectedSubstitution(null);
    }
  }, [open, originalFood]);

  const loadSubstitutions = async () => {
    setLoading(true);
    try {
      const data = await foodSubstitutionService.findSubstitutions(originalFood, 10);
      setSubstitutions(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar substituições',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubstitute = () => {
    if (!selectedSubstitution) {
      toast({
        title: 'Erro',
        description: 'Selecione uma substituição',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Erro',
        description: 'Quantidade inválida',
        variant: 'destructive',
      });
      return;
    }

    onSubstitute(selectedSubstitution, quantity);
    onOpenChange(false);
    toast({
      title: 'Alimento substituído',
      description: `${originalFood.name} substituído por ${selectedSubstitution.food_name}`,
    });
  };

  const calculateAdjustedMacros = (substitution: FoodSubstitution, quantity: number) => {
    const quantityInGrams = foodSubstitutionService.convertToGrams(quantity, originalFood.unit);
    const multiplier = quantityInGrams / 100;

    return {
      calories: Math.round(substitution.calories_per_100g * multiplier),
      protein: Math.round(substitution.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(substitution.carbs_per_100g * multiplier * 10) / 10,
      fats: Math.round(substitution.fats_per_100g * multiplier * 10) / 10,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Substituir Alimento
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Encontre alternativas para <strong>{originalFood.name}</strong> mantendo macros similares
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alimento Original */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Alimento Original</div>
            <div className="font-semibold text-white mb-3">{originalFood.name}</div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Calorias</div>
                <div className="text-cyan-400 font-semibold">{originalFood.calories}</div>
              </div>
              <div>
                <div className="text-slate-400">Proteínas</div>
                <div className="text-cyan-400 font-semibold">{originalFood.protein}g</div>
              </div>
              <div>
                <div className="text-slate-400">Carboidratos</div>
                <div className="text-cyan-400 font-semibold">{originalFood.carbs}g</div>
              </div>
              <div>
                <div className="text-slate-400">Gorduras</div>
                <div className="text-cyan-400 font-semibold">{originalFood.fats}g</div>
              </div>
            </div>
          </div>

          {/* Lista de Substituições */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-cyan-300">Substituições Sugeridas</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {substitutions.map((sub, index) => {
                  const adjustedMacros = calculateAdjustedMacros(sub, parseFloat(newQuantity) || originalFood.quantity);
                  const isSelected = selectedSubstitution?.food_name === sub.food_name;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedSubstitution(sub)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-white">{sub.food_name}</div>
                          <div className="text-xs text-slate-400 mt-1">{sub.category}</div>
                        </div>
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
                          {Math.round(sub.similarity_score)}% similar
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Calorias</div>
                          <div className="text-cyan-400 font-semibold">{adjustedMacros.calories}</div>
                          <div className="text-xs text-slate-500">
                            ({Math.round(sub.calories_per_100g)}/100g)
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Proteínas</div>
                          <div className="text-cyan-400 font-semibold">{adjustedMacros.protein}g</div>
                          <div className="text-xs text-slate-500">
                            ({Math.round(sub.protein_per_100g * 10) / 10}g/100g)
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Carboidratos</div>
                          <div className="text-cyan-400 font-semibold">{adjustedMacros.carbs}g</div>
                          <div className="text-xs text-slate-500">
                            ({Math.round(sub.carbs_per_100g * 10) / 10}g/100g)
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Gorduras</div>
                          <div className="text-cyan-400 font-semibold">{adjustedMacros.fats}g</div>
                          <div className="text-xs text-slate-500">
                            ({Math.round(sub.fats_per_100g * 10) / 10}g/100g)
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantidade */}
          {selectedSubstitution && (
            <div className="space-y-2">
              <Label className="text-cyan-200/70">Nova Quantidade</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="bg-slate-950/50 border-slate-700 text-white"
                />
                <div className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-slate-300">
                  {originalFood.unit}
                </div>
              </div>
              <div className="text-xs text-slate-400">
                Quantidade sugerida: {Math.round(selectedSubstitution.quantity_adjustment)}g
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubstitute}
            disabled={!selectedSubstitution}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Substituir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
