import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import {
    Loader2,
    CheckCircle,
    XCircle,
    RefreshCw,
    ArrowRight,
    Utensils,
    TrendingUp,
    TrendingDown,
    Minus,
    Copy,
    ExternalLink,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    dietAIAdjustmentService,
    type DietAdjustmentResult,
    type AIAdjustmentResponse,
} from '../../lib/diet-ai-adjustment-service';
import { useDietAdjustmentTemplates } from '../../hooks/use-diet-adjustment-templates';
import { dietService } from '../../lib/diet-service';

interface DietAdjustmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkinId: string;
    patientId: string;
    checkinData: any;
    evolutionData: any;
    patientName: string;
    onAdjustmentComplete?: () => void;
}

export const DietAdjustmentModal: React.FC<DietAdjustmentModalProps> = ({
    open,
    onOpenChange,
    checkinId,
    patientId,
    checkinData,
    evolutionData,
    patientName,
    onAdjustmentComplete,
}) => {
    const [adjustment, setAdjustment] = useState<DietAdjustmentResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [editableFeedback, setEditableFeedback] = useState('');
    const [originalDiet, setOriginalDiet] = useState<any>(null);
    const [suggestedDiet, setSuggestedDiet] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const { activeTemplate } = useDietAdjustmentTemplates();

    // Check for existing adjustment when modal opens
    useEffect(() => {
        if (open && checkinId) {
            checkExistingAdjustment();
        }
    }, [open, checkinId]);

    const checkExistingAdjustment = async () => {
        try {
            const existing = await dietAIAdjustmentService.getAdjustmentForCheckin(checkinId);
            if (existing) {
                setAdjustment(existing);
                setEditableFeedback(existing.feedbackText || '');
                await loadDietData(existing.originalPlanId, existing.suggestedPlanId);
            }
        } catch (err) {
            console.error('Erro ao checar ajuste existente:', err);
        }
    };

    const loadDietData = async (originalId: string, suggestedId: string) => {
        try {
            const [original, suggested] = await Promise.all([
                dietService.getById(originalId),
                dietService.getById(suggestedId),
            ]);
            setOriginalDiet(original);
            setSuggestedDiet(suggested);
        } catch (err) {
            console.error('Erro ao carregar dietas:', err);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const result = await dietAIAdjustmentService.analyzeAndSuggest(
                checkinId,
                patientId,
                checkinData,
                evolutionData,
                patientName,
                activeTemplate || undefined
            );
            setAdjustment(result);
            setEditableFeedback(result.feedbackText || '');
            await loadDietData(result.originalPlanId, result.suggestedPlanId);
            toast.success('Análise IA concluída!');
        } catch (err: any) {
            const msg = err?.message || 'Erro ao gerar ajuste';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApprove = async (activateDiet: boolean = false) => {
        if (!adjustment) return;
        setIsApproving(true);
        try {
            if (editableFeedback !== adjustment.feedbackText) {
                await dietAIAdjustmentService.updateFeedbackText(adjustment.id, editableFeedback);
            }
            await dietAIAdjustmentService.approveAdjustment(adjustment.id, activateDiet);
            setAdjustment({ ...adjustment, status: 'approved' });
            toast.success(activateDiet ? 'Dieta aprovada e ativada!' : 'Ajuste aprovado!');
            onAdjustmentComplete?.();
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao aprovar');
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!adjustment) return;
        try {
            await dietAIAdjustmentService.rejectAdjustment(adjustment.id);
            setAdjustment({ ...adjustment, status: 'rejected' });
            toast.info('Ajuste rejeitado');
        } catch (err: any) {
            toast.error('Erro ao rejeitar');
        }
    };

    const handleRegenerate = async () => {
        setAdjustment(null);
        setOriginalDiet(null);
        setSuggestedDiet(null);
        setEditableFeedback('');
        await handleGenerate();
    };

    const handleCopyFeedback = async () => {
        try {
            await navigator.clipboard.writeText(editableFeedback);
            toast.success('Feedback copiado!');
        } catch {
            toast.error('Erro ao copiar');
        }
    };

    const aiResponse = adjustment?.rawAiResponse as AIAdjustmentResponse | undefined;

    // Normalize text for fuzzy matching (lowercase, remove accents)
    const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Macro change helper
    const MacroChange: React.FC<{ label: string; data: { old: number; new: number; reason: string } }> = ({ label, data }) => {
        const diff = data.new - data.old;
        const isIncrease = diff > 0;
        const isDecrease = diff < 0;

        return (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0">
                <span className="text-slate-300 text-xs font-medium">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">{data.old}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className={`text-xs font-semibold ${isIncrease ? 'text-green-400' : isDecrease ? 'text-red-400' : 'text-slate-300'}`}>
                        {data.new}
                    </span>
                    {diff !== 0 && (
                        <Badge className={`text-[10px] px-1 border-0 ${isIncrease ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {isIncrease ? '+' : ''}{diff}
                        </Badge>
                    )}
                </div>
            </div>
        );
    };

    // Render diet meals comparison
    const renderMealComparison = (meals: any[], side: 'original' | 'suggested') => {
        if (!meals?.length) return <p className="text-slate-500 text-xs italic">Sem refeições</p>;

        return meals.map((meal: any, idx: number) => {
            const isModified = side === 'suggested' && aiResponse?.adjustments?.some(
                a => {
                    const normalizedMealName = normalizeText(a.meal_name);
                    const normalizedDbMealName = normalizeText(meal.meal_name || '');
                    return normalizedDbMealName === normalizedMealName
                        || normalizedDbMealName.includes(normalizedMealName)
                        || normalizedMealName.includes(normalizedDbMealName);
                }
            );

            return (
                <div
                    key={meal.id || idx}
                    className={`p-2 rounded-lg mb-2 ${isModified
                        ? 'bg-emerald-900/15 border border-emerald-700/30'
                        : 'bg-slate-800/30 border border-slate-700/20'
                        }`}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-200">
                            {meal.meal_name}
                        </span>
                        {isModified && (
                            <Badge className="text-[9px] px-1 bg-emerald-600/20 text-emerald-400 border-0">
                                Modificada
                            </Badge>
                        )}
                    </div>
                    {meal.suggested_time && (
                        <span className="text-[10px] text-slate-500">{meal.suggested_time}</span>
                    )}
                    {meal.diet_foods?.map((food: any, fIdx: number) => {
                        const normalizedFoodName = normalizeText(food.food_name || '');
                        const foodChanged = side === 'suggested' && aiResponse?.adjustments?.some(a =>
                            a.foods_changed?.some(fc => {
                                const normalizedAiFood = normalizeText(fc.food_name);
                                return normalizedFoodName === normalizedAiFood
                                    || normalizedFoodName.includes(normalizedAiFood)
                                    || normalizedAiFood.includes(normalizedFoodName);
                            })
                        );

                        return (
                            <div
                                key={food.id || fIdx}
                                className={`flex items-center justify-between py-0.5 text-xs ${foodChanged ? 'text-emerald-300' : 'text-slate-400'
                                    }`}
                            >
                                <span className="truncate flex-1">{food.food_name}</span>
                                <span className="ml-2 whitespace-nowrap">
                                    {food.quantity}{food.unit}
                                    {food.calories ? ` · ${food.calories}kcal` : ''}
                                </span>
                            </div>
                        );
                    })}
                    {meal.calories && (
                        <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-700/20 pt-1">
                            {meal.calories}kcal · P:{meal.protein || 0}g · C:{meal.carbs || 0}g · G:{meal.fats || 0}g
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-100">
                        <Utensils className="w-5 h-5 text-emerald-400" />
                        Ajuste de Dieta IA — {patientName || 'Paciente'}
                        {adjustment && (
                            <Badge className={`ml-2 text-xs border-0 ${adjustment.status === 'approved' ? 'bg-green-600/30 text-green-400' :
                                adjustment.status === 'rejected' ? 'bg-red-600/30 text-red-400' :
                                    'bg-yellow-600/30 text-yellow-400'
                                }`}>
                                {adjustment.status === 'approved' ? 'Aprovado' :
                                    adjustment.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* No adjustment yet — generate button */}
                {!adjustment && !isGenerating && (
                    <div className="text-center py-10">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/50 text-red-300 p-3 rounded-lg mb-4 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                        <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm mb-1">
                            A IA irá analisar o check-in e sugerir ajustes na dieta atual.
                        </p>
                        <p className="text-slate-500 text-xs mb-4">
                            {activeTemplate
                                ? `Template ativo: ${activeTemplate.name}`
                                : 'Usando prompt padrão (nenhum template personalizado ativo)'}
                        </p>
                        <Button
                            onClick={handleGenerate}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Utensils className="w-4 h-4 mr-2" />
                            Gerar Ajuste de Dieta
                        </Button>
                    </div>
                )}

                {/* Loading state */}
                {isGenerating && (
                    <div className="text-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
                        <p className="text-slate-300 text-sm font-medium">Analisando check-in e gerando ajustes...</p>
                        <p className="text-slate-500 text-xs mt-1">Isso pode levar até 30 segundos</p>
                    </div>
                )}

                {/* Results */}
                {adjustment && !isGenerating && (
                    <div className="space-y-4">
                        {/* Summary */}
                        {aiResponse?.summary && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-medium text-slate-200">Resumo</span>
                                    {aiResponse.confidence && (
                                        <Badge className={`text-[10px] border-0 ${aiResponse.confidence === 'high' ? 'bg-green-900/30 text-green-400' :
                                            aiResponse.confidence === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                                'bg-red-900/30 text-red-400'
                                            }`}>
                                            Confiança: {aiResponse.confidence === 'high' ? 'Alta' : aiResponse.confidence === 'medium' ? 'Média' : 'Baixa'}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-slate-300 text-sm">{aiResponse.summary}</p>
                            </div>
                        )}

                        {/* Macro Changes */}
                        {aiResponse?.macro_changes && (
                            <Card className="bg-slate-800/30 border-slate-700/50">
                                <CardContent className="p-3">
                                    <span className="text-xs font-semibold text-slate-200 mb-2 block">Alterações de Macros</span>
                                    <MacroChange label="Calorias (kcal)" data={aiResponse.macro_changes.calories} />
                                    <MacroChange label="Proteína (g)" data={aiResponse.macro_changes.protein} />
                                    <MacroChange label="Carboidratos (g)" data={aiResponse.macro_changes.carbs} />
                                    <MacroChange label="Gorduras (g)" data={aiResponse.macro_changes.fats} />
                                </CardContent>
                            </Card>
                        )}

                        {/* Side by side comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Original */}
                            <Card className="bg-slate-800/20 border-slate-700/50">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                                        <span className="text-xs font-semibold text-slate-300">Dieta Anterior</span>
                                    </div>
                                    {originalDiet ? (
                                        <div className="max-h-[400px] overflow-y-auto pr-1">
                                            {renderMealComparison(originalDiet.diet_meals || [], 'original')}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-xs">Carregando...</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Suggested */}
                            <Card className="bg-emerald-900/10 border-emerald-700/30">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-semibold text-emerald-300">Dieta Sugerida (IA)</span>
                                    </div>
                                    {suggestedDiet ? (
                                        <div className="max-h-[400px] overflow-y-auto pr-1">
                                            {renderMealComparison(suggestedDiet.diet_meals || [], 'suggested')}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-xs">Carregando...</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Adjustments list */}
                        {aiResponse?.adjustments?.length > 0 && (
                            <Card className="bg-slate-800/30 border-slate-700/50">
                                <CardContent className="p-3">
                                    <span className="text-xs font-semibold text-slate-200 mb-2 block">Detalhes dos Ajustes</span>
                                    <div className="space-y-2">
                                        {aiResponse.adjustments.map((adj, idx) => (
                                            <div key={idx} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/30">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={`text-[10px] px-1 border-0 ${adj.action === 'added' ? 'bg-green-900/30 text-green-400' :
                                                        adj.action === 'removed' ? 'bg-red-900/30 text-red-400' :
                                                            'bg-blue-900/30 text-blue-400'
                                                        }`}>
                                                        {adj.action === 'added' ? 'Nova' : adj.action === 'removed' ? 'Removida' : 'Modificada'}
                                                    </Badge>
                                                    <span className="text-xs font-medium text-slate-200">{adj.meal_name}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">{adj.changes}</p>
                                                {adj.foods_changed?.length > 0 && (
                                                    <div className="mt-1 space-y-0.5">
                                                        {adj.foods_changed.map((fc, fIdx) => (
                                                            <div key={fIdx} className="flex items-center gap-1 text-[11px]">
                                                                <span className={
                                                                    fc.action === 'added' ? 'text-green-400' :
                                                                        fc.action === 'removed' ? 'text-red-400' :
                                                                            'text-yellow-400'
                                                                }>
                                                                    {fc.action === 'added' ? '+' : fc.action === 'removed' ? '−' : '~'}
                                                                </span>
                                                                <span className="text-slate-300">{fc.food_name}</span>
                                                                {fc.old_value && fc.new_value && (
                                                                    <span className="text-slate-500">
                                                                        ({fc.old_value} → {fc.new_value})
                                                                    </span>
                                                                )}
                                                                <span className="text-slate-500 italic ml-1">— {fc.reason}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Feedback text */}
                        <Card className="bg-slate-800/30 border-slate-700/50">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-200">Feedback para o Paciente</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyFeedback}
                                        className="h-6 text-slate-400 hover:text-white text-xs"
                                    >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copiar
                                    </Button>
                                </div>
                                <Textarea
                                    value={editableFeedback}
                                    onChange={(e) => setEditableFeedback(e.target.value)}
                                    rows={6}
                                    className="bg-slate-800 border-slate-700 text-slate-200 text-sm"
                                    placeholder="Texto de feedback gerado pela IA..."
                                />
                            </CardContent>
                        </Card>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRegenerate}
                                    disabled={isGenerating}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                    Regenerar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReject}
                                    disabled={adjustment.status !== 'pending'}
                                    className="border-red-800/50 text-red-400 hover:bg-red-900/30"
                                >
                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                    Rejeitar
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleApprove(false)}
                                    disabled={adjustment.status !== 'pending' || isApproving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                                    Aprovar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleApprove(true)}
                                    disabled={adjustment.status !== 'pending' || isApproving}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                                    Aprovar e Ativar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
