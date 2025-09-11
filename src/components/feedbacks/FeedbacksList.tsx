import { useState } from "react";
import { 
  Search, 
  Filter,
  Calendar,
  Star,
  TrendingUp,
  User,
  MessageSquare,
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
import { 
  mockFeedbackRecords, 
  mockPatients,
  getRecentFeedbacks 
} from "@/lib/mock-data";
import { FeedbackItemSkeleton, MetricCardSkeleton } from "@/components/ui/loading-skeleton";
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

export function FeedbacksList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [loading, setLoading] = useState(false);

  // Dados para o gráfico de evolução de scores
  const scoreEvolutionData = [
    { date: "01/08", workout: 6.5, cardio: 5.8, sleep: 7.2, overall: 6.5 },
    { date: "08/08", workout: 7.2, cardio: 6.5, sleep: 7.8, overall: 7.2 },
    { date: "15/08", workout: 7.8, cardio: 7.1, sleep: 8.0, overall: 7.6 },
    { date: "22/08", workout: 8.1, cardio: 7.5, sleep: 7.9, overall: 7.8 },
    { date: "29/08", workout: 8.3, cardio: 7.8, sleep: 8.2, overall: 8.1 },
    { date: "05/09", workout: 8.5, cardio: 8.0, sleep: 8.1, overall: 8.2 }
  ];

  // Dados para o radar de categorias
  const categoryRadarData = [
    { category: "Treino", score: 8.2, fullMark: 10 },
    { category: "Cardio", score: 7.5, fullMark: 10 },
    { category: "Sono", score: 7.8, fullMark: 10 },
    { category: "Hidratação", score: 8.5, fullMark: 10 },
    { category: "Alimentação", score: 7.2, fullMark: 10 },
    { category: "Stress", score: 6.8, fullMark: 10 }
  ];

  const recentFeedbacks = getRecentFeedbacks(10);

  // Filtrar feedbacks
  const filteredFeedbacks = recentFeedbacks.filter(feedback => {
    const matchesSearch = feedback.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPatient = selectedPatient === "all" || feedback.patient_id === selectedPatient;
    return matchesSearch && matchesPatient;
  });

  const getScoreColor = (score: number) => {
    if (score >= 8) return "status-active";
    if (score >= 6) return "status-warning";
    return "status-danger";
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return "Excelente";
    if (score >= 6) return "Bom";
    return "Precisa melhorar";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Feedbacks</h1>
            <p className="text-muted-foreground">
              Acompanhe o progresso e evolução dos seus pacientes
            </p>
          </div>
          <Button onClick={() => setLoading(!loading)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Novo Feedback
          </Button>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))
          ) : (
            <>
              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{mockFeedbackRecords.length}</div>
                  <p className="text-xs text-success flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +15% este mês
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Score Médio Geral</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Star className="h-4 w-4 text-warning cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Média dos scores gerais de todos os feedbacks</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">7.4</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desempenho muito bom
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
                  <User className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">18</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Com feedback recente
                  </p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Evolução</CardTitle>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">+12%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Melhoria nos scores
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Gráficos de Análise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Evolução dos Scores
              </CardTitle>
              <CardDescription>
                Progresso médio dos principais indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="workout" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Treino"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cardio" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Cardio"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sleep" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    name="Sono"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overall" 
                    stroke="hsl(var(--danger))" 
                    strokeWidth={3}
                    name="Geral"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Análise por Categoria
              </CardTitle>
              <CardDescription>
                Score médio por área de acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={categoryRadarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
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
                  placeholder="Buscar por paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-surface border-border"
                />
              </div>
              
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-full md:w-48 bg-surface border-border">
                  <SelectValue placeholder="Filtrar por paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {mockPatients.slice(0, 10).map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full md:w-48 bg-surface border-border">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 3 meses</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Feedbacks */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Feedbacks Recentes ({filteredFeedbacks.length})</CardTitle>
            <CardDescription>
              Histórico detalhado dos feedbacks dos pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <FeedbackItemSkeleton key={i} />
              ))
            ) : (
              filteredFeedbacks.map((feedback) => (
                <div key={feedback.id} className="p-4 bg-surface rounded-lg border border-border hover:bg-surface-hover transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {feedback.patient_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-foreground">{feedback.patient_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleDateString('pt-BR')} • 
                          Peso: {feedback.weight}kg
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreColor(feedback.overall_score)}>
                        {feedback.overall_score}/10 • {getScoreText(feedback.overall_score)}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalhes completos</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  
                  {/* Scores Detalhados */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-background/50 rounded">
                      <p className="text-xs text-muted-foreground">Treino</p>
                      <p className="font-medium text-sm">{feedback.workout_score}/10</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <p className="text-xs text-muted-foreground">Cardio</p>
                      <p className="font-medium text-sm">{feedback.cardio_score}/10</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <p className="text-xs text-muted-foreground">Sono</p>
                      <p className="font-medium text-sm">{feedback.sleep_score}/10</p>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <p className="text-xs text-muted-foreground">Hidratação</p>
                      <p className="font-medium text-sm">{feedback.water_intake_score}/10</p>
                    </div>
                  </div>
                  
                  {/* Objetivo e Dificuldades */}
                  {(feedback.current_main_goal || feedback.difficulties_faced) && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {feedback.current_main_goal && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">Objetivo:</span> {feedback.current_main_goal}
                        </p>
                      )}
                      {feedback.difficulties_faced && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Dificuldades:</span> {feedback.difficulties_faced}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            
            {filteredFeedbacks.length === 0 && !loading && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum feedback encontrado
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou peça aos pacientes para enviarem feedbacks.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}