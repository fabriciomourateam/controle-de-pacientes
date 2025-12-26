import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Filter, 
  Users, 
  Star,
  CheckCircle,
  RefreshCw,
  Download,
  TrendingUp,
  FileText,
  MessageSquare
} from "lucide-react";
import {
  LineChart,
  Line,
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

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics();
  const { patients, loading: patientsLoading } = usePatients();
  const { data: chartData } = useChartData();
  
  const metrics = metricsData || {
    totalPatients: 0,
    activePatients: 0,
    expiringPatients: 0,
    pendingFeedbacks: 0,
    avgOverallScore: '0.0'
  };
  const [filters, setFilters] = useState({
    period: 'last-30-days',
    startDate: '',
    endDate: ''
  });
  const [filteredData, setFilteredData] = useState({
    patients: [] as any[],
    monthlyData: [] as any[],
    planDistribution: [] as any[]
  });

  const { monthlyData } = chartData;

  // Função para exportar CSV
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/ /g, '_');
        const value = row[key] ?? row[h] ?? '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Exportado!",
      description: `Relatório ${filename} exportado com sucesso.`,
    });
  };

  // Exportar relatório de crescimento
  const exportGrowthReport = () => {
    const data = displayData.monthlyData.map((item: any) => ({
      mes: item.month,
      novos_pacientes: item.novos || 0
    }));
    exportToCSV(data, 'crescimento_pacientes', ['mes', 'novos_pacientes']);
  };

  // Exportar relatório de pacientes
  const exportPatientsReport = () => {
    const data = displayData.patients.map((p: any) => ({
      nome: p.nome || '',
      email: p.email || '',
      telefone: p.telefone || '',
      plano: p.plano || '',
      status: p.status || 'Ativo',
      data_cadastro: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''
    }));
    exportToCSV(data, 'lista_pacientes', ['nome', 'email', 'telefone', 'plano', 'status', 'data_cadastro']);
  };

  // Exportar relatório de métricas
  const exportMetricsReport = () => {
    const data = [{
      total_pacientes: displayData.patients.length,
      pacientes_ativos: metrics.activePatients,
      planos_unicos: displayData.planDistribution.length,
      score_medio: metrics.avgOverallScore,
      data_geracao: new Date().toLocaleDateString('pt-BR')
    }];
    exportToCSV(data, 'metricas_gerais', ['total_pacientes', 'pacientes_ativos', 'planos_unicos', 'score_medio', 'data_geracao']);
  };

  // Exportar relatório de distribuição de planos
  const exportPlansReport = () => {
    const data = displayData.planDistribution.map((item: any) => ({
      plano: item.name,
      quantidade: item.value
    }));
    exportToCSV(data, 'distribuicao_planos', ['plano', 'quantidade']);
  };

  // Calcular distribuição de planos
  const getPlanDistribution = () => {
    if (!patients || patients.length === 0) return [];

    const inactivePlans = ['⛔ Negativado', 'NOVO', 'RESCISÃO', 'INATIVO'];
    const activePatients = patients.filter(patient => {
      if (!patient.plano) return false;
      return !inactivePlans.some(inactive => 
        patient.plano!.toUpperCase().includes(inactive.toUpperCase()) || 
        inactive.toUpperCase().includes(patient.plano!.toUpperCase())
      );
    });

    const planCounts: { [key: string]: number } = {};
    activePatients.forEach(patient => {
      const planName = patient.plano || 'Sem Plano';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    const colors = ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    return Object.entries(planCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const planDistribution = getPlanDistribution();

  // Aplicar filtros
  const applyFilters = () => {
    if (!patients || patients.length === 0) {
      setFilteredData({ patients: [], monthlyData: [], planDistribution: [] });
      return;
    }

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
    
    const filteredPatients = patients.filter(patient => {
      if (!patient.created_at) return false;
      const createdAt = new Date(patient.created_at);
      return createdAt >= start && createdAt <= end;
    });

    const monthlyStats = filteredPatients.reduce((acc, patient) => {
      if (!patient.created_at) return acc;
      const date = new Date(patient.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = { month: monthKey, novos: 0 };
      acc[monthKey].novos++;
      return acc;
    }, {} as Record<string, any>);

    const newMonthlyData = Object.values(monthlyStats).sort((a: any, b: any) => a.month.localeCompare(b.month));

    const inactivePlans = ['⛔ Negativado', 'NOVO', 'RESCISÃO', 'INATIVO'];
    const activePatients = filteredPatients.filter(patient => {
      if (!patient.plano) return false;
      return !inactivePlans.some(inactive => patient.plano!.toUpperCase().includes(inactive.toUpperCase()));
    });

    const planCounts: { [key: string]: number } = {};
    activePatients.forEach(patient => {
      const planName = patient.plano || 'Sem Plano';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    const colors = ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    const newPlanDistribution = Object.entries(planCounts).map(([name, value], index) => ({
      name, value, color: colors[index % colors.length]
    }));

    setFilteredData({ patients: filteredPatients, monthlyData: newMonthlyData, planDistribution: newPlanDistribution });
    
    toast({ title: "Filtros aplicados", description: `${filteredPatients.length} pacientes encontrados.` });
  };

  const displayData = filteredData.patients.length > 0 ? filteredData : { patients, monthlyData, planDistribution };

  const reportCards = [
    {
      id: 'growth',
      title: 'Crescimento de Pacientes',
      description: 'Evolução mensal de novos pacientes',
      icon: TrendingUp,
      color: 'text-green-400',
      onExport: exportGrowthReport
    },
    {
      id: 'patients',
      title: 'Lista de Pacientes',
      description: 'Dados completos de todos os pacientes',
      icon: Users,
      color: 'text-blue-400',
      onExport: exportPatientsReport
    },
    {
      id: 'metrics',
      title: 'Métricas Gerais',
      description: 'KPIs e indicadores de performance',
      icon: BarChart3,
      color: 'text-purple-400',
      onExport: exportMetricsReport
    },
    {
      id: 'plans',
      title: 'Distribuição de Planos',
      description: 'Pacientes por tipo de plano',
      icon: FileText,
      color: 'text-yellow-400',
      onExport: exportPlansReport
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Relatórios
            </h1>
            <p className="text-slate-400 text-sm">Análise dos dados do seu negócio</p>
          </div>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={applyFilters}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40">
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
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Data Inicial</Label>
                <Input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Data Final</Label>
                <Input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Ações</Label>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={applyFilters}>Aplicar</Button>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => { setFilters({ period: 'last-30-days', startDate: '', endDate: '' }); setFilteredData({ patients: [], monthlyData: [], planDistribution: [] }); }}>Limpar</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total de Pacientes</p>
                  <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{patientsLoading ? '...' : displayData.patients.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pacientes Ativos</p>
                  <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">{metricsLoading ? '...' : metrics.activePatients}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Planos Únicos</p>
                  <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">{displayData.planDistribution.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Score Médio</p>
                  <p className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">{metricsLoading ? '...' : metrics.avgOverallScore}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCards.map((report) => (
            <Card key={report.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <report.icon className={`w-5 h-5 ${report.color}`} />
                  {report.title}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold" onClick={report.onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40">
            <CardHeader>
              <CardTitle className="text-white">Crescimento de Pacientes</CardTitle>
              <CardDescription className="text-slate-400">Evolução mensal de novos pacientes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', color: '#ffffff' }} formatter={(value: any) => [`${value} pacientes`, 'Novos']} />
                  <Line type="monotone" dataKey="novos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40">
            <CardHeader>
              <CardTitle className="text-white">Distribuição de Planos</CardTitle>
              <CardDescription className="text-slate-400">Pacientes por tipo de plano</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={displayData.planDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {displayData.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(255, 255, 255, 0.3)', borderRadius: '12px', color: '#ffffff' }} 
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value: any, name: any, props: any) => [`${value} pacientes`, props.payload.name]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
