import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Star
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  getDashboardMetrics, 
  getRecentFeedbacks, 
  getPatientsRequiringAction,
  mockPlans 
} from "@/lib/mock-data";

// Mock data para gráficos
const monthlyData = [
  { month: "Mar", novos: 12, feedbacks: 45 },
  { month: "Abr", novos: 19, feedbacks: 52 },
  { month: "Mai", novos: 15, feedbacks: 48 },
  { month: "Jun", novos: 22, feedbacks: 61 },
  { month: "Jul", novos: 18, feedbacks: 58 },
  { month: "Ago", novos: 25, feedbacks: 73 },
  { month: "Set", novos: 21, feedbacks: 67 }
];

const planDistribution = [
  { name: "Básico", value: 8, color: "#3B82F6" },
  { name: "Premium", value: 12, color: "#10B981" },
  { name: "VIP", value: 3, color: "#F59E0B" },
  { name: "Família", value: 2, color: "#EF4444" }
];

export function DashboardOverview() {
  const metrics = getDashboardMetrics();
  const recentFeedbacks = getRecentFeedbacks();
  const actionRequired = getPatientsRequiringAction();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos seus pacientes e atividades
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Este mês
          </Button>
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalPatients}</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirando (30 dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{metrics.expiringPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Precisam renovação
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedbacks Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{metrics.pendingFeedbacks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sem feedback há 30+ dias
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.avgOverallScore}</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Excelente desempenho
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução */}
        <Card className="col-span-1 lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Novos pacientes vs feedbacks recebidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Line 
                  type="monotone" 
                  dataKey="novos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="feedbacks" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Planos */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>
              Pacientes por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações Necessárias */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Ação Necessária
            </CardTitle>
            <CardDescription>
              Pacientes expirando nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionRequired.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                Nenhuma ação necessária no momento!
              </div>
            ) : (
              actionRequired.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-warning/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-warning/20 text-warning">
                        {patient.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">{patient.plan_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="status-warning">
                      {patient.days_to_expiration}d restantes
                    </Badge>
                    <Button size="sm" variant="outline">
                      Renovar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Últimos Feedbacks */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Últimos Feedbacks
            </CardTitle>
            <CardDescription>
              5 feedbacks mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentFeedbacks.map((feedback) => (
              <div key={feedback.id} className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {feedback.patient_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{feedback.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={
                      feedback.overall_score >= 8 ? 'status-active' :
                      feedback.overall_score >= 6 ? 'status-warning' :
                      'status-danger'
                    }
                  >
                    {feedback.overall_score}/10
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}