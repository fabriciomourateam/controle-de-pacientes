import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];

interface EditCheckinModalProps {
  checkin: Checkin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCheckinModal({ checkin, open, onOpenChange, onSuccess }: EditCheckinModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    peso: '',
    pontos_treinos: '',
    pontos_cardios: '',
    pontos_sono: '',
    pontos_agua: '',
    pontos_stress: '',
    pontos_libido: '',
    pontos_qualidade_sono: '',
    objetivo: '',
    dificuldades: '',
    melhora_visual: '',
    quais_pontos: ''
  });

  useEffect(() => {
    if (checkin) {
      setFormData({
        peso: checkin.peso || '',
        pontos_treinos: checkin.pontos_treinos || '',
        pontos_cardios: checkin.pontos_cardios || '',
        pontos_sono: checkin.pontos_sono || '',
        pontos_agua: checkin.pontos_agua || '',
        pontos_stress: checkin.pontos_stress || '',
        pontos_libido: checkin.pontos_libido || '',
        pontos_qualidade_sono: checkin.pontos_qualidade_sono || '',
        objetivo: checkin.objetivo || '',
        dificuldades: checkin.dificuldades || '',
        melhora_visual: checkin.melhora_visual || '',
        quais_pontos: checkin.quais_pontos || ''
      });
    }
  }, [checkin]);

  const calculateTotalScore = () => {
    const scores = [
      parseFloat(formData.pontos_treinos) || 0,
      parseFloat(formData.pontos_cardios) || 0,
      parseFloat(formData.pontos_sono) || 0,
      parseFloat(formData.pontos_agua) || 0,
      parseFloat(formData.pontos_stress) || 0,
      parseFloat(formData.pontos_libido) || 0,
      parseFloat(formData.pontos_qualidade_sono) || 0
    ];
    const total = scores.reduce((a, b) => a + b, 0);
    const avg = total / scores.filter(s => s > 0).length || 0;
    return avg.toFixed(1);
  };

  const calculateAproveitamento = () => {
    const total = parseFloat(calculateTotalScore());
    return ((total / 10) * 100).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkin) return;

    setLoading(true);
    try {
      const totalScore = calculateTotalScore();
      const aproveitamento = calculateAproveitamento();

      const { error } = await supabase
        .from('checkin')
        .update({
          peso: formData.peso || null,
          pontos_treinos: formData.pontos_treinos || null,
          pontos_cardios: formData.pontos_cardios || null,
          pontos_sono: formData.pontos_sono || null,
          pontos_agua: formData.pontos_agua || null,
          pontos_stress: formData.pontos_stress || null,
          pontos_libido: formData.pontos_libido || null,
          pontos_qualidade_sono: formData.pontos_qualidade_sono || null,
          objetivo: formData.objetivo || null,
          dificuldades: formData.dificuldades || null,
          melhora_visual: formData.melhora_visual || null,
          quais_pontos: formData.quais_pontos || null,
          total_pontuacao: totalScore,
          percentual_aproveitamento: aproveitamento
        })
        .eq('id', checkin.id);

      if (error) throw error;

      toast({
        title: 'Check-in atualizado! ✅',
        description: 'As alterações foram salvas com sucesso.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar check-in:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!checkin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Editar Check-in - {new Date(checkin.data_checkin).toLocaleDateString('pt-BR')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Peso */}
          <div>
            <Label htmlFor="peso" className="text-slate-300">Peso (kg)</Label>
            <Input
              id="peso"
              type="text"
              value={formData.peso}
              onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Ex: 75.5"
            />
          </div>

          {/* Pontuações */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="treinos" className="text-slate-300">Treinos</Label>
              <Input
                id="treinos"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.pontos_treinos}
                onChange={(e) => setFormData({ ...formData, pontos_treinos: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="cardios" className="text-slate-300">Cardio</Label>
              <Input
                id="cardios"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.pontos_cardios}
                onChange={(e) => setFormData({ ...formData, pontos_cardios: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="sono" className="text-slate-300">Sono</Label>
              <Input
                id="sono"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.pontos_sono}
                onChange={(e) => setFormData({ ...formData, pontos_sono: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="agua" className="text-slate-300">Hidratação</Label>
              <Input
                id="agua"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.pontos_agua}
                onChange={(e) => setFormData({ ...formData, pontos_agua: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="stress" className="text-slate-300">Stress</Label>
              <Input
                id="stress"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.pontos_stress}
                onChange={(e) => setFormData({ ...formData, pontos_stress: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="libido" className="text-slate-300">Libido</Label>
              <Input
                id="libido"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.pontos_libido}
                onChange={(e) => setFormData({ ...formData, pontos_libido: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="qualidade_sono" className="text-slate-300">Qualidade Sono</Label>
              <Input
                id="qualidade_sono"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.pontos_qualidade_sono}
                onChange={(e) => setFormData({ ...formData, pontos_qualidade_sono: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Preview da pontuação */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Pontuação Total:</span>
              <span className="text-2xl font-bold text-white">{calculateTotalScore()}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-300">Aproveitamento:</span>
              <span className="text-lg font-semibold text-purple-400">{calculateAproveitamento()}%</span>
            </div>
          </div>

          {/* Campos de texto */}
          <div>
            <Label htmlFor="objetivo" className="text-slate-300">Objetivo</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="dificuldades" className="text-slate-300">Dificuldades</Label>
            <Textarea
              id="dificuldades"
              value={formData.dificuldades}
              onChange={(e) => setFormData({ ...formData, dificuldades: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="melhora_visual" className="text-slate-300">Melhora Visual</Label>
            <Textarea
              id="melhora_visual"
              value={formData.melhora_visual}
              onChange={(e) => setFormData({ ...formData, melhora_visual: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="quais_pontos" className="text-slate-300">Quais Pontos</Label>
            <Textarea
              id="quais_pontos"
              value={formData.quais_pontos}
              onChange={(e) => setFormData({ ...formData, quais_pontos: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={2}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
