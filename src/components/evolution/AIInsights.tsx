import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp, RefreshCw, Edit2, Plus, Trash2 } from 'lucide-react';
import { analyzePatientProgress, type AIAnalysisResult, type AnalysisInsight } from '@/lib/ai-analysis-service';
import type { Database } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomInsights, type CustomInsight, type InsightData } from '@/hooks/use-custom-insights';
import { EditInsightModal } from './EditInsightModal';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface AIInsightsProps {
  checkins: Checkin[];
  patient?: Patient | null;
  isEditable?: boolean; // Se true, permite editar cards (apenas no portal privado)
  onRefreshData?: () => Promise<void>; // Callback para recarregar dados do paciente/checkins
}

export function AIInsights({ checkins, patient, isEditable = false, onRefreshData }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    strengths: true,
    warnings: false,
    suggestions: false,
    goals: true
  });

  // Estados para edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInsight, setEditingInsight] = useState<CustomInsight | null>(null);
  const [editingSection, setEditingSection] = useState<'strengths' | 'warnings' | 'goals'>('strengths');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiInsightToCopy, setAiInsightToCopy] = useState<AnalysisInsight | null>(null); // Card da IA sendo copiado

  // Hook de insights customizados
  const {
    customInsights,
    fetchCustomInsights,
    saveInsight,
    updateInsight,
    deleteInsight,
    hideAIInsight,
    showAIInsight,
    isAIInsightHidden
  } = useCustomInsights(patient?.telefone || '');

  useEffect(() => {
    if (checkins.length > 0) {
      const result = analyzePatientProgress(checkins, patient);
      setAnalysis(result);
    }
  }, [checkins, patient]);

  // Função para mesclar insights da IA com customizados (filtrando ocultos)
  const getMergedInsights = (
    section: 'strengths' | 'warnings' | 'goals'
  ): (AnalysisInsight | CustomInsight)[] => {
    if (!analysis) return [];

    // Insights da IA (filtrar os que foram ocultados)
    const aiInsights = (analysis[section] || []).filter(
      (insight) => !isAIInsightHidden(insight as AnalysisInsight)
    );

    // Insights customizados desta seção
    const customSectionInsights = customInsights.filter(
      (insight) => insight.section === section
    );

    // Mesclar: customizados primeiro (ordenados por order_index), depois IA
    return [...customSectionInsights, ...aiInsights];
  };

  // Atualizar análise (recalcular com dados atualizados)
  const handleRefreshAnalysis = async () => {
    setIsRefreshing(true);
    try {
      // Recarregar dados do paciente/checkins se callback fornecido
      if (onRefreshData) {
        await onRefreshData();
      }
      
      // Recalcular análise da IA (useEffect vai fazer isso automaticamente quando checkins/patient mudarem)
      // Mas vamos forçar aqui também para garantir
      const result = analyzePatientProgress(checkins, patient);
      setAnalysis(result);

      // Recarregar insights customizados
      await fetchCustomInsights();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Abrir modal para criar novo card
  const handleAddCard = (section: 'strengths' | 'warnings' | 'goals') => {
    setEditingInsight(null);
    setEditingSection(section);
    setShowEditModal(true);
  };

  // Abrir modal para editar card existente (customizado ou criar cópia de card da IA)
  const handleEditCard = (insight: CustomInsight | AnalysisInsight, section: 'strengths' | 'warnings' | 'goals') => {
    const isCustom = isCustomInsight(insight);
    
    if (isCustom) {
      // Editar card customizado existente
      setEditingInsight(insight);
      setEditingSection(insight.section); // Usar section do próprio insight
      setAiInsightToCopy(null);
    } else {
      // Criar cópia editável de card da IA
      setEditingInsight(null); // null = criar novo
      setEditingSection(section); // Usar section passada como parâmetro
      setAiInsightToCopy(insight as AnalysisInsight); // Guardar card da IA para pré-preencher modal
    }
    
    setShowEditModal(true);
  };

  // Salvar card (criar ou atualizar)
  const handleSaveCard = async (data: InsightData): Promise<boolean> => {
    if (editingInsight) {
      // Atualizar existente
      return await updateInsight(editingInsight.id, data);
    } else {
      // Criar novo
      return await saveInsight(data);
    }
  };

  // Excluir card (customizado ou ocultar da IA)
  const handleDeleteCard = async (insight: CustomInsight | AnalysisInsight, section: 'strengths' | 'warnings' | 'goals') => {
    const isCustom = isCustomInsight(insight);
    
    if (isCustom) {
      // Excluir card customizado
      if (confirm(`Tem certeza que deseja excluir o card "${insight.title}"?`)) {
        await deleteInsight(insight.id);
      }
    } else {
      // Ocultar card da IA
      if (confirm(`Deseja ocultar este card da IA? Você pode restaurá-lo depois clicando em "Atualizar Análise".`)) {
        await hideAIInsight(insight as AnalysisInsight, section);
      }
    }
  };

  // Verificar se um insight é customizado
  const isCustomInsight = (insight: any): insight is CustomInsight => {
    return 'id' in insight && 'is_manual' in insight;
  };

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
    <Card className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-700/80 backdrop-blur-sm border-slate-600/50 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-xl border border-emerald-400/30 shadow-lg">
              <Sparkles className="w-7 h-7 text-emerald-200" />
            </div>
            <div className="flex-1">
              <span className="text-2xl font-bold">Análise da sua Evolução</span>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Botão Atualizar Análise */}
            {isEditable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAnalysis}
                disabled={isRefreshing}
                className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 transition-colors"
                title="Recalcular análise com dados atualizados"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar Análise'}
              </Button>
            )}

            {/* Botão Editar */}
            {isEditable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`transition-colors ${
                  isEditMode
                    ? 'text-orange-300 hover:text-orange-200 bg-orange-500/20 hover:bg-orange-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                }`}
                title={isEditMode ? 'Sair do modo de edição' : 'Ativar modo de edição'}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {isEditMode ? 'Concluir Edição' : 'Editar'}
              </Button>
            )}

            {/* Botão Minimizar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-300 hover:text-white hover:bg-slate-700/30"
            >
              {isMinimized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isMinimized && (
        <CardContent className="space-y-4 p-6">
        {/* GRID: Pontos Fortes e Metas lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pontos Fortes */}
          {getMergedInsights('strengths').length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleSection('strengths')}
                  className="flex items-center gap-2 text-left group"
                >
                  <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Pontos Fortes
                  </h3>
                  {expandedSections.strengths ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                  )}
                </button>
                {/* Botão Adicionar Card */}
                {isEditable && isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddCard('strengths')}
                    className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {expandedSections.strengths && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3"
                  >
                    {getMergedInsights('strengths').map((insight, index) => {
                      const isCustom = isCustomInsight(insight);
                      return (
                        <motion.div
                          key={isCustom ? insight.id : `ai-${index}`}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-emerald-900/30 border-2 border-emerald-700/40 rounded-xl p-4 hover:bg-emerald-900/40 transition-colors shadow-lg relative group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{insight.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-base mb-1">{insight.title}</h4>
                              <p className="text-sm text-slate-200 leading-relaxed">{insight.description}</p>
                            </div>
                            {/* Botões de Ação */}
                            {isEditable && isEditMode && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCard(insight, 'strengths')}
                                  className="h-8 w-8 p-0 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                                  title={isCustom ? "Editar card" : "Criar cópia editável"}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {/* Botão excluir em TODOS os cards */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCard(insight, 'strengths')}
                                  className="h-8 w-8 p-0 text-red-300 hover:text-red-200 hover:bg-red-500/20"
                                  title={isCustom ? "Excluir card" : "Ocultar card da IA"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Metas Sugeridas */}
          {getMergedInsights('goals').length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleSection('goals')}
                  className="flex items-center gap-2 text-left group"
                >
                  <h3 className="text-base font-bold text-teal-300 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Próximas Metas
                  </h3>
                  {expandedSections.goals ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                  )}
                </button>
                {/* Botão Adicionar Card */}
                {isEditable && isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddCard('goals')}
                    className="text-teal-300 hover:text-teal-200 hover:bg-teal-500/20"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {expandedSections.goals && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3"
                  >
                    {getMergedInsights('goals').map((insight, index) => {
                      const isCustom = isCustomInsight(insight);
                      return (
                        <motion.div
                          key={isCustom ? insight.id : `ai-${index}`}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-teal-900/30 border-2 border-teal-700/40 rounded-xl p-4 hover:bg-teal-900/40 transition-colors shadow-lg relative group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{insight.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-base mb-1">{insight.title}</h4>
                              <p className="text-sm text-slate-200 leading-relaxed mb-2">{insight.description}</p>
                              {insight.recommendation && (
                                <div className="bg-teal-950/60 rounded-lg p-3 mt-2 border border-teal-800/30">
                                  <p className="text-sm text-teal-200 font-bold mb-1">🎯 Plano de ação:</p>
                                  <p className="text-sm text-slate-200 leading-relaxed">{insight.recommendation}</p>
                                </div>
                              )}
                            </div>
                            {/* Botões de Ação */}
                            {isEditable && isEditMode && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCard(insight, 'goals')}
                                  className="h-8 w-8 p-0 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                                  title={isCustom ? "Editar card" : "Criar cópia editável"}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {/* Botão excluir em TODOS os cards */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCard(insight, 'goals')}
                                  className="h-8 w-8 p-0 text-red-300 hover:text-red-200 hover:bg-red-500/20"
                                  title={isCustom ? "Excluir card" : "Ocultar card da IA"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pontos de Atenção */}
        {getMergedInsights('warnings').length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleSection('warnings')}
                className="flex items-center gap-2 text-left group"
              >
                <h3 className="text-base font-bold text-orange-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Pontos de Atenção
                </h3>
                {expandedSections.warnings ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                )}
              </button>
              {/* Botão Adicionar Card */}
              {isEditable && isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddCard('warnings')}
                  className="text-orange-300 hover:text-orange-200 hover:bg-orange-500/20"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            <AnimatePresence>
              {expandedSections.warnings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  {getMergedInsights('warnings').map((insight, index) => {
                    const isCustom = isCustomInsight(insight);
                    return (
                      <motion.div
                        key={isCustom ? insight.id : `ai-${index}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-orange-900/30 border-2 border-orange-700/40 rounded-xl p-4 hover:bg-orange-900/40 transition-colors shadow-lg relative group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{insight.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-base mb-1">{insight.title}</h4>
                            <p className="text-sm text-slate-200 leading-relaxed mb-2">{insight.description}</p>
                            {insight.recommendation && (
                              <div className="bg-orange-950/60 rounded-lg p-3 mt-2 border border-orange-800/30">
                                <p className="text-sm text-orange-200 font-bold mb-1">💡 Recomendação:</p>
                                <p className="text-sm text-slate-200 leading-relaxed">{insight.recommendation}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`text-xs px-2 py-1 ${
                              insight.priority === 'high' ? 'bg-red-600/40 text-red-100 border-red-500/40' :
                              insight.priority === 'medium' ? 'bg-orange-600/40 text-orange-100 border-orange-500/40' :
                              'bg-yellow-600/40 text-yellow-100 border-yellow-500/40'
                            }`}>
                              {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                            {/* Botões de Ação */}
                            {isEditable && isEditMode && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCard(insight, 'warnings')}
                                  className="h-8 w-8 p-0 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                                  title={isCustom ? "Editar card" : "Criar cópia editável"}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {/* Botão excluir em TODOS os cards */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCard(insight, 'warnings')}
                                  className="h-8 w-8 p-0 text-red-300 hover:text-red-200 hover:bg-red-500/20"
                                  title={isCustom ? "Excluir card" : "Ocultar card da IA"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* CTA de Renovação - Premium Dourado Compacto */}
        <div className="mt-6 relative overflow-hidden rounded-2xl shadow-2xl">
          {/* Background com gradiente dourado premium */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-600/25 to-orange-500/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.15),transparent_70%)]" />
          
          {/* Borda dourada brilhante */}
          <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/40" />
          
          {/* Conteúdo */}
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Ícone Premium */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-amber-400/30 to-yellow-500/30 rounded-2xl border-2 border-amber-400/50 shadow-xl">
                    <Sparkles className="w-10 h-10 text-amber-300" />
                  </div>
                </div>
              </div>
              
              {/* Texto */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  Continue Sua Jornada de Transformação
                </h3>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  Nada vence a consistência, quanto mais se dedica mais resultados tem, só tenho a agradecer pela confiança em seguir e pela parceria nesse processo!
                </p>
                <p className="text-sm sm:text-base text-amber-200 font-semibold leading-relaxed">
                  Caso queira renovar com um bônus em que o plano fica praticamente sem custo, clique aqui:
                </p>
              </div>
              
              {/* Botão WhatsApp */}
              <div className="flex-shrink-0">
                <Button
                  onClick={() => window.open('https://wa.me/5511914880872?text=Oi%20Fabricio%2C%20quero%20renovar%20com%20b%C3%B4nus!', '_blank')}
                  className="group relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-green-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 group-hover:via-green-400/40 rounded-xl transition-all duration-300" />
                  <div className="relative flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-base sm:text-lg">Renovar Agora</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        </CardContent>
      )}

      {/* Modal de Edição */}
      {isEditable && (
        <EditInsightModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingInsight(null);
            setAiInsightToCopy(null);
          }}
          insight={editingInsight}
          aiInsightToCopy={aiInsightToCopy} // Passar card da IA para pré-preencher
          section={editingSection}
          telefone={patient?.telefone || ''}
          onSave={handleSaveCard}
        />
      )}
    </Card>
  );
}

