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
    Activity,
    Droplets,
    Moon,
    Target,
    MessageSquare,
    Sparkles,
    Weight,
    Dumbbell,
    Heart,
    Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    dietAIAdjustmentService,
    type DietAdjustmentResult,
    type AIAdjustmentResponse,
} from '../../lib/diet-ai-adjustment-service';
import { useDietAdjustmentTemplates } from '../../hooks/use-diet-adjustment-templates';
import { dietService } from '../../lib/diet-service';
import { checkinService } from '../../lib/checkin-service';

const PHASES = ['Cutting', 'Bulking', 'Manutenção', 'Recomposição Corporal'] as const;

interface DietAdjustmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkinId: string;
    patientId: string;
    checkinData: any;
    evolutionData: any;
    patientName: string;
    patientPhone?: string;
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
    patientPhone,
    onAdjustmentComplete,
}) => {
    const [adjustment, setAdjustment] = useState<DietAdjustmentResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [editableFeedback, setEditableFeedback] = useState('');
    const [originalDiet, setOriginalDiet] = useState<any>(null);
    const [suggestedDiet, setSuggestedDiet] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // New features state
    const [customInstructions, setCustomInstructions] = useState('');
    const [notes, setNotes] = useState('');
    const [patientPhase, setPatientPhase] = useState<string | null>(null);
    const [checkinHistory, setCheckinHistory] = useState<any[]>([]);
    const [briefing, setBriefing] = useState('');
    const [loadingContext, setLoadingContext] = useState(false);
    const [currentDietMacros, setCurrentDietMacros] = useState<{
        calories: number; protein: number; carbs: number; fats: number; name: string;
    } | null>(null);

    const { activeTemplate } = useDietAdjustmentTemplates();

    // Load context when modal opens
    useEffect(() => {
        if (open && patientId) {
            loadPatientContext();
            checkExistingAdjustment();
        }
    }, [open, patientId, checkinId]);

    const loadPatientContext = async () => {
        setLoadingContext(true);
        try {
            // Load phase, check-in history, and active diet in parallel
            const [phase, history, plans] = await Promise.all([
                dietAIAdjustmentService.getPatientPhase(patientId),
                patientPhone
                    ? checkinService.getPatientEvolution(patientPhone, 3)
                    : Promise.resolve([]),
                dietService.getByPatientId(patientId),
            ]);

            // Get active diet macros
            const activePlan = plans?.find((p: any) => p.status === 'active') || plans?.[0];
            if (activePlan) {
                const fullPlan = await dietService.getById(activePlan.id);
                if (fullPlan) {
                    setCurrentDietMacros({
                        calories: (fullPlan as any).total_calories || 0,
                        protein: (fullPlan as any).total_protein || 0,
                        carbs: (fullPlan as any).total_carbs || 0,
                        fats: (fullPlan as any).total_fats || 0,
                        name: (fullPlan as any).name || 'Dieta atual',
                    });
                }
            }

            setPatientPhase(phase);
            const recentHistory = (history || []).slice(0, 5);
            setCheckinHistory(recentHistory);

            // Generate briefing
            const briefingText = dietAIAdjustmentService.generatePatientBriefing(
                patientName,
                recentHistory,
                phase,
                checkinData
            );
            setBriefing(briefingText);
        } catch (err) {
            console.error('Erro ao carregar contexto:', err);
        } finally {
            setLoadingContext(false);
        }
    };

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
                activeTemplate || undefined,
                checkinHistory,
                customInstructions || undefined,
                patientPhase
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
            await dietAIAdjustmentService.approveAdjustment(adjustment.id, activateDiet, notes || undefined);

            // Save phase if changed
            if (patientPhase) {
                await dietAIAdjustmentService.savePatientPhase(patientId, patientPhase);
            }

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

                {/* No adjustment yet — setup + generate */}
                {!adjustment && !isGenerating && (
                    <div className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/50 text-red-300 p-3 rounded-lg text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Patient Briefing Card */}
                        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-slate-700/50 overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-100">Briefing do Paciente</h3>
                                        <p className="text-[10px] text-slate-500">Contexto que a IA usará para ajustar</p>
                                    </div>
                                </div>

                                {loadingContext ? (
                                    <div className="flex items-center gap-2 py-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                        <span className="text-xs text-slate-400">Carregando contexto...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {/* Weight */}
                                            {checkinData?.peso && (
                                                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Weight className="w-3 h-3 text-blue-400" />
                                                        <span className="text-[10px] text-slate-500">Peso</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-200">{checkinData.peso}kg</span>
                                                    {(() => {
                                                        const weights = checkinHistory
                                                            .filter((c: any) => c.peso)
                                                            .map((c: any) => parseFloat(c.peso))
                                                            .filter((w: number) => !isNaN(w));
                                                        if (weights.length >= 2) {
                                                            const diff = parseFloat(checkinData.peso) - weights[1];
                                                            return (
                                                                <span className={`text-[10px] ml-1 ${diff > 0 ? 'text-amber-400' : diff < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                                    {diff > 0 ? '↑' : diff < 0 ? '↓' : '→'}{Math.abs(diff).toFixed(1)}kg
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            )}
                                            {/* Training */}
                                            {checkinData?.treino && (
                                                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Dumbbell className="w-3 h-3 text-orange-400" />
                                                        <span className="text-[10px] text-slate-500">Treino</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-200">{checkinData.treino}</span>
                                                </div>
                                            )}
                                            {/* Cardio */}
                                            {checkinData?.cardio && (
                                                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Heart className="w-3 h-3 text-red-400" />
                                                        <span className="text-[10px] text-slate-500">Cardio</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-200">{checkinData.cardio}</span>
                                                </div>
                                            )}
                                            {/* Adherence */}
                                            {checkinData?.percentual_aproveitamento && (
                                                <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/30">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Target className="w-3 h-3 text-emerald-400" />
                                                        <span className="text-[10px] text-slate-500">Aderência</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-200">{checkinData.percentual_aproveitamento}%</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Current Diet Macros */}
                                        {currentDietMacros && (
                                            <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/30">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <Utensils className="w-3 h-3 text-amber-400" />
                                                    <span className="text-[10px] text-slate-500">Dieta Atual</span>
                                                    <span className="text-[10px] text-slate-600 ml-auto truncate max-w-[150px]">{currentDietMacros.name}</span>
                                                </div>
                                                {(() => {
                                                    const peso = parseFloat(String(checkinData?.peso || '').replace(',', '.'));
                                                    const hasWeight = peso > 0 && !isNaN(peso);
                                                    const perKg = (val: number) => hasWeight ? (val / peso).toFixed(1) : null;
                                                    return (
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="text-sm font-bold text-amber-300">{currentDietMacros.calories} kcal</span>
                                                            <div className="w-px h-3.5 bg-slate-700" />
                                                            <div className="flex items-center gap-2.5 text-[11px]">
                                                                <span className="text-blue-300">P: <b>{currentDietMacros.protein}g</b>{perKg(currentDietMacros.protein) && <span className="text-blue-400/60 ml-0.5">{perKg(currentDietMacros.protein)}g/kg</span>}</span>
                                                                <span className="text-emerald-300">C: <b>{currentDietMacros.carbs}g</b>{perKg(currentDietMacros.carbs) && <span className="text-emerald-400/60 ml-0.5">{perKg(currentDietMacros.carbs)}g/kg</span>}</span>
                                                                <span className="text-orange-300">G: <b>{currentDietMacros.fats}g</b>{perKg(currentDietMacros.fats) && <span className="text-orange-400/60 ml-0.5">{perKg(currentDietMacros.fats)}g/kg</span>}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Key info highlights */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {checkinData?.fome_algum_horario && checkinData.fome_algum_horario.toLowerCase() !== 'não' && checkinData.fome_algum_horario.toLowerCase() !== 'nao' && (
                                                <Badge className="bg-amber-900/30 text-amber-300 border-0 text-[10px]">
                                                    🍽️ Fome: {checkinData.fome_algum_horario}
                                                </Badge>
                                            )}
                                            {checkinData?.alimento_para_incluir && (
                                                <Badge className="bg-blue-900/30 text-blue-300 border-0 text-[10px]">
                                                    ➕ Incluir: {checkinData.alimento_para_incluir}
                                                </Badge>
                                            )}
                                            {checkinData?.dificuldades && (
                                                <Badge className="bg-red-900/30 text-red-300 border-0 text-[10px]">
                                                    ⚠️ {checkinData.dificuldades.slice(0, 60)}
                                                </Badge>
                                            )}
                                            {checkinData?.sono && (
                                                <Badge className="bg-indigo-900/30 text-indigo-300 border-0 text-[10px]">
                                                    🌙 Sono: {checkinData.sono}
                                                </Badge>
                                            )}
                                            {checkinData?.stress && (
                                                <Badge className="bg-rose-900/30 text-rose-300 border-0 text-[10px]">
                                                    🧠 Stress: {checkinData.stress}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* History summary */}
                                        {checkinHistory.length > 0 && (
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                {checkinHistory.length} check-in(s) no histórico sendo enviados à IA
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Phase Selector */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 whitespace-nowrap">Fase:</span>
                            <div className="flex gap-1.5 flex-wrap">
                                {PHASES.map((phase) => (
                                    <button
                                        key={phase}
                                        onClick={() => setPatientPhase(patientPhase === phase ? null : phase)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${patientPhase === phase
                                            ? phase === 'Cutting' ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                                : phase === 'Bulking' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                                    : phase === 'Manutenção' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                            : 'bg-slate-800/50 border-slate-700/30 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                                            }`}
                                    >
                                        {phase}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Instructions */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs font-medium text-slate-300">Instruções para a IA</span>
                                <span className="text-[10px] text-slate-600">(opcional)</span>
                            </div>
                            <Textarea
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                rows={2}
                                className="bg-slate-800/50 border-slate-700/50 text-slate-200 text-sm placeholder:text-slate-600 resize-none"
                                placeholder="Ex: Aumentar 200kcal priorizando proteína no pós-treino, paciente não gosta de ovo..."
                            />
                        </div>

                        {/* Template info + Generate */}
                        <div className="flex items-center justify-between">
                            <p className="text-slate-500 text-[10px]">
                                {activeTemplate
                                    ? `Template: ${activeTemplate.name}`
                                    : 'Prompt padrão'}
                            </p>
                            <Button
                                onClick={handleGenerate}
                                disabled={loadingContext}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Gerar Ajuste com IA
                            </Button>
                        </div>
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

                        {/* Observation Notes */}
                        <Card className="bg-slate-800/30 border-slate-700/50">
                            <CardContent className="p-3">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs font-semibold text-slate-200">Observações / Raciocínio Clínico</span>
                                    <span className="text-[10px] text-slate-600">(visível para a equipe)</span>
                                </div>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="bg-slate-800 border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 resize-none"
                                    placeholder="Ex: Cortando 200kcal pois platô de peso há 3 semanas. Priorizei proteína no pós-treino..."
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
