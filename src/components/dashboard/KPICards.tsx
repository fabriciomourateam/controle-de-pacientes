import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Info
} from "lucide-react";
import { useState } from "react";
import type { KPIMetric } from "@/types/dashboard";

interface KPICardsProps {
  kpis: KPIMetric[];
  loading?: boolean;
}

const iconMap = {
  Users,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Activity
};

const colorMap = {
  blue: {
    bg: 'from-blue-500/20 to-blue-600/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: 'text-blue-400'
  },
  green: {
    bg: 'from-green-500/20 to-green-600/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: 'text-green-400'
  },
  red: {
    bg: 'from-red-500/20 to-red-600/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-400'
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    icon: 'text-purple-400'
  }
};

export function KPICards({ kpis, loading = false }: KPICardsProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 bg-slate-600 rounded w-24"></div>
                  <div className="h-8 w-8 bg-slate-600 rounded"></div>
                </div>
                <div className="h-8 bg-slate-600 rounded w-20 mb-2"></div>
                <div className="h-3 bg-slate-600 rounded w-32"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getVariationIcon = (tipo?: string) => {
    switch (tipo) {
      case 'positiva':
        return <ArrowUp className="w-3 h-3" />;
      case 'negativa':
        return <ArrowDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getVariationColor = (tipo?: string) => {
    switch (tipo) {
      case 'positiva':
        return 'text-green-400';
      case 'negativa':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => {
        const IconComponent = iconMap[kpi.icone as keyof typeof iconMap];
        const colors = colorMap[kpi.cor as keyof typeof colorMap];
        const isHealthMetric = kpi.titulo === 'Saúde do Negócio';
        
        return (
          <div key={index} className="relative">
            <Card 
              className={`bg-gradient-to-br ${colors.bg} backdrop-blur-sm border ${colors.border} hover:from-slate-700/50 hover:to-slate-800/50 transition-all duration-300`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                    <h3 className="text-sm font-medium text-slate-300">{kpi.titulo}</h3>
                    {isHealthMetric && (
                      <div className="relative">
                        <button 
                          className="text-slate-400 hover:text-slate-300 transition-colors"
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        
                        {showTooltip && (
                          <div 
                            className="absolute -top-80 -left-96 z-[9999] w-96 p-4 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-slate-200"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                          >
                            <div className="space-y-3">
                              <h4 className="font-semibold text-white mb-2">Como é calculada a Saúde do Negócio?</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <div>
                                    <span className="font-medium text-blue-400">Retenção (40%):</span>
                                    <p className="text-slate-300">Taxa de renovação dos clientes</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <div>
                                    <span className="font-medium text-green-400">Churn (40%):</span>
                                    <p className="text-slate-300">Inverso da taxa de cancelamento (quanto menor, melhor)</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <div>
                                    <span className="font-medium text-purple-400">Crescimento (20%):</span>
                                    <p className="text-slate-300">Taxa de crescimento mensal × 5</p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-600">
                                  <p className="text-xs text-slate-400">
                                    <strong>Fórmula:</strong> (Retenção × 0.4) + (Churn × 0.4) + (Crescimento × 0.2)
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {kpi.variacao !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={`${getVariationColor(kpi.variacao_tipo)} border-current`}
                    >
                      <div className="flex items-center gap-1">
                        {getVariationIcon(kpi.variacao_tipo)}
                        <span className="text-xs">
                          {kpi.variacao > 0 ? '+' : ''}{kpi.variacao.toFixed(1)}%
                        </span>
                      </div>
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${colors.text}`}>
                    {kpi.valor}
                  </div>
                  <p className="text-xs text-slate-400">
                    {kpi.descricao}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}


