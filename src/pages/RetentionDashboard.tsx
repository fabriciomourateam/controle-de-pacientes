import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  MessageSquare,
  Phone,
  Calendar,
  Activity,
  Target,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CancellationPatternsAnalysis } from "@/components/retention/CancellationPatternsAnalysis";
import { RecentCancellationsAndFreezes } from "@/components/retention/RecentCancellationsAndFreezes";
import { DailyTasksWidget } from "@/components/retention/DailyTasksWidget";
import { CancellationReasonsAnalysis } from "@/components/retention/CancellationReasonsAnalysis";
import { ContactHistoryService } from "@/lib/contact-history-service";

interface PatientWithRisk {
  id: string;
  nome: string;
  telefone: string;
  plano: string;
  ultimo_contato: any;
  diasSemContato: number;
  riskLevel: 'attention' | 'critical';
  aiSuggestion: string;
  engagementScore: number;
}

function RetentionDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientWithRisk[]>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Buscar apenas alunos com planos PREMIUM ou BASIC e que tenham último contato preenchido
      const { data, error } = await supabase
        .from('patients')
        .select('id, nome, telefone, plano, ultimo_contato, created_at')
        .not('ultimo_contato', 'is', null) // Apenas com último contato preenchido
        .or('plano.ilike.%PREMIUM%,plano.ilike.%BASIC%') // Apenas planos PREMIUM ou BASIC
        .order('nome');

      if (error) throw error;
      if (!data) return;

      // Processar pacientes e calcular risco
      const processedPatients = (data as any[])
        .map((patient: any) => {
          const ultimoContatoRaw = patient.ultimo_contato;
          let diasSemContato = 999; // Valor alto para pacientes sem dados

          if (ultimoContatoRaw) {
            let dataContatoStr: string | null = null;

            if (typeof ultimoContatoRaw === 'string') {
              try {
                const parsed = JSON.parse(ultimoContatoRaw);
                dataContatoStr = parsed.start;
              } catch {
                dataContatoStr = ultimoContatoRaw;
              }
            } else if (typeof ultimoContatoRaw === 'object' && ultimoContatoRaw.start) {
              dataContatoStr = ultimoContatoRaw.start;
            }

            if (dataContatoStr) {
              const dataContato = new Date(dataContatoStr);
              const hoje = new Date();
              const diffTime = Math.abs(hoje.getTime() - dataContato.getTime());
              diasSemContato = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }

          // Calcular score de engajamento (0-100)
          const engagementScore = Math.max(0, 100 - diasSemContato * 2);

          // Determinar nível de risco
          let riskLevel: 'attention' | 'critical' | null = null;
          if (diasSemContato >= 30) {
            riskLevel = 'critical';
          } else if (diasSemContato >= 20) {
            riskLevel = 'attention';
          }

          // Gerar sugestão de IA
          const aiSuggestion = generateAISuggestion(diasSemContato, engagementScore, patient.plano);

          return {
            ...patient,
            diasSemContato,
            riskLevel,
            aiSuggestion,
            engagementScore
          };
        })
        .filter(p => p.riskLevel !== null) as PatientWithRisk[];

      setPatients(processedPatients);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de retenção",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar sugestões de IA
  const generateAISuggestion = (dias: number, score: number, plano: string): string => {
    if (dias >= 45) {
      return "🚨 URGENTE: Aluno em risco crítico de cancelamento. Ligue HOJE e ofereça uma sessão gratuita de reavaliação. Pergunte sobre dificuldades e mostre novos resultados de outros alunos.";
    } else if (dias >= 30) {
      return "⚠️ ATENÇÃO: Aluno distante há mais de 1 mês. Envie mensagem personalizada perguntando como está a rotina. Ofereça ajuste no treino ou dieta. Mostre que você se importa.";
    } else if (dias >= 25) {
      return "📱 Envie um vídeo curto com dica rápida relacionada ao objetivo dele. Pergunte se está tudo bem e se precisa de ajuda com algo específico.";
    } else if (dias >= 20) {
      return "💬 Mensagem amigável: 'Oi [nome]! Tudo bem? Faz um tempinho que não conversamos. Como está indo? Precisa de algum ajuste?'";
    }
    return "✅ Continue monitorando. Aluno ainda está em zona segura.";
  };

  // Calcular métricas
  const metrics = useMemo(() => {
    const attention = patients.filter(p => p.riskLevel === 'attention').length;
    const critical = patients.filter(p => p.riskLevel === 'critical').length;
    const total = attention + critical;
    const avgEngagement = patients.length > 0 
      ? Math.round(patients.reduce((sum, p) => sum + p.engagementScore, 0) / patients.length)
      : 0;

    return { attention, critical, total, avgEngagement };
  }, [patients]);

  const attentionPatients = patients.filter(p => p.riskLevel === 'attention');
  const criticalPatients = patients.filter(p => p.riskLevel === 'critical');

  const handleWhatsApp = (telefone: string, nome: string) => {
    const message = encodeURIComponent(`Oi ${nome}! Tudo bem? 😊`);
    window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleMarkAsContacted = async (telefone: string, patientName: string) => {
    try {
      // Registrar contato no histórico (salva permanentemente)
      const result = await ContactHistoryService.registerContact(
        telefone,
        patientName,
        'manual',
        'Contato registrado via Dashboard de Retenção'
      );

      if (!result.success) {
        throw result.error;
      }

      toast({
        title: "✅ Contato registrado!",
        description: `${patientName} foi marcado como contatado hoje. Histórico salvo permanentemente.`,
      });

      // Recarregar dados
      loadPatients();
    } catch (error) {
      console.error('Erro ao marcar como contatado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o contato",
        variant: "destructive"
      });
    }
  };

  // Preparar tarefas do dia (top 3 mais urgentes)
  const dailyTasks = useMemo(() => {
    return patients
      .filter(p => p.riskLevel === 'critical')
      .slice(0, 3)
      .map(p => ({
        telefone: p.telefone,
        nome: p.nome,
        diasSemContato: p.diasSemContato,
        prioridade: p.diasSemContato >= 45 ? 'urgente' as const : 
                    p.diasSemContato >= 35 ? 'alta' as const : 'media' as const
      }));
  }, [patients]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400">Carregando dados de retenção...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard de Retenção</h1>
          <p className="text-slate-400 mt-1">
            Monitore alunos em risco e tome ações preventivas
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-3 h-3" />
            <span>Exibindo apenas alunos com planos PREMIUM ou BASIC e histórico de contato</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total em Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.total}</div>
              <p className="text-xs text-slate-400 mt-1">alunos precisam de atenção</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.attention}</div>
              <p className="text-xs text-slate-400 mt-1">20-29 dias sem contato</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Crítico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.critical}</div>
              <p className="text-xs text-slate-400 mt-1">30+ dias sem contato</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Engajamento Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.avgEngagement}%</div>
              <p className="text-xs text-slate-400 mt-1">score de engajamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Widget de Tarefas do Dia */}
        <DailyTasksWidget 
          tasks={dailyTasks} 
          onTaskComplete={() => loadPatients()} 
        />

        {/* Alunos Críticos */}
        {criticalPatients.length > 0 && (
          <Card className="bg-slate-800/40 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Alunos Críticos (30+ dias)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ação urgente necessária - risco alto de cancelamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalPatients.map(patient => (
                  <Card key={patient.id} className="bg-red-500/5 border-red-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-red-500/20 text-red-400">
                              {patient.nome?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{patient.nome}</h3>
                              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                                {patient.diasSemContato} dias
                              </Badge>
                              {patient.plano && (
                                <Badge variant="outline" className="text-slate-300">
                                  {patient.plano}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                              <Phone className="w-3 h-3" />
                              {patient.telefone}
                              <span className="mx-2">•</span>
                              <Target className="w-3 h-3" />
                              Score: {patient.engagementScore}%
                            </div>
                            
                            {/* Sugestão de IA */}
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-purple-400 mb-1">
                                    Sugestão de IA
                                  </p>
                                  <p className="text-sm text-slate-300">{patient.aiSuggestion}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleWhatsApp(patient.telefone, patient.nome)}
                            className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsContacted(patient.telefone, patient.nome)}
                            className="bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600 flex-shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Contatado
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alunos em Atenção */}
        {attentionPatients.length > 0 && (
          <Card className="bg-slate-800/40 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Alunos em Atenção (20-29 dias)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Contato preventivo recomendado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attentionPatients.map(patient => (
                  <Card key={patient.id} className="bg-yellow-500/5 border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-yellow-500/20 text-yellow-400">
                              {patient.nome?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{patient.nome}</h3>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                {patient.diasSemContato} dias
                              </Badge>
                              {patient.plano && (
                                <Badge variant="outline" className="text-slate-300">
                                  {patient.plano}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                              <Phone className="w-3 h-3" />
                              {patient.telefone}
                              <span className="mx-2">•</span>
                              <Target className="w-3 h-3" />
                              Score: {patient.engagementScore}%
                            </div>
                            
                            {/* Sugestão de IA */}
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-purple-400 mb-1">
                                    Sugestão de IA
                                  </p>
                                  <p className="text-sm text-slate-300">{patient.aiSuggestion}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleWhatsApp(patient.telefone, patient.nome)}
                            className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsContacted(patient.telefone, patient.nome)}
                            className="bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600 flex-shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Contatado
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há alunos em risco */}
        {metrics.total === 0 && (
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Parabéns! 🎉
                  </h3>
                  <p className="text-slate-400">
                    Nenhum aluno em risco no momento. Continue o ótimo trabalho!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análise de Padrões de Cancelamento */}
        <div className="mt-8">
          <CancellationPatternsAnalysis />
        </div>

        {/* Análise de Motivos de Cancelamento e Congelamento */}
        <div className="mt-8">
          <CancellationReasonsAnalysis />
        </div>

        {/* Cancelamentos e Congelamentos Recentes */}
        <div className="mt-8">
          <RecentCancellationsAndFreezes />
        </div>
      </div>
    </DashboardLayout>
  );
}


export default RetentionDashboard;
