import { useState, useEffect } from "react";
import { popService } from "@/services/popService";
import { PopVersion } from "@/types/pop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, Trash2, Shield, History, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { RichTextEditor } from "@/components/diets/RichTextEditor";
import { Label } from "@/components/ui/label";
import { seedPopData } from "@/utils/seedPopData";

export default function PopEditor() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [version, setVersion] = useState<PopVersion | null>(null);

    useEffect(() => {
        // Clone active version to edit as a new draft - deep clone to avoid mutating local storage pointer
        let active = popService.getActiveVersion();

        if (!active) {
            seedPopData();
            active = popService.getActiveVersion();
        }

        if (active) {
            const deepClone = JSON.parse(JSON.stringify(active));
            setVersion({ ...deepClone, id: crypto.randomUUID(), version: "v" + (parseFloat(active.version.replace('v', '')) + 0.1).toFixed(1) });
        }
    }, []);

    const handleSave = () => {
        if (!version) return;
        popService.saveVersion(version);
        toast({ title: "Nova versão do POP publicada!", description: `Versão ${version.version} agora está ativa.` });
    };

    const handleReset = () => {
        if (confirm("ATENÇÃO: Isso vai apagar todas as edições do POP e restaurar os textos originais de fábrica. Confirmar?")) {
            localStorage.removeItem('@fmteam:pop_versions');
            localStorage.removeItem('@fmteam:pop_sessions');
            window.location.reload();
        }
    };

    if (!version) return <div className="p-8 text-center">Carregando editor...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pop')} className="-ml-2 hover:bg-slate-100">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="p-3 bg-slate-800 rounded-lg text-white">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Editor do POP (Admin)</h2>
                        <p className="text-slate-500 text-sm">Crie uma nova versão editando os parâmetros abaixo.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Input
                        value={version.version}
                        onChange={e => setVersion({ ...version, version: e.target.value })}
                        className="w-24 font-mono font-bold"
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate('/admin/pop')}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleReset} className="hidden sm:inline-flex">
                            Restaurar de Fábrica
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            Publicar Alterações
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="steps">
                <TabsList className="mb-4">
                    <TabsTrigger value="steps">Etapas Operacionais</TabsTrigger>
                    <TabsTrigger value="checklist">Checklist Final</TabsTrigger>
                    <TabsTrigger value="errors">Erros Comuns</TabsTrigger>
                    <TabsTrigger value="settings">Padrões da Equipe</TabsTrigger>
                </TabsList>

                <TabsContent value="steps" className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => {
                            const newSteps = [...version.steps];
                            newSteps.push({
                                id: crypto.randomUUID(),
                                order: newSteps.length + 1,
                                title: "Nova Etapa",
                                is_active: true,
                                content: ""
                            });
                            setVersion({ ...version, steps: newSteps });
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> Nova Etapa
                        </Button>
                    </div>
                    {version.steps.map((step, idx) => (
                        <Card key={step.id}>
                            <CardHeader className="py-3 flex flex-row items-center justify-between border-b bg-slate-50">
                                <Input
                                    value={step.title}
                                    onChange={e => {
                                        const newSteps = [...version.steps];
                                        newSteps[idx] = { ...newSteps[idx], title: e.target.value };
                                        setVersion({ ...version, steps: newSteps });
                                    }}
                                    className="font-bold border-transparent bg-transparent hover:border-slate-300 focus:bg-white w-full max-w-lg"
                                />
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => {
                                    const newSteps = version.steps.filter(s => s.id !== step.id);
                                    // Reorder remaining steps
                                    newSteps.forEach((s, i) => s.order = i + 1);
                                    setVersion({ ...version, steps: newSteps });
                                }}><Trash2 className="w-4 h-4" /></Button>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Label className="block mb-2 text-sm font-semibold text-slate-700">Conteúdo da Etapa</Label>
                                <RichTextEditor
                                    value={step.content}
                                    onChange={val => {
                                        const newSteps = [...version.steps];
                                        newSteps[idx] = { ...newSteps[idx], content: val };
                                        setVersion({ ...version, steps: newSteps });
                                    }}
                                    resizable={true}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="checklist" className="space-y-6">
                    {version.checklist_categories.map(cat => (
                        <div key={cat.id} className="border rounded-xl p-4 bg-white shadow-sm">
                            <h3 className="font-bold text-lg mb-4">{cat.name}</h3>
                            <div className="space-y-2">
                                {version.checklist_items.filter(i => i.category_id === cat.id).map(item => (
                                    <div key={item.id} className="flex gap-2 items-center">
                                        <Input
                                            value={item.text}
                                            onChange={e => {
                                                const newItems = version.checklist_items.map(x =>
                                                    x.id === item.id ? { ...x, text: e.target.value } : x
                                                );
                                                setVersion({ ...version, checklist_items: newItems });
                                            }}
                                            className="flex-1"
                                        />
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                                            const newItems = version.checklist_items.filter(i => i.id !== item.id);
                                            setVersion({ ...version, checklist_items: newItems });
                                        }}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="mt-2 text-blue-600" onClick={() => {
                                    const newItems = [...version.checklist_items];
                                    newItems.push({
                                        id: crypto.randomUUID(),
                                        category_id: cat.id,
                                        text: "Novo Item de Checklist",
                                        is_mandatory: true
                                    });
                                    setVersion({ ...version, checklist_items: newItems });
                                }}>
                                    <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                                </Button>
                            </div>
                        </div>
                    ))}
                </TabsContent>

                <TabsContent value="errors" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {version.common_errors.map((err, idx) => (
                            <Card key={err.id}>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <Input
                                            value={err.title}
                                            onChange={e => {
                                                const newErr = [...version.common_errors];
                                                newErr[idx] = { ...newErr[idx], title: e.target.value };
                                                setVersion({ ...version, common_errors: newErr });
                                            }}
                                        />
                                        <Button variant="ghost" size="icon" className="text-red-500 mt-6" onClick={() => {
                                            const newErr = version.common_errors.filter(e => e.id !== err.id);
                                            setVersion({ ...version, common_errors: newErr });
                                        }}><Trash2 className="w-4 h-4" /></Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">Impacto</span>
                                        <Textarea
                                            value={err.impact}
                                            onChange={e => {
                                                const newErr = [...version.common_errors];
                                                newErr[idx] = { ...newErr[idx], impact: e.target.value };
                                                setVersion({ ...version, common_errors: newErr });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">Como Evitar</span>
                                        <Textarea
                                            value={err.how_to_avoid}
                                            onChange={e => {
                                                const newErr = [...version.common_errors];
                                                newErr[idx] = { ...newErr[idx], how_to_avoid: e.target.value };
                                                setVersion({ ...version, common_errors: newErr });
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <p className="text-slate-500">Configurações globais adicionais e versionamento virão aqui na V2.</p>
                </TabsContent>

            </Tabs>
        </div>
    );
}
