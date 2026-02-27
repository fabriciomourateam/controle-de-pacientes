import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    CheckCircle,
    Clock,
    AlertTriangle,
    Play,
    Settings,
    BookOpen,
    Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { popService } from "@/services/popService";
import { PopSession, PopVersion } from "@/types/pop";

export default function PopDashboard() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<PopSession[]>([]);
    const [activeVersion, setActiveVersion] = useState<PopVersion | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [allSessions, version] = await Promise.all([
                    popService.getSessions(),
                    popService.getActiveVersion()
                ]);

                if (isMounted) {
                    setSessions(allSessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
                    setActiveVersion(version);
                }
            } catch (err) {
                console.error("Error loading dashboard data", err);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, []);

    const inProgress = sessions.filter(s => s.status === 'in_progress').length;
    const completed = sessions.filter(s => s.status === 'approved').length;
    const waitingReview = sessions.filter(s => s.status === 'ready_for_review').length;
    const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((acc, curr) => acc + curr.score, 0) / sessions.length) + "%"
        : "N/A";

    const handleDeleteSession = async (id: string) => {
        if (confirm("Deseja realmente excluir este rascunho de forma permanente?")) {
            try {
                await popService.deleteSession(id);
                setSessions(sessions.filter(s => s.id !== id));
            } catch (err) {
                console.error("Erro ao excluir sessão", err);
            }
        }
    };

    // Mocks por enquanto
    const stats = {
        activeVersion: activeVersion?.version || "N/A",
        inProgress,
        completed,
        waitingReview,
        avgScore,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard de Padronização</h2>
                    <p className="text-slate-500 mt-1">Acompanhamento e evolução profissional da equipe.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/admin/pop/execute/new')} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20 rounded-xl px-6">
                        <Play className="w-4 h-4 mr-2" />
                        Nova Montagem
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* POP Ativo */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white rounded-2xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-blue-700 transition-colors">POP Ativo</CardTitle>
                        <div className="p-2 bg-blue-100/50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{stats.activeVersion}</div>
                    </CardContent>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
                </Card>

                {/* Em Andamento */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-white rounded-2xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-amber-700 transition-colors">Em Andamento</CardTitle>
                        <div className="p-2 bg-amber-100/50 rounded-lg group-hover:bg-amber-100 transition-colors">
                            <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{stats.inProgress}</div>
                    </CardContent>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
                </Card>

                {/* Concluídas */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-white rounded-2xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700 transition-colors">Concluídas</CardTitle>
                        <div className="p-2 bg-emerald-100/50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
                    </CardContent>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                </Card>

                {/* Aguardando Revisão */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-white rounded-2xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-orange-700 transition-colors">Revisão Pendente</CardTitle>
                        <div className="p-2 bg-orange-100/50 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{stats.waitingReview}</div>
                    </CardContent>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-orange-500/5 to-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
                </Card>

                {/* Score Médio */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-white rounded-2xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700 transition-colors">Score Médio</CardTitle>
                        <div className="p-2 bg-indigo-100/50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <FileText className="h-4 w-4 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{stats.avgScore}</div>
                    </CardContent>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sessões Recentes */}
                <Card className="col-span-1 shadow-sm border-slate-100 bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Avaliações Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">Nenhuma sessão recente encontrada.</p>
                                <p className="text-sm text-slate-400 mt-1">As avaliações aparecerão aqui assim que iniciadas.</p>
                            </div>
                        ) : (
                            <div className="max-h-[450px] overflow-y-auto w-full">
                                <div className="divide-y divide-slate-100">
                                    {sessions.map(session => (
                                        <div key={session.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-slate-50 transition-colors w-full group">
                                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                                <div className="hidden sm:flex w-10 h-10 rounded-full bg-blue-100 items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                                                    {session.patient_case.name ? session.patient_case.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{session.patient_case.name || 'Paciente sem Nome'}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                                        <span className={`px-2 py-0.5 rounded-md font-medium ${session.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                                            session.status === 'ready_for_review' ? 'bg-orange-100 text-orange-700' :
                                                                session.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {session.status === 'in_progress' ? 'Em Andamento' :
                                                                session.status === 'ready_for_review' ? 'Aguardando Revisão' :
                                                                    session.status === 'approved' ? 'Aprovado' :
                                                                        session.status}
                                                        </span>
                                                        <span className="text-slate-500 flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Score: {session.score}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                {session.status === 'in_progress' && (
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteSession(session.id)} title="Excluir Rascunho">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 w-full sm:w-auto shadow-sm" onClick={() => {
                                                    if (session.status === 'ready_for_review') navigate(`/admin/pop/review/${session.id}`);
                                                    else navigate(`/admin/pop/execute/${session.id}`);
                                                }}>
                                                    {session.status === 'in_progress' ? 'Continuar' : 'Visualizar'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Atalhos */}
                <Card className="col-span-1 border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Play className="w-5 h-5 text-indigo-500" />
                            Ações Rápidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-28 flex flex-col gap-3 bg-gradient-to-br from-white to-slate-50 hover:to-blue-50 border border-slate-200 hover:border-blue-200 hover:shadow-md hover:-translate-y-1 transition-all group rounded-xl"
                                onClick={() => navigate('/admin/pop/content')}
                            >
                                <div className="p-2.5 rounded-lg bg-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="font-medium text-slate-700 group-hover:text-blue-700">Ler POP Completo</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-28 flex flex-col gap-3 bg-gradient-to-br from-white to-slate-50 hover:to-indigo-50 border border-slate-200 hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all group rounded-xl"
                                onClick={() => navigate('/admin/pop/editor')}
                            >
                                <div className="p-2.5 rounded-lg bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <span className="font-medium text-slate-700 group-hover:text-indigo-700">Modo Admin (Editor)</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
