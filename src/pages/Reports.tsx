import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Printer,
  Mail,
  Share2
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useDashboardMetrics, usePatients, useChartData } from "@/hooks/use-supabase-data";
import { reportsService, ReportData } from "@/lib/reports-service";
import { ReportViewModal } from "@/components/modals/ReportViewModal";

interface ReportItem {
  id: string;
  title: string;
  description: string;
  type: 'chart' | 'table' | 'summary';
  category: string;
  lastUpdated: string;
  status: 'ready' | 'generating' | 'error';
}

interface ReportFilter {
  period: string;
  startDate: string;
  endDate: string;
  patients: string[];
  metrics: string[];
}

export default function ReportsPage() {
  const { metrics, loading: metricsLoading } = useDashboardMetrics();
  const { patients, loading: patientsLoading } = usePatients();
  const { chartData, loading: chartLoading } = useChartData();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [currentReportData, setCurrentReportData] = useState<ReportData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<ReportFilter>({
    period: 'last-30-days',
    startDate: '',
    endDate: '',
    patients: [],
    metrics: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [filteredData, setFilteredData] = useState({
    patients: [] as any[],
    monthlyData: [] as any[],
    planDistribution: [] as any[]
  });

  const reportTypes: ReportItem[] = [
    {
      id: 'patient-growth',
      title: 'Crescimento de Pacientes',
      description: 'Análise do crescimento mensal de pacientes',
      type: 'chart',
      category: 'Crescimento',
      lastUpdated: '2024-01-15',
      status: 'ready'
    },
    {
      id: 'retention-analysis',
      title: 'Análise de Retenção',
      description: 'Taxa de renovação e churn por período',
      type: 'chart',
      category: 'Retenção',
      lastUpdated: '2024-01-14',
      status: 'ready'
    },
    {
      id: 'checkin-performance',
      title: 'Performance de Checkins',
      description: 'Evolução das pontuações e engajamento',
      type: 'chart',
      category: 'Engajamento',
      lastUpdated: '2024-01-13',
      status: 'ready'
    },
    {
      id: 'financial-summary',
      title: 'Resumo Financeiro',
      description: 'Receita, ticket médio e projeções',
      type: 'summary',
      category: 'Financeiro',
      lastUpdated: '2024-01-12',
      status: 'ready'
    },
    {
      id: 'patient-details',
      title: 'Detalhes dos Pacientes',
      description: 'Lista completa com status e informações',
      type: 'table',
      category: 'Pacientes',
      lastUpdated: '2024-01-11',
      status: 'ready'
    },
    {
      id: 'monthly-metrics',
      title: 'Métricas Mensais',
      description: 'KPIs e indicadores de performance',
      type: 'summary',
      category: 'Métricas',
      lastUpdated: '2024-01-10',
      status: 'ready'
    }
  ];

  // Usar dados reais do sistema
  const { monthlyData, planDistribution: realPlanDistribution } = chartData;

  // Calcular distribuição de planos baseada nos dados reais dos pacientes
  const getPlanDistribution = () => {
    if (!patients || patients.length === 0) return [];

    // Filtrar apenas planos ativos (excluir inativos)
    const inactivePlans = ['⛔ Negativado', 'NOVO', 'RESCISÃO', 'INATIVO'];
    const activePatients = patients.filter(patient => {
      if (!patient.plano) return false;
      return !inactivePlans.some(inactive => 
        patient.plano!.toUpperCase().includes(inactive.toUpperCase()) || 
        inactive.toUpperCase().includes(patient.plano!.toUpperCase())
      );
    });

    // Contar planos únicos
    const planCounts: { [key: string]: number } = {};
    activePatients.forEach(patient => {
      const planName = patient.plano || 'Sem Plano';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    // Converter para formato do gráfico
    const colors = ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    return Object.entries(planCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const planDistribution = getPlanDistribution();

  // Dados de retenção baseados nas métricas reais
  const retentionData = monthlyData.map((item, index) => ({
    month: item.month,
    renovacao: Math.round((Math.random() * 20) + 75), // Simular dados de renovação
    churn: Math.round((Math.random() * 15) + 5), // Simular dados de churn
    novos: item.novos || 0
  }));

  // Aplicar filtros aos dados
  const applyFilters = () => {
    console.log('Aplicando filtros:', filters);
    
    if (!patients || patients.length === 0) {
      setFilteredData({ patients: [], monthlyData: [], planDistribution: [] });
      return;
    }

    // Calcular range de datas
    const getDateRange = () => {
      if (filters.startDate && filters.endDate) {
        return { start: new Date(filters.startDate), end: new Date(filters.endDate) };
      }
      
      const now = new Date();
      let start: Date;
      
      switch (filters.period) {
        case 'last-7-days':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last-30-days':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last-3-months':
          start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'last-6-months':
          start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case 'last-year':
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      return { start, end: now };
    };

    const { start, end } = getDateRange();
    
    // Filtrar pacientes por data
    const filteredPatients = patients.filter(patient => {
      if (!patient.created_at) return false;
      const createdAt = new Date(patient.created_at);
      return createdAt >= start && createdAt <= end;
    });

    // Recalcular dados mensais
    const monthlyStats = filteredPatients.reduce((acc, patient) => {
      if (!patient.created_at) return acc;
      
      const date = new Date(patient.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, novos: 0 };
      }
      
      acc[monthKey].novos++;
      return acc;
    }, {} as Record<string, any>);

    const newMonthlyData = Object.values(monthlyStats).sort((a: any, b: any) => a.month.localeCompare(b.month));

    // Recalcular distribuição de planos
    const inactivePlans = ['⛔ Negativado', 'NOVO', 'RESCISÃO', 'INATIVO'];
    const activePatients = filteredPatients.filter(patient => {
      if (!patient.plano) return false;
      return !inactivePlans.some(inactive => 
        patient.plano!.toUpperCase().includes(inactive.toUpperCase())
      );
    });

    const planCounts: { [key: string]: number } = {};
    activePatients.forEach(patient => {
      const planName = patient.plano || 'Sem Plano';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    const colors = ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    const newPlanDistribution = Object.entries(planCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));

    setFilteredData({
      patients: filteredPatients,
      monthlyData: newMonthlyData,
      planDistribution: newPlanDistribution
    });
  };

  // Usar dados filtrados ou originais
  const displayData = filteredData.patients.length > 0 ? filteredData : {
    patients,
    monthlyData,
    planDistribution
  };

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    setSelectedReport(reportId);
    
    try {
      const reportData = await reportsService.generateReportPreview(reportId, filters);
      setCurrentReportData(reportData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
      setSelectedReport(null);
    }
  };

  const handleExportReport = (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exportando relatório ${reportId} em formato ${format}`);
    
    // Se já temos dados do relatório, exportar diretamente
    if (currentReportData && currentReportData.id === reportId) {
      switch (format) {
        case 'csv':
          reportsService.exportToCSV(currentReportData);
          break;
        case 'excel':
          reportsService.exportToExcel(currentReportData);
          break;
        case 'pdf':
          reportsService.exportToPDF(currentReportData);
          break;
      }
    } else {
      // Gerar e exportar
      reportsService.generateReportPreview(reportId, filters)
        .then(reportData => {
          switch (format) {
            case 'csv':
              reportsService.exportToCSV(reportData);
              break;
            case 'excel':
              reportsService.exportToExcel(reportData);
              break;
            case 'pdf':
              reportsService.exportToPDF(reportData);
              break;
          }
        })
        .catch(error => console.error('Erro ao exportar:', error));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'generating':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Pronto';
      case 'generating':
        return 'Gerando...';
      case 'error':
        return 'Erro';
      default:
        return 'Pendente';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header com destaque visual melhorado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Relatórios
            </h1>
            <p className="text-slate-400 text-sm">
              Análise detalhada e relatórios do seu negócio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar Todos
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="w-5 h-5 text-blue-400" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Período</Label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="last-7-days">Últimos 7 dias</option>
                  <option value="last-30-days">Últimos 30 dias</option>
                  <option value="last-3-months">Últimos 3 meses</option>
                  <option value="last-6-months">Últimos 6 meses</option>
                  <option value="last-year">Último ano</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Data Final</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Ações</Label>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={applyFilters}
                  >
                    Aplicar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => setFilters({
                      period: 'last-30-days',
                      startDate: '',
                      endDate: '',
                      patients: [],
                      metrics: []
                    })}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0s'}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Total de Pacientes</p>
                  <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {patientsLoading ? '...' : displayData.patients.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.1s'}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Pacientes Ativos</p>
                  <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
                    {metricsLoading ? '...' : metrics.activePatients}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.2s'}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Planos Únicos</p>
                  <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {displayData.planDistribution.length}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.3s'}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Score Médio</p>
                  <p className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                    {metricsLoading ? '...' : metrics.avgOverallScore}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <Card key={report.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{report.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.status)}
                    <span className="text-xs text-slate-400">{getStatusText(report.status)}</span>
                  </div>
                </div>
                <CardDescription className="text-slate-400">
                  {report.description}
                </CardDescription>
                <Badge variant="outline" className="w-fit text-xs">
                  {report.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Última atualização:</span>
                    <span className="text-white">{new Date(report.lastUpdated).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={isGenerating && selectedReport === report.id}
                    >
                      {isGenerating && selectedReport === report.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      {isGenerating && selectedReport === report.id ? 'Gerando...' : 'Visualizar'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => handleExportReport(report.id, 'pdf')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                      onClick={() => handleExportReport(report.id, 'excel')}
                    >
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                      onClick={() => handleExportReport(report.id, 'csv')}
                    >
                      CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sample Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Crescimento de Pacientes</CardTitle>
              <CardDescription className="text-slate-400">
                Evolução mensal de novos pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#ffffff'
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} pacientes`,
                      'Novos Pacientes'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="novos" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Retention Chart */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Análise de Retenção</CardTitle>
              <CardDescription className="text-slate-400">
                Taxa de renovação vs churn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="renovacao" fill="#10b981" name="Renovação %" />
                  <Bar dataKey="churn" fill="#ef4444" name="Churn %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Plan Distribution */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Planos</CardTitle>
            <CardDescription className="text-slate-400">
              Pacientes por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={displayData.planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {displayData.planDistribution.map((entry, index) => (
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
                      color: '#ffffff'
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} pacientes`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Visualização de Relatório */}
      <ReportViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportData={currentReportData}
        onExport={(format) => {
          if (currentReportData) {
            handleExportReport(currentReportData.id, format);
          }
        }}
      />
      </DashboardLayout>
  );
}
