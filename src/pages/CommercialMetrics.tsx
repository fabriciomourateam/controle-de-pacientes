import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Users, Phone, Calendar, BarChart3, Target, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { N8NWebhookService } from "@/lib/n8n-webhook-service";
import { LeadsChart } from "@/components/commercial-metrics/LeadsChart";
import { CallsChart } from "@/components/commercial-metrics/CallsChart";
import { ConversionChart } from "@/components/commercial-metrics/ConversionChart";
import { DailyMetricsTable } from "@/components/commercial-metrics/DailyMetricsTable";
import { MonthlySummary } from "@/components/commercial-metrics/MonthlySummary";
import { ConnectionTest } from "@/components/commercial-metrics/ConnectionTest";

interface CommercialMetricsData {
  dailyLeads: Array<{
    date: string;
    google: number;
    googleForms: number;
    instagram: number;
    facebook: number;
    seller: number;
    indicacao: number;
    outros: number;
    total: number;
  }>;
  monthlyLeads: {
    current: number;
    previous: number;
    growth: number;
  };
  dailyCalls: Array<{
    date: string;
    scheduled: number;
    completed: number;
  }>;
  monthlyCalls: {
    current: number;
    previous: number;
    growth: number;
  };
  totalLeads: number;
  totalCalls: number;
  conversionRate: number;
  lastUpdated: string;
}

