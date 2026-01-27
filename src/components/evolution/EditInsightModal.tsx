import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import type { CustomInsight, InsightData } from '@/hooks/use-custom-insights';
import type { AnalysisInsight } from '@/lib/ai-analysis-service';

interface EditInsightModalProps {
  open: boolean;
  onClose: () => void;
  insight?: CustomInsight | null; // null = criar novo
  aiInsightToCopy?: AnalysisInsight | null; // Card da IA para copiar/editar
  section: 'strengths' | 'warnings' | 'goals';
  telefone: string;
  onSave: (data: InsightData) => Promise<boolean>;
}

// Emojis sugeridos por seção
const EMOJI_SUGGESTIONS = {
  strengths: ['💪', '🎯', '⭐', '🏆', '✨', '🔥', '📈', '💯', '👏', '🎉', '🌟', '💚'],
  warnings: ['⚠️', '🚨', '⏰', '📊', '🔍', '💡', '🎯', '📉', '⚡', '🔔', '👀', '📌'],
  goals: ['🎯', '🚀', '🏃', '💪', '📈', '🎓', '🌱', '⭐', '🔥', '💡', '🎪', '🏅']
};

const SECTION_LABELS = {
  strengths: 'Pontos Fortes',
  warnings: 'Pontos de Atenção',
  goals: 'Próximas Metas'
};

export function EditInsightModal({
  open,
  onClose,
  insight,
  aiInsightToCopy,
  section,
  telefone,
  onSave
}: EditInsightModalProps) {
  const [icon, setIcon] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [saving, setSaving] = useState(false);

  const isEditMode = !!insight;
  const isWarningSection = section === 'warnings';

  // Preencher campos ao editar ou copiar
  useEffect(() => {
    if (insight) {
      // Editando card customizado existente
      setIcon(insight.icon);
      setTitle(insight.title);
      setDescription(insight.description);
      setRecommendation(insight.recommendation || '');
      setPriority(insight.priority || 'medium');
    } else if (aiInsightToCopy) {
      // Copiando card da IA para editar
      setIcon(aiInsightToCopy.icon);
      setTitle(aiInsightToCopy.title);
      setDescription(aiInsightToCopy.description);
      setRecommendation(aiInsightToCopy.recommendation || '');
      setPriority(aiInsightToCopy.priority || 'medium');
    } else {
      // Criando novo card do zero
      setIcon(EMOJI_SUGGESTIONS[section][0]); // Primeiro emoji da lista
      setTitle('');
      setDescription('');
      setRecommendation('');
      setPriority('medium');
    }
  }, [insight, aiInsightToCopy, section, open]);

  const handleSave = async () => {
    // Validação
    if (!icon.trim()) {
      alert('Escolha um ícone para o card');
      return;
    }
    if (!title.trim()) {
      alert('Digite um título para o card');
      return;
    }
    if (!description.trim()) {
      alert('Digite uma descrição para o card');
      return;
    }

    setSaving(true);
    const data: InsightData = {
      section,
      icon: icon.trim(),
      title: title.trim(),
      description: description.trim(),
      recommendation: recommendation.trim() || undefined,
      priority: isWarningSection ? priority : undefined
    };

    const success = await onSave(data);
    setSaving(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditMode ? 'Editar Card' : aiInsightToCopy ? 'Editar Cópia do Card da IA' : 'Adicionar Novo Card'}
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-2">
            Seção: <span className="font-semibold text-white">{SECTION_LABELS[section]}</span>
            {aiInsightToCopy && (
              <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                📝 Editando cópia da IA
              </span>
            )}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seletor de Ícone */}
          <div className="space-y-2">
            <Label htmlFor="icon" className="text-white">Ícone do Card</Label>
            <div className="flex items-center gap-3">
              <div className="text-4xl bg-slate-800 rounded-lg p-3 border-2 border-slate-700">
                {icon || '❓'}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_SUGGESTIONS[section].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                        icon === emoji
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Ou digite qualquer emoji: 
                  <Input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Digite um emoji"
                    className="inline-block w-24 ml-2 h-7 text-center bg-slate-800 border-slate-700"
                    maxLength={2}
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Título do Card *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Perda de peso consistente"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={100}
            />
            <p className="text-xs text-slate-400">{title.length}/100 caracteres</p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o ponto forte, atenção ou meta..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-slate-400">{description.length}/500 caracteres</p>
          </div>

          {/* Recomendação (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="recommendation" className="text-white">
              {isWarningSection ? 'Recomendação' : 'Plano de Ação'} (opcional)
            </Label>
            <Textarea
              id="recommendation"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder={
                isWarningSection
                  ? 'Recomendação para resolver o ponto de atenção...'
                  : 'Plano de ação para alcançar a meta...'
              }
              className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-slate-400">{recommendation.length}/500 caracteres</p>
          </div>

          {/* Prioridade (apenas para warnings) */}
          {isWarningSection && (
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white">Prioridade</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="high" className="text-white">
                    🔴 Alta - Requer atenção imediata
                  </SelectItem>
                  <SelectItem value="medium" className="text-white">
                    🟡 Média - Monitorar de perto
                  </SelectItem>
                  <SelectItem value="low" className="text-white">
                    🟢 Baixa - Observar evolução
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
