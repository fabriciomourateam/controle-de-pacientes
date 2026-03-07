import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
    Loader2,
    CheckCircle,
    AlertCircle,
    Sparkles,
    Edit,
    Save,
    X,
    RefreshCw,
    Calendar,
    ImageIcon,
    Settings,
    DollarSign,
    ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    analyzeBioimpedancia,
    BioimpedanciaAIResult,
    CheckinOption,
    getAvailableCheckins,
    getCustomPrompt,
    saveCustomPrompt,
} from '@/lib/bioimpedancia-ai-service';

interface BioimpedanciaAIGeneratorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    telefone: string;
    patientName: string;
    checkinId?: string;
    onSuccess?: () => void;
}

type AnalysisStep = 'selecting' | 'analyzing' | 'validating' | 'saving' | 'done' | 'error';

export function BioimpedanciaAIGenerator({
    open,
    onOpenChange,
    telefone,
    patientName,
    checkinId,
    onSuccess,
}: BioimpedanciaAIGeneratorProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<AnalysisStep>('selecting');
    const [progressMessage, setProgressMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [result, setResult] = useState<BioimpedanciaAIResult | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<BioimpedanciaAIResult | null>(null);

    // Check-in selector
    const [checkins, setCheckins] = useState<CheckinOption[]>([]);
    const [selectedCheckinId, setSelectedCheckinId] = useState<string | undefined>(checkinId);
    const [loadingCheckins, setLoadingCheckins] = useState(false);

    // Prompt editor
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [analysisNote, setAnalysisNote] = useState('');
    const [savingPrompt, setSavingPrompt] = useState(false);

    // Load check-ins and custom prompt when modal opens
    useEffect(() => {
        if (open) {
            setStep('selecting');
            setResult(null);
            setEditData(null);
            setIsEditing(false);
            setErrorMessage('');
            setShowPromptEditor(false);
            setAnalysisNote('');
            loadCheckins();
            loadCustomPrompt();
        }
    }, [open]);

    const loadCheckins = async () => {
        setLoadingCheckins(true);
        try {
            const data = await getAvailableCheckins(telefone);
            setCheckins(data);
            // Pre-select the provided checkinId or the first with photos
            if (checkinId) {
                setSelectedCheckinId(checkinId);
            } else {
                const withPhotos = data.find(c => c.hasPhotos);
                setSelectedCheckinId(withPhotos?.id || data[0]?.id);
            }
        } catch {
            setCheckins([]);
        } finally {
            setLoadingCheckins(false);
        }
    };

    const loadCustomPrompt = async () => {
        const saved = await getCustomPrompt();
        if (saved) setCustomPrompt(saved);
    };

    const handleSavePrompt = async () => {
        setSavingPrompt(true);
        const success = await saveCustomPrompt(customPrompt);
        setSavingPrompt(false);
        toast({
            title: success ? 'Prompt salvo! ✅' : 'Erro ao salvar',
            description: success
                ? 'As instruções serão usadas nas próximas análises'
                : 'Não foi possível salvar o prompt',
            variant: success ? 'default' : 'destructive',
        });
        if (success) setShowPromptEditor(false);
    };

    const handleAnalyze = async () => {
        setStep('analyzing');
        setErrorMessage('');

        try {
            // Combine global + per-analysis instructions
            const parts: string[] = [];
            if (customPrompt.trim()) parts.push(customPrompt.trim());
            if (analysisNote.trim()) parts.push(`NOTA ESPECÍFICA DESTA ANÁLISE: ${analysisNote.trim()}`);
            const combined = parts.length > 0 ? parts.join('\n\n') : undefined;

            const analysisResult = await analyzeBioimpedancia(
                { telefone, checkinId: selectedCheckinId, customPromptInstructions: combined },
                (msg) => setProgressMessage(msg)
            );

            setResult(analysisResult);
            setEditData({ ...analysisResult });
            setStep('validating');
        } catch (error: any) {
            console.error('Erro na análise IA:', error);
            
            // Melhor tratamento de diferentes tipos de erro
            let errorMsg = 'Erro desconhecido na análise';
            
            if (error.message) {
                errorMsg = error.message;
            } else if (error.error?.message) {
                errorMsg = error.error.message;
            } else if (typeof error === 'string') {
                errorMsg = error;
            }
            
            // Mensagens mais amigáveis para erros comuns
            if (errorMsg.includes('Failed to fetch')) {
                errorMsg = 'Erro de conexão. Verifique sua internet e tente novamente.';
            } else if (errorMsg.includes('ERR_CONNECTION_RESET')) {
                errorMsg = 'Conexão resetada. Tente novamente em alguns segundos.';
            } else if (errorMsg.includes('401')) {
                errorMsg = 'Erro de autenticação com a IA. Verifique as configurações.';
            } else if (errorMsg.includes('429')) {
                errorMsg = 'Muitas requisições. Aguarde alguns minutos e tente novamente.';
            } else if (errorMsg.includes('413')) {
                errorMsg = 'Fotos muito grandes. Tente com fotos menores.';
            }
            
            setErrorMessage(errorMsg);
            setStep('error');
            
            // Toast para feedback imediato
            toast({
                title: "Erro na análise IA",
                description: errorMsg,
                variant: "destructive",
            });
        }
    };

    const handleSave = async () => {
        if (!editData) return;

        setStep('saving');
        try {
            const { error } = await supabase
                .from('body_composition' as any)
                .insert({
                    telefone,
                    data_avaliacao: new Date().toISOString().split('T')[0],
                    percentual_gordura: editData.percentual_gordura,
                    peso: editData.massa_gorda_kg + editData.massa_magra_kg,
                    massa_gorda: editData.massa_gorda_kg,
                    massa_magra: editData.massa_magra_kg,
                    imc: editData.imc,
                    tmb: editData.tmb,
                    classificacao: editData.classificacao,
                    observacoes: editData.observacoes,
                });

            if (error) throw error;

            setStep('done');
            toast({
                title: 'Bioimpedância salva! ✅',
                description: `${editData.percentual_gordura}% BF | ${editData.classificacao} | IMC: ${editData.imc.toFixed(1)}`,
            });

            setTimeout(() => {
                onOpenChange(false);
                onSuccess?.();
            }, 1500);
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            toast({
                title: 'Erro ao salvar',
                description: error.message || 'Não foi possível salvar a bioimpedância',
                variant: 'destructive',
            });
            setStep('validating');
        }
    };

    const handleEditField = (field: keyof BioimpedanciaAIResult, value: string | number) => {
        if (!editData) return;
        setEditData({ ...editData, [field]: value });
    };

    const confiancaColor = (c: string) => {
        if (c === 'alta') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (c === 'media') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    const confiancaLabel = (c: string) => {
        if (c === 'alta') return 'Alta';
        if (c === 'media') return 'Média';
        return 'Baixa';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        Gerar Bioimpedância com IA
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Análise corporal de {patientName} via Claude Vision
                    </DialogDescription>
                </DialogHeader>

                {/* SELECTING STATE - Check-in picker */}
                {step === 'selecting' && (
                    <div className="space-y-4">
                        {/* Check-in selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                Selecione o check-in para análise
                            </label>

                            {loadingCheckins ? (
                                <div className="flex items-center gap-2 text-slate-400 py-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Carregando check-ins...
                                </div>
                            ) : checkins.length === 0 ? (
                                <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-center">
                                    <p className="text-slate-400 text-sm">Nenhum check-in encontrado</p>
                                    <p className="text-slate-500 text-xs mt-1">A análise usará fotos iniciais do cadastro, se disponíveis</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                    {checkins.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCheckinId(c.id)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedCheckinId === c.id
                                                ? 'bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/30'
                                                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${selectedCheckinId === c.id ? 'bg-blue-400' : 'bg-slate-600'
                                                        }`} />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-200">
                                                            {formatDate(c.data_checkin)}
                                                        </p>
                                                        {c.peso && (
                                                            <p className="text-xs text-slate-400">Peso: {c.peso}kg</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ImageIcon className={`w-3.5 h-3.5 ${c.hasPhotos ? 'text-emerald-400' : 'text-slate-600'}`} />
                                                    <span className={`text-xs ${c.hasPhotos ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                        {c.photoCount} foto{c.photoCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Prompt editor toggle */}
                        <div className="border-t border-slate-700/50 pt-3">
                            <button
                                onClick={() => setShowPromptEditor(!showPromptEditor)}
                                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                {showPromptEditor ? 'Ocultar' : 'Personalizar'} instruções da IA
                                <ChevronDown className={`w-3 h-3 transition-transform ${showPromptEditor ? 'rotate-180' : ''}`} />
                            </button>

                            {showPromptEditor && (
                                <div className="mt-3 space-y-3">
                                    {/* Per-analysis note (temporary) */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 flex items-center gap-1">
                                            📝 Nota desta análise <span className="text-slate-600">(temporária)</span>
                                        </label>
                                        <Textarea
                                            value={analysisNote}
                                            onChange={(e) => setAnalysisNote(e.target.value)}
                                            placeholder="Ex: Paciente com retenção hídrica por TPM. Foto tirada com iluminação ruim..."
                                            className="bg-slate-800 border-slate-600 text-slate-200 text-sm min-h-[60px]"
                                        />
                                        <p className="text-[10px] text-slate-600">
                                            Usada apenas nesta análise e descartada depois
                                        </p>
                                    </div>

                                    {/* Global saved instructions */}
                                    <div className="space-y-1 border-t border-slate-700/30 pt-3">
                                        <label className="text-xs text-slate-400 flex items-center gap-1">
                                            ⚙️ Instruções globais <span className="text-slate-600">(salvas para todas)</span>
                                        </label>
                                        <Textarea
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="Ex: Sempre compare com avaliações anteriores. Seja técnico e direto no relatório..."
                                            className="bg-slate-800 border-slate-600 text-slate-200 text-sm min-h-[60px]"
                                        />
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-slate-600">
                                                Aplicadas em todas as análises futuras
                                            </p>
                                            <Button
                                                size="sm"
                                                onClick={handleSavePrompt}
                                                disabled={savingPrompt}
                                                className="h-7 text-xs bg-slate-700 hover:bg-slate-600"
                                            >
                                                {savingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                <span className="ml-1">Salvar</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <DialogFooter className="flex gap-2 sm:gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAnalyze}
                                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            >
                                <Sparkles className="w-4 h-4" />
                                Iniciar Análise
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* ANALYZING STATE */}
                {step === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                            <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <p className="text-slate-300 text-center font-medium">{progressMessage || 'Iniciando análise...'}</p>
                        <p className="text-slate-500 text-xs text-center">
                            Analisando fotos e dados de {patientName}
                        </p>
                    </div>
                )}

                {/* ERROR STATE */}
                {step === 'error' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <p className="text-red-300 text-center font-medium">Erro na análise</p>
                        <p className="text-slate-400 text-sm text-center max-w-md">{errorMessage}</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setStep('selecting')}
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Voltar e Tentar Novamente
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-slate-600 text-slate-300"
                            >
                                Fechar
                            </Button>
                        </div>
                    </div>
                )}

                {/* VALIDATING STATE - Results for review */}
                {(step === 'validating' || step === 'saving') && editData && (
                    <div className="space-y-4">
                        {/* Confidence badge + Token usage */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-slate-400 text-sm">📋 Paciente: <span className="text-white font-medium">{patientName}</span></p>
                            <div className="flex items-center gap-2">
                                {result?.tokenUsage && (
                                    <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-[10px] gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {result.tokenUsage.total_tokens.toLocaleString()} tokens
                                        {' '}(~${result.tokenUsage.estimated_cost_usd.toFixed(4)})
                                    </Badge>
                                )}
                                <Badge className={confiancaColor(editData.confianca)}>
                                    Confiança: {confiancaLabel(editData.confianca)}
                                </Badge>
                            </div>
                        </div>

                        {/* Main metrics */}
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="bg-slate-800/60 border-slate-700">
                                <CardContent className="p-3 text-center">
                                    <p className="text-slate-400 text-xs mb-1">% Gordura</p>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={editData.percentual_gordura}
                                            onChange={(e) => handleEditField('percentual_gordura', parseFloat(e.target.value))}
                                            className="bg-slate-700 border-slate-600 text-white text-center text-lg h-8"
                                        />
                                    ) : (
                                        <p className="text-2xl font-bold text-blue-400">{editData.percentual_gordura}%</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700">
                                <CardContent className="p-3 text-center">
                                    <p className="text-slate-400 text-xs mb-1">IMC</p>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={editData.imc}
                                            onChange={(e) => handleEditField('imc', parseFloat(e.target.value))}
                                            className="bg-slate-700 border-slate-600 text-white text-center text-lg h-8"
                                        />
                                    ) : (
                                        <p className="text-2xl font-bold text-emerald-400">{editData.imc.toFixed(1)}</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/60 border-slate-700">
                                <CardContent className="p-3 text-center">
                                    <p className="text-slate-400 text-xs mb-1">TMB</p>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={editData.tmb}
                                            onChange={(e) => handleEditField('tmb', parseInt(e.target.value))}
                                            className="bg-slate-700 border-slate-600 text-white text-center text-lg h-8"
                                        />
                                    ) : (
                                        <p className="text-2xl font-bold text-orange-400">{editData.tmb}</p>
                                    )}
                                    <p className="text-slate-500 text-[10px]">kcal/dia</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Body composition row */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="bg-slate-800/60 border-slate-700">
                                <CardContent className="p-3">
                                    <p className="text-slate-400 text-xs mb-1">Massa Gorda</p>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={editData.massa_gorda_kg}
                                            onChange={(e) => handleEditField('massa_gorda_kg', parseFloat(e.target.value))}
                                            className="bg-slate-700 border-slate-600 text-white h-8"
                                        />
                                    ) : (
                                        <p className="text-lg font-semibold text-red-400">{editData.massa_gorda_kg.toFixed(1)} kg</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-800/60 border-slate-700">
                                <CardContent className="p-3">
                                    <p className="text-slate-400 text-xs mb-1">Massa Magra</p>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={editData.massa_magra_kg}
                                            onChange={(e) => handleEditField('massa_magra_kg', parseFloat(e.target.value))}
                                            className="bg-slate-700 border-slate-600 text-white h-8"
                                        />
                                    ) : (
                                        <p className="text-lg font-semibold text-emerald-400">{editData.massa_magra_kg.toFixed(1)} kg</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Classification */}
                        <Card className="bg-slate-800/60 border-slate-700">
                            <CardContent className="p-3">
                                <p className="text-slate-400 text-xs mb-1">Classificação do Shape</p>
                                {isEditing ? (
                                    <Input
                                        value={editData.classificacao}
                                        onChange={(e) => handleEditField('classificacao', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white h-8"
                                    />
                                ) : (
                                    <p className="text-lg font-semibold text-purple-400">{editData.classificacao}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Full report / observations */}
                        <Card className="bg-slate-800/60 border-slate-700">
                            <CardContent className="p-3">
                                <p className="text-slate-400 text-xs mb-2">Relatório da IA</p>
                                {isEditing ? (
                                    <Textarea
                                        value={editData.observacoes}
                                        onChange={(e) => handleEditField('observacoes', e.target.value)}
                                        className="bg-slate-700 border-slate-600 text-white min-h-[200px] text-sm"
                                    />
                                ) : (
                                    <div className="text-sm text-slate-300 whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                                        {editData.observacoes}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Action buttons */}
                        <DialogFooter className="flex gap-2 sm:gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(!isEditing)}
                                className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                                <Edit className="w-4 h-4" />
                                {isEditing ? 'Parar de Editar' : 'Editar Valores'}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </Button>

                            <Button
                                onClick={handleSave}
                                disabled={step === 'saving'}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {step === 'saving' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Confirmar e Salvar
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* DONE STATE */}
                {step === 'done' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                        <p className="text-emerald-300 font-medium">Bioimpedância salva com sucesso!</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
