import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useRef } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Image, Upload } from 'lucide-react';
import { FlowStep } from '@/lib/checkin-flow-default';
import { checkinFlowService } from '@/lib/checkin-flow-service';

interface StepEditorProps {
  step: FlowStep;
  onChange: (updated: FlowStep) => void;
  /** Se true, este step é o último do fluxo; quando for type "message", após ele aparece o botão Finalizar */
  isLastStep?: boolean;
}

const CHECKIN_FIELDS = [
  '', 'peso', 'medida', 'treino', 'tempo', 'descanso', 'cardio', 'tempo_cardio',
  'ref_livre', 'oq_comeu_ref_livre', 'beliscos', 'oq_beliscou', 'comeu_menos',
  'fome_algum_horario', 'alimento_para_incluir', 'agua', 'sono', 'stress', 'libido',
  'melhora_visual', 'quais_pontos', 'objetivo', 'dificuldades', 'fotos',
];

const OPERATORS = [
  { value: '==', label: 'Igual a' },
  { value: '!=', label: 'Diferente de' },
  { value: '>=', label: 'Maior ou igual' },
  { value: '<=', label: 'Menor ou igual' },
  { value: '>', label: 'Maior que' },
  { value: '<', label: 'Menor que' },
  { value: 'between', label: 'Entre (min,max)' },
];

