import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";
import { TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import type { ChartData } from "@/types/dashboard";

interface ChurnChartProps {
  data: ChartData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-semibold">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ChurnChart({ data, loading = false }: ChurnChartProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Renovação vs Churn</CardTitle>
          <CardDescription className="text-slate-400">
            Comparativo entre taxa de renovação e churn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-64 bg-slate-700/50 rounded"></div>
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
          <CardTitle className="text-white">Renovação vs Churn</CardTitle>
          <CardDescription className="text-slate-400">
            Comparativo entre taxa de renovação e churn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500">
              Os gráficos aparecerão conforme os dados forem inseridos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular médias
  const renovacaoMedia = data.reduce((acc, item) => acc + item.renovacao, 0) / data.length;
  const churnMedio = data.reduce((acc, item) => acc + item.churn, 0) / data.length;

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Renovação vs Churn
            </CardTitle>
            <CardDescription className="text-slate-400">
              Comparativo entre taxa de renovação e churn
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-green-400 border-green-500/30"
            >
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span className="text-xs">
                  Renovação: {renovacaoMedia.toFixed(1)}%
                </span>
              </div>
            </Badge>
            <Badge 
              variant="outline" 
              className="text-red-400 border-red-500/30"
            >
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs">
                  Churn: {churnMedio.toFixed(1)}%
                </span>
              </div>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="mes" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="renovacao" 
              fill="#10b981" 
              radius={[2, 2, 0, 0]}
              name="Renovação"
            />
            <Bar 
              dataKey="churn" 
              fill="#ef4444" 
              radius={[2, 2, 0, 0]}
              name="Churn"
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-slate-300">Renovação</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-slate-300">Churn</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}












