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
  Inbox,
  RefreshCw,
  Clock
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useCheckinsWithScheduledRefetch, useCheckinsWithPatient } from "@/hooks/use-checkin-data";
import { getNextScheduledUpdate } from "@/hooks/use-scheduled-refetch";
import { usePatientsWithBioimpedance } from "@/hooks/use-patients-with-bioimpedance";
import { CheckinItemSkeleton, MetricCardSkeleton } from "@/components/ui/loading-skeleton";
import { CheckinDetailsModal } from "@/components/modals/CheckinDetailsModal";
import { CheckinForm } from "@/components/forms/CheckinForm";
import { formatWeight } from "@/lib/weight-utils";
import { EditCheckinModal } from "@/components/evolution/EditCheckinModal";
import { RankingPanel } from "@/components/checkins/RankingPanel";
import { CheckinFeedbackCard } from "@/components/checkins/CheckinFeedbackCard";
import { CheckinFilters } from "@/components/checkins/CheckinFilters";
import { CheckinQuickControls, getAssigneeCardColor } from "@/components/checkins/CheckinQuickControls";
import { assigneeColorsService } from "@/lib/assignee-colors-service";
import { useCheckinManagement, CheckinStatus } from "@/hooks/use-checkin-management";
import type { CheckinWithPatient } from "@/lib/checkin-service";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/auth-helpers";
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

// Interface para preferências
interface CheckinPreferences {
  searchTerm: string;
  selectedStatuses: CheckinStatus[];
  selectedResponsibles: string[];
  sortBy: 'date' | 'name' | 'status' | 'score';
  sortOrder: 'asc' | 'desc';
  filterWithBioimpedance: boolean;
  displayLimit: number;
}

// Função para carregar preferências do banco de dados por usuário
const loadCheckinPreferences = async (): Promise<Partial<CheckinPreferences>> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {}; // Se não há usuário autenticado, retorna vazio
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('filters')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {};
    }

    // Verificar se há preferências de checkins no campo filters
    const filters = data.filters as any;
    if (filters && filters.checkinPreferences) {
      return filters.checkinPreferences;
    }
  } catch (error) {
    console.warn('Erro ao carregar preferências de checkins:', error);
  }
  return {};
};

// Função para salvar preferências no banco de dados por usuário
const saveCheckinPreferences = async (prefs: Partial<CheckinPreferences>) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return; // Se não há usuário autenticado, não salva
    }

    // Buscar preferências existentes
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('filters')
      .eq('user_id', userId)
      .single();

    const currentFilters = (existing?.filters as any) || {};

    // Atualizar apenas as preferências de checkins
    const updatedFilters = {
      ...currentFilters,
      checkinPreferences: prefs
    };

    // Salvar no banco
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        filters: updatedFilters,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.warn('Erro ao salvar preferências de checkins:', error);
    }
  } catch (error) {
    console.warn('Erro ao salvar preferências de checkins:', error);
  }
};

