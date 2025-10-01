import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart, 
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

interface ChartData {
  month: string;
  novos: number;
  feedbacks: number;
  renovacao?: number; // Porcentagem de renovação
  churn?: number; // Porcentagem de churn
}

interface InteractiveChartProps {
  data: ChartData[];
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  iconColor: string;
}

const CHART_TYPES = [
  { 
    value: 'line', 
    label: 'Linha', 
    icon: LineChartIcon, 
    color: 'text-blue-500',
    description: 'Mostra tendência ao longo do tempo'
  },
  { 
    value: 'area', 
    label: 'Área', 
    icon: AreaChart, 
    color: 'text-green-500',
    description: 'Destaque visual da evolução'
  },
  { 
    value: 'bar', 
    label: 'Barras', 
    icon: BarChart3, 
    color: 'text-purple-500',
    description: 'Comparação entre períodos'
  }
];

const COLORS = {
  novos: '#3b82f6', // blue-500
  feedbacks: '#10b981', // emerald-500
  renovacoes: '#f59e0b', // amber-500
  churn: '#ef4444', // red-500
  gradient: {
    start: 'rgba(59, 130, 246, 0.1)',
    end: 'rgba(59, 130, 246, 0.05)'
  }
};

export function InteractiveChart({ data, title, description, icon: Icon, iconColor }: InteractiveChartProps) {
  const [chartType, setChartType] = useState('line');
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedData, setSelectedData] = useState<ChartData | null>(null);

  const handleDataClick = (data: any) => {
    setSelectedData(data);
  };

  const renderChart = () => {
    const commonProps = {
      data,
      onClick: handleDataClick,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              content={CustomTooltip}
              cursor={{ stroke: COLORS.novos, strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="novos" 
              stroke={COLORS.novos}
              strokeWidth={3}
              dot={{ fill: COLORS.novos, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.novos, strokeWidth: 2 }}
              name="Novos Pacientes"
            />
            <Line 
              type="monotone" 
              dataKey="renovacao" 
              stroke={COLORS.renovacoes}
              strokeWidth={3}
              dot={{ fill: COLORS.renovacoes, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.renovacoes, strokeWidth: 2 }}
              name="Renovação (%)"
            />
            <Line 
              type="monotone" 
              dataKey="churn" 
              stroke={COLORS.churn}
              strokeWidth={3}
              dot={{ fill: COLORS.churn, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.churn, strokeWidth: 2 }}
              name="Churn (%)"
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={CustomTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="novos"
              stackId="1"
              stroke={COLORS.novos}
              fill={COLORS.novos}
              fillOpacity={0.6}
              strokeWidth={2}
              name="Novos Pacientes"
            />
            <Area
              type="monotone"
              dataKey="renovacao"
              stackId="2"
              stroke={COLORS.renovacoes}
              fill={COLORS.renovacoes}
              fillOpacity={0.6}
              strokeWidth={2}
              name="Renovação (%)"
            />
            <Area
              type="monotone"
              dataKey="churn"
              stackId="3"
              stroke={COLORS.churn}
              fill={COLORS.churn}
              fillOpacity={0.6}
              strokeWidth={2}
              name="Churn (%)"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={CustomTooltip} />
            <Legend />
            <Bar 
              dataKey="novos" 
              fill={COLORS.novos}
              radius={[4, 4, 0, 0]}
              name="Novos Pacientes"
            />
            <Bar 
              dataKey="renovacao" 
              fill={COLORS.renovacoes}
              radius={[4, 4, 0, 0]}
              name="Renovação (%)"
            />
            <Bar 
              dataKey="churn" 
              fill={COLORS.churn}
              radius={[4, 4, 0, 0]}
              name="Churn (%)"
            />
          </BarChart>
        );

      default:
        return null;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-2xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300 text-sm">
                {entry.name}: <span className="text-white font-medium">
                  {entry.dataKey === 'renovacao' || entry.dataKey === 'churn' 
                    ? `${entry.value.toFixed(1)}%` 
                    : entry.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const selectedChartType = CHART_TYPES.find(type => type.value === chartType);
  const ChartIcon = selectedChartType?.icon || LineChartIcon;

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br from-${iconColor.split('-')[1]}-500/20 to-${iconColor.split('-')[1]}-600/20 rounded-lg`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                {title}
                <Badge variant="outline" className="text-xs">
                  {data.length} períodos
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-400">
                {description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
              {CHART_TYPES.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={chartType === type.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type.value)}
                    className={`h-8 px-2 ${
                      chartType === type.value 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    title={type.description}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400">Nenhum dado disponível</p>
              <p className="text-sm text-slate-500 mt-1">Os gráficos aparecerão conforme os dados forem carregados</p>
            </div>
          ) : (
            <>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
              
              {selectedData && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">Dados Selecionados</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Período</p>
                      <p className="text-white font-semibold">{selectedData.month}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Novos Pacientes</p>
                      <p className="text-blue-400 font-semibold">{selectedData.novos}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Renovação</p>
                      <p className="text-amber-400 font-semibold">{(selectedData.renovacao || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Churn</p>
                      <p className="text-red-400 font-semibold">{(selectedData.churn || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Crescimento</p>
                      <p className="text-white font-semibold">
                        {((selectedData.renovacao || 0) - (selectedData.churn || 0)).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
