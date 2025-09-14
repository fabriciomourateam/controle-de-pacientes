import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/lib/dashboard-service';
import { dashboardMetricsService } from '@/lib/dashboard-metrics-service';
import type { 
  DashboardMetricas, 
  UltimosMeses, 
  AlertaDashboard,
  DashboardFilters,
  KPIMetric,
  ChartData,
  GrowthMetrics,
  RetentionMetrics,
  HealthMetrics
} from '@/types/dashboard';

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardMetricas[]>([]);
  const [ultimosMeses, setUltimosMeses] = useState<UltimosMeses[]>([]);
  const [alertas, setAlertas] = useState<AlertaDashboard[]>([]);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados básicos
      const [metricasData, ultimosMesesData] = await Promise.allSettled([
        dashboardService.getMetricas(filters),
        dashboardService.getUltimosMeses()
      ]);

      // Processar resultados, permitindo que alguns falhem
      const metricas = metricasData.status === 'fulfilled' ? metricasData.value : [];
      const ultimosMeses = ultimosMesesData.status === 'fulfilled' ? ultimosMesesData.value : [];
      const alertas = await dashboardService.getAlertas(); // Sempre retorna array vazio por enquanto

      // Ordenar dados cronologicamente por mes_numero (01-20)
      const sortedMetricas = metricas.sort((a, b) => a.mes_numero - b.mes_numero);

      // Usar apenas dados reais do Supabase
      setData(sortedMetricas);
      setUltimosMeses(ultimosMeses);
      setAlertas(alertas);

      // Calcular métricas organizadas com filtros aplicados
      const [
        kpisOrganizados,
        chartDataOrganizado,
        growthMetricsData,
        retentionMetricsData,
        healthMetricsData
      ] = await Promise.allSettled([
        dashboardMetricsService.generateOrganizedKPIs(filters),
        dashboardMetricsService.prepareOrganizedChartData(filters),
        dashboardMetricsService.calculateGrowthMetrics(filters),
        dashboardMetricsService.calculateRetentionMetrics(filters),
        dashboardMetricsService.calculateHealthMetrics(filters)
      ]);

      // Usar KPIs organizados se disponíveis, senão usar os antigos
      const kpisCalculados = kpisOrganizados.status === 'fulfilled' ? kpisOrganizados.value : dashboardService.calculateKPIs(sortedMetricas);
      const chartDataPreparado = chartDataOrganizado.status === 'fulfilled' ? chartDataOrganizado.value : dashboardService.prepareChartData(sortedMetricas);

      setKpis(kpisCalculados);
      setChartData(chartDataPreparado);

      // Definir métricas específicas
      if (growthMetricsData.status === 'fulfilled') {
        setGrowthMetrics(growthMetricsData.value);
      }
      if (retentionMetricsData.status === 'fulfilled') {
        setRetentionMetrics(retentionMetricsData.value);
      }
      if (healthMetricsData.status === 'fulfilled') {
        setHealthMetrics(healthMetricsData.value);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = useCallback((newFilters: DashboardFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const exportData = useCallback(() => {
    dashboardService.exportToCSV(data);
  }, [data]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  return {
    data,
    ultimosMeses,
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
  };
}