export function CheckinsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados iniciais (serão atualizados quando as preferências carregarem)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<CheckinStatus[]>(['pendente', 'em_analise']);
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithPatient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Padrão: mais antigo primeiro (enviados primeiro no topo)
  const [filterWithBioimpedance, setFilterWithBioimpedance] = useState(false);
  const [patientsWithBioimpedance, setPatientsWithBioimpedance] = useState<Set<string>>(new Set());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Estado para controlar o limite de checkins carregados
  const [checkinLimit, setCheckinLimit] = useState<number | null>(200); // Padrão: 200 checkins
  const [showLimitControl, setShowLimitControl] = useState(false);

  // Estado para controlar qual check-in está aberto no Sheet lateral
  const [selectedCheckinForSheet, setSelectedCheckinForSheet] = useState<CheckinWithPatient | null>(null);



  // Hook para buscar checkins com dados do paciente e limite customizado
  // Usa o hook com atualização programada, mas com limite customizado
  const { data: recentCheckins = [], isLoading: checkinsLoading, refetch, isFetching } = useCheckinsWithScheduledRefetch(checkinLimit);
  const { teamMembers, loading: teamMembersLoading } = useCheckinManagement();

  // Estado para última atualização e próxima atualização programada
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const nextUpdate = getNextScheduledUpdate();

  // Fechar menu de limite ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLimitControl && !target.closest('.limit-control-menu')) {
        setShowLimitControl(false);
      }
    };

    if (showLimitControl) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLimitControl]);

  // Carregar preferências do banco de dados ao montar o componente
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function loadPreferences() {
      try {
        // Timeout de segurança: se demorar mais de 5 segundos, marcar como carregado
        timeoutId = setTimeout(() => {
          console.warn('Timeout ao carregar preferências, continuando sem elas');
          setPreferencesLoaded(true);
        }, 5000);

        const savedPrefs = await loadCheckinPreferences();
        clearTimeout(timeoutId);

        if (savedPrefs.searchTerm !== undefined) setSearchTerm(savedPrefs.searchTerm);
        if (savedPrefs.selectedStatuses) setSelectedStatuses(savedPrefs.selectedStatuses);
        if (savedPrefs.selectedResponsibles) setSelectedResponsibles(savedPrefs.selectedResponsibles);
        if (savedPrefs.displayLimit) setDisplayLimit(savedPrefs.displayLimit);
        if (savedPrefs.sortBy) setSortBy(savedPrefs.sortBy);
        if (savedPrefs.sortOrder) setSortOrder(savedPrefs.sortOrder);
        if (savedPrefs.filterWithBioimpedance !== undefined) setFilterWithBioimpedance(savedPrefs.filterWithBioimpedance);
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
        clearTimeout(timeoutId);
      } finally {
        // Sempre marcar como carregado, mesmo em caso de erro
        setPreferencesLoaded(true);
      }
    }

    loadPreferences();

    // Cleanup: limpar timeout se componente desmontar
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Função para atualização manual (inteligente)
  const handleManualRefresh = useCallback(async () => {
    await refetch();
    setLastUpdate(new Date());
  }, [refetch]);

  // Função para atualização completa (forçar busca de tudo)
  const handleFullRefresh = useCallback(async () => {
    console.log('🔄 Atualização completa: invalidando todas as queries...');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['checkins'] }),
      queryClient.invalidateQueries({ queryKey: ['checkin'] }),
      queryClient.invalidateQueries({ queryKey: ['patients'] }),
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] }),
    ]);
    await refetch();
    setLastUpdate(new Date());
  }, [refetch, queryClient]);

  // Carregar lista de telefones que têm bioimpedância
  // Otimizado: usa React Query com cache
  const { data: patientsWithBioimpedanceData } = usePatientsWithBioimpedance();

  useEffect(() => {
    if (patientsWithBioimpedanceData) {
      setPatientsWithBioimpedance(patientsWithBioimpedanceData);
    }
  }, [patientsWithBioimpedanceData]);

  // Debounce na busca para melhorar performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Gerar dados reais para o gráfico de evolução de scores (memoizado)
  // ⚡ OTIMIZAÇÃO: Processar apenas últimos 50 checkins ao invés de todos
  const scoreEvolutionData = useMemo(() => {
    if (recentCheckins.length === 0) return [];

    // Limitar a 50 checkins mais recentes para performance
    const checkinsToProcess = recentCheckins.slice(0, 50);

    // Agrupar checkins por data e calcular médias
    const groupedByDate = checkinsToProcess.reduce((acc, checkin) => {
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
  // ⚡ OTIMIZAÇÃO: Processar apenas últimos 50 checkins ao invés de todos
  const categoryRadarData = useMemo(() => {
    if (recentCheckins.length === 0) return [];

    // Limitar a 50 checkins mais recentes para performance
    const checkinsToProcess = recentCheckins.slice(0, 50);

    const categories = [
      { key: 'pontos_treinos', name: 'Treino' },
      { key: 'pontos_cardios', name: 'Cardio' },
      { key: 'pontos_sono', name: 'Sono' },
      { key: 'pontos_agua', name: 'Hidratação' },
      { key: 'pontos_stress', name: 'Stress' },
      { key: 'pontos_libido', name: 'Libido' }
    ];

    return categories.map(category => {
      const scores = checkinsToProcess
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
  // ⚡ OTIMIZAÇÃO: Early return para evitar verificações desnecessárias
  const filteredCheckins = useMemo(() => {
    return recentCheckins.filter(checkin => {
      // Filtro de busca por nome (mais restritivo primeiro)
      if (debouncedSearchTerm) {
        const matchesSearch = checkin.patient?.nome?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        if (!matchesSearch) return false; // Early return
      }

      // Filtro de status
      if (selectedStatuses.length > 0) {
        const checkinStatus = (checkin.status as CheckinStatus) || 'pendente';
        if (!selectedStatuses.includes(checkinStatus)) return false; // Early return
      }

      // Filtro de responsável
      if (selectedResponsibles.length > 0) {
        if (!selectedResponsibles.includes(checkin.assigned_to || 'unassigned')) return false; // Early return
      }

      // Filtro de bioimpedância
      if (filterWithBioimpedance) {
        const telefoneCheckin = checkin.telefone || checkin.patient?.telefone;
        if (!telefoneCheckin || !patientsWithBioimpedance.has(telefoneCheckin)) return false; // Early return
      }

      return true;
    });
  }, [recentCheckins, debouncedSearchTerm, selectedStatuses, selectedResponsibles, filterWithBioimpedance, patientsWithBioimpedance]);

  // Ordenar check-ins filtrados
  const sortedCheckins = useMemo(() => {
    const sorted = [...filteredCheckins].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        // Usar data_preenchimento (data/hora de envio) primeiro para ordenar por quando foi enviado
        const dateA = new Date(a.data_preenchimento || a.data_checkin || 0).getTime();
        const dateB = new Date(b.data_preenchimento || b.data_checkin || 0).getTime();
        comparison = dateA - dateB;

        // REGRA ESPECIAL: Quando filtro de pendentes está ativo, sempre ordenar ascendente (mais antigos primeiro)
        const isPendingFilterActive = selectedStatuses.length === 1 && selectedStatuses.includes('pendente');
        if (isPendingFilterActive) {
          return comparison; // Sempre ascendente para pendentes
        }
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
  }, [filteredCheckins, sortBy, sortOrder, selectedStatuses]);

  // Limitar check-ins exibidos baseado no displayLimit
  const displayedCheckins = useMemo(() => {
    return sortedCheckins.slice(0, displayLimit);
  }, [sortedCheckins, displayLimit]);

  // Verificar se há mais check-ins para carregar
  const hasMore = sortedCheckins.length > displayLimit;

  // Salvar preferências quando mudarem (apenas após carregar as preferências iniciais)
  useEffect(() => {
    if (!preferencesLoaded) return; // Não salvar antes de carregar as preferências iniciais

    saveCheckinPreferences({
      searchTerm,
      selectedStatuses,
      selectedResponsibles,
      sortBy,
      sortOrder,
      filterWithBioimpedance,
      displayLimit
    });
  }, [searchTerm, selectedStatuses, selectedResponsibles, sortBy, sortOrder, filterWithBioimpedance, displayLimit, preferencesLoaded]);

  // Não resetar displayLimit automaticamente - manter o valor salvo


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

  // ⚡ OTIMIZAÇÃO: Memoizar métricas do header para evitar recálculos
  const headerMetrics = useMemo(() => {
    const now = new Date();

    return {
      total: recentCheckins.length,
      thisMonth: recentCheckins.filter(c => {
        const dateToCheck = c.data_preenchimento || c.data_checkin;
        if (!dateToCheck) return false;

        const checkinDate = new Date(dateToCheck);
        if (isNaN(checkinDate.getTime())) return false;

        return checkinDate.getMonth() === now.getMonth() &&
          checkinDate.getFullYear() === now.getFullYear();
      }).length,
      avgScore: recentCheckins.length > 0
        ? (recentCheckins.reduce((acc, c) => {
          const score = parseFloat(c.total_pontuacao || '0');
          return acc + (isNaN(score) ? 0 : score);
        }, 0) / recentCheckins.length).toFixed(1)
        : '0.0',
      activePatients: new Set(recentCheckins.map(c => c.patient?.id).filter(Boolean)).size
    };
  }, [recentCheckins]);

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
                <p className="text-2xl font-bold text-white">{headerMetrics.total}</p>
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
                <p className="text-2xl font-bold text-white">{headerMetrics.thisMonth}</p>
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
                <p className="text-2xl font-bold text-white">{headerMetrics.avgScore}</p>
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
                <p className="text-2xl font-bold text-white">{headerMetrics.activePatients}</p>
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
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div>
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
            </div>

            {/* Botão de atualização e informações */}
            <div className="flex flex-col items-end gap-2 relative">
              <div className="flex gap-2">
                {/* Botão para controlar limite - Apenas ícone */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLimitControl(!showLimitControl)}
                        className="gap-2 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 text-white h-9 w-9 p-0"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Limite: {checkinLimit ? `${checkinLimit} checkins` : 'Sem limite'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          if (e.shiftKey) {
                            e.preventDefault();
                            handleFullRefresh();
                          } else {
                            handleManualRefresh();
                          }
                        }}
                        disabled={isFetching}
                        className="gap-2 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 text-white"
                      >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        {isFetching ? 'Atualizando...' : 'Atualizar'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clique normal: atualização inteligente</p>
                      <p>Shift+Clique: atualização completa</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Menu de controle de limite */}
              {showLimitControl && (
                <Card className="limit-control-menu absolute z-50 mt-10 bg-slate-800 border-slate-600 shadow-lg min-w-[200px]">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-white mb-2">
                        Quantos checkins carregar?
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={checkinLimit === 200 ? "default" : "outline"}
                          onClick={() => {
                            setCheckinLimit(200);
                            setShowLimitControl(false);
                            refetch();
                          }}
                          className="w-full justify-start"
                        >
                          200 checkins (padrão)
                        </Button>
                        <Button
                          size="sm"
                          variant={checkinLimit === 500 ? "default" : "outline"}
                          onClick={() => {
                            setCheckinLimit(500);
                            setShowLimitControl(false);
                            refetch();
                          }}
                          className="w-full justify-start"
                        >
                          500 checkins
                        </Button>
                        <Button
                          size="sm"
                          variant={checkinLimit === 1000 ? "default" : "outline"}
                          onClick={() => {
                            setCheckinLimit(1000);
                            setShowLimitControl(false);
                            refetch();
                          }}
                          className="w-full justify-start"
                        >
                          1.000 checkins
                        </Button>
                        <Button
                          size="sm"
                          variant={checkinLimit === 2000 ? "default" : "outline"}
                          onClick={() => {
                            setCheckinLimit(2000);
                            setShowLimitControl(false);
                            refetch();
                          }}
                          className="w-full justify-start"
                        >
                          2.000 checkins
                        </Button>
                        <Button
                          size="sm"
                          variant={checkinLimit === null ? "default" : "outline"}
                          onClick={() => {
                            setCheckinLimit(null);
                            setShowLimitControl(false);
                            refetch();
                          }}
                          className="w-full justify-start text-orange-400 hover:text-orange-300"
                        >
                          Todos os checkins (sem limite)
                        </Button>
                      </div>
                      <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
                        <p>⚠️ Limites maiores aumentam o tempo de carregamento</p>
                        <p>💡 Use "Todos" apenas quando necessário</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}


            </div>
          </div>
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

              // Obter cor do responsável (com suporte a cores personalizadas)
              const assigneeColor = assigneeColorsService.getAssigneeCardColor(checkin.assigned_to, teamMembers);

              return (
                <div key={checkin.id} className={`px-2.5 py-3 backdrop-blur-sm rounded-lg border border-slate-700/50 transition-all duration-300 ease-out ${assigneeColor
                  ? `${assigneeColor.border} ${assigneeColor.hoverBorder}`
                  : 'hover:from-slate-700/60 hover:to-slate-800/60 hover:border-slate-600/60'
                  } bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:shadow-lg hover:shadow-slate-900/20`}>
                  <div className="grid grid-cols-[1fr_140px_160px_120px] gap-3 items-center">
                    {/* Informações do Paciente - Coluna flexível */}
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        // Prevenir abertura se o clique vier de dentro dos controles (status, responsável, ações)
                        const target = e.target as HTMLElement;
                        if (target.closest('[data-no-expand]')) {
                          return;
                        }
                        // Prevenir abertura se o clique vier de um link ou botão
                        if (target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
                          return;
                        }
                        e.stopPropagation();
                        // Abrir Sheet com os dados do check-in
                        setSelectedCheckinForSheet(checkin);
                      }}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                          {checkin.patient?.nome?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-lg truncate leading-tight">{checkin.patient?.nome || 'Paciente não informado'}</h4>
                      </div>
                    </div>

                    {/* Status - Coluna fixa */}
                    <div className="flex-shrink-0" data-no-expand>
                      <CheckinQuickControls
                        checkin={checkin}
                        teamMembers={teamMembers}
                        onUpdate={refetch}
                        notesCount={checkin.notes_count || 0}
                        showOnlyStatus={true}
                      />
                    </div>

                    {/* Responsável - Coluna fixa */}
                    <div className="flex-shrink-0" data-no-expand>
                      <CheckinQuickControls
                        checkin={checkin}
                        teamMembers={teamMembers}
                        onUpdate={refetch}
                        notesCount={checkin.notes_count || 0}
                        showOnlyResponsible={true}
                      />
                    </div>

                    {/* Ações - Coluna fixa */}
                    <div className="flex items-center gap-1 flex-shrink-0 justify-end w-full" data-no-expand>
                      <CheckinQuickControls
                        checkin={checkin}
                        teamMembers={teamMembers}
                        onUpdate={refetch}
                        notesCount={checkin.notes_count || 0}
                        showOnlyActions={true}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={`/checkins/evolution/${checkin.telefone}`}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-500/20 hover:text-blue-300 h-7 w-7 p-0"
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
                              className="h-7 w-7 p-0 hover:bg-slate-700/50"
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
                              className="h-7 w-7 p-0 hover:bg-slate-700/50"
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

      {/* Sheet para Feedback e Detalhes do Checkin */}
      <Sheet open={!!selectedCheckinForSheet} onOpenChange={(open) => !open && setSelectedCheckinForSheet(null)}>
        <SheetContent className="w-full sm:max-w-[700px] md:max-w-[800px] lg:max-w-[1000px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Check-in de {selectedCheckinForSheet?.patient?.nome}</SheetTitle>
            <SheetDescription>
              Detalhes e feedback do check-in realizado em {selectedCheckinForSheet?.created_at ? new Date(selectedCheckinForSheet.created_at).toLocaleDateString('pt-BR') : ''}
            </SheetDescription>
          </SheetHeader>

          {selectedCheckinForSheet && (
            <div className="mt-6">
              <CheckinFeedbackCard
                checkin={selectedCheckinForSheet}
                totalCheckins={selectedCheckinForSheet.patient?.id
                  ? (patientCheckinsCount.get(selectedCheckinForSheet.patient.id) || 0)
                  : 0}
                onUpdate={refetch}
                isSheet={true}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
