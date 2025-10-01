import { useState } from "react";
import { 
  Search, 
  Filter,
  Calendar,
  Star,
  TrendingUp,
  User,
  Activity,
  Eye,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCheckinsWithPatient } from "@/hooks/use-checkin-data";
import { CheckinItemSkeleton, MetricCardSkeleton } from "@/components/ui/loading-skeleton";
import { CheckinDetailsModal } from "@/components/modals/CheckinDetailsModal";
import { CheckinForm } from "@/components/forms/CheckinForm";
import { RankingPanel } from "@/components/checkins/RankingPanel";
import type { CheckinWithPatient } from "@/lib/checkin-service";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

export function CheckinsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithPatient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { checkins: recentCheckins, loading: checkinsLoading, refetch } = useCheckinsWithPatient();

  // Gerar dados reais para o gráfico de evolução de scores
  const generateScoreEvolutionData = () => {
    if (recentCheckins.length === 0) return [];
    
    // Agrupar checkins por data e calcular médias
    const groupedByDate = recentCheckins.reduce((acc, checkin) => {
      const date = checkin.data_preenchimento || checkin.data_checkin;
      if (!date) return acc;
      
      const dateKey = new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          workout: [],
          cardio: [],
          sleep: [],
          overall: []
        };
      }
      
      // Converter strings para números
      const workout = parseFloat(checkin.pontos_treinos || '0');
      const cardio = parseFloat(checkin.pontos_cardios || '0');
      const sleep = parseFloat(checkin.pontos_sono || '0');
      const overall = parseFloat(checkin.total_pontuacao || '0');
      
      if (!isNaN(workout)) acc[dateKey].workout.push(workout);
      if (!isNaN(cardio)) acc[dateKey].cardio.push(cardio);
      if (!isNaN(sleep)) acc[dateKey].sleep.push(sleep);
      if (!isNaN(overall)) acc[dateKey].overall.push(overall);
      
      return acc;
    }, {} as any);
    
    // Calcular médias e ordenar por data
    return Object.values(groupedByDate)
      .map((group: any) => ({
        date: group.date,
        workout: group.workout.length > 0 ? (group.workout.reduce((a: number, b: number) => a + b, 0) / group.workout.length).toFixed(1) : 0,
        cardio: group.cardio.length > 0 ? (group.cardio.reduce((a: number, b: number) => a + b, 0) / group.cardio.length).toFixed(1) : 0,
        sleep: group.sleep.length > 0 ? (group.sleep.reduce((a: number, b: number) => a + b, 0) / group.sleep.length).toFixed(1) : 0,
        overall: group.overall.length > 0 ? (group.overall.reduce((a: number, b: number) => a + b, 0) / group.overall.length).toFixed(1) : 0
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
      .slice(-10); // Últimos 10 registros
  };

  // Gerar dados reais para o radar de categorias
  const generateCategoryRadarData = () => {
    if (recentCheckins.length === 0) return [];
    
    const categories = [
      { key: 'pontos_treinos', name: 'Treino' },
      { key: 'pontos_cardios', name: 'Cardio' },
      { key: 'pontos_sono', name: 'Sono' },
      { key: 'pontos_agua', name: 'Hidratação' },
      { key: 'pontos_stress', name: 'Stress' },
      { key: 'pontos_libido', name: 'Libido' }
    ];
    
    return categories.map(category => {
      const scores = recentCheckins
        .map(c => parseFloat((c as any)[category.key] || '0'))
        .filter(score => !isNaN(score) && score > 0);
      
      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      
      return {
        category: category.name,
        score: parseFloat(avgScore.toFixed(1)),
        fullMark: 10
      };
    });
  };

  const scoreEvolutionData = generateScoreEvolutionData();
  const categoryRadarData = generateCategoryRadarData();

  // Filtrar checkins
  const filteredCheckins = recentCheckins.filter(checkin => {
    const matchesSearch = checkin.patient?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesPatient = selectedPatient === "all" || checkin.patient?.id === selectedPatient;
    return matchesSearch && matchesPatient;
  });

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (score >= 6) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return "Excelente";
    if (score >= 6) return "Bom";
    return "Precisa melhorar";
  };

  const handleViewCheckin = (checkin: CheckinWithPatient) => {
    setSelectedCheckin(checkin);
    setIsModalOpen(true);
  };

  const handleSaveCheckin = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checkins dos Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso mensal dos seus pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <CheckinForm
            trigger={
              <Button size="sm" onClick={() => console.log('Botão clicado!')}>
                <Activity className="w-4 h-4 mr-2" />
                Novo Checkin
              </Button>
            }
            onSave={handleSaveCheckin}
          />
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[140px] bg-slate-800/50 border-slate-600/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-full sm:w-[160px] bg-slate-800/50 border-slate-600/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pacientes</SelectItem>
                {Array.from(new Set(recentCheckins.map(c => c.patient?.id).filter(Boolean))).map((patientId, index) => {
                  const checkin = recentCheckins.find(c => c.patient?.id === patientId);
                  return (
                    <SelectItem key={`patient-${patientId}-${index}`} value={patientId || ''}>
                      {checkin?.patient?.nome || 'Paciente não informado'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total de Checkins</p>
                <p className="text-2xl font-bold text-white">{recentCheckins.length}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Este Mês</p>
                <p className="text-2xl font-bold text-white">
                  {recentCheckins.filter(c => {
                    // Usar data_preenchimento ou data_checkin como fallback
                    const dateToCheck = c.data_preenchimento || c.data_checkin;
                    if (!dateToCheck) return false;
                    
                    const checkinDate = new Date(dateToCheck);
                    const now = new Date();
                    
                    // Verificar se a data é válida
                    if (isNaN(checkinDate.getTime())) return false;
                    
                    // Debug: log para verificar as datas
                    console.log('Checkin date:', dateToCheck, 'Parsed:', checkinDate);
                    console.log('Current date:', now);
                    console.log('Same month:', checkinDate.getMonth() === now.getMonth());
                    console.log('Same year:', checkinDate.getFullYear() === now.getFullYear());
                    
                    return checkinDate.getMonth() === now.getMonth() && 
                           checkinDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Score Médio</p>
                <p className="text-2xl font-bold text-white">
                  {recentCheckins.length > 0 
                    ? (recentCheckins.reduce((acc, c) => {
                        const score = parseFloat(c.total_pontuacao || '0');
                        return acc + (isNaN(score) ? 0 : score);
                      }, 0) / recentCheckins.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Star className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Pacientes Ativos</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(recentCheckins.map(c => c.patient?.id).filter(Boolean)).size}
                </p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <User className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Evolução dos Scores</CardTitle>
            <CardDescription className="text-slate-400">
              Progresso dos pacientes ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreEvolutionData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-400">Nenhum dado de evolução disponível</p>
                  <p className="text-sm text-slate-500 mt-1">Os gráficos aparecerão conforme os checkins forem preenchidos</p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Line type="monotone" dataKey="workout" stroke="#8884d8" strokeWidth={2} name="Treino" />
                    <Line type="monotone" dataKey="cardio" stroke="#82ca9d" strokeWidth={2} name="Cardio" />
                    <Line type="monotone" dataKey="sleep" stroke="#ffc658" strokeWidth={2} name="Sono" />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Legenda */}
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-[#8884d8]"></div>
                    <span className="text-slate-300">Treino</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-[#82ca9d]"></div>
                    <span className="text-slate-300">Cardio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-[#ffc658]"></div>
                    <span className="text-slate-300">Sono</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Distribuição por Categoria</CardTitle>
            <CardDescription className="text-slate-400">
              Performance em diferentes áreas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryRadarData.length === 0 || categoryRadarData.every(cat => cat.score === 0) ? (
              <div className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-400">Nenhum dado de categoria disponível</p>
                  <p className="text-sm text-slate-500 mt-1">Os gráficos aparecerão conforme os checkins forem preenchidos</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={categoryRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking Panel */}
      <RankingPanel />

      {/* Lista de Checkins */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Checkins Recentes ({filteredCheckins.length})</CardTitle>
          <CardDescription className="text-slate-400">
            Histórico detalhado dos checkins dos pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkinsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <CheckinItemSkeleton key={i} />
            ))
          ) : (
            filteredCheckins.map((checkin) => (
              <div key={checkin.id} className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:from-slate-700/60 hover:to-slate-800/60 hover:border-slate-600/60 hover:shadow-xl hover:shadow-slate-900/20 hover:scale-[1.02] transition-all duration-300 ease-out">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 dark:ring-2 dark:ring-blue-600/30 dark:ring-offset-2 dark:ring-offset-[#1e3a8a] hover:dark:ring-blue-600/50 transition-all duration-300">
                      <AvatarFallback className="bg-primary/20 dark:bg-gradient-to-br dark:from-primary/30 dark:to-primary/50 text-primary dark:text-primary-foreground font-semibold text-lg">
                        {checkin.patient?.nome?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-white text-lg">{checkin.patient?.nome || 'Paciente não informado'}</h4>
                      <p className="text-sm text-slate-400 font-medium">
                        {checkin.data_preenchimento ? new Date(checkin.data_preenchimento).toLocaleDateString('pt-BR') : 
                         checkin.data_checkin ? new Date(checkin.data_checkin).toLocaleDateString('pt-BR') : 'Data não informada'} • 
                        Peso: {checkin.peso ? `${checkin.peso}kg` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${getScoreColor(checkin.total_pontuacao || 0)}`}
                    >
                      {checkin.total_pontuacao ? `${checkin.total_pontuacao} pts` : 'N/A'}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleViewCheckin(checkin)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalhes</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Treino</p>
                    <p className="font-semibold text-white">{checkin.pontos_treinos || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Cardio</p>
                    <p className="font-semibold text-white">{checkin.pontos_cardios || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Sono</p>
                    <p className="font-semibold text-white">{checkin.pontos_sono || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Hidratação</p>
                    <p className="font-semibold text-white">{checkin.pontos_agua || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Stress</p>
                    <p className="font-semibold text-white">{checkin.pontos_stress || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Libido</p>
                    <p className="font-semibold text-white">{checkin.pontos_libido || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
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
