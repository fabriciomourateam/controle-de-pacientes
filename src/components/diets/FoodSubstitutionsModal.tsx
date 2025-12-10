import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
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

interface FoodSubstitution {
  food_name: string;
  quantity: number;
  unit: string;
}

interface FoodSubstitutionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFoodName: string;
  substitutions: FoodSubstitution[];
  onSave: (substitutions: FoodSubstitution[]) => void;
}

const units = ['g', 'kg', 'ml', 'unidade', 'unidades', 'colher de sopa', 'colher de chá', 'xícara'];

export function FoodSubstitutionsModal({
  open,
  onOpenChange,
  originalFoodName,
  substitutions: initialSubstitutions,
  onSave,
}: FoodSubstitutionsModalProps) {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>(initialSubstitutions || []);

  useEffect(() => {
    if (open) {
      setSubstitutions(initialSubstitutions || []);
    }
  }, [open, initialSubstitutions]);

  const addSubstitution = () => {
    setSubstitutions([
      ...substitutions,
      {
        food_name: '',
        quantity: 0,
        unit: 'g',
      },
    ]);
  };

  const removeSubstitution = (index: number) => {
    setSubstitutions(substitutions.filter((_, i) => i !== index));
  };

  const updateSubstitution = (index: number, field: keyof FoodSubstitution, value: string | number) => {
    const updated = [...substitutions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSubstitutions(updated);
  };

  const handleSave = () => {
    // Validar substituições
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

    onSave(substitutions);
    onOpenChange(false);
    toast({
      title: 'Substituições salvas!',
      description: `${substitutions.length} substituição(ões) adicionada(s) para ${originalFoodName}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-700/50 bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" />
            Substituições para {originalFoodName}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Adicione alimentos substitutos que o paciente pode usar no lugar de <strong>{originalFoodName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {substitutions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>Nenhuma substituição adicionada ainda.</p>
              <p className="text-sm mt-2">Clique em "Adicionar Substituição" para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {substitutions.map((sub, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-medium">Substituição {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubstitution(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label className="text-slate-400 text-sm mb-1 block">Nome do Alimento *</Label>
                      <Input
                        placeholder="Ex: Macarrão, Batata, etc."
                        value={sub.food_name}
                        onChange={(e) => updateSubstitution(index, 'food_name', e.target.value)}
                        className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-400 text-sm mb-1 block">Unidade *</Label>
                      <Select
                        value={sub.unit}
                        onValueChange={(value) => updateSubstitution(index, 'unit', value)}
                      >
                        <SelectTrigger className="border-slate-600/50 bg-slate-800/50 text-white focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-sm mb-1 block">Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="0"
                      value={sub.quantity || ''}
                      onChange={(e) => updateSubstitution(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Quantidade proporcional ao alimento original
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addSubstitution}
            className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/50 text-purple-300 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Substituição
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 text-white"
          >
            Salvar Substituições
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





