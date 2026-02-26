import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { popService } from "@/services/popService";
import { PopSession, PopVersion, PopPatientCase } from "@/types/pop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Save, CheckCircle, ArrowLeft, AlertCircle, Check, ChevronsUpDown, Sparkles, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PopSessionExecute() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<PopSession | null>(null);
    const [version, setVersion] = useState<PopVersion | null>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [patientComboboxOpen, setPatientComboboxOpen] = useState(false);

    // State for the case summary
    const [caseData, setCaseData] = useState<PopPatientCase>({
        patient_id: "", name: "", objective: "", weight: 0, height: 0, tmb: 0,
        get_base: 0, can_weigh_food: false, intolerances: "", wake_time: "", work_time: "",
        study_time: "", training_time: "", sleep_time: "", highest_hunger_time: "", lowest_hunger_time: "",
        likes: "", dislikes: "", must_have: "", supplements: "", current_habits: "", observations: ""
    });

    // Checklist and steps status
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [calculatedScore, setCalculatedScore] = useState(0);

    // AI Suggestions
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

    // Auto-save logic
    const DRAFT_STORAGE_KEY = `@fmteam:pop_draft_${id}`;

    useEffect(() => {
        loadData();
    }, [id]);

    // Debounced Auto-Save
    useEffect(() => {
        if (loading || !version) return;

        const autoSaveTimer = setTimeout(() => {
            saveDraft(true);
        }, 3000); // Saves 3 seconds after the last change

        return () => clearTimeout(autoSaveTimer);
    }, [caseData, checkedItems, completedSteps, calculatedScore]);

    const generateSuggestions = (data: PopPatientCase) => {
        const tips: string[] = [];

        if (data.intolerances && data.intolerances.trim() !== "" && data.intolerances.toLowerCase() !== "sem dados") {
            tips.push(`⚠️ Atenção redobrada nas intolerâncias/alergias relatadas: "${data.intolerances}". Revise a isenção de ingredientes na dieta.`);
        }

        if (data.objective && data.objective.toLowerCase().includes("emagrecimento")) {
            tips.push("💡 Foco em déficit calórico. Lembre-se de calcular o GET e aplicar a restrição adequada.");
        }

        if (data.dislikes && data.dislikes.trim() !== "") {
            tips.push("💡 Evite colocar no plano os alimentos listados como 'Não Gosta'.");
        }

        setAiSuggestions(tips);
    };

    const loadData = async () => {
        setLoading(true);
        const activeVersion = popService.getActiveVersion();
        setVersion(activeVersion);

        if (id && id !== 'new') {
            const existingSession = popService.getSessionId(id);
            if (existingSession) {
                setSession(existingSession);
                setCaseData(existingSession.patient_case);
                setCheckedItems(new Set(existingSession.checked_item_ids));
                setCompletedSteps(new Set(existingSession.completed_step_ids));
                calculateScore(new Set(existingSession.checked_item_ids), activeVersion);
                generateSuggestions(existingSession.patient_case);
            } else {
                toast({ title: "Sessão não encontrada", variant: "destructive" });
                navigate('/admin/pop');
            }
        } else {
            // Check for drafts
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setSession(parsed);
                    setCaseData(parsed.patient_case);
                    setCheckedItems(new Set(parsed.checked_item_ids));
                    setCompletedSteps(new Set(parsed.completed_step_ids));
                    calculateScore(new Set(parsed.checked_item_ids), activeVersion);
                    generateSuggestions(parsed.patient_case);
                    toast({ title: "Rascunho recuperado", description: "Continuando de onde você parou." });
                } catch (e) { /* ignore corrupt draft */ }
            }
            // Load patients for new session selection
            const dbPatients = await popService.getPatientsForMock();
            setPatients(dbPatients);
        }
        setLoading(false);
    };

    const calculateScore = (checked: Set<string>, ver = version) => {
        if (!ver) return;
        const totalItems = ver.checklist_items.length;
        if (totalItems === 0) return 0;

        // Simplistic score logic: (checked / total) * 100
        const score = Math.round((checked.size / totalItems) * 100);
        setCalculatedScore(score);
        return score;
    };

    const handlePatientSelect = async (patientId: string) => {
        const p = patients.find(x => x.id === patientId);
        if (p) {
            // Optimistically update name and ID
            const newCaseData = { ...caseData, patient_id: p.id, name: p.nome };
            setCaseData(newCaseData);
            setPatientComboboxOpen(false);

            // Fetch rich data from Anamnesis and Evolution
            const richData = await popService.fetchPatientCaseData(p.id);
            const enrichedData = {
                ...newCaseData,
                ...richData,
                patient_id: p.id, // Ensure these aren't overwritten
                name: richData.name || p.nome
            };
            setCaseData(enrichedData);
            generateSuggestions(enrichedData);
        }
    };

    const handleCaseChange = (field: keyof PopPatientCase, value: any) => {
        const newData = { ...caseData, [field]: value };
        setCaseData(newData);
        if (field === 'intolerances' || field === 'objective' || field === 'dislikes') {
            generateSuggestions(newData);
        }
    };

    const toggleChecklistItem = (itemId: string) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(itemId)) newChecked.delete(itemId);
        else newChecked.add(itemId);

        setCheckedItems(newChecked);
        calculateScore(newChecked);
    };

    const saveDraft = (isAutoSave = false) => {
        if (!version) return;

        const currentUser = popService.getCurrentUser();

        const newSession: PopSession = {
            id: session?.id || crypto.randomUUID(),
            version_id: version.id,
            intern_id: currentUser?.id || "unknown",
            created_at: session?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'in_progress',
            patient_case: caseData,
            completed_step_ids: Array.from(completedSteps),
            step_notes: session?.step_notes || {},
            intern_general_notes: session?.intern_general_notes || "",
            intern_questions: session?.intern_questions || "",
            checked_item_ids: Array.from(checkedItems),
            supervisor_feedback: "",
            supervisor_adjustments: "",
            score: calculatedScore
        };

        popService.saveSession(newSession);
        setSession(newSession);

        // Also save to generic localstorage for crash recovery
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newSession));

        if (!isAutoSave) {
            toast({ title: "Rascunho salvo com sucesso." });
            if (!id || id === 'new') navigate(`/admin/pop/execute/${newSession.id}`, { replace: true });
        }
    };

    const submitForReview = () => {
        if (calculatedScore < 80) {
            toast({ title: "Atenção", description: "Score baixo. Revise os itens do checklist antes de enviar.", variant: "destructive" });
            return;
        }

        // Save state as ready_for_review
        if (!version) return;
        const currentUser = popService.getCurrentUser();
        const newSession: PopSession = {
            ...(session as object),
            id: session?.id || crypto.randomUUID(),
            version_id: version.id,
            intern_id: currentUser?.id || "unknown",
            created_at: session?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'ready_for_review',
            patient_case: caseData,
            completed_step_ids: Array.from(completedSteps),
            step_notes: session?.step_notes || {},
            intern_general_notes: session?.intern_general_notes || "",
            intern_questions: session?.intern_questions || "",
            checked_item_ids: Array.from(checkedItems),
            supervisor_feedback: session?.supervisor_feedback || "",
            supervisor_adjustments: session?.supervisor_adjustments || "",
            score: calculatedScore
        } as PopSession;

        // Clean up draft cache
        localStorage.removeItem(DRAFT_STORAGE_KEY);

        popService.saveSession(newSession);
        toast({ title: "Enviado para revisão!" });
        navigate('/admin/pop');
    };

    if (loading) return <div>Carregando...</div>;
    if (!version) return <div>POP não encontrado.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pop')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold">
                            {id === 'new' ? 'Nova Montagem' : `Montagem: ${caseData.name || 'Sem nome'}`}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {session?.status === 'ready_for_review' ? 'Aguardando Revisão' : 'Em andamento'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${calculatedScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        Score: {calculatedScore}%
                    </div>
                    <Button variant="outline" onClick={() => saveDraft(false)}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Rascunho
                    </Button>
                    <Button onClick={submitForReview} disabled={calculatedScore < 80} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Enviar p/ Revisão
                    </Button>
                </div>
            </div>

            {/* SPLIT VIEW */}
            <div className="flex-1 flex gap-6 overflow-hidden">

                {/* LEFT PANEL: CASE SUMMARY (Scrollable) */}
                <div className="w-1/3 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col overflow-hidden relative">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-800 flex justify-between items-center">
                        <span>Resumo do Caso (Aluno)</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Auto-save ativo
                        </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
                        {aiSuggestions.length > 0 && (
                            <div className="mb-4 space-y-2 bg-indigo-50/80 border border-indigo-100 rounded-lg p-3">
                                <h4 className="text-indigo-800 font-bold text-xs uppercase flex items-center gap-1 mb-2">
                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                    Dicas InShape Express
                                </h4>
                                {aiSuggestions.map((suggestion, idx) => (
                                    <p key={idx} className="text-indigo-700 text-xs leading-relaxed">
                                        {suggestion}
                                    </p>
                                ))}
                            </div>
                        )}

                        {(!session || id === 'new') && (
                            <div className="space-y-2 flex flex-col">
                                <Label>Selecionar Paciente (Opcional)</Label>
                                <Popover open={patientComboboxOpen} onOpenChange={setPatientComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={patientComboboxOpen}
                                            className="w-full justify-between"
                                        >
                                            {caseData.patient_id
                                                ? patients.find((p) => p.id === caseData.patient_id)?.nome
                                                : "Digite para buscar um paciente..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar paciente por nome..." />
                                            <CommandList>
                                                <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {patients.map((p) => (
                                                        <CommandItem
                                                            key={p.id}
                                                            value={p.nome}
                                                            onSelect={() => handlePatientSelect(p.id)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    caseData.patient_id === p.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {p.nome}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Nome do Aluno</Label>
                            <Input value={caseData.name} onChange={e => handleCaseChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Objetivo Principal</Label>
                            <Input value={caseData.objective} onChange={e => handleCaseChange('objective', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Peso (kg)</Label>
                                <Input type="number" value={caseData.weight || ''} onChange={e => handleCaseChange('weight', parseFloat(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Altura (cm)</Label>
                                <Input type="number" value={caseData.height || ''} onChange={e => handleCaseChange('height', parseFloat(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>TMB Calculada</Label>
                                <Input type="number" value={caseData.tmb || ''} onChange={e => handleCaseChange('tmb', parseFloat(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>GET Base</Label>
                                <Input type="number" value={caseData.get_base || ''} onChange={e => handleCaseChange('get_base', parseFloat(e.target.value))} />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="weigh_food" checked={caseData.can_weigh_food} onCheckedChange={(c) => handleCaseChange('can_weigh_food', !!c)} />
                            <Label htmlFor="weigh_food">Consegue pesar alimentos?</Label>
                        </div>

                        <div className={cn(
                            "space-y-2 p-3 rounded-lg border transition-colors",
                            caseData.intolerances && caseData.intolerances.trim() !== "" && caseData.intolerances.toLowerCase() !== "sem dados"
                                ? "bg-red-50 border-red-200"
                                : "bg-transparent border-transparent"
                        )}>
                            <Label className={cn(
                                "flex items-center gap-2",
                                caseData.intolerances && caseData.intolerances.trim() !== "" && caseData.intolerances.toLowerCase() !== "sem dados"
                                    ? "text-red-700 font-bold"
                                    : "text-slate-700"
                            )}>
                                Restrições / Intolerâncias
                                {caseData.intolerances && caseData.intolerances.trim() !== "" && caseData.intolerances.toLowerCase() !== "sem dados" && (
                                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                                )}
                            </Label>
                            <Input
                                value={caseData.intolerances}
                                onChange={e => handleCaseChange('intolerances', e.target.value)}
                                className={cn(
                                    caseData.intolerances && caseData.intolerances.trim() !== "" && caseData.intolerances.toLowerCase() !== "sem dados"
                                        ? "border-red-300 bg-white text-red-800 font-medium focus-visible:ring-red-500"
                                        : ""
                                )}
                            />
                        </div>

                        <hr className="my-4" />
                        <h4 className="font-semibold text-slate-700">Rotina & Horários</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Acorda</Label>
                                <Input type="time" value={caseData.wake_time} onChange={e => handleCaseChange('wake_time', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Dorme</Label>
                                <Input type="time" value={caseData.sleep_time} onChange={e => handleCaseChange('sleep_time', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Trabalho</Label>
                                <Input value={caseData.work_time} onChange={e => handleCaseChange('work_time', e.target.value)} placeholder="09:00 as 18:00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Treino</Label>
                                <Input value={caseData.training_time} onChange={e => handleCaseChange('training_time', e.target.value)} placeholder="19:00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Maior Fome</Label>
                                <Input value={caseData.highest_hunger_time} onChange={e => handleCaseChange('highest_hunger_time', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Menor Fome</Label>
                                <Input value={caseData.lowest_hunger_time} onChange={e => handleCaseChange('lowest_hunger_time', e.target.value)} />
                            </div>
                        </div>

                        <hr className="my-4" />
                        <h4 className="font-semibold text-slate-700">Preferências Alimentares</h4>
                        <div className="space-y-2">
                            <Label>Alimentos que Gosta</Label>
                            <Textarea value={caseData.likes} onChange={e => handleCaseChange('likes', e.target.value)} className="min-h-[60px]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Alimentos que NÃO Gosta</Label>
                            <Textarea value={caseData.dislikes} onChange={e => handleCaseChange('dislikes', e.target.value)} className="min-h-[60px]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Faz questão de ter</Label>
                            <Textarea value={caseData.must_have} onChange={e => handleCaseChange('must_have', e.target.value)} className="min-h-[60px]" />
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: POP Execution (Tabs) */}
                <div className="w-2/3 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col overflow-hidden">
                    <Tabs defaultValue="steps" className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="steps">1. Execução POP</TabsTrigger>
                                <TabsTrigger value="checklist">
                                    2. Checklist Final
                                    {calculatedScore < 80 ? (
                                        <AlertCircle className="w-3 h-3 ml-2 text-red-500 inline" />
                                    ) : (
                                        <CheckCircle className="w-3 h-3 ml-2 text-emerald-500 inline" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="errors">
                                    <span className="text-red-600 font-medium">3. Erros Comuns</span>
                                </TabsTrigger>
                                <TabsTrigger value="notes">Anotações Internas</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* TAB: STEPS */}
                        <TabsContent value="steps" className="flex-1 overflow-y-auto p-4 m-0 data-[state=active]:block data-[state=inactive]:hidden">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500 mb-6">Siga rigorosamente as etapas operacionais abaixo enquanto monta o plano no WebDiet.</p>
                                <Accordion type="single" collapsible className="w-full">
                                    {version.steps.map(step => (
                                        <AccordionItem key={step.id} value={step.id} className="bg-slate-50 border border-slate-200 rounded-lg mb-3 px-2">
                                            <AccordionTrigger className="hover:no-underline hover:bg-slate-100 px-4 py-3 rounded-lg">
                                                <span className="font-bold text-base text-slate-800 text-left">
                                                    {step.title}
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-5 pb-5 pt-3 border-t border-slate-100">
                                                <div className="text-[15px] leading-relaxed text-slate-700 space-y-4 prose prose-sm max-w-none
                                                    prose-p:mb-2 prose-ul:my-2 prose-ul:pl-6 prose-li:mb-1 prose-li:leading-relaxed prose-strong:text-slate-900"
                                                    dangerouslySetInnerHTML={{ __html: step.content }}
                                                />
                                                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-2">
                                                    <Checkbox
                                                        id={`step-${step.id}`}
                                                        checked={completedSteps.has(step.id)}
                                                        onCheckedChange={(c) => {
                                                            const ns = new Set(completedSteps);
                                                            if (c) ns.add(step.id); else ns.delete(step.id);
                                                            setCompletedSteps(ns);
                                                        }}
                                                    />
                                                    <Label htmlFor={`step-${step.id}`} className="text-slate-700 font-medium cursor-pointer">Marcar etapa como concluída</Label>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </TabsContent>

                        {/* TAB: CHECKLIST */}
                        <TabsContent value="checklist" className="flex-1 overflow-y-auto p-4 m-0 data-[state=active]:block data-[state=inactive]:hidden">
                            <div className="space-y-8">
                                {version.checklist_categories.map(category => {
                                    const items = version.checklist_items.filter(i => i.category_id === category.id);
                                    if (items.length === 0) return null;

                                    return (
                                        <div key={category.id} className="space-y-3">
                                            <h3 className="font-bold text-slate-800 border-b pb-1">{category.name}</h3>
                                            <div className="space-y-2">
                                                {items.map(item => (
                                                    <div key={item.id} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                                                        <Checkbox
                                                            id={`check-${item.id}`}
                                                            checked={checkedItems.has(item.id)}
                                                            onCheckedChange={() => toggleChecklistItem(item.id)}
                                                            className="mt-1"
                                                        />
                                                        <Label
                                                            htmlFor={`check-${item.id}`}
                                                            className={`text-sm cursor-pointer leading-tight ${checkedItems.has(item.id) ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                        >
                                                            {item.text}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </TabsContent>

                        {/* TAB: ERRORS */}
                        <TabsContent value="errors" className="flex-1 overflow-y-auto p-4 m-0 data-[state=active]:block data-[state=inactive]:hidden">
                            <div className="space-y-6">
                                <p className="text-sm text-slate-500">
                                    Leia os erros abaixo cometidos com mais frequência pela equipe. Entenda o impacto de cada um e valide se você está evitando-os.
                                </p>

                                {version.common_errors.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">Nenhum erro comum cadastrado.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {version.common_errors.map(err => (
                                            <div key={err.id} className="border border-red-100 bg-red-50/30 rounded-lg p-4">
                                                <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {err.title}
                                                </h4>

                                                <div className="mt-3 space-y-3 text-sm">
                                                    <div>
                                                        <span className="font-semibold text-slate-700 block text-xs uppercase mb-1">Impacto no Paciente</span>
                                                        <p className="text-slate-600">{err.impact}</p>
                                                    </div>

                                                    <div>
                                                        <span className="font-semibold text-emerald-700 block text-xs uppercase mb-1">Como Evitar</span>
                                                        <p className="text-slate-600">{err.how_to_avoid}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* TAB: NOTES */}
                        <TabsContent value="notes" className="flex-1 overflow-y-auto p-4 m-0 space-y-6">
                            <div className="space-y-2">
                                <Label>O que foi difícil nesta montagem?</Label>
                                <Textarea placeholder="Minhas observações da montagem..." className="min-h-[150px]" />
                            </div>
                            <div className="space-y-2">
                                <Label>Dúvidas para o Supervisor</Label>
                                <Textarea placeholder="Tem alguma dúvida antes da aprovação?" className="min-h-[150px]" />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
