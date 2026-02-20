import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
    Loader2,
    Utensils,
    ArrowUpRight,
    ArrowDownRight,
    Save,
    CheckCircle,
    Calculator,
    PanelLeftClose,
    PanelLeftOpen,
    X,
    ClipboardList,
    Apple,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { dietService } from '../../lib/diet-service';
import { dietAIAdjustmentService } from '../../lib/diet-ai-adjustment-service';
import { DietPlanForm } from '../diets/DietPlanForm';
import { TMBCalculator } from '../diets/TMBCalculator';
import { supabase } from '@/integrations/supabase/client';

interface ManualDietAdjustmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    checkinData: any;
    patientName: string;
    onComplete?: () => void;
}

export const ManualDietAdjustmentModal: React.FC<ManualDietAdjustmentModalProps> = ({
    open,
    onOpenChange,
    patientId,
    checkinData,
    patientName,
    onComplete,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [originalDiet, setOriginalDiet] = useState<any>(null);
    const [duplicatedPlanId, setDuplicatedPlanId] = useState<string | null>(null);
    const [sidePanelOpen, setSidePanelOpen] = useState(true);
    const [showTmbCalculator, setShowTmbCalculator] = useState(false);
    const [patientData, setPatientData] = useState<any>(null);
    const [getCalories, setGetCalories] = useState<number | null>(null);
    const [dietTitle, setDietTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [originalDietExpanded, setOriginalDietExpanded] = useState(false);

    // Load patient data for TMB calculator
    const loadPatientData = useCallback(async () => {
        if (!patientId) return;
        try {
            const { data } = await (supabase
                .from('patients') as any)
                .select('nome, sexo, data_nascimento, peso_inicial, altura')
                .eq('id', patientId)
                .maybeSingle();
            if (data) {
                const age = data.data_nascimento
                    ? Math.floor((Date.now() - new Date(data.data_nascimento).getTime()) / (365.25 * 24 * 3600 * 1000))
                    : undefined;
                setPatientData({
                    peso: data.peso_inicial,
                    altura: data.altura,
                    idade: age,
                    sexo: data.sexo,
                });
            }
        } catch (err) {
            console.error('Erro ao carregar dados do paciente:', err);
        }
    }, [patientId]);

    // Load active diet and duplicate it when modal opens
    const initializeDiet = useCallback(async () => {
        if (!patientId) return;
        setIsLoading(true);
        try {
            const plans = await dietService.getByPatientId(patientId);
            const activePlan = plans.find((p: any) => p.status === 'active' || p.is_released);

            if (!activePlan) {
                toast.error('Nenhum plano alimentar ativo encontrado para este paciente.');
                setIsLoading(false);
                return;
            }

            const fullPlan = await dietService.getById(activePlan.id);
            setOriginalDiet(fullPlan);

            if ((fullPlan as any)?.target_calories) {
                setGetCalories((fullPlan as any).target_calories);
            }

            const newTitle = `${fullPlan.name || 'Plano'} - Ajuste Manual ${new Date().toLocaleDateString('pt-BR')}`;
            setDietTitle(newTitle);

            const duplicatedId = await dietAIAdjustmentService.duplicateDietPlan(
                activePlan.id,
                patientId,
                newTitle
            );
            setDuplicatedPlanId(duplicatedId);
        } catch (err: any) {
            console.error('Erro ao inicializar dieta:', err);
            toast.error(err?.message || 'Erro ao carregar plano alimentar');
        } finally {
            setIsLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        if (open) {
            initializeDiet();
            loadPatientData();
        } else {
            setOriginalDiet(null);
            setDuplicatedPlanId(null);
            setSidePanelOpen(true);
            setDietTitle('');
            setIsEditingTitle(false);
            setOriginalDietExpanded(false);
        }
    }, [open, initializeDiet, loadPatientData]);

    // Update plan title in DB when user finishes editing
    const handleTitleBlur = useCallback(async () => {
        setIsEditingTitle(false);
        if (!duplicatedPlanId || !dietTitle.trim()) return;
        try {
            await dietService.update(duplicatedPlanId, { name: dietTitle.trim() });
        } catch (err) {
            console.error('Erro ao atualizar título:', err);
        }
    }, [duplicatedPlanId, dietTitle]);

    const originalMacros = useMemo(() => {
        if (!originalDiet) return null;
        return {
            calories: originalDiet.total_calories || 0,
            protein: originalDiet.total_protein || 0,
            carbs: originalDiet.total_carbs || 0,
            fats: originalDiet.total_fats || 0,
        };
    }, [originalDiet]);

    const handleSaveAndActivate = useCallback(async () => {
        if (!duplicatedPlanId || !originalDiet?.id) return;
        try {
            await supabase
                .from('diet_plans')
                .update({ status: 'draft' } as any)
                .eq('id', originalDiet.id);

            await dietService.release(duplicatedPlanId);

            toast.success('Nova dieta salva e ativada! A dieta anterior foi desativada.');
            onComplete?.();
            onOpenChange(false);
        } catch (err: any) {
            console.error('Erro ao salvar e ativar:', err);
            toast.error(err?.message || 'Erro ao ativar a nova dieta');
        }
    }, [duplicatedPlanId, originalDiet, onComplete, onOpenChange]);

    const handleSaveDraft = useCallback(async () => {
        toast.success('Plano salvo como rascunho!');
        onComplete?.();
        onOpenChange(false);
    }, [onComplete, onOpenChange]);

    const handleTmbApply = useCallback((macros: { calorias: number; proteinas: number; carboidratos: number; gorduras: number }) => {
        setGetCalories(macros.calorias);
        toast.success(`GET atualizado: ${macros.calorias} kcal`);
    }, []);

    // Check-in info items
    const checkinItems = useMemo(() => {
        const items: { icon: string; label: string; value: string; color: string }[] = [];
        if (checkinData?.objetivo) items.push({ icon: '🎯', label: 'Objetivo', value: checkinData.objetivo, color: 'text-slate-200' });
        if (checkinData?.dificuldades) items.push({ icon: '⚠️', label: 'Dificuldades', value: checkinData.dificuldades, color: 'text-amber-200' });
        if (checkinData?.fome_algum_horario) items.push({ icon: '🍴', label: 'Fome', value: checkinData.fome_algum_horario, color: 'text-yellow-200' });
        if (checkinData?.alimento_para_incluir) items.push({ icon: '🍌', label: 'Incluir', value: checkinData.alimento_para_incluir, color: 'text-emerald-200' });
        if (checkinData?.comeu_menos) items.push({ icon: '📉', label: 'Comeu menos', value: checkinData.comeu_menos, color: 'text-slate-200' });
        if (checkinData?.oq_beliscou) items.push({ icon: '🍪', label: 'Beliscou', value: checkinData.oq_beliscou, color: 'text-orange-200' });
        if (checkinData?.oq_comeu_ref_livre) items.push({ icon: '🍽️', label: 'Ref. livre', value: checkinData.oq_comeu_ref_livre, color: 'text-slate-200' });
        return items;
    }, [checkinData]);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-[95vw] w-[95vw] h-[92vh] max-h-[92vh] p-0 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    }}
                >
                    {/* ═══════ TOP HEADER ═══════ */}
                    <div className="flex-shrink-0 px-5 py-3 border-b border-slate-700/40" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                                    <Utensils className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {isEditingTitle ? (
                                        <Input
                                            value={dietTitle}
                                            onChange={(e) => setDietTitle(e.target.value)}
                                            onBlur={handleTitleBlur}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                                            autoFocus
                                            className="h-7 text-sm font-semibold bg-slate-800/60 border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditingTitle(true)}>
                                            <h2 className="text-sm font-semibold text-white truncate">{dietTitle || `Ajuste Manual — ${patientName}`}</h2>
                                            <Pencil className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                                        </div>
                                    )}
                                    <span className="text-xs text-slate-300">{patientName}</span>
                                </div>
                                <Badge className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">Manual</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 ml-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowTmbCalculator(true)}
                                    className="h-7 text-[11px] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
                                >
                                    <Calculator className="w-3.5 h-3.5 mr-1" />
                                    TMB/GET
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSidePanelOpen(!sidePanelOpen)}
                                    className="h-7 text-[11px] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
                                >
                                    {sidePanelOpen ? <PanelLeftClose className="w-3.5 h-3.5 mr-1" /> : <PanelLeftOpen className="w-3.5 h-3.5 mr-1" />}
                                    Painel
                                </Button>
                                <div className="w-px h-5 bg-slate-700/50 mx-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Macro Comparison Bar */}
                        {originalMacros && (
                            <div className="flex items-center gap-4 mt-2 text-[11px]">
                                <div className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-1.5 border border-slate-700/30">
                                    <span className="text-slate-200 font-medium">Dieta atual:</span>
                                    <span className="text-orange-300 font-semibold">Calorias: {originalMacros.calories} kcal</span>
                                    <div className="w-px h-3 bg-slate-700/50" />
                                    <span className="text-blue-300">Proteínas: {originalMacros.protein}g</span>
                                    <span className="text-violet-300">Carboidratos: {originalMacros.carbs}g</span>
                                    <span className="text-emerald-300">Gorduras: {originalMacros.fats}g</span>
                                </div>
                                {getCalories && (
                                    <div className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-1.5 border border-slate-700/30">
                                        <span className="text-slate-500 font-medium">GET:</span>
                                        <span className="text-amber-300 font-semibold">{getCalories}kcal</span>
                                        {originalMacros.calories > 0 && (
                                            <Badge className={`text-[9px] px-1.5 py-0 border-0 rounded-full ${originalMacros.calories < getCalories
                                                ? 'bg-red-500/15 text-red-300'
                                                : 'bg-emerald-500/15 text-emerald-300'
                                                }`}>
                                                {originalMacros.calories < getCalories ? '↓ Déficit' : '↑ Superávit'} {Math.abs(originalMacros.calories - getCalories)}kcal
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ═══════ MAIN CONTENT ═══════ */}
                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* Side Panel */}
                        {sidePanelOpen && (
                            <div className="w-[300px] flex-shrink-0 border-r border-slate-700/30 overflow-y-auto" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                                {/* Check-in Summary */}
                                <div className="p-4 border-b border-slate-700/20">
                                    <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                                        Resumo do Check-in
                                    </h3>
                                    <div className="space-y-2.5">
                                        {checkinItems.map((item, idx) => (
                                            <div key={idx} className="bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/15">
                                                <span className="text-[10px] font-bold text-white block mb-0.5">
                                                    {item.icon} {item.label}
                                                </span>
                                                <span className={`text-[11px] leading-relaxed ${item.color}`}>{item.value}</span>
                                            </div>
                                        ))}
                                        {checkinItems.length === 0 && (
                                            <p className="text-[11px] text-slate-500 italic text-center py-3">Nenhum dado do check-in</p>
                                        )}
                                    </div>
                                </div>

                                {/* Original Diet — Collapsible */}
                                <div className="p-4">
                                    <button
                                        onClick={() => setOriginalDietExpanded(!originalDietExpanded)}
                                        className="flex items-center justify-between w-full text-left group mb-2"
                                    >
                                        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <Apple className="w-3.5 h-3.5 text-orange-400" />
                                            Dieta Atual (Referência)
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            {originalMacros && (
                                                <span className="text-[9px] text-orange-300/70 mr-1">{originalMacros.calories}kcal</span>
                                            )}
                                            {originalDietExpanded
                                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                                                : <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                                            }
                                        </div>
                                    </button>

                                    {originalDietExpanded && (
                                        <>
                                            {originalDiet ? (
                                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                    {originalDiet.diet_meals?.map((meal: any, idx: number) => (
                                                        <div key={meal.id || idx} className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/15">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-[11px] font-bold text-white">{meal.meal_name}</span>
                                                                {meal.suggested_time && (
                                                                    <span className="text-[9px] text-slate-500 bg-slate-700/30 px-1.5 py-0.5 rounded">{meal.suggested_time}</span>
                                                                )}
                                                            </div>
                                                            {meal.diet_foods?.map((food: any, fIdx: number) => (
                                                                <div key={food.id || fIdx} className="flex items-center justify-between py-0.5 text-[10px]">
                                                                    <span className="text-slate-400 truncate flex-1 mr-2">{food.food_name}</span>
                                                                    <span className="text-slate-500 whitespace-nowrap font-medium">
                                                                        {food.quantity}{food.unit}
                                                                        {food.calories ? <span className="text-orange-400/60 ml-1">{food.calories}kcal</span> : ''}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {(meal.calories || meal.protein) && (
                                                                <div className="text-[9px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-700/15 flex gap-2">
                                                                    <span className="text-orange-400/80">{meal.calories}kcal</span>
                                                                    <span className="text-blue-400/60">P:{meal.protein || 0}g</span>
                                                                    <span className="text-violet-400/60">C:{meal.carbs || 0}g</span>
                                                                    <span className="text-emerald-400/60">G:{meal.fats || 0}g</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Totals */}
                                                    <div className="bg-slate-700/30 rounded-lg p-2.5 border border-slate-600/20">
                                                        <h4 className="text-[10px] font-bold text-white mb-1">📊 Total</h4>
                                                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                                                            <span className="text-slate-400">Calorias: <span className="text-orange-300 font-medium">{originalMacros?.calories}kcal</span></span>
                                                            <span className="text-slate-400">Proteína: <span className="text-blue-300 font-medium">{originalMacros?.protein}g</span></span>
                                                            <span className="text-slate-400">Carbs: <span className="text-violet-300 font-medium">{originalMacros?.carbs}g</span></span>
                                                            <span className="text-slate-400">Gordura: <span className="text-emerald-300 font-medium">{originalMacros?.fats}g</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center py-6">
                                                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Main Editor Area */}
                        <div className="flex-1 overflow-y-auto bg-slate-100 flex flex-col min-h-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center flex-1">
                                    <div className="text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500">Preparando editor de dieta...</p>
                                        <p className="text-xs text-gray-400 mt-1">Duplicando plano alimentar para edição</p>
                                    </div>
                                </div>
                            ) : duplicatedPlanId ? (
                                <div className="overflow-y-auto pb-2">
                                    <DietPlanForm
                                        patientId={patientId}
                                        planId={duplicatedPlanId}
                                        open={true}
                                        onOpenChange={() => { }}
                                        isPageMode={true}
                                        onSuccess={() => {
                                            toast.success('Plano salvo com sucesso!');
                                        }}
                                        onSaveSuccess={() => {
                                            toast.success('Plano salvo com sucesso!');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center flex-1">
                                    <div className="text-center">
                                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                                        <p className="text-sm text-gray-700">Nenhum plano alimentar ativo encontrado.</p>
                                        <p className="text-xs text-gray-500 mt-1">O paciente precisa ter um plano alimentar ativo para usar o ajuste manual.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══════ FOOTER ACTION BAR ═══════ */}
                    <div
                        className="flex-shrink-0 px-5 py-3 border-t border-slate-700/40 flex items-center justify-between"
                        style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', zIndex: 50 }}
                    >
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Editor completo disponível — Edite refeições, alimentos e macros acima</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveDraft}
                                className="h-8 text-xs border-slate-600 text-slate-300 hover:bg-slate-700/60 bg-transparent rounded-lg"
                            >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                Salvar Rascunho
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveAndActivate}
                                disabled={!duplicatedPlanId}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/20"
                            >
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                Salvar e Ativar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <TMBCalculator
                open={showTmbCalculator}
                onOpenChange={setShowTmbCalculator}
                onApplyMacros={handleTmbApply}
                patientData={patientData}
            />
        </>
    );
};
