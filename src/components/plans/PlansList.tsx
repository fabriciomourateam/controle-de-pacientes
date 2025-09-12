import { useState } from "react";
import { 
  Edit, 
  Users, 
  Calendar,
  DollarSign,
  Eye,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CardSkeleton, MetricCardSkeleton } from "@/components/ui/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/hooks/use-supabase-data";
import { PlanDetailsModal } from "@/components/modals/PlanDetailsModal";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip
} from "recharts";

export function PlansList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);
  const { toast } = useToast();

  // Função para formatar valores monetários com 2 casas decimais
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Hooks para dados do Supabase
  const { patients, loading: patientsLoading } = usePatients();


  // Funções para visualizar planos (baseados em dados reais dos pacientes)
  const handleViewDetails = (plan: any) => {
    setSelectedPlan(plan);
    setShowDetails(true);
  };

  const handleEditPlan = (plan: any) => {
    // Para planos baseados em dados reais, apenas mostrar detalhes
    toast({
      title: "Informação",
      description: "Os planos são baseados nos dados reais dos pacientes. Para alterar, edite os dados dos pacientes.",
      variant: "default",
    });
  };


  // Calcular estatísticas dos planos baseadas nos dados reais dos pacientes
  const getPlansStats = () => {
    // Obter planos únicos dos pacientes
    const uniquePlans = [...new Set(patients.map(p => p.plano).filter(Boolean))];
    
    const planUsage = uniquePlans.map(planName => {
      const patientsWithPlan = patients.filter(p => p.plano === planName);
      const patientsCount = patientsWithPlan.length;
      
      // Calcular valores reais dos pacientes
      const totalValue = patientsWithPlan.reduce((sum, p) => sum + (p.valor || 0), 0);
      const avgValue = patientsCount > 0 ? totalValue / patientsCount : 0;
      
      // Calcular ticket médio (apenas pacientes que têm ticket_medio preenchido)
      const patientsWithTicketMedio = patientsWithPlan.filter(p => p.ticket_medio && p.ticket_medio > 0);
      const ticketMedio = patientsWithTicketMedio.length > 0 
        ? patientsWithTicketMedio.reduce((sum, p) => sum + p.ticket_medio, 0) / patientsWithTicketMedio.length 
        : 0;
      
      return {
        name: planName,
        patientsCount,
        totalValue,
        avgValue,
        ticketMedio,
        ticketMedioCount: patientsWithTicketMedio.length, // Quantos pacientes têm ticket médio
        revenue: totalValue,
        active: true, // Considerar todos os planos dos pacientes como ativos
        category: 'personalizado',
        period: 'mensal',
        description: `Plano ${planName} - ${patientsCount} pacientes`
      };
    });

    const activePlans = planUsage.length;
    const totalPatients = patients.length;
    const totalRevenue = planUsage.reduce((sum, p) => sum + p.revenue, 0);

    // Debug: mostrar informações sobre ticket médio
    console.log('Debug Planos - Ticket Médio:', planUsage.map(p => ({
      plano: p.name,
      pacientes: p.patientsCount,
      ticketMedio: p.ticketMedio,
      ticketMedioCount: p.ticketMedioCount
    })));

    return { activePlans, totalPatients, planUsage, totalRevenue };
  };

  const stats = getPlansStats();

  // Dados para gráficos
  const planDistribution = stats.planUsage.map(plan => ({
    name: plan.name,
    value: plan.patientsCount,
    color: plan.name.includes('VIP') ? '#F59E0B' : 
           plan.name.includes('Premium') ? '#10B981' : 
           plan.name.includes('Família') ? '#EF4444' : 
           plan.name.includes('Básico') ? '#3B82F6' : '#8B5CF6'
  }));

  const revenueData = stats.planUsage.map(plan => ({
    name: plan.name,
    receita: plan.revenue,
    pacientes: plan.patientsCount,
    valorMedio: plan.avgValue
  }));

  // Filtrar planos
  const filteredPlans = stats.planUsage.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || plan.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && plan.active) ||
                         (selectedStatus === "inactive" && !plan.active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Loading state
  const loading = patientsLoading;

  const getCategoryBadge = (category: string) => {
    const colors = {
      iniciante: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      intermediário: "bg-green-500/20 text-green-400 border-green-500/30",
      avançado: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      especial: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      econômico: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || "bg-gray-500/20 text-gray-400"}>
        {category}
      </Badge>
    );
  };

  const getPeriodBadge = (period: string) => {
    const colors = {
      mensal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      trimestral: "bg-green-500/20 text-green-400 border-green-500/30",
      semestral: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    };
    
    return (
      <Badge className={colors[period as keyof typeof colors] || "bg-gray-500/20 text-gray-400"}>
        {period}
      </Badge>
    );
  };


  return (
    <TooltipProvider>
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Planos</h1>
          <p className="text-slate-400">
            Análise dos planos baseados nos dados reais dos pacientes
          </p>
        </div>
        <div className="text-sm text-slate-400">
          <p>Dados extraídos dos pacientes cadastrados</p>
          <p className="text-xs mt-1">
            Total de pacientes: {patients.length} | 
            Planos únicos: {stats.planUsage.length} | 
            Pacientes com ticket médio: {stats.planUsage.reduce((sum, p) => sum + p.ticketMedioCount, 0)}
          </p>
        </div>
      </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))
          ) : (
            <>
              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Planos Ativos</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.activePlans}</div>
                  <p className="text-xs text-slate-400 mt-1">
                    baseados nos dados dos pacientes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalPatients}</div>
                  <p className="text-xs text-emerald-400 mt-1">
                    Distribuídos nos planos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Receita Total</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DollarSign className="h-4 w-4 text-amber-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Receita total baseada nos valores reais dos pacientes</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    R$ {formatCurrency(stats.totalRevenue)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Valores reais dos pacientes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Mais Popular</CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-white">
                    {stats.planUsage.sort((a, b) => b.patientsCount - a.patientsCount)[0]?.name.replace('Plano ', '') || 'N/A'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.planUsage.sort((a, b) => b.patientsCount - a.patientsCount)[0]?.patientsCount} pacientes
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Pacientes</CardTitle>
            <CardDescription className="text-slate-400">
              Quantidade de pacientes por plano
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
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} pacientes`,
                      name
                    ]}
                    labelStyle={{
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '15px'
                    }}
                    itemStyle={{
                      color: '#ffffff'
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

        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Receita por Plano</CardTitle>
            <CardDescription className="text-slate-400">
              Receita total e valor médio por plano dos pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Bar 
                  dataKey="receita" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Receita Total"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-slate-400">Total Geral</p>
                <p className="font-bold text-lg text-white">R$ {formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400">Média por Plano</p>
                <p className="font-bold text-lg text-white">R$ {formatCurrency(Math.round(stats.totalRevenue / stats.planUsage.length))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar planos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-600/50 text-white">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Array.from(new Set(stats.planUsage.map(p => p.category).filter(Boolean))).map((category, index) => (
                  <SelectItem key={`category-${category}-${index}`} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-600/50 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

        {/* Lista de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : (
            filteredPlans.map((plan, index) => (
          <Card key={`${plan.name}-${index}`} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Ativo
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleViewDetails(plan)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2 text-slate-400">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {getCategoryBadge(plan.category)}
                  {getPeriodBadge(plan.period)}
                </div>
                <Badge variant={plan.active ? "default" : "secondary"}>
                  {plan.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Users className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <p className="text-2xl font-bold text-white">{plan.patientsCount}</p>
                  <p className="text-xs text-slate-400">Pacientes</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <p className="text-lg font-bold text-white">
                    R$ {formatCurrency(plan.avgValue)}
                  </p>
                  <p className="text-xs text-slate-400">Valor Médio</p>
                </div>
              </div>
              
              {/* Receita Total */}
              <div className="text-center p-3 bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-lg border border-amber-500/20">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                <p className="text-xl font-bold text-amber-400">
                  R$ {formatCurrency(plan.revenue)}
                </p>
                <p className="text-xs text-slate-400">Receita Total</p>
              </div>
              
              {/* Ticket Médio */}
              <div className="text-center p-3 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                <DollarSign className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                <p className="text-lg font-bold text-blue-400">
                  {plan.ticketMedio > 0 ? `R$ ${formatCurrency(plan.ticketMedio)}` : 'N/A'}
                </p>
                <p className="text-xs text-slate-400">
                  Ticket Médio {plan.ticketMedioCount > 0 ? `(${plan.ticketMedioCount} pacientes)` : '(sem dados)'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  onClick={() => handleViewDetails(plan)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver Detalhes
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  onClick={() => handleEditPlan(plan)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Info
                </Button>
              </div>
            </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && filteredPlans.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-white mb-2">
              Nenhum plano encontrado
            </h3>
            <p className="text-slate-400 mb-4">
              Não há pacientes com planos cadastrados ou os filtros não retornaram resultados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes */}
      <PlanDetailsModal
        plan={selectedPlan}
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedPlan(null);
        }}
        onEdit={handleEditPlan}
      />
    </div>
    </TooltipProvider>
  );
}