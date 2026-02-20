import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import { Loader2, Plus, Save, Trash2, CheckCircle, Edit2, Utensils, Info } from 'lucide-react';
import { useDietAdjustmentTemplates } from '../../hooks/use-diet-adjustment-templates';
import { DEFAULT_DIET_ADJUSTMENT_PROMPT } from '../../lib/diet-ai-adjustment-service';
import type { DietAdjustmentPromptTemplate } from '../../lib/diet-ai-adjustment-service';
import { toast } from 'sonner';

export const DietAdjustmentPromptEditor: React.FC = () => {
    const {
        templates,
        activeTemplate,
        loading,
        saveTemplate,
        setTemplateActive,
        deleteTemplate,
        refreshTemplates,
    } = useDietAdjustmentTemplates();

    const [editingTemplate, setEditingTemplate] = useState<Partial<DietAdjustmentPromptTemplate> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showVariables, setShowVariables] = useState(false);

    const availableVariables = [
        { name: '{patientName}', desc: 'Nome do paciente' },
        { name: '{checkinData}', desc: 'Dados completos do check-in formatados' },
        { name: '{currentDiet}', desc: 'Dieta atual com refeições, alimentos e macros' },
        { name: '{evolutionData}', desc: 'Comparação com check-in anterior (peso, medidas)' },
        { name: '{objetivo}', desc: 'Objetivo do paciente (emagrecimento, hipertrofia, etc.)' },
        { name: '{fome_horario}', desc: 'Horário em que sente fome' },
        { name: '{alimento_incluir}', desc: 'Alimento que deseja incluir na dieta' },
    ];

    const handleNewTemplate = () => {
        setEditingTemplate({
            name: '',
            description: '',
            prompt_template: DEFAULT_DIET_ADJUSTMENT_PROMPT,
            ai_model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            temperature: 0.3,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (template: DietAdjustmentPromptTemplate) => {
        setEditingTemplate({ ...template });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingTemplate?.name || !editingTemplate?.prompt_template) {
            toast.error('Nome e prompt são obrigatórios');
            return;
        }

        setIsSaving(true);
        try {
            const result = await saveTemplate({
                ...editingTemplate,
                name: editingTemplate.name!,
                prompt_template: editingTemplate.prompt_template!,
            });

            if (result) {
                toast.success('Template salvo com sucesso!');
                setIsModalOpen(false);
                setEditingTemplate(null);
            } else {
                toast.error('Erro ao salvar template');
            }
        } catch (error) {
            toast.error('Erro ao salvar template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleActivate = async (templateId: string) => {
        const success = await setTemplateActive(templateId);
        if (success) {
            toast.success('Template ativado!');
        } else {
            toast.error('Erro ao ativar template');
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('Deseja realmente excluir este template?')) return;

        const success = await deleteTemplate(templateId);
        if (success) {
            toast.success('Template excluído');
        } else {
            toast.error('Erro ao excluir template');
        }
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-400" />
                        <CardTitle className="text-sm text-slate-200">
                            Prompts de Ajuste de Dieta IA
                        </CardTitle>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNewTemplate}
                        className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Novo
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-slate-400 text-xs mb-2">Nenhum template criado.</p>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleNewTemplate}
                            className="text-emerald-400 hover:text-emerald-300 text-xs"
                        >
                            Criar primeiro template
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {templates.map((t) => (
                            <div
                                key={t.id}
                                className={`flex items-center justify-between p-2 rounded-lg border ${t.is_active
                                        ? 'bg-emerald-900/20 border-emerald-700/50'
                                        : 'bg-slate-800/30 border-slate-700/30'
                                    }`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-sm text-slate-200 truncate">{t.name}</span>
                                    {t.is_active && (
                                        <Badge className="bg-emerald-600/30 text-emerald-300 text-[10px] px-1.5 border-0">
                                            Ativo
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {!t.is_active && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleActivate(t.id)}
                                            className="h-6 w-6 p-0 text-slate-400 hover:text-emerald-400"
                                            title="Ativar"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(t)}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-blue-400"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(t.id)}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Edit/Create Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100">
                            {editingTemplate?.id ? 'Editar Template' : 'Novo Template de Ajuste'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-slate-300 text-xs">Nome</Label>
                                <Input
                                    value={editingTemplate?.name || ''}
                                    onChange={(e) =>
                                        setEditingTemplate((prev) => ({ ...prev!, name: e.target.value }))
                                    }
                                    placeholder="Ex: Ajuste Hipertrofia v1"
                                    className="bg-slate-800 border-slate-700 text-slate-200 text-sm"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-xs">Descrição (opcional)</Label>
                                <Input
                                    value={editingTemplate?.description || ''}
                                    onChange={(e) =>
                                        setEditingTemplate((prev) => ({ ...prev!, description: e.target.value }))
                                    }
                                    placeholder="Breve descrição do template"
                                    className="bg-slate-800 border-slate-700 text-slate-200 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="text-slate-300 text-xs">Modelo AI</Label>
                                <Input
                                    value={editingTemplate?.ai_model || ''}
                                    onChange={(e) =>
                                        setEditingTemplate((prev) => ({ ...prev!, ai_model: e.target.value }))
                                    }
                                    className="bg-slate-800 border-slate-700 text-slate-200 text-xs"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-xs">Max Tokens</Label>
                                <Input
                                    type="number"
                                    value={editingTemplate?.max_tokens || 4096}
                                    onChange={(e) =>
                                        setEditingTemplate((prev) => ({ ...prev!, max_tokens: parseInt(e.target.value) || 4096 }))
                                    }
                                    className="bg-slate-800 border-slate-700 text-slate-200 text-xs"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-xs">Temperature</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    value={editingTemplate?.temperature || 0.3}
                                    onChange={(e) =>
                                        setEditingTemplate((prev) => ({ ...prev!, temperature: parseFloat(e.target.value) || 0.3 }))
                                    }
                                    className="bg-slate-800 border-slate-700 text-slate-200 text-xs"
                                />
                            </div>
                        </div>

                        {/* Variables info */}
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowVariables(!showVariables)}
                                className="text-blue-400 text-xs h-6 px-2 mb-1"
                            >
                                <Info className="w-3 h-3 mr-1" />
                                Variáveis disponíveis {showVariables ? '▲' : '▼'}
                            </Button>
                            {showVariables && (
                                <div className="bg-slate-800/80 rounded-lg p-2 text-xs space-y-0.5">
                                    {availableVariables.map((v) => (
                                        <div key={v.name} className="flex gap-2">
                                            <code className="text-emerald-400 font-mono">{v.name}</code>
                                            <span className="text-slate-400">— {v.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label className="text-slate-300 text-xs">Prompt Template</Label>
                            <Textarea
                                value={editingTemplate?.prompt_template || ''}
                                onChange={(e) =>
                                    setEditingTemplate((prev) => ({ ...prev!, prompt_template: e.target.value }))
                                }
                                rows={18}
                                className="bg-slate-800 border-slate-700 text-slate-200 font-mono text-xs leading-relaxed"
                                placeholder="Escreva o prompt para a IA..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="text-slate-400"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
