import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { TrendingUp, Users, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { ChartData, GrowthMetrics } from "@/types/dashboard";

interface OrganizedGrowthChartProps {
  data: ChartData[];
  growthMetrics: GrowthMetrics | null;
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 shadow-xl">
        <p className="text-sm font-medium text-white mb-3">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300">{entry.name}:</span>
            </div>
            <span className="text-white font-semibold">
              {entry.dataKey === 'crescimento' ? `${entry.value}%` : entry.value.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function OrganizedGrowthChart({ data, growthMetrics, loading = false }: OrganizedGrowthChartProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Crescimento Organizado</CardTitle>
          <CardDescription className="text-slate-400">
            Evolução real do crescimento da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-80 bg-slate-700/50 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Crescimento Organizado</CardTitle>
          <CardDescription className="text-slate-400">
            Evolução real do crescimento da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
            <Users className="w-16 h-16 text-slate-400 mb-4" />
            <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500">
              Os dados aparecerão conforme forem inseridos no sistema
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getGrowthIcon = () => {
    if (!growthMetrics) return <Minus className="w-4 h-4" />;
    switch (growthMetrics.growthTrend) {
      case 'growing': return <ArrowUpRight className="w-4 h-4" />;
      case 'declining': return <ArrowDownRight className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getGrowthColor = () => {
    if (!growthMetrics) return 'text-slate-400 border-slate-500/30';
    switch (growthMetrics.growthTrend) {
      case 'growing': return 'text-green-400 border-green-500/30';
      case 'declining': return 'text-red-400 border-red-500/30';
      default: return 'text-blue-400 border-blue-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Crescimento Organizado
            </CardTitle>
            <CardDescription className="text-slate-400">
              Evolução real do crescimento
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {growthMetrics && (
              <>
                <Badge variant="outline" className={getGrowthColor()}>
                  <div className="flex items-center gap-1">
                    {getGrowthIcon()}
                    <span className="text-xs">
                      {growthMetrics.totalGrowth >= 0 ? '+' : ''}{growthMetrics.totalGrowth}%
                    </span>
                  </div>
                </Badge>
                <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                  <span className="text-xs">
                    Projeção: {growthMetrics.projectedNextMonth}
                  </span>
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico de crescimento mensal */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Crescimento Mensal (%)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCrescimento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="crescimento"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorCrescimento)"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de ativos vs saldo */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Ativos vs Saldo (Entradas - Saídas)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toLocaleString('pt-BR')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="ativos" 
                  fill="#3b82f6" 
                  radius={[2, 2, 0, 0]}
                  name="Ativos"
                />
                <Bar 
                  dataKey="saldo" 
                  fill="#10b981" 
                  radius={[2, 2, 0, 0]}
                  name="Saldo"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Resumo das métricas */}
        {growthMetrics && (
          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <h4 className="text-sm font-medium text-white mb-3">Resumo do Crescimento</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Crescimento Total:</p>
                <p className={`font-semibold ${growthMetrics.totalGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {growthMetrics.totalGrowth >= 0 ? '+' : ''}{growthMetrics.totalGrowth}%
                </p>
              </div>
              <div>
                <p className="text-slate-400">Crescimento Mensal:</p>
                <p className={`font-semibold ${growthMetrics.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {growthMetrics.monthlyGrowth >= 0 ? '+' : ''}{growthMetrics.monthlyGrowth}%
                </p>
              </div>
              <div>
                <p className="text-slate-400">Média Mensal:</p>
                <p className={`font-semibold ${growthMetrics.averageMonthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {growthMetrics.averageMonthlyGrowth >= 0 ? '+' : ''}{growthMetrics.averageMonthlyGrowth}%
                </p>
              </div>
              <div>
                <p className="text-slate-400">Projeção:</p>
                <p className="text-blue-400 font-semibold">
                  {growthMetrics.projectedNextMonth.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
