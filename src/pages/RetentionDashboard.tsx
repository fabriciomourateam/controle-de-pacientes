import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  CheckCircle2,
  X,
  Trash2,
  RefreshCw,
  List,
  LayoutGrid,
  ArrowUpDown,
  TrendingUp,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CancellationPatternsAnalysis } from "@/components/retention/CancellationPatternsAnalysis";
import { RecentCancellationsAndFreezes } from "@/components/retention/RecentCancellationsAndFreezes";
import { DailyTasksWidget } from "@/components/retention/DailyTasksWidget";
import { CancellationReasonsAnalysis } from "@/components/retention/CancellationReasonsAnalysis";
import { ContactHistoryService } from "@/lib/contact-history-service";
import { retentionService } from "@/lib/retention-service";
import { contactWebhookService } from "@/lib/contact-webhook-service";
import { cn } from "@/lib/utils";

interface PatientWithRisk {
  id: string;
  nome: string;
  telefone: string;
  plano: string;
  ultimo_contato: any;
  ultimo_contato_nutricionista?: string;
  diasSemContato: number;
  riskLevel: 'attention' | 'critical';
  aiSuggestion: string;
  engagementScore: number;
}

type SortOption = 'dias' | 'nome' | 'score';
type ViewMode = 'cards' | 'compact';

function RetentionDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientWithRisk[]>([]);
  const [removedPatients, setRemovedPatients] = useState<Set<string>>(new Set());
  const [contactedPatients, setContactedPatients] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('dias');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [contactStats, setContactStats] = useState({
    today: 0,
    thisWeek: 0,
    chartData: [] as Array<{ date: string; count: number }>
  });
  const [dailyGoal] = useState(5); // Meta diária de contatos
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [isCriticalExpanded, setIsCriticalExpanded] = useState(false);
  const [isAttentionExpanded, setIsAttentionExpanded] = useState(false);

  useEffect(() => {
    loadPatients();
    loadExcludedPatients();
    loadContactedPatients();
    loadContactStats();
  }, []);

  // Carregar pacientes que foram contatados (para mostrar como "Contatado")
  const loadContactedPatients = async () => {
    try {
      // Obter user_id do usuário atual para filtrar apenas seus contatos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado, não é possível carregar contatos');
        return;
      }
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Buscar contatos de hoje do usuário atual (RLS já filtra por user_id)
      const { data, error } = await supabase
        .from('contact_history')
        .select('telefone')
        .gte('contact_date', hoje.toISOString())
        .eq('user_id', user.id); // Garantir que só busca contatos do usuário atual

      if (error) throw error;
      
      if (data) {
        // Buscar IDs dos pacientes pelos telefones (já filtrados por user_id via RLS)
        const telefones = data.map(c => c.telefone);
        if (telefones.length > 0) {
          const { data: patientsData } = await supabase
            .from('patients')
            .select('id, telefone')
            .in('telefone', telefones);
          
          if (patientsData) {
            setContactedPatients(new Set(patientsData.map(p => p.id)));
          }
        } else {
          // Se não há contatos, limpar o Set
          setContactedPatients(new Set());
        }
      } else {
        setContactedPatients(new Set());
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes contatados:', error);
    }
  };

  // Carregar estatísticas de contatos
  const loadContactStats = async () => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const umaSemanaAtras = new Date(hoje);
      umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

      // Contatos hoje
      const { count: todayCount } = await supabase
        .from('contact_history')
        .select('*', { count: 'exact', head: true })
        .gte('contact_date', hoje.toISOString());

      // Contatos esta semana
      const { count: weekCount } = await supabase
        .from('contact_history')
        .select('*', { count: 'exact', head: true })
        .gte('contact_date', umaSemanaAtras.toISOString());

      // Dados para gráfico (últimos 7 dias)
      const { data: chartData } = await supabase
        .from('contact_history')
        .select('contact_date')
        .gte('contact_date', umaSemanaAtras.toISOString())
        .order('contact_date', { ascending: true });

      // Processar dados do gráfico
      const chartDataProcessed: Array<{ date: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(hoje);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = chartData?.filter(c => {
          const contactDate = new Date(c.contact_date).toISOString().split('T')[0];
          return contactDate === dateStr;
        }).length || 0;
        
        chartDataProcessed.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          count
        });
      }

      setContactStats({
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        chartData: chartDataProcessed
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas de contatos:', error);
    }
  };

  // Carregar pacientes excluídos do banco de dados
  const loadExcludedPatients = async () => {
    try {
      const excludedIds = await retentionService.getExcludedPatientIds();
      setRemovedPatients(excludedIds);
    } catch (error) {
      console.error('Erro ao carregar pacientes excluídos:', error);
      // Fallback para localStorage se houver erro
      try {
        const stored = localStorage.getItem('retention_removed_patients');
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          setRemovedPatients(new Set(ids));
        }
      } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
      }
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Buscar alunos com planos PREMIUM, BASIC ou CONGELADO e que tenham último contato preenchido
      const { data, error } = await supabase
        .from('patients')
        .select('id, nome, telefone, plano, ultimo_contato, ultimo_contato_nutricionista, created_at')
        .not('ultimo_contato', 'is', null) // Apenas com último contato preenchido
        .or('plano.ilike.%PREMIUM%,plano.ilike.%BASIC%,plano.ilike.%CONGELADO%') // PREMIUM, BASIC ou CONGELADO
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
      setLastUpdate(new Date());
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
    // Filtrar pacientes removidos para as métricas
    const activePatients = patients.filter(p => !removedPatients.has(p.id));
    const attention = activePatients.filter(p => p.riskLevel === 'attention').length;
    const critical = activePatients.filter(p => p.riskLevel === 'critical').length;
    const total = attention + critical;
    const avgEngagement = activePatients.length > 0 
      ? Math.round(activePatients.reduce((sum, p) => sum + p.engagementScore, 0) / activePatients.length)
      : 0;

    return { attention, critical, total, avgEngagement };
  }, [patients, removedPatients]);

  // Ordenar pacientes
  const sortedPatients = useMemo(() => {
    const activePatients = patients.filter(p => !removedPatients.has(p.id));
    
    const sorted = [...activePatients].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dias':
          comparison = a.diasSemContato - b.diasSemContato;
          break;
        case 'nome':
          comparison = (a.nome || '').localeCompare(b.nome || '');
          break;
        case 'score':
          comparison = a.engagementScore - b.engagementScore;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [patients, removedPatients, sortBy, sortOrder]);

  const attentionPatients = sortedPatients.filter(p => p.riskLevel === 'attention');
  const criticalPatients = sortedPatients.filter(p => p.riskLevel === 'critical');
  
  const handleRemovePatient = async (patientId: string, patientName: string) => {
    try {
      const success = await retentionService.excludePatient(patientId, 'Removido da lista de retenção');
      
      if (success) {
        const newRemoved = new Set([...removedPatients, patientId]);
        setRemovedPatients(newRemoved);
        
        // Também salvar no localStorage como backup
        try {
          localStorage.setItem('retention_removed_patients', JSON.stringify(Array.from(newRemoved)));
        } catch (e) {
          // Ignorar erro do localStorage
        }
        
        toast({
          title: "Paciente removido",
          description: `${patientName} foi removido da lista de retenção e não aparecerá mais aqui.`,
        });
      } else {
        throw new Error('Falha ao remover paciente');
      }
    } catch (error) {
      console.error('Erro ao remover paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o paciente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = (telefone: string, nome: string) => {
    const message = encodeURIComponent(`Oi ${nome}! Tudo bem? 😊`);
    window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleContact = async (telefone: string, nome: string, patientId: string) => {
    const actionKey = `contact-${patientId}`;
    try {
      setLoadingActions(prev => new Set([...prev, actionKey]));
      
      const success = await contactWebhookService.sendContactMessage(telefone, nome);
      
      if (success) {
        // Registrar contato no histórico para persistir após refresh
        const result = await ContactHistoryService.registerContact(
          telefone,
          nome,
          'webhook',
          'Contato via webhook - Dashboard de Retenção'
        );
        
        if (!result.success) {
          console.error('Erro ao registrar contato:', result.error);
        }
        
        // Atualizar AMBOS os campos para reiniciar a contagem
        const hoje = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('patients')
          .update({
            ultimo_contato: hoje,  // Atualizar para reiniciar contagem
            ultimo_contato_nutricionista: hoje
          } as any)
          .eq('id', patientId);
        
        if (updateError) {
          console.error('Erro ao atualizar último contato:', updateError);
        }
        
        // Recarregar pacientes contatados do banco (para persistir após refresh)
        await loadContactedPatients();
        
        // Recarregar lista de pacientes (para remover contatados da lista)
        await loadPatients();
        
        // Atualizar estatísticas
        loadContactStats();
        
        toast({
          title: "✅ Mensagem enviada!",
          description: `Áudio enviado para ${nome} via webhook. A contagem foi reiniciada.`,
        });
      } else {
        throw new Error('Falha ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Verifique se o webhook está configurado.",
        variant: "destructive",
      });
    } finally {
      setLoadingActions(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  const handleMarkAsContacted = async (patientId: string, telefone: string, patientName: string) => {
    const actionKey = `mark-${patientId}`;
    try {
      setLoadingActions(prev => new Set([...prev, actionKey]));
      
      const hoje = new Date().toISOString();

      // 1. Registrar contato no histórico (salva permanentemente)
      const result = await ContactHistoryService.registerContact(
        telefone,
        patientName,
        'manual',
        'Contato registrado via Dashboard de Retenção'
      );

      if (!result.success) {
        throw result.error;
      }

      // 2. Atualizar ambas as colunas na tabela patients
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          ultimo_contato: hoje,
          ultimo_contato_nutricionista: hoje
        } as any)
        .eq('id', patientId);

      if (updateError) {
        console.error('Erro ao atualizar último contato:', updateError);
        throw updateError;
      }

      // 3. Remover da lista de retenção
      await handleRemovePatient(patientId, patientName);
      
      // 4. Recarregar pacientes contatados do banco (para persistir após refresh)
      await loadContactedPatients();
      
      loadContactStats();

      toast({
        title: "✅ Contato registrado!",
        description: `${patientName} foi marcado como contatado e removido da lista de retenção.`,
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
    } finally {
      setLoadingActions(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  // Preparar tarefas do dia (top 5: críticos + congelados mais urgentes)
  // Filtrar pacientes removidos e excluídos
  const dailyTasks = useMemo(() => {
    const activePatients = patients.filter(p => !removedPatients.has(p.id));
    
    const criticalTasks = activePatients
      .filter(p => p.riskLevel === 'critical' && !p.plano?.toUpperCase().includes('CONGELADO'))
      .map(p => ({
        telefone: p.telefone,
        nome: p.nome,
        diasSemContato: p.diasSemContato,
        prioridade: p.diasSemContato >= 45 ? 'urgente' as const : 
                    p.diasSemContato >= 35 ? 'alta' as const : 'media' as const,
        isCongelado: false,
        patientId: p.id // Adicionar ID do paciente para poder remover
      }));

    const frozenTasks = activePatients
      .filter(p => p.plano?.toUpperCase().includes('CONGELADO') && p.diasSemContato >= 30)
      .map(p => ({
        telefone: p.telefone,
        nome: p.nome,
        diasSemContato: p.diasSemContato,
        prioridade: p.diasSemContato >= 60 ? 'urgente' as const : 
                    p.diasSemContato >= 45 ? 'alta' as const : 'media' as const,
        isCongelado: true,
        patientId: p.id // Adicionar ID do paciente para poder remover
      }));

    // Combinar e ordenar por prioridade e dias
    return [...criticalTasks, ...frozenTasks]
      .sort((a, b) => {
        // Urgente > Alta > Média
        const priorityOrder = { urgente: 3, alta: 2, media: 1 };
        if (priorityOrder[a.prioridade] !== priorityOrder[b.prioridade]) {
          return priorityOrder[b.prioridade] - priorityOrder[a.prioridade];
        }
        // Mesmo nível de prioridade: mais dias sem contato primeiro
        return b.diasSemContato - a.diasSemContato;
      })
      .slice(0, 5); // Top 5 tarefas
  }, [patients, removedPatients]);
  
  // Handler para quando uma tarefa é completada (marcada como contatada)
  const handleTaskComplete = async (telefone: string) => {
    // Encontrar o paciente pelo telefone
    const patient = patients.find(p => p.telefone === telefone);
    if (patient) {
      // Remover da lista de retenção também
      await handleRemovePatient(patient.id, patient.nome);
    }
    // Recarregar pacientes para atualizar a lista
    loadPatients();
    loadContactStats();
  };

  const progressPercentage = Math.min((contactStats.today / dailyGoal) * 100, 100);

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
    <TooltipProvider>
      <DashboardLayout>
        <div className="space-y-8 animate-fadeIn">
        {/* Header com destaque visual melhorado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Dashboard de Retenção
            </h1>
            <p className="text-slate-400 text-sm">
              Monitore alunos em risco e tome ações preventivas
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Activity className="w-3 h-3" />
              <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadPatients();
                loadContactStats();
                loadContactedPatients();
              }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'cards' ? 'compact' : 'cards')}
            >
              {viewMode === 'cards' ? <List className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
              {viewMode === 'cards' ? 'Vista Compacta' : 'Vista Cards'}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0s'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                Total em Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{metrics.total}</div>
              <p className="text-xs text-slate-400 mt-1">alunos precisam de atenção</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.1s'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors">{metrics.attention}</div>
              <p className="text-xs text-slate-400 mt-1">20-29 dias sem contato</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.2s'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                Crítico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white group-hover:text-red-400 transition-colors">{metrics.critical}</div>
              <p className="text-xs text-slate-400 mt-1">30+ dias sem contato</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.3s'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                Engajamento Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">{metrics.avgEngagement}%</div>
              <p className="text-xs text-slate-400 mt-1">score de engajamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas de Contatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Phone className="w-5 h-5 text-purple-400" />
                </div>
                Contatos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">
                {contactStats.today}
              </div>
              <p className="text-sm text-slate-400">contatos realizados hoje</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                Contatos Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">
                {contactStats.thisWeek}
              </div>
              <p className="text-sm text-slate-400">contatos nos últimos 7 dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard de Produtividade */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              Produtividade de Contatos
            </CardTitle>
            <CardDescription className="text-slate-400">
              Acompanhe seu progresso diário e semanal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progresso do Dia */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-300">Meta Diária</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-500/30">
                    {contactStats.today} / {dailyGoal}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${progressPercentage >= 100 ? 'text-green-400' : progressPercentage >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {Math.round(progressPercentage)}%
                  </span>
                  {progressPercentage >= 100 && (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className={`h-4 rounded-full transition-all duration-700 ease-out ${
                    progressPercentage >= 100 
                      ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500 animate-pulse' 
                      : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Gráfico de Contatos */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-4">Contatos nos Últimos 7 Dias</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={contactStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Widget de Tarefas do Dia */}
        <DailyTasksWidget 
          tasks={dailyTasks} 
          onTaskComplete={handleTaskComplete} 
        />

        {/* Separador Visual */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-slate-900 px-4">
              <Badge variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-700/50">
                <Activity className="w-3 h-3 mr-1" />
                Lista de Pacientes
              </Badge>
            </div>
          </div>
        </div>

        {/* Controles de Ordenação */}
        <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-300">Ordenar por:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === 'dias') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('dias');
                  setSortOrder('desc');
                }
              }}
              className={`transition-all duration-200 hover:scale-105 ${
                sortBy === 'dias' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : ''
              }`}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Dias sem Contato {sortBy === 'dias' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === 'nome') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('nome');
                  setSortOrder('asc');
                }
              }}
              className={`transition-all duration-200 hover:scale-105 ${
                sortBy === 'nome' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : ''
              }`}
            >
              Nome {sortBy === 'nome' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sortBy === 'score') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('score');
                  setSortOrder('desc');
                }
              }}
              className={`transition-all duration-200 hover:scale-105 ${
                sortBy === 'score' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : ''
              }`}
            >
              Score {sortBy === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
          </div>
        </div>

        {/* Alunos Críticos */}
        {criticalPatients.length > 0 && (
          <Card className="bg-slate-800/40 border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                    Alunos Críticos (30+ dias)
                  </CardTitle>
                  <CardDescription className="text-slate-400 ml-12">
                    Ação urgente necessária - risco alto de cancelamento
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/40 text-lg px-3 py-1">
                    {criticalPatients.length}
                  </Badge>
                  {criticalPatients.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCriticalExpanded(!isCriticalExpanded)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      {isCriticalExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Minimizar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Expandir
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'cards' ? (
                <div className="space-y-3">
                {(isCriticalExpanded ? criticalPatients : criticalPatients.slice(0, 3)).map((patient, index) => {
                  const isContacted = contactedPatients.has(patient.id);
                  const isContacting = loadingActions.has(`contact-${patient.id}`);
                  const isMarking = loadingActions.has(`mark-${patient.id}`);
                  const urgencyLevel = patient.diasSemContato >= 45 ? 'extreme' : patient.diasSemContato >= 35 ? 'high' : 'medium';
                  
                  return (
                  <Card 
                    key={patient.id} 
                    className={cn(
                      "relative overflow-hidden transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5 group",
                      isContacted ? 'bg-blue-500/10 border-blue-500/40' : 'bg-red-500/5 border-red-500/30',
                      "hover:shadow-red-500/20"
                    )}
                    style={{ 
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Barra lateral colorida indicando urgência */}
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-1
                      ${urgencyLevel === 'extreme' ? 'bg-red-500' : urgencyLevel === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}
                      group-hover:w-1.5 transition-all duration-300
                    `} />
                    
                    <CardContent className="p-4 pl-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="w-14 h-14 ring-2 ring-slate-700/50 group-hover:ring-red-500/30 transition-all duration-300">
                            <AvatarFallback className={`
                              ${isContacted 
                                ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-300' 
                                : 'bg-gradient-to-br from-red-500/30 to-orange-500/20 text-red-300'
                              }
                              font-bold text-lg
                              transition-all duration-300
                              group-hover:scale-110
                            `}>
                              {patient.nome?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-bold text-white text-lg group-hover:text-red-300 transition-colors duration-300">
                                {patient.nome}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`
                                  bg-red-500/20 text-red-300 border-red-500/40
                                  font-semibold px-2.5 py-0.5
                                  shadow-sm
                                  ${urgencyLevel === 'extreme' ? 'animate-pulse' : ''}
                                `}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {patient.diasSemContato} dias
                              </Badge>
                              {patient.plano && (
                                <Badge variant="outline" className="bg-slate-700/50 text-slate-200 border-slate-600/50 font-medium">
                                  {patient.plano}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono">{patient.telefone}</span>
                              </div>
                              <span className="text-slate-600">•</span>
                              <div className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold">{patient.engagementScore}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => handleContact(patient.telefone, patient.nome, patient.id)}
                                disabled={isContacting || isMarking}
                                className={`
                                  ${isContacted ? 'bg-blue-600 hover:bg-blue-700' : 'bg-cyan-600 hover:bg-cyan-700'} 
                                  text-white flex-shrink-0
                                  transition-all duration-200
                                  hover:scale-105 active:scale-95
                                  shadow-md hover:shadow-lg
                                `}
                              >
                                {isContacting ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Phone className="w-4 h-4 mr-2" />
                                )}
                                {isContacted ? 'Contatado' : 'Contatar'}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enviar mensagem via webhook</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => handleWhatsApp(patient.telefone, patient.nome)}
                                disabled={isContacting || isMarking}
                                className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                WhatsApp
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Abrir conversa no WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsContacted(patient.id, patient.telefone, patient.nome)}
                                disabled={isContacting || isMarking}
                                className="bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600 flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                {isMarking ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Contatado
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Marcar como contatado e remover da lista</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemovePatient(patient.id, patient.nome)}
                                disabled={isContacting || isMarking}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remover da lista de retenção</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
                {!isCriticalExpanded && criticalPatients.length > 3 && (
                  <div className="text-center pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCriticalExpanded(true)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Ver mais {criticalPatients.length - 3} paciente(s)
                    </Button>
                  </div>
                )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Paciente</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Telefone</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Plano</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Dias</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Score</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-300">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isCriticalExpanded ? criticalPatients : criticalPatients.slice(0, 3)).map(patient => {
                        const isContacted = contactedPatients.has(patient.id);
                        return (
                          <tr key={patient.id} className={`border-b border-slate-700/50 ${isContacted ? 'bg-blue-500/5' : ''}`}>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className={`${isContacted ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'} text-xs`}>
                                    {patient.nome?.charAt(0) || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-white font-medium">{patient.nome}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 text-sm">{patient.telefone}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-slate-300 text-xs">
                                {patient.plano}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                                {patient.diasSemContato}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-300 text-sm">{patient.engagementScore}%</td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleContact(patient.telefone, patient.nome, patient.id)}
                                  className={`${isContacted ? 'bg-blue-600/20 hover:bg-blue-600/30' : ''} text-white h-8 px-2`}
                                  title={isContacted ? 'Contatado' : 'Contatar'}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleWhatsApp(patient.telefone, patient.nome)}
                                  className="text-white h-8 px-2"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsContacted(patient.id, patient.telefone, patient.nome)}
                                  className="text-white h-8 px-2"
                                  title="Marcar como Contatado"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemovePatient(patient.id, patient.nome)}
                                  className="text-red-400 hover:text-red-300 h-8 px-2"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!isCriticalExpanded && criticalPatients.length > 3 && (
                    <div className="text-center pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCriticalExpanded(true)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Ver mais {criticalPatients.length - 3} paciente(s)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alunos em Atenção */}
        {attentionPatients.length > 0 && (
          <Card className="bg-slate-800/40 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    </div>
                    Alunos em Atenção (20-29 dias)
                  </CardTitle>
                  <CardDescription className="text-slate-400 ml-12">
                    Contato preventivo recomendado
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-lg px-3 py-1">
                    {attentionPatients.length}
                  </Badge>
                  {attentionPatients.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAttentionExpanded(!isAttentionExpanded)}
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                    >
                      {isAttentionExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Minimizar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Expandir
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'cards' ? (
                <div className="space-y-3">
                {(isAttentionExpanded ? attentionPatients : attentionPatients.slice(0, 3)).map((patient, index) => {
                  const isContacted = contactedPatients.has(patient.id);
                  const isContacting = loadingActions.has(`contact-${patient.id}`);
                  const isMarking = loadingActions.has(`mark-${patient.id}`);
                  
                  return (
                  <Card 
                    key={patient.id} 
                    className={cn(
                      "relative overflow-hidden transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5 group",
                      isContacted ? 'bg-blue-500/10 border-blue-500/40' : 'bg-yellow-500/5 border-yellow-500/30',
                      "hover:shadow-yellow-500/20"
                    )}
                    style={{ 
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Barra lateral colorida */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 group-hover:w-1.5 transition-all duration-300" />
                    
                    <CardContent className="p-4 pl-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="w-14 h-14 ring-2 ring-slate-700/50 group-hover:ring-yellow-500/30 transition-all duration-300">
                            <AvatarFallback className={`
                              ${isContacted 
                                ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-300' 
                                : 'bg-gradient-to-br from-yellow-500/30 to-orange-500/20 text-yellow-300'
                              }
                              font-bold text-lg
                              transition-all duration-300
                              group-hover:scale-110
                            `}>
                              {patient.nome?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-bold text-white text-lg group-hover:text-yellow-300 transition-colors duration-300">
                                {patient.nome}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-semibold px-2.5 py-0.5 shadow-sm"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {patient.diasSemContato} dias
                              </Badge>
                              {patient.plano && (
                                <Badge variant="outline" className="bg-slate-700/50 text-slate-200 border-slate-600/50 font-medium">
                                  {patient.plano}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono">{patient.telefone}</span>
                              </div>
                              <span className="text-slate-600">•</span>
                              <div className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold">{patient.engagementScore}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => handleContact(patient.telefone, patient.nome, patient.id)}
                                disabled={isContacting || isMarking}
                                className={`
                                  ${isContacted ? 'bg-blue-600 hover:bg-blue-700' : 'bg-cyan-600 hover:bg-cyan-700'} 
                                  text-white flex-shrink-0
                                  transition-all duration-200
                                  hover:scale-105 active:scale-95
                                  shadow-md hover:shadow-lg
                                `}
                              >
                                {isContacting ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Phone className="w-4 h-4 mr-2" />
                                )}
                                {isContacted ? 'Contatado' : 'Contatar'}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enviar mensagem via webhook</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => handleWhatsApp(patient.telefone, patient.nome)}
                                disabled={isContacting || isMarking}
                                className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                WhatsApp
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Abrir conversa no WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsContacted(patient.id, patient.telefone, patient.nome)}
                                disabled={isContacting || isMarking}
                                className="bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600 flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                {isMarking ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Contatado
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Marcar como contatado e remover da lista</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemovePatient(patient.id, patient.nome)}
                                disabled={isContacting || isMarking}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remover da lista de retenção</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
                {!isAttentionExpanded && attentionPatients.length > 3 && (
                  <div className="text-center pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAttentionExpanded(true)}
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                    >
                      Ver mais {attentionPatients.length - 3} paciente(s)
                    </Button>
                  </div>
                )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Paciente</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Telefone</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Plano</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Dias</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-300">Score</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-300">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isAttentionExpanded ? attentionPatients : attentionPatients.slice(0, 3)).map(patient => {
                        const isContacted = contactedPatients.has(patient.id);
                        return (
                          <tr key={patient.id} className={`border-b border-slate-700/50 ${isContacted ? 'bg-blue-500/5' : ''}`}>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className={`${isContacted ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs`}>
                                    {patient.nome?.charAt(0) || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-white font-medium">{patient.nome}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 text-sm">{patient.telefone}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-slate-300 text-xs">
                                {patient.plano}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                {patient.diasSemContato}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-300 text-sm">{patient.engagementScore}%</td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleContact(patient.telefone, patient.nome, patient.id)}
                                  className={`${isContacted ? 'bg-blue-600/20 hover:bg-blue-600/30' : ''} text-white h-8 px-2`}
                                  title={isContacted ? 'Contatado' : 'Contatar'}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleWhatsApp(patient.telefone, patient.nome)}
                                  className="text-white h-8 px-2"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsContacted(patient.id, patient.telefone, patient.nome)}
                                  className="text-white h-8 px-2"
                                  title="Marcar como Contatado"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemovePatient(patient.id, patient.nome)}
                                  className="text-red-400 hover:text-red-300 h-8 px-2"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!isAttentionExpanded && attentionPatients.length > 3 && (
                    <div className="text-center pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAttentionExpanded(true)}
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      >
                        Ver mais {attentionPatients.length - 3} paciente(s)
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
    </TooltipProvider>
  );
}


export default RetentionDashboard;
