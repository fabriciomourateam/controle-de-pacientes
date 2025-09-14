import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ChartData } from "@/types/dashboard";

interface MonthlyComparisonChartProps {
  data: ChartData[];
  loading?: boolean;
}

export function MonthlyComparisonChart({ data, loading = false }: MonthlyComparisonChartProps) {
  const [isVariationsMinimized, setIsVariationsMinimized] = useState(true);
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Comparativo Mês a Mês</CardTitle>
          <CardDescription className="text-slate-400">
            Carregando dados...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Comparativo Mês a Mês</CardTitle>
          <CardDescription className="text-slate-400">
            Nenhum dado disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-400">
            Sem dados para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular variações mês a mês
  const comparisonData = data.map((item, index) => {
    const previousItem = index > 0 ? data[index - 1] : null;
    
    const ativosVariation = previousItem 
      ? ((item.ativos - previousItem.ativos) / previousItem.ativos) * 100
      : 0;
    
    const entraramVariation = previousItem 
      ? ((item.entraram - previousItem.entraram) / Math.max(previousItem.entraram, 1)) * 100
      : 0;
    
    const sairamVariation = previousItem 
      ? ((item.sairam - previousItem.sairam) / Math.max(previousItem.sairam, 1)) * 100
      : 0;

    const renovacaoVariation = previousItem 
      ? item.renovacao - previousItem.renovacao
      : 0;

    const churnVariation = previousItem 
      ? item.churn - previousItem.churn
      : 0;

    return {
      ...item,
      ativosVariation: Number(ativosVariation.toFixed(1)),
      entraramVariation: Number(entraramVariation.toFixed(1)),
      sairamVariation: Number(sairamVariation.toFixed(1)),
      renovacaoVariation: Number(renovacaoVariation.toFixed(1)),
      churnVariation: Number(churnVariation.toFixed(1)),
      saldo: item.entraram - item.sairam,
      saldoVariation: previousItem 
        ? ((item.entraram - item.sairam) - (previousItem.entraram - previousItem.sairam)) / Math.max(previousItem.entraram - previousItem.sairam, 1) * 100
        : 0
    };
  });

  // Calcular estatísticas gerais
  const totalGrowth = data.length > 1 
    ? ((data[data.length - 1].ativos - data[0].ativos) / data[0].ativos) * 100
    : 0;

  const averageMonthlyGrowth = comparisonData
    .slice(1) // Remove primeiro item (sem comparação)
    .reduce((sum, item) => sum + item.ativosVariation, 0) / (comparisonData.length - 1);

  const positiveMonths = comparisonData
    .slice(1)
    .filter(item => item.ativosVariation > 0).length;

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-slate-400";
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Comparativo Mês a Mês
            </CardTitle>
            <CardDescription className="text-slate-400">
              Variações e tendências mensais
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">Crescimento Total</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVariationsMinimized(!isVariationsMinimized)}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              {isVariationsMinimized ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronUp className="w-4 h-4 mr-2" />
              )}
              {isVariationsMinimized ? 'Expandir' : 'Minimizar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Crescimento Médio</p>
                <p className={`text-lg font-semibold ${getTrendColor(averageMonthlyGrowth)}`}>
                  {averageMonthlyGrowth >= 0 ? '+' : ''}{averageMonthlyGrowth.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(averageMonthlyGrowth)}
            </div>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Meses Positivos</p>
                <p className="text-lg font-semibold text-green-400">
                  {positiveMonths}/{comparisonData.length - 1}
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Taxa de Sucesso</p>
                <p className="text-lg font-semibold text-blue-400">
                  {((positiveMonths / (comparisonData.length - 1)) * 100).toFixed(0)}%
                </p>
              </div>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Gráfico de Variações */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="mes" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                label={{ value: 'Variação (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: any, name: string) => [
                  `${value}%`,
                  name === 'ativosVariation' ? 'Ativos' :
                  name === 'entraramVariation' ? 'Entraram' :
                  name === 'sairamVariation' ? 'Sairam' :
                  name === 'renovacaoVariation' ? 'Renovação' :
                  name === 'churnVariation' ? 'Churn' : name
                ]}
              />
              <Line
                type="monotone"
                dataKey="ativosVariation"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                name="Ativos"
              />
              <Line
                type="monotone"
                dataKey="entraramVariation"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Entraram"
              />
              <Line
                type="monotone"
                dataKey="sairamVariation"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                name="Sairam"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de Variações Detalhadas */}
        {!isVariationsMinimized && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-white mb-3">Variações Detalhadas</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-slate-300 py-2">Mês</th>
                    <th className="text-right text-slate-300 py-2">Ativos</th>
                    <th className="text-right text-slate-300 py-2">Entraram</th>
                    <th className="text-right text-slate-300 py-2">Sairam</th>
                    <th className="text-right text-slate-300 py-2">Renovação</th>
                    <th className="text-right text-slate-300 py-2">Churn</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.slice(1).map((item, index) => (
                    <tr key={index} className="border-b border-slate-700/30 hover:bg-slate-800/20">
                      <td className="py-2 text-slate-300">{item.mes}</td>
                      <td className={`py-2 text-right ${getTrendColor(item.ativosVariation)}`}>
                        {item.ativosVariation >= 0 ? '+' : ''}{item.ativosVariation}%
                      </td>
                      <td className={`py-2 text-right ${getTrendColor(item.entraramVariation)}`}>
                        {item.entraramVariation >= 0 ? '+' : ''}{item.entraramVariation}%
                      </td>
                      <td className={`py-2 text-right ${getTrendColor(item.sairamVariation)}`}>
                        {item.sairamVariation >= 0 ? '+' : ''}{item.sairamVariation}%
                      </td>
                      <td className={`py-2 text-right ${getTrendColor(item.renovacaoVariation)}`}>
                        {item.renovacaoVariation >= 0 ? '+' : ''}{item.renovacaoVariation}%
                      </td>
                      <td className={`py-2 text-right ${getTrendColor(item.churnVariation)}`}>
                        {item.churnVariation >= 0 ? '+' : ''}{item.churnVariation}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
