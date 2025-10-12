import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Users, Phone, Target, TrendingUp, AlertCircle, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCommercialMetrics } from "@/hooks/use-commercial-metrics";
import { LeadsDailyChart, ChannelDistributionChart, MetricsTable } from "@/components/commercial-metrics/MetricsCharts";
import { ChannelComparisonWithFilter } from "@/components/commercial-metrics/ChannelComparisonWithFilter";
import { metricsCalculations } from "@/lib/commercial-metrics-service";

export default function CommercialMetrics() {
  const [selectedMonthForComparison, setSelectedMonthForComparison] = useState<string>('');
  const [isFunnelConversionExpanded, setIsFunnelConversionExpanded] = useState(false);
  const { isLoading, isError, kpis, dailyData, funnelData, availableMonths, currentMonth, allMonthsData, refetch } = useCommercialMetrics(selectedMonthForComparison);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-slate-400">Carregando métricas comerciais...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-400" />
                Métricas Comerciais
              </h1>
              <p className="text-slate-400 mt-1">
                Acompanhe leads, calls e conversões em tempo real
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-24 h-24 text-red-400 mb-6" />
            <h2 className="text-2xl font-semibold text-white mb-4">
              Erro ao carregar dados
            </h2>
            <p className="text-slate-400 mb-6 max-w-2xl">
              Não foi possível carregar os dados das métricas comerciais. 
              Verifique se as tabelas estão criadas no Supabase e se o N8N está atualizando os dados.
            </p>
            
              <Button
                variant="outline"
              onClick={() => refetch()}
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

  // Preparar dados dos canais para o gráfico
  const channelsData = [
    { name: 'Google', value: kpis.leadsGoogle, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Google Forms', value: kpis.leadsGoogleForms, color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'Instagram', value: kpis.leadsInstagram, color: 'bg-gradient-to-r from-pink-500 to-purple-600' },
    { name: 'Facebook', value: kpis.leadsFacebook, color: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
    { name: 'Seller', value: kpis.leadsSeller, color: 'bg-gradient-to-r from-orange-500 to-red-600' },
    { name: 'Indicação', value: kpis.leadsIndicacao, color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
    { name: 'Outros', value: kpis.leadsOutros, color: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  ];

  const callsChannelsData = [
    { name: 'Google', value: kpis.callsGoogle, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Google Forms', value: kpis.callsGoogleForms, color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'Instagram', value: kpis.callsInstagram, color: 'bg-gradient-to-r from-pink-500 to-purple-600' },
    { name: 'Facebook', value: kpis.callsFacebook, color: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
    { name: 'Seller', value: kpis.callsSeller, color: 'bg-gradient-to-r from-orange-500 to-red-600' },
    { name: 'Indicação', value: kpis.callsIndicacao, color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
    { name: 'Outros', value: kpis.callsOutros, color: 'bg-gradient-to-r from-gray-500 to-gray-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-400" />
              Métricas Comerciais
            </h1>
            <p className="text-slate-400 mt-1">
              Dados atualizados automaticamente pelo N8N
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-300">
              Atualização automática a cada 30s
            </Badge>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-blue-500 rounded"></div>
            <h2 className="text-xl font-semibold text-white">KPIs Principais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Total de Leads</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{kpis.totalLeads.toLocaleString()}</div>
                <p className="text-xs text-slate-400">
                  {currentMonth ? `Mês: ${currentMonth}` : 'Total acumulado'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Calls Agendadas</CardTitle>
                <Phone className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{kpis.totalCalls.toLocaleString()}</div>
                <p className="text-xs text-slate-400">
                  {currentMonth ? `Mês: ${currentMonth}` : 'Total acumulado'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{kpis.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">
                  Leads que vão para call
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Canal Líder</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {channelsData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name}
                </div>
                <p className="text-xs text-slate-400">
                  {channelsData.reduce((prev, current) => (prev.value > current.value) ? prev : current).value} leads
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-500 rounded"></div>
            <h2 className="text-xl font-semibold text-white">Análise Detalhada</h2>
          </div>
          
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700/50">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="conversion"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Métricas Diárias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Dashboard de Comparação Detalhada com Filtro */}
            <ChannelComparisonWithFilter 
              availableMonths={availableMonths}
              allMonthsData={allMonthsData}
              initialMonth={currentMonth}
              onMonthChange={setSelectedMonthForComparison}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeadsDailyChart data={dailyData} />
              <ChannelDistributionChart channels={channelsData} />
            </div>

            {/* Total de Conversões pra Call por Funil */}
            {funnelData.leads.length > 0 && funnelData.agendamentos.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-400" />
                        Total de Conversões pra Call por Funil
                      </CardTitle>
                      <CardDescription className="text-slate-400 mt-1">
                        {funnelData.leads.length} {funnelData.leads.length === 1 ? 'funil' : 'funis'} • Taxa de conversão (Calls / Leads)
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFunnelConversionExpanded(!isFunnelConversionExpanded)}
                      className="text-slate-300 hover:text-white hover:bg-slate-700/50"
                    >
                      {isFunnelConversionExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Minimizar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Expandir
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {isFunnelConversionExpanded && (
                  <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {funnelData.leads.map((leadItem, index) => {
                      // Encontrar o agendamento correspondente pelo nome do funil
                      const agendItem = funnelData.agendamentos.find(
                        a => a.TOTAL_AGEND_DOS_FUNIS === leadItem.TOTAL_DE_LEADS_DOS_FUNIS
                      );
                      
                      const totalLeads = leadItem.TOTAL_GERAL_LEADS || 0;
                      const totalCalls = agendItem?.TOTAL_GERAL_AGEND || 0;
                      const conversionRate = totalLeads > 0 ? (totalCalls / totalLeads) * 100 : 0;
                      
                      return (
                        <div 
                          key={index} 
                          className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/30 hover:border-purple-500/50 transition-colors"
                        >
                          <h3 className="text-slate-300 text-sm font-medium mb-3">{leadItem.TOTAL_DE_LEADS_DOS_FUNIS}</h3>
                          
                          {/* Métricas em grid */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-blue-500/10 rounded p-2 text-center">
                              <p className="text-xs text-blue-400 font-semibold">Leads</p>
                              <p className="text-lg font-bold text-white">{totalLeads.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="bg-green-500/10 rounded p-2 text-center">
                              <p className="text-xs text-green-400 font-semibold">Calls</p>
                              <p className="text-lg font-bold text-white">{totalCalls.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>

                          {/* Taxa de conversão destacada */}
                          <div className="bg-purple-500/10 rounded-lg p-3 text-center border border-purple-500/30">
                            <p className="text-xs text-purple-400 font-semibold mb-1">Taxa de Conversão</p>
                            <p className={`text-3xl font-bold ${
                              conversionRate >= 21 ? 'text-green-400' : 
                              conversionRate >= 15 ? 'text-yellow-400' : 
                              conversionRate >= 10 ? 'text-orange-400' :
                              'text-red-400'
                            }`}>
                              {conversionRate.toFixed(1)}%
                            </p>
                          </div>

                          {/* Barra de progresso */}
                          <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden mt-3">
                            <div 
                              className={`absolute h-full transition-all duration-500 ${
                                conversionRate >= 21 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                                conversionRate >= 15 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                                conversionRate >= 10 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${Math.min(conversionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legenda de cores */}
                  <div className="mt-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-300">≥ 21% <span className="text-green-400 font-semibold">Excelente</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-slate-300">15-20% <span className="text-yellow-400 font-semibold">Bom</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-slate-300">10-14% <span className="text-orange-400 font-semibold">Regular</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-slate-300">&lt; 10% <span className="text-red-400 font-semibold">Baixo</span></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <MetricsTable data={dailyData} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
