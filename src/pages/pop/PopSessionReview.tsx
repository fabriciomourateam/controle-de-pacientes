import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { popService } from "@/services/popService";
import { PopSession, PopVersion } from "@/types/pop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PopSessionReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [session, setSession] = useState<PopSession | null>(null);
    const [version, setVersion] = useState<PopVersion | null>(null);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (id) {
            const s = popService.getSessionId(id);
            if (s) {
                setSession(s);
                setFeedback(s.supervisor_feedback || "");
                const allVers = popService.getVersions();
                setVersion(allVers.find(v => v.id === s.version_id) || null);
            }
        }
    }, [id]);

    const handleReview = (approved: boolean) => {
        if (!session) return;
        const currentUser = popService.getCurrentUser();

        const updated: PopSession = {
            ...session,
            supervisor_id: currentUser?.id,
            supervisor_feedback: feedback,
            status: approved ? 'approved' : 'in_correction',
            updated_at: new Date().toISOString()
        };

        popService.saveSession(updated);
        setSession(updated);
        toast({
            title: approved ? "Montagem Aprovada!" : "Enviado para Correção",
            variant: approved ? "default" : "destructive"
        });
        navigate('/admin/pop');
    };

    if (!session || !version) return <div className="p-8">Carregando Sessão...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pop')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Revisão: {session.patient_case.name || 'Paciente Sem Nome'}
                        </h2>
                        <div className="flex gap-2 items-center mt-1">
                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                {session.status === 'approved' ? 'Aprovado' : session.status === 'in_correction' ? 'Em Correção' : 'Aguardando Avaliação'}
                            </span>
                            <span className="text-xs text-slate-500">
                                Score: {session.score}%
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => handleReview(false)} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        <XCircle className="w-4 h-4 mr-2" />
                        Corrigir
                    </Button>
                    <Button onClick={() => handleReview(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar Montagem
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* LADO ESQUERDO: INFOS DO ALUNO */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="py-4 border-b bg-slate-50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Search className="w-4 h-4" /> Resumo do Paciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3 text-sm">
                            <div><span className="font-semibold">Objetivo:</span> {session.patient_case.objective || '-'}</div>
                            <div><span className="font-semibold">Peso/Alt:</span> {session.patient_case.weight}kg / {session.patient_case.height}cm</div>
                            <div><span className="font-semibold">TMB/GET:</span> {session.patient_case.tmb} / {session.patient_case.get_base}kcal</div>
                            <div><span className="font-semibold">Balança:</span> {session.patient_case.can_weigh_food ? 'Sim' : 'Medidas Caseiras'}</div>
                            <hr />
                            <div><span className="font-semibold text-xs text-slate-500 block uppercase mb-1">Dificuldades do Estagiário:</span>
                                {session.intern_general_notes || 'Nenhuma nota informada.'}
                            </div>
                            <div><span className="font-semibold text-xs text-slate-500 block uppercase mb-1">Dúvidas:</span>
                                {session.intern_questions || 'Nenhuma dúvida.'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200">
                        <CardHeader className="py-4 border-b bg-blue-50/50">
                            <CardTitle className="text-sm font-bold text-blue-900">Feedback do Supervisor</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Label>Deixe seu parecer ou ajustes necessários:</Label>
                            <Textarea
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                className="mt-2 min-h-[150px]"
                                placeholder="Exemplo: Faltou ajustar o jantar para ter mais volume, e esqueceu de tirar a azeitona que o aluno não gosta."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* LADO DIREITO: CHECKLIST DO ESTAGIÁRIO */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="py-4 border-b bg-slate-50">
                            <CardTitle className="text-sm font-bold">Checklist Preenchido ({session.score}%)</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6">
                            {version.checklist_categories.map(cat => {
                                const items = version.checklist_items.filter(i => i.category_id === cat.id);
                                if (items.length === 0) return null;

                                return (
                                    <div key={cat.id}>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">{cat.name}</h3>
                                        <div className="space-y-2">
                                            {items.map(item => {
                                                const checked = session.checked_item_ids.includes(item.id);
                                                return (
                                                    <div key={item.id} className="flex gap-3 items-start">
                                                        <div className="mt-0.5">
                                                            {checked ?
                                                                <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                                                                <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-100" />
                                                            }
                                                        </div>
                                                        <span className={`text-sm ${checked ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                                                            {item.text}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
