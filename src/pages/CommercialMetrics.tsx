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
import { SalesMetricsSection } from "@/components/commercial-metrics/SalesMetricsSection";
import { CommercialMetricsManager } from "@/components/commercial-metrics/CommercialMetricsManager";
import { metricsCalculations } from "@/lib/commercial-metrics-service";
import { useToast } from "@/hooks/use-toast";
import { WebhookEmailDialogSimple } from "@/components/webhook/WebhookEmailDialogSimple";
import { getUserWebhookUrl } from "@/lib/webhook-config-service";

export default function CommercialMetrics() {
  const [selectedMonthForComparison, setSelectedMonthForComparison] = useState<string>('');
  // Carregar preferência de visualização do localStorage (padrão: compacta)
  const [isFunnelConversionExpanded, setIsFunnelConversionExpanded] = useState(() => {
    const saved = localStorage.getItem('funnelConversionViewExpanded');
    return saved === 'true' ? true : false; // Padrão: compacta (false)
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const { toast } = useToast();
  const { isLoading, isError, kpis, dailyData, funnelData, availableMonths, currentMonth, allMonthsData, refetch } = useCommercialMetrics(selectedMonthForComparison);

  // Função para alternar visualização e salvar preferência
  const toggleFunnelView = () => {
    const newValue = !isFunnelConversionExpanded;
    setIsFunnelConversionExpanded(newValue);
    localStorage.setItem('funnelConversionViewExpanded', String(newValue));
    toast({
      title: newValue ? "Visão expandida ativada" : "Visão compacta ativada",
      description: "Sua preferência foi salva automaticamente",
    });
  };

  // Abrir dialog de confirmação de email
  const handleRefreshClick = () => {
    console.log('🟢 CommercialMetrics: handleRefreshClick chamado, abrindo dialog de email');
    setShowEmailDialog(true);
    console.log('🟢 CommercialMetrics: showEmailDialog definido como true');
  };

  // Função para acionar o webhook do n8n e atualizar os dados (após confirmação de email)
  const handleRefresh = async (confirmedEmail: string, confirmedUserId: string) => {
    setIsRefreshing(true);
    setShowEmailDialog(false);
    
    try {
      // Buscar URL de webhook personalizada do usuário
      const webhookUrl = await getUserWebhookUrl('commercial_metrics');
      
      if (!webhookUrl) {
        toast({
          title: "Webhook não configurado",
          description: "Você precisa configurar sua URL de webhook primeiro. Entre em contato com o suporte.",
          variant: "destructive"
        });
        setIsRefreshing(false);
        return;
      }
      
      console.log('🔗 Usando webhook URL:', webhookUrl);
      
      // Acionar webhook do n8n
      toast({
        title: "Atualizando dados",
        description: "Acionando fluxo do N8N...",
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: confirmedUserId, // ⚠️ IMPORTANTE: Isolar por usuário
          user_email: confirmedEmail, // Email confirmado pelo usuário
          trigger: 'manual',
          source: 'dashboard',
          timestamp: new Date().toISOString(),
          webhook_type: 'commercial_metrics'
        })
      });

      if (response.ok) {
        toast({
          title: "Fluxo acionado",
          description: `Webhook acionado para ${confirmedEmail}. Aguarde alguns segundos...`,
        });
        
        // Aguardar 3 segundos para o n8n processar
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Atualizar os dados na interface
        await refetch();
        
        toast({
          title: "Dados atualizados",
          description: "Métricas comerciais atualizadas com sucesso!",
        });
      } else {
        throw new Error('Erro ao acionar webhook');
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível acionar o fluxo do N8N. Tentando atualizar apenas os dados locais...",
        variant: "destructive",
      });
      
      // Mesmo com erro no webhook, tentar atualizar os dados
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

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
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Tentar novamente'}
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
        <div className="space-y-8 animate-fadeIn">
        {/* Header com destaque visual melhorado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-400" />
              Métricas Comerciais
            </h1>
            <p className="text-slate-400 text-sm">
              Dados atualizados automaticamente pelo N8N
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-300">
              Atualização automática a cada 30s
            </Badge>
            <div className="flex gap-2">
              <Button 
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                variant="outline"
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0s'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Total de Leads</CardTitle>
                <Users className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{kpis.totalLeads.toLocaleString()}</div>
                <p className="text-xs text-slate-400">
                  {currentMonth ? `Mês: ${currentMonth}` : 'Total acumulado'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.1s'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Calls Agendadas</CardTitle>
                <Phone className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">{kpis.totalCalls.toLocaleString()}</div>
                <p className="text-xs text-slate-400">
                  {currentMonth ? `Mês: ${currentMonth}` : 'Total acumulado'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.2s'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">{kpis.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">
                  Leads que vão para call
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 hover:-translate-y-0.5 group" style={{animationDelay: '0.3s'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Canal Líder</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">
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
          
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700/50">
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
            <TabsTrigger 
              value="sales"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Vendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Dashboard de Comparação Detalhada com Filtro */}
            <ChannelComparisonWithFilter 
              availableMonths={availableMonths}
              allMonthsData={allMonthsData}
              onMonthChange={setSelectedMonthForComparison}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeadsDailyChart data={dailyData} />
              <ChannelDistributionChart channels={channelsData} />
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <MetricsTable data={dailyData} />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SalesMetricsSection initialMonth={currentMonth} />
          </TabsContent>
        </Tabs>

        {/* Gerenciador de Métricas Comerciais */}
        <CommercialMetricsManager />
        </div>

        {/* Dialog de confirmação de email */}
        <WebhookEmailDialogSimple
          open={showEmailDialog}
          onClose={() => {
            console.log('🔴 CommercialMetrics: Fechando dialog de email');
            setShowEmailDialog(false);
          }}
          onConfirm={handleRefresh}
          webhookType="commercial_metrics"
          title="Confirmar Email para Atualizar Métricas"
          description="Digite seu email para confirmar e acionar o webhook de métricas comerciais"
        />
      </DashboardLayout>
  );
}
