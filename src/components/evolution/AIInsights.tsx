import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzePatientProgress, type AIAnalysisResult } from '@/lib/ai-analysis-service';
import type { Database } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';

type Checkin = Database['public']['Tables']['checkin']['Row'];

interface AIInsightsProps {
  checkins: Checkin[];
}

export function AIInsights({ checkins }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    strengths: false,
    warnings: false,
    suggestions: false,
    goals: false
  });

  useEffect(() => {
    if (checkins.length > 0) {
      const result = analyzePatientProgress(checkins);
      setAnalysis(result);
    }
  }, [checkins]);

  if (!analysis || checkins.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm border-purple-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Análise Inteligente
          </CardTitle>
          <CardDescription className="text-slate-400">
            Insights personalizados serão gerados assim que houver check-ins suficientes
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getTrendIcon = () => {
    switch (analysis.trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'declining':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTrendText = () => {
    switch (analysis.trend) {
      case 'improving':
        return 'Em evolução positiva';
      case 'declining':
        return 'Necessita atenção';
      default:
        return 'Progresso estável';
    }
  };

  const getTrendColor = () => {
    switch (analysis.trend) {
      case 'improving':
        return 'from-emerald-500/20 to-green-600/20 border-emerald-500/30';
      case 'declining':
        return 'from-orange-500/20 to-red-600/20 border-orange-500/30';
      default:
        return 'from-blue-500/20 to-indigo-600/20 border-blue-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm border-purple-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="p-2 bg-purple-600/30 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>Análise Inteligente do Progresso</span>
              <Badge className="bg-purple-600/30 text-purple-200 border-purple-500/30">
                IA
              </Badge>
            </div>
            <p className="text-sm font-normal text-purple-300 mt-1">
              Insights personalizados baseados em {checkins.length} check-ins
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Geral e Tendência */}
        <div className={`bg-gradient-to-br ${getTrendColor()} rounded-lg p-4 border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTrendIcon()}
              <div>
                <p className="text-sm text-slate-300">Status Geral</p>
                <p className="text-xl font-bold text-white">{getTrendText()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Pontuação Média</p>
              <p className="text-3xl font-bold text-white">{analysis.overallScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400">/10</p>
            </div>
          </div>
        </div>

        {/* Pontos Fortes */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('strengths')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pontos Fortes ({analysis.strengths.length})
              </h3>
              {expandedSections.strengths ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.strengths && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  {analysis.strengths.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4 hover:bg-emerald-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                          <p className="text-sm text-slate-300">{insight.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Pontos de Atenção */}
        {analysis.warnings.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('warnings')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-lg font-semibold text-orange-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Pontos de Atenção ({analysis.warnings.length})
              </h3>
              {expandedSections.warnings ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.warnings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  {analysis.warnings.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-4 hover:bg-orange-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                          <p className="text-sm text-slate-300 mb-2">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="bg-orange-950/50 rounded p-2 mt-2">
                              <p className="text-xs text-orange-200 font-semibold mb-1">💡 Recomendação:</p>
                              <p className="text-xs text-slate-300">{insight.recommendation}</p>
                            </div>
                          )}
                        </div>
                        <Badge className={`${
                          insight.priority === 'high' ? 'bg-red-600/30 text-red-200 border-red-500/30' :
                          insight.priority === 'medium' ? 'bg-orange-600/30 text-orange-200 border-orange-500/30' :
                          'bg-yellow-600/30 text-yellow-200 border-yellow-500/30'
                        }`}>
                          {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sugestões */}
        {analysis.suggestions.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('suggestions')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Sugestões de Melhoria ({analysis.suggestions.length})
              </h3>
              {expandedSections.suggestions ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.suggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  {analysis.suggestions.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 hover:bg-blue-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                          <p className="text-sm text-slate-300 mb-2">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="bg-blue-950/50 rounded p-2 mt-2">
                              <p className="text-xs text-blue-200 font-semibold mb-1">✨ Como fazer:</p>
                              <p className="text-xs text-slate-300">{insight.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Metas */}
        {analysis.goals.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('goals')}
              className="w-full flex items-center justify-between text-left group"
            >
              <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metas Sugeridas ({analysis.goals.length})
              </h3>
              {expandedSections.goals ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.goals && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  {analysis.goals.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4 hover:bg-purple-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                          <p className="text-sm text-slate-300 mb-2">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="bg-purple-950/50 rounded p-2 mt-2">
                              <p className="text-xs text-purple-200 font-semibold mb-1">🎯 Plano de ação:</p>
                              <p className="text-xs text-slate-300">{insight.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Footer com informação sobre IA */}
        <div className="pt-4 border-t border-purple-700/30">
          <p className="text-xs text-slate-400 text-center">
            💡 Análise gerada com base em algoritmos inteligentes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

