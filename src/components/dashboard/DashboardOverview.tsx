import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PatientForm } from "@/components/forms/PatientForm";
import { AutoSyncManager } from "@/components/auto-sync/AutoSyncManager";
import { InteractiveChart } from "./InteractiveChart";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Send,
  RefreshCw,
  Save
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useDashboardMetrics, useChartData, useExpiringPatients, useRecentFeedbacks } from "@/hooks/use-supabase-data";
import { useCheckinsWithPatient } from "@/hooks/use-checkin-data";
import { CheckinDetailsModal } from "@/components/modals/CheckinDetailsModal";
import type { CheckinWithPatient } from "@/lib/checkin-service";
import { userPreferencesService } from "@/lib/user-preferences-service";

export function DashboardOverview() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filterThisMonth, setFilterThisMonth] = useState(false);
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics(filterThisMonth);
  const { data: chartData, isLoading: chartLoading } = useChartData(filterThisMonth);
  const { data: expiringPatients = [], isLoading: expiringLoading } = useExpiringPatients();
  const { data: recentCheckinsFromHook = [], isLoading: checkinsLoadingFromHook } = useRecentFeedbacks();
  const { data: recentCheckins = [], isLoading: checkinsLoading } = useCheckinsWithPatient();
  
  const metrics = metricsData || {
    totalPatients: 0,
    activePatients: 0,
    expiringPatients: 0,
    pendingFeedbacks: 0,
    avgOverallScore: '0.0'
  };
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithPatient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);
  
  // Estados para modal de renovação
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [renewalMessage, setRenewalMessage] = useState("");
  const [isSendingRenewal, setIsSendingRenewal] = useState(false);
  const [sentRenewals, setSentRenewals] = useState<Set<string>>(new Set());
  const [isLoadingRenewals, setIsLoadingRenewals] = useState(true);

  const { monthlyData, planDistribution } = chartData || { monthlyData: [], planDistribution: [] };

  // Garantir que os dados sejam arrays válidos
  const safeMonthlyData = Array.isArray(monthlyData) ? monthlyData : [];
  const safePlanDistribution = Array.isArray(planDistribution) ? planDistribution : [];

  // Carregar dados de renovação do banco ao montar o componente
  useEffect(() => {
    const loadRenewalData = async () => {
      try {
        setIsLoadingRenewals(true);
        const preferences = await userPreferencesService.getUserPreferences();
        
        if (preferences?.filters) {
          // Carregar lista de renovações enviadas
          if (preferences.filters.sent_renewals) {
            const renewalsArray = Array.isArray(preferences.filters.sent_renewals) 
              ? preferences.filters.sent_renewals 
              : [];
            setSentRenewals(new Set(renewalsArray));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados de renovação:', error);
      } finally {
        setIsLoadingRenewals(false);
      }
    };

    loadRenewalData();
  }, []);

  // Salvar lista de renovações enviadas no banco
  const saveSentRenewals = async (renewals: Set<string>) => {
    try {
      const preferences = await userPreferencesService.getUserPreferences();
      const currentFilters = preferences?.filters || {};
      
      await userPreferencesService.upsertUserPreferences({
        filters: {
          ...currentFilters,
          sent_renewals: Array.from(renewals)
        }
      });
    } catch (error) {
      console.error('Erro ao salvar renovações enviadas:', error);
    }
  };

  // Função para obter mensagem padrão (do banco ou padrão do código)
  const getDefaultRenewalMessage = async (patientName: string): Promise<string> => {
    const firstName = patientName?.split(' ')[0] || 'amigo';
    
    try {
      const preferences = await userPreferencesService.getUserPreferences();
      
      // Tentar carregar do banco
      if (preferences?.filters?.renewal_message_template) {
        const template = preferences.filters.renewal_message_template;
        // Substituir placeholder do nome se existir
        return template.replace(/\{nome\}/g, firstName);
      }
    } catch (error) {
      console.error('Erro ao carregar template do banco:', error);
    }
    
    // Mensagem padrão do código
    return `Falaaa ${firstName}, como vc ta?

Passando pra avisar que *completamos nosso período de acompanhamento* e, primeiramente, quero muito te agradecer por toda confiança no que estamos fazendo. 

Seguir tudo 100% é pra poucooooss, pois sei que sempre vai ter algum perrengue pra tirar o foco, seja a correria do dia a dia, imprevistos, enfim.

Mas o simples fato de você ter confiado no meu trabalho já significa muito pra mim.

Tenho certeza que no momento atual há uma experiência muito melhor e diferente de como iniciamos, e isso já é uma vitória gigante!

Gostaria de pedir um favor?
Queria um feedback seu sobre todo esse processo. 
Isso *me ajuda demais* a entender o que funcionou e o que posso melhorar.

Coisa muito rápida mesmo, só clicar no link:
https://chat.shapepro.shop/feedback-

Muito obrigado por tudo, novamente agradeço demais por toda confiança!`;
  };

  // Função para salvar mensagem como padrão no banco
  const saveRenewalMessageAsDefault = async () => {
    if (!renewalMessage.trim()) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Salvar template no banco (usando placeholder {nome} para o primeiro nome)
      const firstName = selectedPatient?.nome?.split(' ')[0] || '{nome}';
      const template = renewalMessage.replace(new RegExp(firstName, 'gi'), '{nome}');
      
      const preferences = await userPreferencesService.getUserPreferences();
      const currentFilters = preferences?.filters || {};
      
      await userPreferencesService.upsertUserPreferences({
        filters: {
          ...currentFilters,
          renewal_message_template: template
        }
      });
      
      toast({
        title: "Sucesso",
        description: "Mensagem salva como padrão no banco de dados! Ela será usada para todos os próximos pacientes.",
      });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir modal de renovação
  const handleOpenRenewalModal = async (patient: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir navegação ao clicar no botão
    setSelectedPatient(patient);
    
    // Carregar mensagem padrão do banco
    const defaultMessage = await getDefaultRenewalMessage(patient.nome || '');
    setRenewalMessage(defaultMessage);
    setRenewalModalOpen(true);
  };

  // Função para enviar renovação
  const handleSendRenewal = async () => {
    if (!selectedPatient || !renewalMessage.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha a mensagem de renovação.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingRenewal(true);

    try {
      const response = await fetch('https://n8n.shapepro.shop/webhook/renovar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: selectedPatient.nome || '',
          telefone: selectedPatient.telefone || '',
          mensagem: renewalMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar renovação');
      }

      // Marcar como enviado e salvar no banco
      const updatedRenewals = new Set(sentRenewals).add(selectedPatient.id);
      setSentRenewals(updatedRenewals);
      await saveSentRenewals(updatedRenewals);
      
      toast({
        title: "Sucesso",
        description: "Mensagem de renovação enviada com sucesso!",
      });

      setRenewalModalOpen(false);
      setSelectedPatient(null);
      setRenewalMessage("");
    } catch (error) {
      console.error('Erro ao enviar renovação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem de renovação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingRenewal(false);
    }
  };

  const handleViewCheckin = (checkin: CheckinWithPatient) => {
    setSelectedCheckin(checkin);
    setIsModalOpen(true);
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  // Função para criar novo paciente
  const handleCreatePatient = async (patientData: any) => {
    try {
      // A lógica de criação será implementada no PatientForm
      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o paciente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header com destaque visual melhorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm">
            Visão geral dos seus pacientes e atividades
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PatientForm
            trigger={
              <Button className="btn-premium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                <Users className="w-4 h-4 mr-2" />
                Novo Paciente
              </Button>
            }
            onSave={handleCreatePatient}
          />
          <AutoSyncManager />
        </div>
      </div>

      {/* Métricas Principais com animação escalonada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {metricsLoading ? '...' : metrics.totalPatients}
            </div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.1s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Pacientes Ativos</CardTitle>
            <Activity className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
              {metricsLoading ? '...' : metrics.activePatients}
            </div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.2s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Expirando (30 dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400 group-hover:scale-105 transition-transform inline-block">
              {metricsLoading ? '...' : metrics.expiringPatients}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Precisam renovação
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.3s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Checkins Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-400 animate-pulse group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400 group-hover:scale-105 transition-transform inline-block">
              {metricsLoading ? '...' : metrics.pendingFeedbacks}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sem checkin há 30+ dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.4s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Score Médio</CardTitle>
            <Star className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
              {metricsLoading ? '...' : metrics.avgOverallScore}
            </div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Score dos checkins
            </p>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Interativo de Evolução */}
        <div className="col-span-1 lg:col-span-2 transform transition-all duration-300 hover:scale-[1.01]">
          <InteractiveChart
            data={safeMonthlyData}
            title="Evolução Mensal"
            description="Novos pacientes, % de renovação e % de churn por mês"
            icon={BarChart3}
            iconColor="text-blue-400"
          />
        </div>

        {/* Distribuição de Planos */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Planos</CardTitle>
            <CardDescription className="text-slate-400">
              Pacientes por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              {!safePlanDistribution || safePlanDistribution.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-slate-400">
                  <p>Nenhum dado disponível</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={safePlanDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {safePlanDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      color: '#ffffff !important',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} pacientes`,
                      name
                    ]}
                    labelStyle={{
                      color: '#ffffff !important',
                      fontWeight: '700',
                      fontSize: '15px'
                    }}
                    itemStyle={{
                      color: '#ffffff !important'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.2)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
            
            {/* Legenda personalizada */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-300">Legenda dos Planos</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLegendMinimized(!isLegendMinimized)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-1 h-auto"
                >
                  {isLegendMinimized ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {!isLegendMinimized && planDistribution && planDistribution.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {planDistribution.map((entry, index) => (
                    <div key={`legend-${entry.name}-${index}`} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-slate-300 truncate">{entry.name}</span>
                      <span className="text-slate-400 ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações Necessárias */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              Ação Necessária
            </CardTitle>
            <CardDescription className="text-slate-400">
              Pacientes vencidos e expirando nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expiringLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
                Carregando...
              </div>
            ) : expiringPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                Nenhuma ação necessária no momento!
              </div>
            ) : (
              expiringPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  onClick={() => handlePatientClick(patient.id)}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-md hover:shadow-amber-500/10"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-amber-500/20 text-amber-400">
                        {patient.nome?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-white">{patient.nome || 'Nome não informado'}</p>
                      <p className="text-xs text-slate-400">
                        {patient.plano || 'Plano não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        patient.dias_para_vencer <= 0 
                          ? "bg-red-500/20 text-red-400 border-red-500/30" 
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }
                    >
                      {patient.dias_para_vencer === 0 
                        ? 'Vencido hoje' 
                        : patient.dias_para_vencer < 0 
                          ? `${Math.abs(patient.dias_para_vencer)}d atrasado`
                          : `${patient.dias_para_vencer}d restantes`
                      }
                    </Badge>
                    {sentRenewals.has(patient.id) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="bg-emerald-600/60 text-emerald-200 border-emerald-500 hover:bg-emerald-600/60 cursor-not-allowed font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enviado
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-blue-600/60 text-blue-200 border-blue-500 hover:bg-blue-600/80 hover:text-blue-100 font-semibold"
                        onClick={(e) => handleOpenRenewalModal(patient, e)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Renovação
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Últimos Checkins */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-4 h-4 text-blue-400" />
              Últimos Checkins
            </CardTitle>
            <CardDescription className="text-slate-400">
              5 checkins mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkinsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
                Carregando...
              </div>
            ) : recentCheckins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2" />
                Nenhum checkin encontrado
              </div>
            ) : (
              recentCheckins.slice(0, 5).map((checkin, index) => (
                <div 
                  key={checkin.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-xl hover:from-slate-600/40 hover:to-slate-700/40 transition-all duration-300 border border-slate-600/30 hover:border-blue-500/40 hover:scale-[1.02] hover:shadow-md hover:shadow-blue-500/10 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-500/20 text-blue-400">
                        {checkin.patient?.nome?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {checkin.patient?.nome || 'Paciente não informado'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {checkin.data_preenchimento ? new Date(checkin.data_preenchimento).toLocaleDateString('pt-BR') : 
                         checkin.data_checkin ? new Date(checkin.data_checkin).toLocaleDateString('pt-BR') : 'Data não informada'}
                        {checkin.peso && ` • Peso: ${checkin.peso}kg`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      {checkin.total_pontuacao ? `${checkin.total_pontuacao} pts` : 'N/A'}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleViewCheckin(checkin)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>


      </div>

      {/* Modal de Detalhes do Checkin */}
      <CheckinDetailsModal
        checkin={selectedCheckin}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCheckin(null);
        }}
      />

      {/* Modal de Renovação */}
      <Dialog open={renewalModalOpen} onOpenChange={setRenewalModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Mensagem de Renovação - {selectedPatient?.nome || 'Paciente'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Edite a mensagem abaixo antes de enviar. A mensagem será enviada via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="renewal-message" className="text-slate-300">
                Mensagem de Renovação
              </Label>
              <Textarea
                id="renewal-message"
                value={renewalMessage}
                onChange={(e) => setRenewalMessage(e.target.value)}
                className="min-h-[300px] bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                placeholder="Digite a mensagem de renovação..."
              />
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p><strong>Paciente:</strong> {selectedPatient?.nome || 'N/A'}</p>
              <p><strong>Telefone:</strong> {selectedPatient?.telefone || 'N/A'}</p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={saveRenewalMessageAsDefault}
                disabled={!renewalMessage.trim()}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar como Padrão
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRenewalModalOpen(false);
                  setSelectedPatient(null);
                  setRenewalMessage("");
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendRenewal}
                disabled={isSendingRenewal || !renewalMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSendingRenewal ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}