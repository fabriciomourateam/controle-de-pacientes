import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PatientForm } from "@/components/forms/PatientForm";
import { AutoSyncManager } from "@/components/auto-sync/AutoSyncManager";
import { InteractiveChart } from "./InteractiveChart";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
  ChevronUp
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useDashboardMetrics, useChartData, useExpiringPatients, useRecentFeedbacks } from "@/hooks/use-supabase-data";
import { useCheckinsWithPatient } from "@/hooks/use-checkin-data";
import { CheckinDetailsModal } from "@/components/modals/CheckinDetailsModal";
import type { CheckinWithPatient } from "@/lib/checkin-service";

export function DashboardOverview() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filterThisMonth, setFilterThisMonth] = useState(false);
  const { metrics, loading: metricsLoading } = useDashboardMetrics(filterThisMonth);
  const { chartData, loading: chartLoading } = useChartData(filterThisMonth);
  const { patients: expiringPatients, loading: expiringLoading } = useExpiringPatients();
  const { feedbacks: recentCheckinsFromHook, loading: checkinsLoadingFromHook } = useRecentFeedbacks();
  const { checkins: recentCheckins, loading: checkinsLoading } = useCheckinsWithPatient();
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithPatient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);

  const { monthlyData, planDistribution } = chartData;

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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">
            Visão geral dos seus pacientes e atividades
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <PatientForm
              trigger={
                <Button className="btn-premium">
                  <Users className="w-4 h-4 mr-2" />
                  Novo Paciente
                </Button>
              }
              onSave={handleCreatePatient}
            />
            <AutoSyncManager />
          </div>
        </div>
      </div>


      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metricsLoading ? '...' : metrics.totalPatients}
            </div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300" style={{animationDelay: '0.1s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pacientes Ativos</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metricsLoading ? '...' : metrics.activePatients}
            </div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300" style={{animationDelay: '0.2s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Expirando (30 dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {metricsLoading ? '...' : metrics.expiringPatients}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Precisam renovação
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300" style={{animationDelay: '0.3s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Checkins Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {metricsLoading ? '...' : metrics.pendingFeedbacks}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sem checkin há 30+ dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300" style={{animationDelay: '0.4s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Score Médio</CardTitle>
            <Star className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
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
        <div className="col-span-1 lg:col-span-2">
          <InteractiveChart
            data={monthlyData}
            title="Evolução Mensal"
            description="Novos pacientes, % de renovação e % de churn por mês"
            icon={Activity}
            iconColor="text-blue-400"
          />
        </div>

        {/* Distribuição de Planos */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Planos</CardTitle>
            <CardDescription className="text-slate-400">
              Pacientes por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
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
              
              {!isLegendMinimized && (
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
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
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
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
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
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Últimos Checkins */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
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
              recentCheckins.slice(0, 5).map((checkin) => (
                <div key={checkin.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg hover:from-slate-600/40 hover:to-slate-700/40 transition-all duration-300 border border-slate-600/30">
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
    </div>
  );
}