import React, { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Copy, Save, Loader2, Calendar as CalendarIcon, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { workspaceService, WorkspaceSchedule, STANDARD_WEEK_DATE } from "@/lib/workspace-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 to 22
const DAYS = [0, 1, 2, 3, 4, 5, 6]; // Monday (0) to Sunday (6) mapped later
const DAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export function WeeklyPlanner() {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [mode, setMode] = useState<'standard' | 'calendar'>('standard');
    const [schedules, setSchedules] = useState<WorkspaceSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [people, setPeople] = useState<{ id: string, name: string, color: string }[]>([]);
    const [manageTeamOpen, setManageTeamOpen] = useState(false);
    const [newPersonName, setNewPersonName] = useState("");
    const [newPersonColor, setNewPersonColor] = useState("#f59e0b"); // Default amber

    // Edit State - linking to Person ID
    const [editingSlot, setEditingSlot] = useState<{ day: number, hour: number, id?: string } | null>(null);
    const [selectedPersonId, setSelectedPersonId] = useState<string>("");
    const [editTask, setEditTask] = useState("");

    // Copy State
    const [copiedSlot, setCopiedSlot] = useState<{ personId: string, task: string } | null>(null);

    useEffect(() => {
        loadSchedules();
        loadPeople();
    }, [currentWeekStart, mode]);

    const loadPeople = async () => {
        try {
            const data = await workspaceService.getPeople();
            setPeople(data);
        } catch (error) {
            console.error("Error loading people:", error);
        }
    };

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const dateKey = mode === 'standard'
                ? STANDARD_WEEK_DATE
                : format(currentWeekStart, 'yyyy-MM-dd');

            const data = await workspaceService.getSchedules(dateKey);
            setSchedules(data);
        } catch (error) {
            console.error("Error loading schedules:", error);
            toast({ title: "Erro ao carregar agenda", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddPerson = async () => {
        if (!newPersonName.trim()) return;
        try {
            await workspaceService.addPerson(newPersonName, newPersonColor);
            setNewPersonName("");
            loadPeople();
            toast({ title: "Pessoa adicionada com sucesso" });
        } catch (error) {
            toast({ title: "Erro ao adicionar pessoa", variant: "destructive" });
        }
    };

    const handleDeletePerson = async (id: string) => {
        try {
            await workspaceService.deletePerson(id);
            loadPeople();
            toast({ title: "Pessoa removida" });
        } catch (error) {
            toast({ title: "Erro ao remover pessoa", variant: "destructive" });
        }
    };

    const handleSave = async () => {
        if (!editingSlot || !selectedPersonId) {
            toast({ title: "Selecione uma pessoa", variant: "destructive" });
            return;
        }

        const person = people.find(p => p.id === selectedPersonId);

        try {
            const dateKey = mode === 'standard'
                ? STANDARD_WEEK_DATE
                : format(currentWeekStart, 'yyyy-MM-dd');

            await workspaceService.saveSchedule({
                id: editingSlot.id, // For update if exists, though upsert handles by keys
                week_start_date: dateKey,
                day_of_week: editingSlot.day,
                hour: editingSlot.hour,
                person_id: selectedPersonId,
                person_name: person?.name || "Desconhecido", // Fallback/Legacy
                task_description: editTask
            });

            setEditingSlot(null);
            loadSchedules();
            toast({ title: "Salvo com sucesso" });
        } catch (error) {
            toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    };

    const handleDeleteSchedule = async () => {
        if (!editingSlot?.id) return;
        try {
            await workspaceService.deleteSchedule(editingSlot.id);
            setEditingSlot(null);
            loadSchedules();
            toast({ title: "Agendamento removido" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    }

    const getSchedule = (day: number, hour: number) => {
        return schedules.find(s => s.day_of_week === day && s.hour === hour);
    };

    const handleSlotClick = (day: number, hour: number) => {
        const existing = getSchedule(day, hour);

        // If clicking an existing slot, populate data. 
        // If it's a new slot, clear data.
        if (existing) {
            setSelectedPersonId(existing.person_id || people.find(p => p.name === existing.person_name)?.id || "");
            setEditTask(existing.task_description || "");
            setEditingSlot({ day, hour, id: existing.id });
        } else {
            setSelectedPersonId("");
            setEditTask("");
            setEditingSlot({ day, hour });
        }
    };

    const handlePaste = async (day: number, hour: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!copiedSlot) return;

        const person = people.find(p => p.id === copiedSlot.personId);

        try {
            const dateKey = mode === 'standard'
                ? STANDARD_WEEK_DATE
                : format(currentWeekStart, 'yyyy-MM-dd');

            await workspaceService.saveSchedule({
                week_start_date: dateKey,
                day_of_week: day,
                hour: hour,
                person_id: copiedSlot.personId,
                person_name: person?.name || "Desconhecido",
                task_description: copiedSlot.task
            });
            loadSchedules();
        } catch (error) {
            toast({ title: "Erro ao colar", variant: "destructive" });
        }
    };

    const handleImportStandard = async () => {
        if (mode === 'standard') return;

        try {
            const dateKey = format(currentWeekStart, 'yyyy-MM-dd');
            await workspaceService.importFromStandard(dateKey);
            loadSchedules();
            toast({ title: "Importado da semana padrão com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao importar", variant: "destructive" });
        }
    };

    // Helper to get person color
    const getPersonColor = (personId?: string | null, personName?: string | null) => {
        if (personId) {
            const person = people.find(p => p.id === personId);
            return person ? person.color : '#cbd5e1';
        }
        // Fallback for legacy data without ID
        if (personName) {
            const person = people.find(p => p.name === personName);
            return person ? person.color : '#cbd5e1';
        }
        return '#cbd5e1';
    };

    return (
        <div className="space-y-4 h-full flex flex-col p-2">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-200 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                    <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full sm:w-auto">
                        <TabsList className="bg-slate-300/50 p-1 rounded-lg">
                            <TabsTrigger value="standard" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 transition-all text-xs font-bold px-4 py-1.5 gap-2 text-slate-600">
                                <LayoutTemplate className="w-3.5 h-3.5" />
                                SEMANA PADRÃO
                            </TabsTrigger>
                            <TabsTrigger value="calendar" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 transition-all text-xs font-bold px-4 py-1.5 gap-2 text-slate-600">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                CALENDÁRIO
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setManageTeamOpen(true)}
                        className="h-8 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 hover:text-white border-transparent shadow-sm transition-all"
                    >
                        Gerenciar Time
                    </Button>
                </div>

                {mode === 'calendar' && (
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-300 shadow-sm relative z-10">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-slate-600 hover:text-amber-600" onClick={() => setCurrentWeekStart(d => subWeeks(d, 1))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-bold min-w-[150px] text-center text-sm tracking-wide uppercase text-slate-900">
                            {format(currentWeekStart, "dd MMM", { locale: ptBR })} - {format(addWeeks(currentWeekStart, 0), "dd MMM", { locale: ptBR })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-slate-600 hover:text-amber-600" onClick={() => setCurrentWeekStart(d => addWeeks(d, 1))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-2 relative z-10">
                    {mode === 'calendar' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-950 transition-colors shadow-sm"
                            onClick={handleImportStandard}
                        >
                            <Copy className="w-3.5 h-3.5 mr-2" />
                            Importar Padrão
                        </Button>
                    )}
                    {copiedSlot && (
                        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 bg-emerald-200 px-3 py-1.5 rounded-full border border-emerald-300 shadow-sm animate-fadeIn cursor-pointer hover:bg-emerald-300 transition-colors" onClick={() => setCopiedSlot(null)} title="Clique para cancelar">
                            <Copy className="w-3.5 h-3.5" />
                            COPIADO! <span className="font-normal opacity-80">(Clique nos espaços vazios para colar)</span>
                            <span className="ml-1 text-xs hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center">×</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Planner Grid Container */}
            <div className="flex-1 overflow-hidden rounded-xl border border-slate-300 shadow-xl bg-white relative flex flex-col">
                <div className="overflow-auto scrollbar-hide flex-1">
                    <div className="min-w-[800px]">
                        {/* Grid Header */}
                        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-white sticky top-0 z-30 shadow-sm border-b-2 border-amber-400">
                            <div className="p-2 text-[10px] font-bold text-center text-slate-500 uppercase tracking-widest border-r border-slate-100 flex items-center justify-center bg-slate-100">
                                HORA
                            </div>
                            {DAYS.map((day, i) => {
                                const isToday = mode === 'calendar' && isSameDay(new Date(), addWeeks(currentWeekStart, 0));
                                return (
                                    <div key={day} className={cn(
                                        "py-2 px-1 text-center border-r border-slate-100 last:border-r-0 transition-colors flex flex-col justify-center items-center",
                                        isToday ? "bg-amber-50" : "bg-white"
                                    )}>
                                        <div className={cn(
                                            "text-xs font-bold uppercase tracking-widest",
                                            isToday ? "text-amber-700" : "text-slate-700"
                                        )}>
                                            {DAY_LABELS[i]}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid Body */}
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                <span className="text-sm font-medium tracking-wide">CARREGANDO AGENDA...</span>
                            </div>
                        ) : (
                            HOURS.map(hour => (
                                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 last:border-b-0 group/row min-h-[50px]">
                                    {/* Time Column */}
                                    <div className="text-xs font-bold text-center text-slate-500 border-r border-slate-100 bg-slate-50/50 flex items-center justify-center group-hover/row:bg-amber-50/10 transition-colors">
                                        {hour}:00
                                    </div>
                                    {/* Days Columns */}
                                    {DAYS.map(day => {
                                        const schedule = getSchedule(day, hour);
                                        const hasContent = !!schedule;
                                        const color = getPersonColor(schedule?.person_id, schedule?.person_name);

                                        return (
                                            <div
                                                key={day}
                                                className={cn(
                                                    "border-r border-slate-100 last:border-r-0 relative group/cell transition-all duration-200",
                                                    !hasContent && "hover:bg-slate-50 cursor-pointer"
                                                )}
                                                onClick={() => handleSlotClick(day, hour)}
                                            >
                                                {hasContent ? (
                                                    <div
                                                        className="absolute inset-1 rounded-md bg-white border shadow-sm p-1.5 hover:shadow-md hover:scale-[1.02] hover:z-10 transition-all duration-200 cursor-pointer overflow-hidden group/card"
                                                        style={{ borderColor: color, borderLeftWidth: '4px' }}
                                                    >
                                                        <div className="relative z-10 flex flex-col h-full justify-center pointer-events-none"> {/* Content pointer-events-none to prevent interfering with button overlay? No, allow selection? */}
                                                            <div className="font-bold text-slate-800 text-[11px] leading-tight flex items-center gap-1.5 truncate">
                                                                <span className="truncate">{schedule.person_name}</span>
                                                            </div>
                                                            {schedule.task_description && (
                                                                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight truncate opacity-90">
                                                                    {schedule.task_description}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Expand Icon / Actions Overlay on Hover */}
                                                        {/* Fix: Added pointer-events-none to container and pointer-events-auto to button */}
                                                        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/90 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-end pr-1 pointer-events-none">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 hover:bg-slate-100 rounded-full pointer-events-auto shadow-sm border border-slate-100 bg-white"
                                                                style={{ color: color }}
                                                                title="Copiar"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCopiedSlot({ personId: schedule.person_id || '', task: schedule.task_description || '' });
                                                                    toast({ title: "Copiado!" });
                                                                }}
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Empty State Actions */
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 pointer-events-none group-hover/cell:pointer-events-auto">
                                                        {copiedSlot && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 shadow-sm border border-emerald-200 p-0 transform scale-90 hover:scale-100 transition-all"
                                                                title="Colar"
                                                                onClick={(e) => handlePaste(day, hour, e)}
                                                            >
                                                                <Copy className="h-3.5 w-3.5 rotate-180" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Editar Horário */}
            <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
                <DialogContent className="sm:max-w-[425px] border-none shadow-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800">
                            <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                                <LayoutTemplate className="w-4 h-4" />
                            </div>
                            Editar Horário <span className="text-slate-400 font-normal">| {editingSlot?.hour}:00</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaborador</Label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                value={selectedPersonId}
                                onChange={(e) => setSelectedPersonId(e.target.value)}
                            >
                                <option value="" disabled>Selecione...</option>
                                {people.map(p => (
                                    <option key={p.id} value={p.id} style={{ color: p.color, fontWeight: 'bold' }}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="task" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Atividade</Label>
                            <Textarea
                                id="task"
                                value={editTask}
                                onChange={(e) => setEditTask(e.target.value)}
                                className="bg-white border-slate-200 text-slate-900 focus:border-amber-400 focus:ring-amber-400/20 transition-all min-h-[80px] resize-none"
                                placeholder="Descrição da tarefa..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 flex justify-between items-center sm:justify-between w-full">
                        {editingSlot?.id ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSchedule}
                                className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none"
                            >
                                Excluir
                            </Button>
                        ) : <div></div>}
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setEditingSlot(null)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cancelar</Button>
                            <Button onClick={handleSave} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg border-0 transition-all">Salvar Alterações</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Gerenciar Time */}
            <Dialog open={manageTeamOpen} onOpenChange={setManageTeamOpen}>
                <DialogContent className="sm:max-w-[400px] border-none shadow-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Time</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Nome da pessoa..."
                                value={newPersonName}
                                onChange={e => setNewPersonName(e.target.value)}
                                className="bg-white text-slate-900 border-slate-200"
                            />
                            <input
                                type="color"
                                value={newPersonColor}
                                onChange={e => setNewPersonColor(e.target.value)}
                                className="w-10 h-10 p-0 rounded cursor-pointer border-none"
                            />
                            <Button size="icon" onClick={handleAddPerson} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white">
                                <Save className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                            {people.length === 0 && (
                                <div className="p-4 text-center text-sm text-slate-400">Nenhuma pessoa cadastrada.</div>
                            )}
                            {people.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 border-b last:border-b-0 bg-slate-50/50 hover:bg-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                                        <span className="text-sm font-medium text-slate-700">{p.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => handleDeletePerson(p.id)}>
                                        <div className="sr-only">Delete</div>
                                        <span aria-hidden>true</span>
                                        <span className="text-lg leading-none">×</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
