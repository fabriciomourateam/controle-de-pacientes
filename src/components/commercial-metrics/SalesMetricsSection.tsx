import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  XCircle, 
  CheckCircle, 
  Target,
  ChevronDown,
  ChevronUp,
  Calendar
} from "lucide-react";
import { useSalesMetrics } from "@/hooks/use-commercial-metrics";

interface SalesMetricsSectionProps {
  initialMonth?: string;
}

// Função para detectar o mês atual em português
const getCurrentMonthName = () => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonth = new Date().getMonth();
  return months[currentMonth];
};

export function SalesMetricsSection({ initialMonth }: SalesMetricsSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isFunnelExpanded, setIsFunnelExpanded] = useState(true);
  const [isCloserExpanded, setIsCloserExpanded] = useState(true);

  // Inicializar com o mês atual quando os dados chegarem (apenas uma vez)
  const [hasInitialized, setHasInitialized] = useState(false);

  // Buscar dados com o mês selecionado (passar undefined se for 'all')
  const monthFilter = selectedMonth === 'all' ? undefined : selectedMonth;
  const { isLoading, isError, monthlyMetrics, funnelMetrics, closerMetrics, availableMonths } = 
    useSalesMetrics(monthFilter);

  useEffect(() => {
    if (availableMonths && availableMonths.length > 0 && !hasInitialized) {
      // Sempre tentar selecionar o mês atual primeiro (ignorar initialMonth se vier errado)
      const currentMonth = getCurrentMonthName();
      
      const found = availableMonths.find(m => 
        m && m.toLowerCase().includes(currentMonth.toLowerCase())
      );
      
      // Se não encontrou o mês atual, usar o mais recente (primeiro da lista)
      const defaultMonth = found || availableMonths[0];
      setSelectedMonth(defaultMonth);
      setHasInitialized(true);
    }
  }, [availableMonths, hasInitialized]);

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Métricas de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">Carregando dados de vendas...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Métricas de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-center py-8">
            Erro ao carregar dados de vendas. Verifique se a tabela "Total de Vendas" existe no Supabase.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais gerais
  const totals = monthlyMetrics.reduce((acc, month) => ({
    totalCalls: acc.totalCalls + month.totalCalls,
    comprou: acc.comprou + month.comprou,
    naoComprou: acc.naoComprou + month.naoComprou,
    noShow: acc.noShow + month.noShow,
  }), { totalCalls: 0, comprou: 0, naoComprou: 0, noShow: 0 });

  // Taxa de conversão geral = (Comprou / Calls Realizadas) × 100
  // Calls Realizadas = comprou + não comprou (exclui no show)
  const callsRealizadas = totals.comprou + totals.naoComprou;
  const overallConversion = callsRealizadas > 0
    ? (totals.comprou / callsRealizadas) * 100
    : 0;
  
  // Verificação: soma deve bater com total (vendas sem status contam como "não comprou")
  const somaStatus = totals.comprou + totals.naoComprou + totals.noShow;
  if (somaStatus !== totals.totalCalls) {
    console.warn('⚠️ ATENÇÃO: Soma dos status não bate com total de calls!', {
      totalCalls: totals.totalCalls,
      somaStatus,
      diferenca: totals.totalCalls - somaStatus,
      breakdown: totals
    });
  }

  return (
    <div className="space-y-6">
      {/* Header com filtro de mês */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Métricas de Vendas
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                {selectedMonth === 'all'
                  ? 'Análise detalhada de conversões e resultados das calls de vendas - Todos os meses'
                  : `Análise detalhada de conversões e resultados das calls de vendas - ${selectedMonth}`
                }
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {selectedMonth && selectedMonth !== 'all' && (
                <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs">
                  Filtrado: {selectedMonth}
                </Badge>
              )}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] bg-slate-700/50 border-slate-600/50 text-white">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    📊 Todos os meses
                  </SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month} className="text-white hover:bg-slate-700">
                      {month.toLowerCase().includes(getCurrentMonthName().toLowerCase()) && '⭐ '}
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* KPI Cards */}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-blue-400 font-semibold uppercase">Total Calls</p>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{totals.totalCalls}</p>
              <p className="text-xs text-slate-400 mt-1">Calls agendadas</p>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-green-400 font-semibold uppercase">Comprou</p>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{totals.comprou}</p>
              <p className="text-xs text-slate-400 mt-1">Conversões</p>
            </div>

            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-red-400 font-semibold uppercase">Não Comprou</p>
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-white">{totals.naoComprou}</p>
              <p className="text-xs text-slate-400 mt-1">Não converteu</p>
            </div>

            <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-orange-400 font-semibold uppercase">No Show</p>
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{totals.noShow}</p>
              <p className="text-xs text-slate-400 mt-1">Não compareceram</p>
            </div>

            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-purple-400 font-semibold uppercase">Conversão</p>
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{overallConversion.toFixed(1)}%</p>
              <p className="text-xs text-slate-400 mt-1">Taxa geral</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas por Funil (Geral) */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Conversão por Funil
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Performance de cada funil no período selecionado
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFunnelExpanded(!isFunnelExpanded)}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              {isFunnelExpanded ? (
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
        {isFunnelExpanded && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {funnelMetrics.map((funnel, index) => (
                <div 
                  key={index} 
                  className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:border-purple-500/50 transition-colors"
                >
                  <h3 className="text-slate-300 text-sm font-medium mb-3">{funnel.funil}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-500/10 rounded p-2 text-center">
                      <p className="text-xs text-blue-400 font-semibold">Calls</p>
                      <p className="text-lg font-bold text-white">{funnel.totalCalls}</p>
                    </div>
                    <div className="bg-green-500/10 rounded p-2 text-center">
                      <p className="text-xs text-green-400 font-semibold">Vendas</p>
                      <p className="text-lg font-bold text-white">{funnel.comprou}</p>
                    </div>
                  </div>

                  <div className="bg-purple-500/10 rounded-lg p-3 text-center border border-purple-500/30">
                    <p className="text-xs text-purple-400 font-semibold mb-1">Taxa de Conversão</p>
                    <p className={`text-3xl font-bold ${
                      funnel.conversionRate >= 60 ? 'text-green-400' : 
                      funnel.conversionRate >= 50 ? 'text-yellow-400' : 
                      funnel.conversionRate >= 40 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {funnel.conversionRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`absolute h-full transition-all duration-500 ${
                        funnel.conversionRate >= 60 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                        funnel.conversionRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                        funnel.conversionRate >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${Math.min(funnel.conversionRate, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-600/30 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Não comprou:</span>
                      <span className="text-red-400 font-semibold">{funnel.naoComprou}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>No Show:</span>
                      <span className="text-orange-400 font-semibold">{funnel.noShow}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {funnelMetrics.length === 0 && (
              <p className="text-slate-400 text-center py-8">Nenhum dado disponível para o período selecionado.</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Comparação Fabricio vs Closer */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Performance por Closer
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Comparação de resultados entre closers
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCloserExpanded(!isCloserExpanded)}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              {isCloserExpanded ? (
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
        {isCloserExpanded && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {closerMetrics.all.map((closer: any, index: number) => (
                <div key={index} className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{closer.closer}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-sm ${
                          closer.conversionRate >= 60 ? 'border-green-500 text-green-400' :
                          closer.conversionRate >= 50 ? 'border-yellow-500 text-yellow-400' :
                          closer.conversionRate >= 40 ? 'border-orange-500 text-orange-400' :
                          'border-red-500 text-red-400'
                        }`}
                      >
                        {closer.conversionRate.toFixed(1)}% conversão
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          (closer.totalCalls > 0 ? (closer.noShow / closer.totalCalls) * 100 : 0) <= 10 ? 'border-green-500 text-green-400' :
                          (closer.totalCalls > 0 ? (closer.noShow / closer.totalCalls) * 100 : 0) <= 20 ? 'border-yellow-500 text-yellow-400' :
                          'border-red-500 text-red-400'
                        }`}
                      >
                        {closer.totalCalls > 0 ? ((closer.noShow / closer.totalCalls) * 100).toFixed(1) : 0}% no show
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-500/10 rounded p-3 text-center border border-blue-500/20">
                      <p className="text-xs text-blue-400 font-semibold mb-1">Total Calls</p>
                      <p className="text-2xl font-bold text-white">{closer.totalCalls}</p>
                    </div>
                    <div className="bg-green-500/10 rounded p-3 text-center border border-green-500/20">
                      <p className="text-xs text-green-400 font-semibold mb-1">Vendas</p>
                      <p className="text-2xl font-bold text-white">{closer.comprou}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Não comprou:</span>
                      <span className="text-red-400 font-semibold">{closer.naoComprou}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">No Show:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400 font-semibold">{closer.noShow}</span>
                        <span className="text-orange-300 text-xs">
                          ({closer.totalCalls > 0 ? ((closer.noShow / closer.totalCalls) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`absolute h-full transition-all duration-500 ${
                        closer.conversionRate >= 60 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                        closer.conversionRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                        closer.conversionRate >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${Math.min(closer.conversionRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {closerMetrics.all.length === 0 && (
              <p className="text-slate-400 text-center py-8">Nenhum dado disponível para o período selecionado.</p>
            )}

            {/* Legenda de cores */}
            <div className="mt-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Legenda de Conversão */}
                <div>
                  <h4 className="text-slate-300 font-semibold mb-2">Taxa de Conversão:</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-300">≥ 60% <span className="text-green-400 font-semibold">Excelente</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-slate-300">50-59% <span className="text-yellow-400 font-semibold">Bom</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-slate-300">40-49% <span className="text-orange-400 font-semibold">Regular</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-slate-300">&lt; 40% <span className="text-red-400 font-semibold">Baixo</span></span>
                    </div>
                  </div>
                </div>
                
                {/* Legenda de No Show */}
                <div>
                  <h4 className="text-slate-300 font-semibold mb-2">Taxa de No Show:</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-slate-300">≤ 10% <span className="text-green-400 font-semibold">Baixo</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-slate-300">11-20% <span className="text-yellow-400 font-semibold">Médio</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-slate-300">&gt; 20% <span className="text-red-400 font-semibold">Alto</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

