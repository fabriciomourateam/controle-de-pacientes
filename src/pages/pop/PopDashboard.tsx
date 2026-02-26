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
    BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { popService } from "@/services/popService";
import { PopSession, PopVersion } from "@/types/pop";

export default function PopDashboard() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<PopSession[]>([]);
    const [activeVersion, setActiveVersion] = useState<PopVersion | null>(null);

    useEffect(() => {
        setSessions(popService.getSessions().sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
        setActiveVersion(popService.getActiveVersion());
    }, []);

    const inProgress = sessions.filter(s => s.status === 'in_progress').length;
    const completed = sessions.filter(s => s.status === 'approved').length;
    const waitingReview = sessions.filter(s => s.status === 'ready_for_review').length;
    const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((acc, curr) => acc + curr.score, 0) / sessions.length) + "%"
        : "N/A";

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard de Treinamento</h2>
                    <p className="text-slate-500">Acompanhamento e padronização das montagens de dieta.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/admin/pop/execute/new')} className="bg-amber-500 hover:bg-amber-600">
                        <Play className="w-4 h-4 mr-2" />
                        Nova Montagem
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">POP Ativo</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeVersion}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aguardando Revisão</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.waitingReview}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
                        <FileText className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgScore}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sessões Recentes */}
                <Card className="col-span-1 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Sessões Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-8">
                                Nenhuma sessão recente encontrada.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.slice(0, 5).map(session => (
                                    <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                                        <div>
                                            <p className="font-semibold text-sm">{session.patient_case.name || 'Paciente s/ Nome'}</p>
                                            <p className="text-xs text-slate-500">
                                                Status: {session.status} | Score: {session.score}%
                                            </p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => {
                                            if (session.status === 'ready_for_review') navigate(`/admin/pop/review/${session.id}`);
                                            else navigate(`/admin/pop/execute/${session.id}`);
                                        }}>
                                            Abrir
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Atalhos */}
                <Card className="col-span-1 border-slate-200 shadow-none bg-slate-50">
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white" onClick={() => navigate('/admin/pop/content')}>
                            <BookOpen className="w-6 h-6 text-blue-500" />
                            <span>Ler POP Completo</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white" onClick={() => navigate('/admin/pop/editor')}>
                            <Settings className="w-6 h-6 text-slate-600" />
                            <span>Modo Admin (Editor)</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
