import { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  DollarSign,
  MoreHorizontal,
  Eye,
  ToggleLeft,
  ToggleRight,
  Filter,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockPlans, mockPatients } from "@/lib/mock-data";
import { CardSkeleton, MetricCardSkeleton } from "@/components/ui/loading-skeleton";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export function PlansList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Calcular estatísticas dos planos
  const getPlansStats = () => {
    const activePlans = mockPlans.filter(p => p.active).length;
    const totalPatients = mockPatients.length;
    
    const planUsage = mockPlans.map(plan => {
      const patientsCount = mockPatients.filter(p => p.plan_id === plan.id).length;
      return {
        ...plan,
        patientsCount,
        revenue: patientsCount * (plan.name.includes('VIP') ? 500 : plan.name.includes('Premium') ? 300 : 150)
      };
    });

    return { activePlans, totalPatients, planUsage };
  };

  const stats = getPlansStats();

  // Dados para gráficos
  const planDistribution = stats.planUsage.map(plan => ({
    name: plan.name,
    value: plan.patientsCount,
    color: plan.name.includes('VIP') ? '#F59E0B' : 
           plan.name.includes('Premium') ? '#10B981' : 
           plan.name.includes('Família') ? '#EF4444' : '#3B82F6'
  }));

  const revenueData = stats.planUsage.map(plan => ({
    name: plan.name.replace('Plano ', ''),
    receita: plan.revenue,
    pacientes: plan.patientsCount
  }));

  // Filtrar planos
  const filteredPlans = stats.planUsage.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || plan.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && plan.active) ||
                         (selectedStatus === "inactive" && !plan.active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const handleDeletePlan = async (planId: string) => {
    setDeletingId(planId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Plano excluído",
        description: "O plano foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TooltipProvider>
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de acompanhamento disponíveis
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))
          ) : (
            <>
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.activePlans}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {mockPlans.length} planos totais
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.totalPatients}</div>
                  <p className="text-xs text-success mt-1">
                    Distribuídos nos planos
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DollarSign className="h-4 w-4 text-warning cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Receita mensal estimada baseada nos planos ativos</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    R$ {stats.planUsage.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mensal aproximada
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mais Popular</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-foreground">
                    {stats.planUsage.sort((a, b) => b.patientsCount - a.patientsCount)[0]?.name.replace('Plano ', '') || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.planUsage.sort((a, b) => b.patientsCount - a.patientsCount)[0]?.patientsCount} pacientes
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Distribuição de Pacientes</CardTitle>
            <CardDescription>
              Quantidade de pacientes por plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name.replace('Plano ', '')}: ${value}`}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Receita por Plano</CardTitle>
            <CardDescription>
              Receita mensal estimada por tipo de plano
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
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Bar 
                  dataKey="receita" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar planos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-surface border-border"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-surface border-border">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediário">Intermediário</SelectItem>
                <SelectItem value="avançado">Avançado</SelectItem>
                <SelectItem value="especial">Especial</SelectItem>
                <SelectItem value="econômico">Econômico</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48 bg-surface border-border">
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
            filteredPlans.map((plan) => (
          <Card key={plan.id} className="glass hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {plan.active ? (
                    <ToggleRight className="w-5 h-5 text-success" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        {plan.active ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />}
                        {plan.active ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DeleteConfirmation
                        itemName={plan.name}
                        itemType="plano"
                        onConfirm={() => handleDeletePlan(plan.id)}
                        loading={deletingId === plan.id}
                      >
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()}
                          className="text-danger focus:text-danger"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DeleteConfirmation>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
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
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{plan.patientsCount}</p>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-success" />
                  <p className="text-2xl font-bold text-foreground">
                    R$ {plan.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Receita/mês</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="w-3 h-3 mr-1" />
                  Detalhes
                </Button>
              </div>
            </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredPlans.length === 0 && (
        <Card className="glass">
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum plano encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou crie um novo plano.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Plano
            </Button>
          </CardContent>
      </Card>
      )}
    </div>
    </TooltipProvider>
  );
}