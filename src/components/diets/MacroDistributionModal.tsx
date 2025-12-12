import React, { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { macroDistributionService, DistributionStrategy, MealMacroTarget } from '@/lib/diet-macro-distribution-service';
import { useToast } from '@/hooks/use-toast';

interface MacroDistributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  mealTypes: string[];
  onApply: (distribution: MealMacroTarget[]) => void;
}

export function MacroDistributionModal({
  open,
  onOpenChange,
  totalMacros,
  mealTypes,
  onApply,
}: MacroDistributionModalProps) {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<DistributionStrategy>('balanced');
  const [distribution, setDistribution] = useState<MealMacroTarget[]>([]);
  const [isValid, setIsValid] = useState(true);

  React.useEffect(() => {
    if (open && mealTypes.length > 0) {
      const dist = macroDistributionService.distributeMacros(
        totalMacros,
        mealTypes,
        strategy
      );
      setDistribution(dist);
      
      const validation = macroDistributionService.validateDistribution(
        dist,
        totalMacros
      );
      setIsValid(validation.valid);
    }
  }, [open, strategy, totalMacros, mealTypes]);

  const handleStrategyChange = (newStrategy: DistributionStrategy) => {
    setStrategy(newStrategy);
    const dist = macroDistributionService.distributeMacros(
      totalMacros,
      mealTypes,
      newStrategy
    );
    setDistribution(dist);
    
    const validation = macroDistributionService.validateDistribution(
      dist,
      totalMacros
    );
    setIsValid(validation.valid);
  };

  const handleManualAdjust = (index: number, field: keyof MealMacroTarget['target'], value: number) => {
    const updated = [...distribution];
    if (updated[index]) {
      updated[index].target[field] = value;
      setDistribution(updated);
      
      const validation = macroDistributionService.validateDistribution(
        updated,
        totalMacros
      );
      setIsValid(validation.valid);
    }
  };

  const handleNormalize = () => {
    const normalized = macroDistributionService.normalizeDistribution(
      distribution,
      totalMacros
    );
    setDistribution(normalized);
    setIsValid(true);
    toast({
      title: 'Distribuição normalizada',
      description: 'Os valores foram ajustados para somar exatamente os totais',
    });
  };

  const handleApply = () => {
    if (!isValid) {
      toast({
        title: 'Distribuição inválida',
        description: 'Ajuste os valores antes de aplicar',
        variant: 'destructive',
      });
      return;
    }

    onApply(distribution);
    onOpenChange(false);
    toast({
      title: 'Distribuição aplicada',
      description: 'Os macros foram distribuídos entre as refeições',
    });
  };

  const validation = distribution.length > 0
    ? macroDistributionService.validateDistribution(distribution, totalMacros)
    : { valid: true, differences: { calories: 0, protein: 0, carbs: 0, fats: 0 } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Distribuição Automática de Macros
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Distribua automaticamente os macros entre as refeições usando diferentes estratégias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estratégia */}
          <div className="space-y-2">
            <Label className="text-cyan-200/70">Estratégia de Distribuição</Label>
            <Select value={strategy} onValueChange={handleStrategyChange}>
              <SelectTrigger className="border-cyan-500/30 bg-slate-950/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Equilibrada (mesma proporção)</SelectItem>
                <SelectItem value="protein_focused">Foco em Proteína (mais no almoço/jantar)</SelectItem>
                <SelectItem value="carb_strategic">Carboidrato Estratégico (mais no pré/pós-treino)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Totais */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-300 mb-3">Totais do Plano</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-400">Calorias</div>
                <div className="text-xl font-bold text-cyan-400">{totalMacros.calories}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Proteínas</div>
                <div className="text-xl font-bold text-cyan-400">{totalMacros.protein}g</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Carboidratos</div>
                <div className="text-xl font-bold text-cyan-400">{totalMacros.carbs}g</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Gorduras</div>
                <div className="text-xl font-bold text-cyan-400">{totalMacros.fats}g</div>
              </div>
            </div>
          </div>

          {/* Distribuição por Refeição */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-cyan-300">Distribuição por Refeição</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNormalize}
                className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
              >
                Normalizar
              </Button>
            </div>

            <div className="space-y-3">
              {distribution.map((meal, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-white">{meal.mealName}</div>
                      <div className="text-sm text-slate-400">{meal.mealType}</div>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
                      {Math.round((meal.target.calories / totalMacros.calories) * 100)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-slate-400">Calorias</Label>
                      <Input
                        type="number"
                        value={meal.target.calories}
                        onChange={(e) => handleManualAdjust(index, 'calories', parseInt(e.target.value) || 0)}
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Proteínas (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={meal.target.protein}
                        onChange={(e) => handleManualAdjust(index, 'protein', parseFloat(e.target.value) || 0)}
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Carboidratos (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={meal.target.carbs}
                        onChange={(e) => handleManualAdjust(index, 'carbs', parseFloat(e.target.value) || 0)}
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Gorduras (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={meal.target.fats}
                        onChange={(e) => handleManualAdjust(index, 'fats', parseFloat(e.target.value) || 0)}
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validação */}
          {!isValid && (
            <Alert className="border-yellow-500 bg-yellow-500/10">
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-semibold text-yellow-400">Diferenças encontradas:</div>
                  {validation.differences.calories !== 0 && (
                    <div className="text-sm text-yellow-300">
                      Calorias: {validation.differences.calories > 0 ? '+' : ''}{Math.round(validation.differences.calories)}
                    </div>
                  )}
                  {validation.differences.protein !== 0 && (
                    <div className="text-sm text-yellow-300">
                      Proteínas: {validation.differences.protein > 0 ? '+' : ''}{Math.round(validation.differences.protein * 10) / 10}g
                    </div>
                  )}
                  {validation.differences.carbs !== 0 && (
                    <div className="text-sm text-yellow-300">
                      Carboidratos: {validation.differences.carbs > 0 ? '+' : ''}{Math.round(validation.differences.carbs * 10) / 10}g
                    </div>
                  )}
                  {validation.differences.fats !== 0 && (
                    <div className="text-sm text-yellow-300">
                      Gorduras: {validation.differences.fats > 0 ? '+' : ''}{Math.round(validation.differences.fats * 10) / 10}g
                    </div>
                  )}
                  <div className="text-sm text-yellow-300 mt-2">
                    Clique em "Normalizar" para ajustar automaticamente
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isValid && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Distribuição válida! Os valores somam corretamente.
              </AlertDescription>
            </Alert>
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
            onClick={handleApply}
            disabled={!isValid}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Aplicar Distribuição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}










