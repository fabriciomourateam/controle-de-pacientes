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
  Area
} from "recharts";
import { TrendingUp, Users, ArrowUpRight } from "lucide-react";
interface MetricsData {
  mes_numero: number;
  mes: string;
  ano: number;
  total_pacientes: number;
  pacientes_ativos: number;
  novos_pacientes: number;
  churn_rate: number;
  renovacao_rate: number;
}

interface GrowthChartProps {
  data: MetricsData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Extrair mês e ano do label (formato: "Mês/Ano")
    const displayLabel = label || (payload[0]?.payload?.mes_ano || payload[0]?.payload?.mes || '');
    
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-2">{displayLabel}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-semibold">{entry.value.toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function GrowthChart({ data, loading = false }: GrowthChartProps) {
  console.log('🔍 GrowthChart recebeu dados:', data);
  
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Crescimento de Ativos</CardTitle>
          <CardDescription className="text-slate-400">
            Evolução do número de pacientes ativos
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
          <CardTitle className="text-white">Crescimento de Ativos</CardTitle>
          <CardDescription className="text-slate-400">
            Evolução do número de pacientes ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500">
              Os gráficos aparecerão conforme os dados forem inseridos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processar dados para incluir mês/ano combinado e garantir ordem correta
  const chartData = data.map(item => ({
    ...item,
    mes_ano: `${item.mes}/${item.ano}`,
    mes_ano_short: `${item.mes.substring(0, 3)}/${item.ano.toString().slice(-2)}` // Ex: "Ago/24"
  }));

  // Calcular crescimento total
  const crescimentoTotal = data.length > 1 
    ? ((data[data.length - 1].pacientes_ativos - data[0].pacientes_ativos) / data[0].pacientes_ativos) * 100 
    : 0;

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Crescimento de Ativos
            </CardTitle>
            <CardDescription className="text-slate-400">
              Evolução do número de pacientes ativos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${
                crescimentoTotal >= 0 ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span className="text-xs">
                  {crescimentoTotal >= 0 ? '+' : ''}{crescimentoTotal.toFixed(1)}%
                </span>
              </div>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAtivos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="mes_ano" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                // Formatar para mostrar de forma compacta: "Ago/24" ou "Ago/2024" dependendo do espaço
                const parts = value.split('/');
                if (parts.length === 2) {
                  const mes = parts[0];
                  const ano = parts[1];
                  // Se o mês for longo, usar abreviação
                  const mesAbrev = mes.length > 4 ? mes.substring(0, 3) : mes;
                  // Usar últimos 2 dígitos do ano para economizar espaço
                  const anoShort = ano.length === 4 ? ano.slice(-2) : ano;
                  return `${mesAbrev}/${anoShort}`;
                }
                return value;
              }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pacientes_ativos"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorAtivos)"
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-slate-300">Pacientes Ativos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