export function StepEditor({ step, onChange, isLastStep }: StepEditorProps) {
  const hasConditions = (step.conditionalMessages?.length ?? 0) > 0 || !!step.showIf;
  const isFinalizeStep = isLastStep && step.type === 'message';
  const [showConditions, setShowConditions] = useState(hasConditions);
  const [uploadingImage, setUploadingImage] = useState(false);
  const stepImageInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof FlowStep, value: any) => {
    onChange({ ...step, [key]: value });
  };

  const updateMessage = (index: number, value: string) => {
    const msgs = [...(step.messages || [])];
    msgs[index] = value;
    update('messages', msgs);
  };

  const addMessage = () => update('messages', [...(step.messages || []), '']);
  const removeMessage = (index: number) => update('messages', (step.messages || []).filter((_, i) => i !== index));

  const updateOption = (index: number, value: string) => {
    const opts = [...(step.options || [])];
    opts[index] = value;
    update('options', opts);
  };

  const addOption = () => update('options', [...(step.options || []), '']);
  const removeOption = (index: number) => update('options', (step.options || []).filter((_, i) => i !== index));

  const addConditionalMessage = () => {
    update('conditionalMessages', [
      ...(step.conditionalMessages || []),
      { condition: { field: step.field || '', operator: '==', value: '' }, messages: [''] }
    ]);
  };

  const updateConditional = (index: number, key: string, value: any) => {
    const cms = [...(step.conditionalMessages || [])];
    if (key === 'messages') {
      cms[index] = { ...cms[index], messages: value };
    } else {
      cms[index] = { ...cms[index], condition: { ...cms[index].condition, [key]: value } };
    }
    update('conditionalMessages', cms);
  };

  const removeConditional = (index: number) => {
    update('conditionalMessages', (step.conditionalMessages || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      {isFinalizeStep && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Este é o step de <strong>finalização</strong>. Após exibir estas mensagens, o paciente verá o botão &quot;Finalizar e Enviar Check-in&quot; para salvar os dados.
        </div>
      )}
      {/* Tipo e Campo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Tipo</Label>
          <Select value={step.type} onValueChange={v => update('type', v)}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message">Mensagem (sem input)</SelectItem>
              <SelectItem value="text">Texto livre</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="choice">Opções</SelectItem>
              <SelectItem value="file">Upload de fotos</SelectItem>
              <SelectItem value="multi-input">Múltiplos Campos (Medidas)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Campo do Check-in</Label>
          <Select value={step.field || ''} onValueChange={v => update('field', v || undefined)}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-9 text-sm">
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              {CHECKIN_FIELDS.map(f => (
                <SelectItem key={f || 'none'} value={f || 'none'}>{f || '(nenhum)'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pergunta */}
      {step.type !== 'message' && (
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Pergunta</Label>
          <Textarea
            value={step.question || ''}
            onChange={e => update('question', e.target.value)}
            rows={2}
            className="bg-slate-800/50 border-slate-700/50 text-white text-sm resize-none"
            placeholder="Pergunta que aparece como mensagem do bot..."
          />
          <p className="text-[10px] text-slate-500">Use **palavra** para negrito e *palavra* para itálico no chat.</p>
        </div>
      )}

      {/* Mensagens */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-slate-400 text-xs">Mensagens do bot</Label>
          <Button size="sm" variant="ghost" onClick={addMessage} className="h-6 text-xs text-slate-400">
            <Plus className="w-3 h-3 mr-1" /> Adicionar
          </Button>
        </div>
        <p className="text-[10px] text-slate-500">Use **palavra** para negrito e *palavra* para itálico no chat.</p>
        {(step.messages || []).map((msg, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={msg}
              onChange={e => updateMessage(i, e.target.value)}
              rows={2}
              className="flex-1 bg-slate-800/50 border-slate-700/50 text-white text-sm resize-none"
            />
            <Button size="sm" variant="ghost" onClick={() => removeMessage(i)} className="text-slate-500 hover:text-red-400 shrink-0 h-8">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Opções (para choice) */}
      {step.type === 'choice' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-400 text-xs">Opções de resposta</Label>
            <Button size="sm" variant="ghost" onClick={addOption} className="h-6 text-xs text-slate-400">
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          </div>
          {(step.options || []).map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                className="flex-1 bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"
              />
              <Button size="sm" variant="ghost" onClick={() => removeOption(i)} className="text-slate-500 hover:text-red-400 shrink-0 h-9">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}



      {/* Inputs para Multi-Input */}
      {step.type === 'multi-input' && (
        <div className="space-y-3 border-t border-slate-700/30 pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-400 text-xs">Campos do Multi-Input</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => update('inputs', [...(step.inputs || []), { label: 'Novo Campo', field: '', type: 'number', placeholder: '' }])}
              className="h-6 text-xs text-slate-400"
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar Campo
            </Button>
          </div>

          {(step.inputs || []).map((input, i) => (
            <div key={i} className="bg-slate-900/30 rounded-lg p-3 space-y-2 border border-slate-700/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase">Input {i + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => update('inputs', (step.inputs || []).filter((_, idx) => idx !== i))}
                  className="h-5 text-xs text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500">Label</Label>
                  <Input
                    value={input.label}
                    onChange={e => {
                      const newInputs = [...(step.inputs || [])];
                      newInputs[i] = { ...newInputs[i], label: e.target.value };
                      update('inputs', newInputs);
                    }}
                    className="bg-slate-800/50 border-slate-700/50 text-white h-7 text-xs"
                    placeholder="Ex: Cintura (cm)"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500">ID (ex: cintura)</Label>
                  <Input
                    value={input.field}
                    onChange={e => {
                      const newInputs = [...(step.inputs || [])];
                      newInputs[i] = { ...newInputs[i], field: e.target.value };
                      update('inputs', newInputs);
                    }}
                    className="bg-slate-800/50 border-slate-700/50 text-white h-7 text-xs"
                    placeholder="Id único"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500">Tipo</Label>
                  <Select
                    value={input.type}
                    onValueChange={v => {
                      const newInputs = [...(step.inputs || [])];
                      newInputs[i] = { ...newInputs[i], type: v as any };
                      update('inputs', newInputs);
                    }}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500">Placeholder</Label>
                  <Input
                    value={input.placeholder || ''}
                    onChange={e => {
                      const newInputs = [...(step.inputs || [])];
                      newInputs[i] = { ...newInputs[i], placeholder: e.target.value };
                      update('inputs', newInputs);
                    }}
                    className="bg-slate-800/50 border-slate-700/50 text-white h-7 text-xs"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder */}
      {(step.type === 'text' || step.type === 'number') && (
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Placeholder</Label>
          <Input
            value={step.placeholder || ''}
            onChange={e => update('placeholder', e.target.value)}
            className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"
            placeholder="Ex: Digite aqui..."
          />
        </div>
      )}

      {/* Obrigatório */}
      <div className="flex items-center justify-between">
        <Label className="text-slate-400 text-xs">Obrigatório</Label>
        <Switch checked={step.required || false} onCheckedChange={v => update('required', v)} />
      </div>

      {/* Imagem de apoio (opcional) */}
      <div className="space-y-1.5">
        <Label className="text-slate-400 text-xs flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5" /> Imagem de apoio (opcional)
        </Label>
        <div className="flex gap-2">
          <Input
            value={step.imageUrl || ''}
            onChange={e => update('imageUrl', e.target.value || undefined)}
            placeholder="URL da imagem (ex.: onde medir cintura/quadril)"
            className="flex-1 bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploadingImage}
            onClick={() => stepImageInputRef.current?.click()}
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 h-9 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
          </Button>
        </div>
        {step.imageUrl && (
          <div className="flex items-center gap-2">
            <Label className="text-slate-500 text-[10px] shrink-0">Ordem:</Label>
            <Select
              value={step.imagePosition || 'below'}
              onValueChange={(v: 'above' | 'below') => update('imagePosition', v)}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-8 text-xs w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Imagem acima do texto</SelectItem>
                <SelectItem value="below">Imagem abaixo do texto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <input
          ref={stepImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingImage(true);
            try {
              const url = await checkinFlowService.uploadStepImage(file);
              update('imageUrl', url);
            } finally {
              setUploadingImage(false);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Condições avançadas */}
      <div className="border-t border-slate-700/30 pt-4">
        <button
          onClick={() => setShowConditions(!showConditions)}
          className="flex items-center gap-2 text-slate-400 text-xs hover:text-white transition-colors w-full"
        >
          {showConditions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Condições avançadas
          {((step.conditionalMessages?.length ?? 0) > 0 || step.showIf) && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">
              {(step.conditionalMessages?.length ?? 0) > 0
                ? `${step.conditionalMessages!.length} mensagem(ns) condicional(is)`
                : 'Step condicional'}
            </span>
          )}
        </button>

        {showConditions && (
          <div className="mt-3 space-y-4">
            {/* ShowIf */}
            <Card className="bg-slate-800/30 border-slate-700/30">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs text-slate-400">Mostrar apenas se...</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={step.showIf?.field || ''} onValueChange={v => update('showIf', v ? { ...step.showIf, field: v, operator: step.showIf?.operator || '==', value: step.showIf?.value || '' } : undefined)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-8 text-xs"><SelectValue placeholder="Campo" /></SelectTrigger>
                    <SelectContent>{CHECKIN_FIELDS.filter(f => f).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={step.showIf?.operator || '=='} onValueChange={v => update('showIf', { ...step.showIf!, operator: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{OPERATORS.map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={step.showIf?.value || ''} onChange={e => update('showIf', { ...step.showIf!, value: e.target.value })} className="bg-slate-800/50 border-slate-700/50 text-white h-8 text-xs" placeholder="Valor" />
                </div>
                {step.showIf && (
                  <Button size="sm" variant="ghost" onClick={() => update('showIf', undefined)} className="h-6 text-xs text-red-400">
                    Remover condição
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Mensagens Condicionais */}
            <Card className="bg-slate-800/30 border-slate-700/30">
              <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs text-slate-400">Mensagens condicionais</CardTitle>
                <Button size="sm" variant="ghost" onClick={addConditionalMessage} className="h-6 text-xs text-slate-400">
                  <Plus className="w-3 h-3 mr-1" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
                {(step.conditionalMessages || []).map((cm, i) => (
                  <div key={i} className="bg-slate-900/30 rounded-lg p-3 space-y-2 border border-slate-700/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase">Condição {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeConditional(i)} className="h-5 text-xs text-red-400"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={cm.condition.field} onValueChange={v => updateConditional(i, 'field', v)}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-7 text-[10px]"><SelectValue placeholder="Campo" /></SelectTrigger>
                        <SelectContent>{CHECKIN_FIELDS.filter(f => f).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={cm.condition.operator} onValueChange={v => updateConditional(i, 'operator', v)}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{OPERATORS.map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={cm.condition.value} onChange={e => updateConditional(i, 'value', e.target.value)} className="bg-slate-800/50 border-slate-700/50 text-white h-7 text-[10px]" placeholder="Valor" />
                    </div>
                    {cm.messages.map((msg, mi) => (
                      <Textarea
                        key={mi}
                        value={msg}
                        onChange={e => {
                          const msgs = [...cm.messages];
                          msgs[mi] = e.target.value;
                          updateConditional(i, 'messages', msgs);
                        }}
                        rows={2}
                        className="bg-slate-800/50 border-slate-700/50 text-white text-xs resize-none"
                        placeholder="Mensagem que aparece quando a condição é verdadeira..."
                      />
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
