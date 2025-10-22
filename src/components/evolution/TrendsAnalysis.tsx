import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Info, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Trend } from '@/lib/trends-analysis';

interface TrendsAnalysisProps {
  trends: Trend[];
}

export function TrendsAnalysis({ trends }: TrendsAnalysisProps) {
  if (trends.length === 0) {
    return null;
  }

  const getTypeIcon = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'negative':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'insight':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  const getTypeLabel = (type: Trend['type']) => {
    switch (type) {
      case 'positive':
        return 'Positivo';
      case 'negative':
        return 'Atenção';
      case 'insight':
        return 'Insight';
      default:
        return 'Neutro';
    }
  };

  return (
    <Card className="glass-card border-slate-700 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Análise de Tendências</CardTitle>
            <CardDescription>
              Insights personalizados baseados nos seus dados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {trends.map((trend, index) => (
          <motion.div
            key={trend.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <div 
              className={`
                relative p-4 rounded-lg border border-slate-700
                bg-gradient-to-br ${trend.color} bg-opacity-5
                hover:bg-opacity-10 transition-all duration-200
              `}
            >
              {/* Barra lateral colorida */}
              <div className={`
                absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                bg-gradient-to-b ${trend.color}
              `} />

              <div className="pl-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{trend.icon}</span>
                    <h4 className="font-bold text-white text-sm">
                      {trend.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${getTypeBadgeColor(trend.type)} text-xs`}
                    >
                      <span className="mr-1">{getTypeIcon(trend.type)}</span>
                      {getTypeLabel(trend.type)}
                    </Badge>
                    
                    {trend.confidence >= 80 && (
                      <Badge 
                        variant="outline" 
                        className="bg-purple-500/20 text-purple-300 border-purple-500/50 text-xs"
                      >
                        {trend.confidence}% confiança
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                  {trend.description}
                </p>

                {/* Recomendação */}
                {trend.recommendation && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-yellow-400 mb-1">
                          Recomendação:
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {trend.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Footer com estatísticas */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {trends.filter(t => t.type === 'positive').length}
              </div>
              <div className="text-xs text-slate-400">Positivos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {trends.filter(t => t.type === 'insight').length}
              </div>
              <div className="text-xs text-slate-400">Insights</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                {trends.filter(t => t.type === 'negative').length}
              </div>
              <div className="text-xs text-slate-400">Atenção</div>
            </div>
          </div>
        </div>

        {/* Mensagem final */}
        <div className="text-center text-xs text-slate-400 mt-4">
          💡 Análise baseada em {trends[0]?.confidence ? 'algoritmos inteligentes' : 'padrões detectados'} nos seus dados
        </div>
      </CardContent>
    </Card>
  );
}

