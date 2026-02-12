import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Save, Loader2, Plus, Copy, Trash2, Power, PowerOff,
    Palette, ChevronDown, FileText, LayoutTemplate, RefreshCw,
    MessageSquare, Link2, GripVertical, ChevronUp
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    anamnesisFlowService,
    AnamnesisFlowConfig,
    AnamnesisFlowTheme,
    DEFAULT_ANAMNESIS_THEME,
} from '@/lib/anamnesis-flow-service';
import {
    DEFAULT_ANAMNESIS_FLOW,
    DEFAULT_FINAL_MESSAGE,
    DEFAULT_TERMS_URL,
    DEFAULT_TERMS_TEXT,
    AnamnesisFlowStep,
    AnamnesisFieldDef,
    FinalMessageConfig,
} from '@/lib/anamnesis-flow-default';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ==================== SORTABLE SECTION ====================

function SortableSection({ step, isSelected, onSelect, onDelete }: {
    step: AnamnesisFlowStep; isSelected: boolean; onSelect: () => void; onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${isSelected
                ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5'
                : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                }`}
            onClick={onSelect}
        >
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-700/50 rounded">
                <GripVertical className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-lg">{step.sectionEmoji}</span>
            <span className="text-sm text-slate-300 truncate flex-1">{step.sectionTitle}</span>
            <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/30 text-[10px]">
                {step.fields.length} campos
            </Badge>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors shrink-0"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ==================== SORTABLE FIELD ====================

function SortableField({ field, isSelected, onSelect, onDelete }: {
    field: AnamnesisFieldDef; isSelected: boolean; onSelect: () => void; onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    const TYPE_LABELS: Record<string, string> = {
        text: 'Texto', textarea: 'Área de Texto', select: 'Seletor', number: 'Número',
        date: 'Data', time: 'Hora', photo: 'Foto', checkbox: 'Checkbox'
    };

    const TYPE_COLORS: Record<string, string> = {
        text: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        textarea: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        select: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        number: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        date: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        time: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        photo: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        checkbox: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${isSelected
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-slate-800/20 border-slate-700/20 hover:bg-slate-800/40'
                }`}
            onClick={onSelect}
        >
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-700/50 rounded">
                <GripVertical className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <Badge className={`${TYPE_COLORS[field.type] || TYPE_COLORS.text} text-[9px] px-1.5 py-0 shrink-0`}>
                {TYPE_LABELS[field.type] || field.type}
            </Badge>
            <span className="text-xs text-slate-300 truncate flex-1">{field.label}</span>
            {field.required && <span className="text-blue-400 text-xs shrink-0">*</span>}
            <span className="text-[9px] text-slate-600 font-mono shrink-0">{field.field}</span>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-0.5 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors shrink-0"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
}

// ==================== FIELD EDITOR ====================

// Gera slug a partir do label (ex: "Restrição Alimentar" → "restricao_alimentar")
function slugify(text: string): string {
    return text
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50);
}

