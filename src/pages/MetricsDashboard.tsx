import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KPICards } from "@/components/dashboard/KPICards";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { ChurnChart } from "@/components/dashboard/ChurnChart";
import { OrganizedGrowthChart } from "@/components/dashboard/OrganizedGrowthChart";
import { MonthlyGrowthChart } from "@/components/dashboard/MonthlyGrowthChart";
import { BusinessHealthPanel } from "@/components/dashboard/BusinessHealthPanel";
import { BusinessInsights } from "@/components/dashboard/BusinessInsights";
import { MetricsTable } from "@/components/dashboard/MetricsTable";
import { DashboardSyncModal } from "@/components/dashboard/DashboardSyncModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { 
  RefreshCw, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Database,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function MetricsDashboard() {
  const {
    data,
    alertas,
    kpis,
    chartData,
    growthMetrics,
    retentionMetrics,
    healthMetrics,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
    exportData
  } = useDashboardMetrics();

  const [isMetricsTableMinimized, setIsMetricsTableMinimized] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [isFilterMinimized, setIsFilterMinimized] = useState(true);

  // Gerar lista de meses disponíveis
  const availableMonths = useMemo(() => {
    const months = data.map(item => ({
      mes_numero: item.mes_numero,
      mes: item.mes,
      ano: item.ano
    })).sort((a, b) => a.mes_numero - b.mes_numero);
    
    return months;
  }, [data]);

  // Inicializar meses selecionados com todos os meses se estiver vazio (apenas uma vez)
  useEffect(() => {
    if (selectedMonths.length === 0 && availableMonths.length > 0) {
      setSelectedMonths(availableMonths.map(m => m.mes_numero));
    }
  }, [availableMonths.length]); // Removido selectedMonths.length para evitar loop


  // Manipular seleção de meses
  const handleMonthToggle = (mesNumero: number) => {
    setSelectedMonths(prev => {
      if (prev.includes(mesNumero)) {
        return prev.filter(m => m !== mesNumero);
      } else {
        return [...prev, mesNumero].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths(availableMonths.map(m => m.mes_numero));
  };

  const handleDeselectAllMonths = () => {
    setSelectedMonths([]);
  };

  // Filtrar dados baseado nos meses selecionados
  const filteredData = useMemo(() => {
    if (selectedMonths.length === 0) return data;
    return data.filter(item => selectedMonths.includes(item.mes_numero));
  }, [data, selectedMonths]);

  // Transformar dados filtrados para o formato ChartData
  const filteredChartData = useMemo(() => {
    return filteredData.map(item => ({
      mes: item.mes,
      ativos: item.ativos_total_inicio_mes || 0,
      entraram: item.entraram || 0,
      sairam: item.sairam || 0,
      renovacao: (item.percentual_renovacao || 0) * 100,
      churn: (item.percentual_churn || 0) * 100,
      crescimento: item.taxa_crescimento || 0,
      saldo: (item.entraram || 0) - (item.sairam || 0),
      eficiencia: item.eficiencia_conversao || 0
    }));
  }, [filteredData]);

  // Tratamento de erro
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                Dashboard de Métricas
              </h1>
              <p className="text-slate-400 mt-1">
                Análise completa de renovação, churn e crescimento dos pacientes
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="w-24 h-24 text-red-400 mb-6" />
            <h2 className="text-2xl font-semibold text-white mb-4">
              Erro ao carregar dados
            </h2>
            <p className="text-slate-400 mb-8 max-w-md">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={refreshData}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              Dashboard de Métricas
            </h1>
            <p className="text-slate-400 mt-1">
              Análise completa de renovação, churn e crescimento dos pacientes
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <DashboardSyncModal onSyncComplete={refreshData} />
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={loading}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={exportData}
              disabled={loading || data.length === 0}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>


        {/* Filtro de Meses */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Selecionar Meses para Análise
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllMonths}
                    className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllMonths}
                    className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    Desmarcar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterMinimized(!isFilterMinimized)}
                    className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    {isFilterMinimized ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {!isFilterMinimized && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {availableMonths.map((month) => (
                      <label
                        key={month.mes_numero}
                        className="flex items-center space-x-2 p-3 rounded-lg border border-slate-600/50 bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMonths.includes(month.mes_numero)}
                          onChange={() => handleMonthToggle(month.mes_numero)}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {month.mes}
                          </span>
                          <span className="text-xs text-slate-400">
                            {month.ano}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <div className="text-sm text-slate-400">
                    {selectedMonths.length > 0 ? (
                      <span>
                        {selectedMonths.length} de {availableMonths.length} meses selecionados
                      </span>
                    ) : (
                      <span className="text-blue-400">
                        Nenhum mês selecionado - todos os dados serão exibidos
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPIs PRINCIPAIS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-blue-500 rounded"></div>
            <h2 className="text-xl font-semibold text-white">KPIs Principais</h2>
          </div>
          
          <KPICards kpis={kpis} loading={loading} />
        </div>

        {/* ANÁLISE DE CRESCIMENTO */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-500 rounded"></div>
            <h2 className="text-xl font-semibold text-white">Análise de Crescimento</h2>
          </div>
          
          <MonthlyGrowthChart
            data={filteredChartData}
            growthMetrics={growthMetrics}
            loading={loading}
          />
        </div>

        {/* SAÚDE DO NEGÓCIO */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-purple-500 rounded"></div>
            <h2 className="text-xl font-semibold text-white">Saúde do Negócio</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BusinessHealthPanel
              healthMetrics={healthMetrics}
              retentionMetrics={retentionMetrics}
              growthMetrics={growthMetrics}
              loading={loading}
            />
            <BusinessInsights
              data={filteredChartData}
              growthMetrics={growthMetrics}
              retentionMetrics={retentionMetrics}
              healthMetrics={healthMetrics}
              loading={loading}
            />
          </div>
        </div>

        {/* Tabela de Dados Detalhados */}
        <MetricsTable
          data={filteredData}
          loading={loading}
          onRefresh={refreshData}
          onExport={exportData}
          isMinimized={isMetricsTableMinimized}
          onToggleMinimize={() => setIsMetricsTableMinimized(!isMetricsTableMinimized)}
        />
      </div>
    </DashboardLayout>
  );
}