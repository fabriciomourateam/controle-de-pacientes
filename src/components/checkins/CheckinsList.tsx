import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDebounce } from "@/hooks/use-auto-save";
import { 
  Search, 
  Calendar,
  Star,
  TrendingUp,
  User,
  Activity,
  Eye,
  BarChart3,
  FileText,
  Edit,
  ChevronDown,
  Inbox
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
import { formatWeight } from "@/lib/weight-utils";
import { EditCheckinModal } from "@/components/evolution/EditCheckinModal";
import { RankingPanel } from "@/components/checkins/RankingPanel";
import { CheckinFeedbackCard } from "@/components/checkins/CheckinFeedbackCard";
import { CheckinFilters } from "@/components/checkins/CheckinFilters";
import { CheckinQuickControls } from "@/components/checkins/CheckinQuickControls";
import { useCheckinManagement, CheckinStatus } from "@/hooks/use-checkin-management";
import type { CheckinWithPatient } from "@/lib/checkin-service";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<CheckinStatus[]>(['pendente', 'em_analise']); // Padrão: pendentes (inclui em_analise)
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithPatient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10); // Mostrar 10 por padrão
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Padrão: mais recente primeiro
  const [filterWithBioimpedance, setFilterWithBioimpedance] = useState(false);
  const [patientsWithBioimpedance, setPatientsWithBioimpedance] = useState<Set<string>>(new Set());

  const { data: recentCheckins = [], isLoading: checkinsLoading, refetch } = useCheckinsWithPatient();
  const { teamMembers } = useCheckinManagement();

  // Carregar lista de telefones que têm bioimpedância
  useEffect(() => {
    const loadPatientsWithBioimpedance = async () => {
      try {
        const { data, error } = await supabase
          .from('body_composition')
          .select('telefone')
          .not('telefone', 'is', null);

        if (error) throw error;

        const telefones = new Set(data?.map(bio => bio.telefone).filter(Boolean) || []);
        setPatientsWithBioimpedance(telefones);
      } catch (error) {
        console.error('Erro ao carregar pacientes com bioimpedância:', error);
      }
    };

    loadPatientsWithBioimpedance();
  }, []);

  // Debounce na busca para melhorar performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Gerar dados reais para o gráfico de evolução de scores (memoizado)
  const scoreEvolutionData = useMemo(() => {
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
          water: [],
          overall: []
        };
      }
      
      // Converter strings para números
      const workout = parseFloat(checkin.pontos_treinos || '0');
      const cardio = parseFloat(checkin.pontos_cardios || '0');
      const sleep = parseFloat(checkin.pontos_sono || '0');
      const water = parseFloat(checkin.pontos_agua || '0');
      const overall = parseFloat(checkin.total_pontuacao || '0');
      
      if (!isNaN(workout)) acc[dateKey].workout.push(workout);
      if (!isNaN(cardio)) acc[dateKey].cardio.push(cardio);
      if (!isNaN(sleep)) acc[dateKey].sleep.push(sleep);
      if (!isNaN(water)) acc[dateKey].water.push(water);
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
        water: group.water.length > 0 ? (group.water.reduce((a: number, b: number) => a + b, 0) / group.water.length).toFixed(1) : 0,
        overall: group.overall.length > 0 ? (group.overall.reduce((a: number, b: number) => a + b, 0) / group.overall.length).toFixed(1) : 0
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
      .slice(-10); // Últimos 10 registros
  }, [recentCheckins]);

  // Gerar dados reais para o radar de categorias (memoizado)
  const categoryRadarData = useMemo(() => {
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
  }, [recentCheckins]);

  // Calcular contagem de checkins por paciente (uma única vez, antes do map)
  const patientCheckinsCount = useMemo(() => {
    const countMap = new Map<string, number>();
    recentCheckins.forEach(checkin => {
      const patientId = checkin.patient?.id;
      if (patientId) {
        countMap.set(patientId, (countMap.get(patientId) || 0) + 1);
      }
    });
    return countMap;
  }, [recentCheckins]);

  // Filtrar checkins com base nos filtros selecionados
  const filteredCheckins = useMemo(() => {
    return recentCheckins.filter(checkin => {
      // Filtro de busca por nome (usando debouncedSearchTerm para melhor performance)
      const matchesSearch = !debouncedSearchTerm || 
        checkin.patient?.nome?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      // Filtro de status (quando "pendente" é selecionado, selectedStatuses contém ['pendente', 'em_analise'])
      const checkinStatus = (checkin.status as CheckinStatus) || 'pendente';
      const matchesStatus = selectedStatuses.length === 0 || 
        selectedStatuses.includes(checkinStatus);
      
      // Filtro de responsável
      const matchesResponsible = selectedResponsibles.length === 0 || 
        selectedResponsibles.includes(checkin.assigned_to || 'unassigned');
      
      // Filtro de bioimpedância
      const telefoneCheckin = checkin.telefone || checkin.patient?.telefone;
      const matchesBioimpedance = !filterWithBioimpedance || 
        (telefoneCheckin && patientsWithBioimpedance.has(telefoneCheckin));
      
      return matchesSearch && matchesStatus && matchesResponsible && matchesBioimpedance;
    });
  }, [recentCheckins, debouncedSearchTerm, selectedStatuses, selectedResponsibles, filterWithBioimpedance, patientsWithBioimpedance]);

  // Ordenar check-ins filtrados
  const sortedCheckins = useMemo(() => {
    const sorted = [...filteredCheckins].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        const dateA = new Date(a.data_checkin || a.data_preenchimento || 0).getTime();
        const dateB = new Date(b.data_checkin || b.data_preenchimento || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'name') {
        const nameA = (a.patient?.nome || '').toLowerCase();
        const nameB = (b.patient?.nome || '').toLowerCase();
        comparison = nameA.localeCompare(nameB, 'pt-BR');
      } else if (sortBy === 'status') {
        const statusA = (a.status || 'pendente').toLowerCase();
        const statusB = (b.status || 'pendente').toLowerCase();
        comparison = statusA.localeCompare(statusB);
      } else if (sortBy === 'score') {
        const scoreA = parseFloat(a.total_pontuacao || '0');
        const scoreB = parseFloat(b.total_pontuacao || '0');
        comparison = scoreA - scoreB;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredCheckins, sortBy, sortOrder]);

  // Limitar check-ins exibidos baseado no displayLimit
  const displayedCheckins = useMemo(() => {
    return sortedCheckins.slice(0, displayLimit);
  }, [sortedCheckins, displayLimit]);

  // Verificar se há mais check-ins para carregar
  const hasMore = sortedCheckins.length > displayLimit;

  // Resetar limite quando os filtros mudarem
  useEffect(() => {
    setDisplayLimit(10);
  }, [selectedStatuses, selectedResponsibles, searchTerm]);


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

  const handleViewCheckin = useCallback((checkin: CheckinWithPatient) => {
    setSelectedCheckin(checkin);
    setIsModalOpen(true);
  }, []);

  const handleEditCheckin = useCallback((checkin: CheckinWithPatient) => {
    setEditingCheckin(checkin);
    setIsEditModalOpen(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSaveCheckin = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header com destaque visual melhorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Checkins dos Pacientes
          </h1>
          <p className="text-slate-400 text-sm">
            Acompanhe o progresso mensal dos seus pacientes
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Filtros Avançados */}
      <CheckinFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatuses={selectedStatuses}
        onStatusChange={setSelectedStatuses}
        selectedResponsibles={selectedResponsibles}
        onResponsibleChange={setSelectedResponsibles}
        teamMembers={teamMembers}
        totalResults={filteredCheckins.length}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        filterWithBioimpedance={filterWithBioimpedance}
        onFilterWithBioimpedanceChange={setFilterWithBioimpedance}
      />

      {/* Lista de Checkins */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">
            Checkins Recentes ({filteredCheckins.length})
            {displayedCheckins.length < sortedCheckins.length && (
              <span className="text-slate-400 text-sm font-normal ml-2">
                (mostrando {displayedCheckins.length} de {sortedCheckins.length})
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Histórico detalhado dos checkins dos pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkinsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <CheckinItemSkeleton key={i} />
            ))
          ) : displayedCheckins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Inbox className="w-16 h-16 text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                {filteredCheckins.length === 0 && recentCheckins.length > 0
                  ? 'Nenhum check-in encontrado'
                  : 'Nenhum check-in cadastrado'}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {filteredCheckins.length === 0 && recentCheckins.length > 0
                  ? 'Tente ajustar os filtros para encontrar check-ins.'
                  : 'Comece criando check-ins para os pacientes.'}
              </p>
              {filteredCheckins.length === 0 && recentCheckins.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatuses(['pendente']);
                    setSelectedResponsibles([]);
                  }}
                  className="mt-2"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            displayedCheckins.map((checkin) => {
              // Obter total de check-ins para este paciente (já calculado anteriormente)
              const totalPatientCheckins = checkin.patient?.id 
                ? (patientCheckinsCount.get(checkin.patient.id) || 0)
                : 0;
              
              return (
                <div key={checkin.id} className="px-2.5 py-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:from-slate-700/60 hover:to-slate-800/60 hover:border-slate-600/60 hover:shadow-lg hover:shadow-slate-900/20 transition-all duration-300 ease-out">
                  <div className="flex items-center justify-between gap-2">
                    {/* Informações do Paciente */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                          {checkin.patient?.nome?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-lg truncate leading-tight">{checkin.patient?.nome || 'Paciente não informado'}</h4>
                      </div>
                    </div>
                    
                    {/* Controles e Botões */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 flex-wrap">
                      {/* Status, Responsável, Notas e Lock - integrados na linha */}
                      <CheckinQuickControls
                        checkin={checkin}
                        teamMembers={teamMembers}
                        onUpdate={refetch}
                        notesCount={checkin.notes_count || 0}
                        compact={true}
                      />
                      
                      <div className="flex items-center gap-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={`/checkins/evolution/${checkin.telefone}`}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-500/20 hover:text-blue-300 h-6 w-6 p-0"
                                onContextMenu={(e) => {
                                  // Permite o menu de contexto padrão do navegador
                                  // O navegador já oferece "Abrir em nova aba" no menu de contexto
                                }}
                              >
                                <FileText className="w-4 h-4" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver dossiê de evolução (clique direito para abrir em nova aba)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleViewCheckin(checkin)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalhes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditCheckin(checkin)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar checkin</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>

                   {/* Feedback */}
                   <div className="mt-0.5">
                     <CheckinFeedbackCard
                       checkin={checkin}
                       totalCheckins={totalPatientCheckins}
                       onUpdate={refetch}
                     />
                   </div>
                </div>
              );
            })
          )}
          
          {/* Botão Carregar Mais */}
          {hasMore && !checkinsLoading && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setDisplayLimit(prev => prev + 10)}
                className="bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Carregar mais ({sortedCheckins.length - displayLimit} restantes)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                    <Line type="monotone" dataKey="water" stroke="#3b82f6" strokeWidth={2} name="Hidratação" />
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
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-[#3b82f6]"></div>
                    <span className="text-slate-300">Hidratação</span>
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

      {/* Modal de Detalhes */}
      <CheckinDetailsModal
        checkin={selectedCheckin}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCheckin(null);
        }}
      />

      {/* Modal de Edição */}
      <EditCheckinModal
        checkin={editingCheckin}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