function FieldEditor({ field, onChange }: { field: AnamnesisFieldDef; onChange: (f: AnamnesisFieldDef) => void }) {
    const update = (key: keyof AnamnesisFieldDef, value: any) => onChange({ ...field, [key]: value });

    // Auto-gerar slug quando o label muda e o campo ainda é o padrão auto-gerado
    const handleLabelChange = (newLabel: string) => {
        const currentSlug = field.field;
        const isAutoGenerated = !currentSlug || currentSlug.startsWith('campo_') || currentSlug === slugify(field.label);
        const updates: Partial<AnamnesisFieldDef> = { label: newLabel };
        if (isAutoGenerated) {
            updates.field = slugify(newLabel);
        }
        onChange({ ...field, ...updates });
    };

    return (
        <div className="space-y-4 bg-slate-900/30 rounded-xl p-4 border border-slate-700/20">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">Editando Campo</h4>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Label (pergunta)</Label>
                    <Input
                        value={field.label}
                        onChange={e => handleLabelChange(e.target.value)}
                        className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Tipo de resposta</Label>
                    <Select value={field.type} onValueChange={v => update('type', v)}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">Texto livre</SelectItem>
                            <SelectItem value="textarea">Área de texto</SelectItem>
                            <SelectItem value="select">Seletor (dropdown)</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="time">Hora</SelectItem>
                            <SelectItem value="photo">Upload de foto</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs flex items-center gap-1">
                        Chave no banco <span className="text-emerald-400 text-[9px]">(auto-gerado)</span>
                    </Label>
                    <Input
                        value={field.field}
                        onChange={e => update('field', e.target.value)}
                        className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9 font-mono"
                        placeholder="ex: restricao_alimentar"
                    />
                    <p className="text-[9px] text-slate-600">Gerado automaticamente do label. Edite se necessário.</p>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Salvar em</Label>
                    <Select value={field.targetField} onValueChange={v => update('targetField', v)}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="anamnese">
                                <div className="flex flex-col">
                                    <span>Anamnese (JSON)</span>
                                    <span className="text-[10px] text-slate-500">Maioria dos campos — dados flexíveis</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="form">
                                <div className="flex flex-col">
                                    <span>Paciente (campo fixo)</span>
                                    <span className="text-[10px] text-slate-500">Apenas: nome, telefone, email, peso, altura...</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-[9px] text-slate-600">
                        {field.targetField === 'form'
                            ? '⚠️ Campos fixos do cadastro do paciente (nome, telefone, etc.)'
                            : '✅ Padrão: salva no JSON da anamnese'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Placeholder</Label>
                    <Input
                        value={field.placeholder || ''}
                        onChange={e => update('placeholder', e.target.value || undefined)}
                        className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"
                        placeholder="Texto de exemplo"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Colunas no grid (1-4)</Label>
                    <Select value={String(field.gridCols || '')} onValueChange={v => update('gridCols', v ? Number(v) : undefined)}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white h-9 text-sm">
                            <SelectValue placeholder="Auto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Auto (largura total)</SelectItem>
                            <SelectItem value="2">2 colunas</SelectItem>
                            <SelectItem value="3">3 colunas</SelectItem>
                            <SelectItem value="4">4 colunas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Label className="text-slate-400 text-xs">Obrigatório</Label>
                <Switch checked={field.required} onCheckedChange={v => update('required', v)} />
            </div>

            <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Ícone (emoji)</Label>
                <Input
                    value={field.icon || ''}
                    onChange={e => update('icon', e.target.value || undefined)}
                    className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9 w-24"
                    placeholder="👤"
                />
            </div>

            {/* Opções para select */}
            {field.type === 'select' && (
                <div className="space-y-2 border-t border-slate-700/30 pt-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-400 text-xs">Opções do seletor</Label>
                        <Button size="sm" variant="ghost" onClick={() => update('options', [...(field.options || []), ''])} className="h-6 text-xs text-slate-400">
                            <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                    </div>
                    {(field.options || []).map((opt, i) => (
                        <div key={i} className="flex gap-2">
                            <Input
                                value={opt}
                                onChange={e => {
                                    const opts = [...(field.options || [])];
                                    opts[i] = e.target.value;
                                    update('options', opts);
                                }}
                                className="flex-1 bg-slate-800/50 border-slate-700/50 text-white text-sm h-8"
                            />
                            <Button size="sm" variant="ghost" onClick={() => update('options', (field.options || []).filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 h-8">
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Condição de exibição */}
            <div className="space-y-2 border-t border-slate-700/30 pt-3">
                <Label className="text-slate-400 text-xs">Mostrar apenas se (condicional)</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        value={field.showIf?.field || ''}
                        onChange={e => update('showIf', e.target.value ? { field: e.target.value, value: field.showIf?.value || '' } : undefined)}
                        className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-8"
                        placeholder="Campo (ex: genero)"
                    />
                    <Input
                        value={field.showIf?.value || ''}
                        onChange={e => update('showIf', field.showIf?.field ? { ...field.showIf, value: e.target.value } : undefined)}
                        className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-8"
                        placeholder="Valor (ex: Feminino)"
                    />
                </div>
                {field.showIf && (
                    <Button size="sm" variant="ghost" onClick={() => update('showIf', undefined)} className="h-6 text-xs text-red-400">
                        Remover condição
                    </Button>
                )}
            </div>
        </div>
    );
}

// ==================== MAIN EDITOR ====================

export function AnamnesisFlowEditor() {
    const { toast } = useToast();
    const [flows, setFlows] = useState<AnamnesisFlowConfig[]>([]);
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editedFlow, setEditedFlow] = useState<AnamnesisFlowStep[]>([]);
    const [editedTheme, setEditedTheme] = useState<AnamnesisFlowTheme>(DEFAULT_ANAMNESIS_THEME);
    const [editedName, setEditedName] = useState('');
    const [editedFinalMessage, setEditedFinalMessage] = useState<FinalMessageConfig>(DEFAULT_FINAL_MESSAGE);
    const [editedTermsUrl, setEditedTermsUrl] = useState(DEFAULT_TERMS_URL);
    const [editedTermsText, setEditedTermsText] = useState(DEFAULT_TERMS_TEXT);
    const [activeTab, setActiveTab] = useState<'sections' | 'theme' | 'final' | 'terms'>('sections');
    const [hasChanges, setHasChanges] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => { loadFlows(); }, []);

    const loadFlows = async () => {
        try {
            setLoading(true);
            let data = await anamnesisFlowService.getMyFlows();

            // Auto-criar fluxo padrão ativo se o nutri não tem nenhum
            if (data.length === 0) {
                try {
                    const defaultFlow = await anamnesisFlowService.createFlow('Anamnese Padrão', { fromTemplate: true });
                    await anamnesisFlowService.activateFlow(defaultFlow.id);
                    data = await anamnesisFlowService.getMyFlows();
                    toast({ title: '🎉 Pronto!', description: 'Sua anamnese padrão foi criada e ativada automaticamente. Você já pode editá-la!' });
                } catch (autoErr) {
                    console.warn('Não foi possível criar fluxo padrão:', autoErr);
                }
            }

            setFlows(data);
            if (data.length > 0 && !selectedFlowId) selectFlow(data[0]);
        } catch (error) {
            console.error('Erro ao carregar fluxos:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectFlow = (flow: AnamnesisFlowConfig) => {
        setSelectedFlowId(flow.id);
        setEditedFlow(JSON.parse(JSON.stringify(flow.flow)));
        setEditedTheme({ ...DEFAULT_ANAMNESIS_THEME, ...flow.theme });
        setEditedName(flow.name);
        setEditedFinalMessage({ ...DEFAULT_FINAL_MESSAGE, ...flow.final_message });
        setEditedTermsUrl(flow.terms_url || DEFAULT_TERMS_URL);
        setEditedTermsText(flow.terms_text || DEFAULT_TERMS_TEXT);
        setSelectedStepId(flow.flow[0]?.id || null);
        setSelectedFieldId(null);
        setHasChanges(false);
    };

    const handleCreateFromModel = async () => {
        try {
            const newFlow = await anamnesisFlowService.createFlow('Anamnese (modelo)', { fromTemplate: true });
            setFlows(prev => [newFlow, ...prev]);
            selectFlow(newFlow);
            toast({ title: 'Fluxo criado a partir do modelo!' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const handleCreateEmpty = async () => {
        try {
            const newFlow = await anamnesisFlowService.createFlow('Nova Anamnese', { fromTemplate: false });
            setFlows(prev => [newFlow, ...prev]);
            selectFlow(newFlow);
            toast({ title: 'Fluxo em branco criado!' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const handleDuplicateFlow = async (flowId: string) => {
        try {
            const newFlow = await anamnesisFlowService.duplicateFlow(flowId);
            setFlows(prev => [newFlow, ...prev]);
            selectFlow(newFlow);
            toast({ title: 'Fluxo duplicado!' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const handleDeleteFlow = async (flowId: string) => {
        if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;
        try {
            await anamnesisFlowService.deleteFlow(flowId);
            setFlows(prev => prev.filter(f => f.id !== flowId));
            if (selectedFlowId === flowId) {
                setSelectedFlowId(null);
                setEditedFlow([]);
            }
            toast({ title: 'Fluxo excluído!' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const handleToggleActive = async (flowId: string, isActive: boolean) => {
        try {
            if (isActive) {
                await anamnesisFlowService.deactivateFlow(flowId);
            } else {
                await anamnesisFlowService.activateFlow(flowId);
            }
            await loadFlows();
            toast({ title: isActive ? 'Fluxo desativado' : 'Fluxo ativado!' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const handleSave = async () => {
        if (!selectedFlowId) return;
        setSaving(true);
        try {
            await anamnesisFlowService.updateFlow(selectedFlowId, {
                name: editedName,
                flow: editedFlow,
                theme: editedTheme,
                final_message: editedFinalMessage,
                terms_url: editedTermsUrl,
                terms_text: editedTermsText,
            });
            setHasChanges(false);
            await loadFlows();
            toast({ title: 'Salvo com sucesso!' });
        } catch (error: any) {
            toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Section management
    const handleAddSection = () => {
        const newStep: AnamnesisFlowStep = {
            id: `section_${Date.now()}`,
            sectionTitle: 'Nova Seção',
            sectionEmoji: '📋',
            fields: [],
        };
        setEditedFlow(prev => [...prev, newStep]);
        setSelectedStepId(newStep.id);
        setSelectedFieldId(null);
        setHasChanges(true);
    };

    const handleDeleteSection = (stepId: string) => {
        if (!confirm('Excluir esta seção e todos os seus campos?')) return;
        setEditedFlow(prev => prev.filter(s => s.id !== stepId));
        if (selectedStepId === stepId) {
            setSelectedStepId(null);
            setSelectedFieldId(null);
        }
        setHasChanges(true);
    };

    const handleSectionReorder = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = editedFlow.findIndex(s => s.id === active.id);
            const newIndex = editedFlow.findIndex(s => s.id === over.id);
            setEditedFlow(arrayMove(editedFlow, oldIndex, newIndex));
            setHasChanges(true);
        }
    };

    // Field management within a section
    const selectedSection = editedFlow.find(s => s.id === selectedStepId);
    const selectedField = selectedSection?.fields.find(f => f.id === selectedFieldId);

    const handleAddField = () => {
        if (!selectedStepId) return;
        const newField: AnamnesisFieldDef = {
            id: `field_${Date.now()}`,
            type: 'text',
            label: 'Novo Campo',
            placeholder: '',
            required: false,
            field: `campo_${Date.now()}`,
            targetField: 'anamnese',
        };
        setEditedFlow(prev => prev.map(s =>
            s.id === selectedStepId ? { ...s, fields: [...s.fields, newField] } : s
        ));
        setSelectedFieldId(newField.id);
        setHasChanges(true);
    };

    const handleDuplicateField = (fieldId: string) => {
        if (!selectedStepId || !selectedSection) return;
        const original = selectedSection.fields.find(f => f.id === fieldId);
        if (!original) return;
        const newField: AnamnesisFieldDef = {
            ...original,
            id: `field_${Date.now()}`,
            label: `${original.label} (cópia)`,
            field: `${original.field}_copy`,
        };
        setEditedFlow(prev => prev.map(s =>
            s.id === selectedStepId ? { ...s, fields: [...s.fields, newField] } : s
        ));
        setSelectedFieldId(newField.id);
        setHasChanges(true);
    };

    const handleDeleteField = (fieldId: string) => {
        if (!selectedStepId) return;
        setEditedFlow(prev => prev.map(s =>
            s.id === selectedStepId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s
        ));
        if (selectedFieldId === fieldId) setSelectedFieldId(null);
        setHasChanges(true);
    };

    const handleFieldChange = (updated: AnamnesisFieldDef) => {
        if (!selectedStepId) return;
        setEditedFlow(prev => prev.map(s =>
            s.id === selectedStepId ? { ...s, fields: s.fields.map(f => f.id === updated.id ? updated : f) } : s
        ));
        setHasChanges(true);
    };

    const handleFieldReorder = (event: DragEndEvent) => {
        if (!selectedStepId || !selectedSection) return;
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = selectedSection.fields.findIndex(f => f.id === active.id);
            const newIndex = selectedSection.fields.findIndex(f => f.id === over.id);
            setEditedFlow(prev => prev.map(s =>
                s.id === selectedStepId ? { ...s, fields: arrayMove(s.fields, oldIndex, newIndex) } : s
            ));
            setHasChanges(true);
        }
    };

    const handleThemeChange = (key: keyof AnamnesisFlowTheme, value: string) => {
        setEditedTheme(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSectionTitleChange = (stepId: string, title: string) => {
        setEditedFlow(prev => prev.map(s => s.id === stepId ? { ...s, sectionTitle: title } : s));
        setHasChanges(true);
    };

    const handleSectionEmojiChange = (stepId: string, emoji: string) => {
        setEditedFlow(prev => prev.map(s => s.id === stepId ? { ...s, sectionEmoji: emoji } : s));
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Lista de Fluxos */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm">Seus Fluxos de Anamnese</CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Novo Fluxo <ChevronDown className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-64">
                                <DropdownMenuItem onClick={handleCreateFromModel} className="text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer">
                                    <LayoutTemplate className="w-4 h-4 mr-2 text-blue-400" />
                                    <div className="flex flex-col items-start">
                                        <span>A partir do modelo</span>
                                        <span className="text-xs text-slate-500">Anamnese completa com todos os campos atuais</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCreateEmpty} className="text-slate-200 focus:bg-slate-700 focus:text-white cursor-pointer">
                                    <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                    <div className="flex flex-col items-start">
                                        <span>Em branco</span>
                                        <span className="text-xs text-slate-500">Começar do zero e montar as seções</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    {flows.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400 mb-3">Nenhum fluxo de anamnese criado ainda.</p>
                            <p className="text-slate-500 text-sm">Clique em <strong className="text-slate-400">Novo Fluxo</strong> para começar.</p>
                            <p className="text-slate-600 text-xs mt-3">Enquanto não tiver um fluxo ativo, será usado o formulário padrão do sistema.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {flows.map(flow => (
                                <div
                                    key={flow.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedFlowId === flow.id
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                                        }`}
                                    onClick={() => { const f = flows.find(x => x.id === flow.id); if (f) selectFlow(f); }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium text-sm truncate">{flow.name}</span>
                                            {flow.is_active && (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Ativo</Badge>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-xs">{flow.flow.length} seções</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleToggleActive(flow.id, flow.is_active); }} className="h-7 w-7 p-0" title={flow.is_active ? 'Desativar' : 'Ativar'}>
                                            {flow.is_active ? <Power className="w-3.5 h-3.5 text-emerald-400" /> : <PowerOff className="w-3.5 h-3.5 text-slate-500" />}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDuplicateFlow(flow.id); }} className="h-7 w-7 p-0" title="Duplicar">
                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteFlow(flow.id); }} className="h-7 w-7 p-0" title="Excluir">
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Editor */}
            {selectedFlowId && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Input
                                    value={editedName}
                                    onChange={e => { setEditedName(e.target.value); setHasChanges(true); }}
                                    className="bg-slate-800/50 border-slate-700/50 text-white font-semibold text-sm h-9 max-w-xs"
                                />
                                {hasChanges && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">Alterações não salvas</Badge>}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <div className="flex bg-slate-900/50 rounded-lg p-0.5 gap-0.5">
                                    {[
                                        { key: 'sections', label: 'Seções' },
                                        { key: 'theme', label: 'Tema', icon: Palette },
                                        { key: 'final', label: 'Mensagem Final', icon: MessageSquare },
                                        { key: 'terms', label: 'Termo', icon: Link2 },
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key as any)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab.key ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {tab.icon && <tab.icon className="w-3.5 h-3.5 inline mr-1" />}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* ===== SEÇÕES TAB ===== */}
                        {activeTab === 'sections' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Coluna 1: Lista de seções */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-semibold text-sm">Seções ({editedFlow.length})</h3>
                                        <Button size="sm" variant="outline" onClick={handleAddSection} className="h-7 text-xs border-slate-600 text-slate-300">
                                            <Plus className="w-3 h-3 mr-1" /> Nova Seção
                                        </Button>
                                    </div>
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionReorder}>
                                        <SortableContext items={editedFlow.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                                                {editedFlow.map(step => (
                                                    <SortableSection
                                                        key={step.id}
                                                        step={step}
                                                        isSelected={selectedStepId === step.id}
                                                        onSelect={() => { setSelectedStepId(step.id); setSelectedFieldId(null); }}
                                                        onDelete={() => handleDeleteSection(step.id)}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </div>

                                {/* Coluna 2: Campos da seção selecionada */}
                                <div className="space-y-2">
                                    {selectedSection ? (
                                        <>
                                            {/* Editar título/emoji da seção */}
                                            <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-700/20 space-y-2 mb-3">
                                                <div className="grid grid-cols-[60px_1fr] gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-slate-500 text-[10px]">Emoji</Label>
                                                        <Input
                                                            value={selectedSection.sectionEmoji}
                                                            onChange={e => handleSectionEmojiChange(selectedSection.id, e.target.value)}
                                                            className="bg-slate-800/50 border-slate-700/50 text-white h-8 text-center text-lg"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-slate-500 text-[10px]">Título da Seção</Label>
                                                        <Input
                                                            value={selectedSection.sectionTitle}
                                                            onChange={e => handleSectionTitleChange(selectedSection.id, e.target.value)}
                                                            className="bg-slate-800/50 border-slate-700/50 text-white h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-white font-semibold text-sm">Campos ({selectedSection.fields.length})</h3>
                                                <div className="flex gap-1">
                                                    {selectedFieldId && (
                                                        <Button size="sm" variant="ghost" onClick={() => handleDuplicateField(selectedFieldId)} className="h-7 text-xs text-slate-400" title="Duplicar campo">
                                                            <Copy className="w-3 h-3 mr-1" /> Duplicar
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="outline" onClick={handleAddField} className="h-7 text-xs border-slate-600 text-slate-300">
                                                        <Plus className="w-3 h-3 mr-1" /> Novo Campo
                                                    </Button>
                                                </div>
                                            </div>
                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldReorder}>
                                                <SortableContext items={selectedSection.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                                    <div className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
                                                        {selectedSection.fields.map(field => (
                                                            <SortableField
                                                                key={field.id}
                                                                field={field}
                                                                isSelected={selectedFieldId === field.id}
                                                                onSelect={() => setSelectedFieldId(field.id)}
                                                                onDelete={() => handleDeleteField(field.id)}
                                                            />
                                                        ))}
                                                    </div>
                                                </SortableContext>
                                            </DndContext>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                                            Selecione uma seção para ver seus campos
                                        </div>
                                    )}
                                </div>

                                {/* Coluna 3: Editor do campo selecionado */}
                                <div>
                                    {selectedField ? (
                                        <FieldEditor field={selectedField} onChange={handleFieldChange} />
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                                            Selecione um campo para editar
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===== TEMA TAB ===== */}
                        {activeTab === 'theme' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-white font-semibold text-sm">Cores do Formulário</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'bg_gradient_from', label: 'Fundo (início)' },
                                            { key: 'bg_gradient_via', label: 'Fundo (meio)' },
                                            { key: 'bg_gradient_to', label: 'Fundo (fim)' },
                                            { key: 'card_bg', label: 'Card (fundo)' },
                                            { key: 'card_border', label: 'Card (borda)' },
                                            { key: 'text_primary', label: 'Texto primário' },
                                            { key: 'text_secondary', label: 'Texto secundário' },
                                            { key: 'text_muted', label: 'Texto discreto' },
                                            { key: 'input_bg', label: 'Input (fundo)' },
                                            { key: 'input_border', label: 'Input (borda)' },
                                            { key: 'input_text', label: 'Input (texto)' },
                                            { key: 'accent_color', label: 'Cor destaque' },
                                            { key: 'button_bg', label: 'Botão (fundo)' },
                                            { key: 'button_text', label: 'Botão (texto)' },
                                            { key: 'progress_from', label: 'Progresso (início)' },
                                            { key: 'progress_to', label: 'Progresso (fim)' },
                                        ].map(({ key, label }) => (
                                            <div key={key} className="space-y-1">
                                                <Label className="text-slate-500 text-[10px]">{label}</Label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={editedTheme[key as keyof AnamnesisFlowTheme]?.replace(/rgba?\([^)]+\)/, '#334155') || '#334155'}
                                                        onChange={e => handleThemeChange(key as keyof AnamnesisFlowTheme, e.target.value)}
                                                        className="w-8 h-8 rounded-lg border border-slate-600 cursor-pointer bg-transparent"
                                                    />
                                                    <Input
                                                        value={editedTheme[key as keyof AnamnesisFlowTheme] || ''}
                                                        onChange={e => handleThemeChange(key as keyof AnamnesisFlowTheme, e.target.value)}
                                                        className="flex-1 bg-slate-800/50 border-slate-700/50 text-white text-[10px] h-8 font-mono"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => { setEditedTheme(DEFAULT_ANAMNESIS_THEME); setHasChanges(true); }} className="text-xs text-slate-400">
                                        <RefreshCw className="w-3 h-3 mr-1" /> Resetar para padrão
                                    </Button>
                                </div>

                                {/* Preview ao vivo do tema */}
                                <div className="space-y-3">
                                    <h4 className="text-slate-400 text-xs">Preview ao Vivo</h4>
                                    <div
                                        className="rounded-2xl p-6 border transition-all"
                                        style={{
                                            background: `linear-gradient(135deg, ${editedTheme.bg_gradient_from}, ${editedTheme.bg_gradient_via}, ${editedTheme.bg_gradient_to})`,
                                            borderColor: editedTheme.card_border,
                                        }}
                                    >
                                        {/* Mini progress bar */}
                                        <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: editedTheme.card_bg }}>
                                            <div className="h-full w-3/5 rounded-full" style={{ background: `linear-gradient(to right, ${editedTheme.progress_from}, ${editedTheme.progress_to})` }} />
                                        </div>

                                        {/* Mini card */}
                                        <div
                                            className="rounded-xl p-4 space-y-3 mb-4"
                                            style={{ background: editedTheme.card_bg, borderColor: editedTheme.card_border, border: `1px solid ${editedTheme.card_border}` }}
                                        >
                                            <p className="text-sm font-semibold" style={{ color: editedTheme.text_primary }}>📋 Dados Pessoais</p>
                                            <p className="text-xs" style={{ color: editedTheme.text_secondary }}>Preencha seus dados abaixo:</p>

                                            {/* Mini input */}
                                            <div className="space-y-1">
                                                <p className="text-[10px]" style={{ color: editedTheme.text_muted }}>Nome Completo</p>
                                                <div
                                                    className="rounded-lg h-8 px-3 flex items-center text-xs"
                                                    style={{ background: editedTheme.input_bg, border: `1px solid ${editedTheme.input_border}`, color: editedTheme.input_text }}
                                                >
                                                    João Silva
                                                </div>
                                            </div>

                                            {/* Mini input 2 */}
                                            <div className="space-y-1">
                                                <p className="text-[10px]" style={{ color: editedTheme.text_muted }}>Email</p>
                                                <div
                                                    className="rounded-lg h-8 px-3 flex items-center text-xs"
                                                    style={{ background: editedTheme.input_bg, border: `1px solid ${editedTheme.input_border}`, color: editedTheme.input_text }}
                                                >
                                                    joao@email.com
                                                </div>
                                            </div>

                                            {/* Accent text */}
                                            <p className="text-[10px]" style={{ color: editedTheme.accent_color }}>* Campo obrigatório</p>
                                        </div>

                                        {/* Mini button */}
                                        <button
                                            className="w-full rounded-lg h-9 text-xs font-semibold"
                                            style={{ background: editedTheme.button_bg, color: editedTheme.button_text }}
                                        >
                                            Avançar →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ===== MENSAGEM FINAL TAB ===== */}
                        {activeTab === 'final' && (
                            <div className="space-y-4 max-w-2xl">
                                <h3 className="text-white font-semibold text-sm">Mensagem de Sucesso (após envio)</h3>
                                <p className="text-slate-500 text-xs">Esta mensagem aparece para o paciente após ele enviar a anamnese com sucesso.</p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-400 text-xs">Título</Label>
                                        <Input
                                            value={editedFinalMessage.title}
                                            onChange={e => { setEditedFinalMessage(prev => ({ ...prev, title: e.target.value })); setHasChanges(true); }}
                                            className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"
                                            placeholder="Anamnese enviada!"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-400 text-xs">Subtítulo / Descrição</Label>
                                        <Textarea
                                            value={editedFinalMessage.subtitle}
                                            onChange={e => { setEditedFinalMessage(prev => ({ ...prev, subtitle: e.target.value })); setHasChanges(true); }}
                                            className="bg-slate-800/50 border-slate-700/50 text-white text-sm resize-none"
                                            rows={3}
                                            placeholder="Seus dados foram enviados com sucesso..."
                                        />
                                        <p className="text-[10px] text-slate-600">Use **texto** para negrito.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-400 text-xs">Rodapé / Frase motivacional</Label>
                                        <Input
                                            value={editedFinalMessage.footer}
                                            onChange={e => { setEditedFinalMessage(prev => ({ ...prev, footer: e.target.value })); setHasChanges(true); }}
                                            className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9"
                                            placeholder="Tenho certeza que você terá ótimos resultados! 🎯"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-6">
                                    <h4 className="text-slate-400 text-xs mb-3">Preview</h4>
                                    <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 rounded-2xl p-8 text-center border border-slate-700/30">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-2xl">✅</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{editedFinalMessage.title || 'Anamnese enviada!'}</h2>
                                        <p className="text-slate-300 text-sm mb-1"
                                            dangerouslySetInnerHTML={{
                                                __html: (editedFinalMessage.subtitle || '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-400 font-bold">$1</strong>').replace(/\n/g, '<br />')
                                            }}
                                        />
                                        <div className="mt-6 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                            <p className="text-slate-500/80 text-xs">{editedFinalMessage.footer}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ===== TERMOS TAB ===== */}
                        {activeTab === 'terms' && (
                            <div className="space-y-4 max-w-2xl">
                                <h3 className="text-white font-semibold text-sm">Termo de Adesão</h3>
                                <p className="text-slate-500 text-xs">Configure o link e o texto do termo de adesão que aparece na última etapa do formulário.</p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-400 text-xs">Link do Termo (URL)</Label>
                                        <Input
                                            value={editedTermsUrl}
                                            onChange={e => { setEditedTermsUrl(e.target.value); setHasChanges(true); }}
                                            className="bg-slate-800/50 border-slate-700/50 text-white text-sm h-9 font-mono"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-400 text-xs">Texto Explicativo (acima do checkbox)</Label>
                                        <Textarea
                                            value={editedTermsText}
                                            onChange={e => { setEditedTermsText(e.target.value); setHasChanges(true); }}
                                            className="bg-slate-800/50 border-slate-700/50 text-white text-sm resize-none"
                                            rows={4}
                                            placeholder="Texto que aparece antes do link e checkbox do termo..."
                                        />
                                        <p className="text-[10px] text-slate-600">Use **texto** para negrito.</p>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-6">
                                    <h4 className="text-slate-400 text-xs mb-3">Preview</h4>
                                    <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                                        <h3 className="text-white font-semibold flex items-center gap-2">📝 Termo de Adesão ao Acompanhamento</h3>
                                        <p className="text-slate-300 text-sm leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: (editedTermsText || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')
                                            }}
                                        />
                                        <a href={editedTermsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline text-sm">
                                            Clique aqui para ler o termo completo
                                        </a>
                                        <div className="flex items-center space-x-3 pt-2">
                                            <input type="checkbox" disabled className="w-5 h-5 rounded border-slate-500 bg-slate-700" />
                                            <span className="text-slate-300 text-sm">Declaro que li e concordo com os termos.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