export default function CommercialMetrics() {
  const [data, setData] = useState<CommercialMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      // Obter dados existentes primeiro
      let metricsData = N8NWebhookService.getMetrics();
      
      // Verificar se há dados válidos
      const hasValidData = metricsData.dailyLeads.length > 0 || metricsData.dailyCalls.length > 0;
      
      if (!hasValidData) {
        console.log('🔄 Nenhum dado encontrado, buscando dados do N8N...');
        await N8NWebhookService.fetchDataFromN8N();
        metricsData = N8NWebhookService.getMetrics();
      }
      
      // Verificar novamente se há dados após tentar buscar
      const hasDataAfterFetch = metricsData.dailyLeads.length > 0 || metricsData.dailyCalls.length > 0;
      
      if (hasDataAfterFetch) {
        setData(metricsData);
        
        if (showToast) {
          toast({
            title: "Dados atualizados",
            description: "Métricas comerciais atualizadas com sucesso",
          });
        }
      } else {
        // Se ainda não há dados, definir como null para mostrar a tela de erro
        setData(null);
        
        if (showToast) {
          toast({
            title: "Nenhum dado encontrado",
            description: "Use 'Simular Dados N8N' para testar ou configure o N8N",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      
      let errorMessage = "Não foi possível carregar as métricas comerciais";
      
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          errorMessage = "Erro de permissão: Verifique a configuração do N8N";
        } else if (error.message.includes('404')) {
          errorMessage = "Dados não encontrados: Verifique se o N8N está enviando dados";
        } else if (error.message.includes('API key')) {
          errorMessage = "Chave da API inválida: Verifique a configuração do N8N";
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      setData(null);
      
      toast({
        title: "Erro ao carregar dados",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Verificar dados do N8N a cada 30 segundos
    const interval = setInterval(() => {
      console.log('🔄 Verificando dados do N8N...');
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
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

  if (!data) {
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
            <AlertTriangle className="w-24 h-24 text-red-400 mb-6" />
            <h2 className="text-2xl font-semibold text-white mb-4">
              Nenhum dado encontrado
            </h2>
            <p className="text-slate-400 mb-6 max-w-2xl">
              Não há dados disponíveis do N8N. 
              Verifique se o N8N está configurado para enviar dados para o webhook.
            </p>
            
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-8 max-w-2xl text-left">
              <h3 className="text-lg font-semibold text-white mb-4">Possíveis soluções:</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Verifique se o N8N está configurado para enviar dados para o webhook</li>
                <li>• Confirme se o workflow do N8N está ativo e executando</li>
                <li>• Teste a conexão usando o botão "Testar Conexão" abaixo</li>
                <li>• Use "Simular Dados N8N" para testar com dados de exemplo</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => fetchData(true)}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
              
              <Button
                variant="default"
                onClick={async () => {
                  try {
                    setRefreshing(true);
                    N8NWebhookService.simulateN8NData();
                    const refreshedData = N8NWebhookService.getMetrics();
                    setData(refreshedData);
                    toast({
                      title: "Dados simulados carregados",
                      description: "Dados de teste foram carregados com sucesso",
                    });
                  } catch (error) {
                    toast({
                      title: "Erro ao simular dados",
                      description: "Erro ao carregar dados de teste",
                      variant: "destructive",
                    });
                  } finally {
                    setRefreshing(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Simular Dados N8N
              </Button>
            </div>
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
              <Target className="w-8 h-8 text-blue-400" />
              Métricas Comerciais
            </h1>
            <p className="text-slate-400 mt-1">
              Acompanhe leads, calls e conversões em tempo real
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-300">
              Última atualização: {new Date(data.lastUpdated).toLocaleString('pt-BR')}
            </Badge>
            <Button 
              onClick={() => fetchData(true)} 
              disabled={refreshing}
              variant="outline"
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              try {
                setRefreshing(true);
                const refreshedData = N8NWebhookService.getMetrics();
                setData(refreshedData);
                toast({
                  title: "Dados atualizados via N8N",
                  description: "Dados foram atualizados diretamente do N8N",
                });
              } catch (error) {
                toast({
                  title: "Erro ao atualizar via N8N",
                  description: "Tentando atualização normal...",
                  variant: "destructive",
                });
                fetchData(true);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            variant="outline"
            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
          
          <Button 
            onClick={async () => {
              try {
                setRefreshing(true);
                N8NWebhookService.simulateN8NData();
                const refreshedData = N8NWebhookService.getMetrics();
                setData(refreshedData);
                toast({
                  title: "Dados simulados do N8N",
                  description: "Dados de teste foram carregados com sucesso",
                });
              } catch (error) {
                toast({
                  title: "Erro ao simular dados",
                  description: "Erro ao carregar dados de teste",
                  variant: "destructive",
                });
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <BarChart3 className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Simular Dados N8N
          </Button>
          
          <Button 
            onClick={() => {
              N8NWebhookService.clearData();
              setData(null);
              toast({
                title: "Dados limpos",
                description: "Todos os dados foram removidos. Recarregue a página para ver a tela inicial.",
              });
            }}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Limpar Dados
          </Button>
        </div>
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
                <CardTitle className="text-sm font-medium text-slate-300">Leads do Mês</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.monthlyLeads.current.toLocaleString()}</div>
                <p className="text-xs text-slate-400">
                  <span className={data.monthlyLeads.growth >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {data.monthlyLeads.growth >= 0 ? '+' : ''}{data.monthlyLeads.growth.toFixed(1)}%
                  </span>
                  <span className="text-slate-500"> vs mês anterior</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Calls do Mês</CardTitle>
                <Phone className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.monthlyCalls.current.toLocaleString()}</div>
                <p className="text-xs text-slate-400">
                  <span className={data.monthlyCalls.growth >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {data.monthlyCalls.growth >= 0 ? '+' : ''}{data.monthlyCalls.growth.toFixed(1)}%
                  </span>
                  <span className="text-slate-500"> vs mês anterior</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">
                  Leads que vão para call
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Total Geral</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.totalLeads.toLocaleString()}</div>
                <p className="text-xs text-slate-400">
                  {data.totalCalls.toLocaleString()} calls agendadas
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
          
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700/50">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="leads"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="calls"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Calls
            </TabsTrigger>
            <TabsTrigger 
              value="conversion"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Conversão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeadsChart data={data.dailyLeads} />
              <CallsChart data={data.dailyCalls} />
            </div>
            <MonthlySummary 
              monthlyLeads={data.monthlyLeads}
              monthlyCalls={data.monthlyCalls}
              conversionRate={data.conversionRate}
            />
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <LeadsChart data={data.dailyLeads} />
            <DailyMetricsTable 
              data={data.dailyLeads} 
              type="leads"
              title="Leads por Dia"
            />
          </TabsContent>

          <TabsContent value="calls" className="space-y-6">
            <CallsChart data={data.dailyCalls} />
            <DailyMetricsTable 
              data={data.dailyCalls} 
              type="calls"
              title="Calls por Dia"
            />
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <ConversionChart 
              leadsData={data.dailyLeads}
              callsData={data.dailyCalls}
            />
          </TabsContent>
        </Tabs>

        {/* Teste de Conexão */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-purple-500 rounded"></div>
            <h2 className="text-xl font-semibold text-white">Configuração</h2>
          </div>
          
          <ConnectionTest />
        </div>
      </div>
    </DashboardLayout>
  );
}
