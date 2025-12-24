import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Loader2, Settings, MessageSquare, Copy, ExternalLink, Save, Send, ChevronDown, ChevronUp, Bot, TrendingUp, Sparkles } from 'lucide-react';
import { useCheckinFeedback } from '../../hooks/use-checkin-feedback';
import { useFeedbackTemplates } from '../../hooks/use-feedback-templates';
import { extractMeasurements } from '../../lib/measurement-utils';
import { PromptEditor } from '../evolution/PromptEditor';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { CheckinWithPatient } from '@/lib/checkin-service';
import { useCheckinManagement } from '../../hooks/use-checkin-management';
import { supabase } from '@/integrations/supabase/client';

interface CheckinFeedbackCardProps {
  checkin: CheckinWithPatient;
  totalCheckins?: number;
  onUpdate?: () => void;
}

export const CheckinFeedbackCard: React.FC<CheckinFeedbackCardProps> = ({
  checkin,
  totalCheckins = 0,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [observedImprovements, setObservedImprovements] = useState('');
  const [dietAdjustments, setDietAdjustments] = useState('');
  const [generatedFeedback, setGeneratedFeedback] = useState('');

  const {
    latestCheckin,
    evolutionData,
    feedbackAnalysis,
    isGenerating,
    loading,
    patientId,
    generateFeedback,
    saveFeedbackAnalysis,
    markFeedbackAsSent
  } = useCheckinFeedback(checkin.telefone);

  const { activeTemplate } = useFeedbackTemplates();
  const { updateCheckinStatus } = useCheckinManagement();

  // Carregar dados existentes quando disponível do hook
  React.useEffect(() => {
    if (feedbackAnalysis) {
      // Só atualizar se os dados vierem do mesmo check-in
      if (feedbackAnalysis.checkin_id === checkin.id) {
        setObservedImprovements(feedbackAnalysis.observed_improvements || '');
        setDietAdjustments(feedbackAnalysis.diet_adjustments || '');
        setGeneratedFeedback(feedbackAnalysis.generated_feedback || '');
      }
    }
  }, [feedbackAnalysis, checkin.id]);
  
  // Carregar análise específica deste check-in quando o componente montar ou check-in mudar
  React.useEffect(() => {
    const loadAnalysisForCheckin = async () => {
      if (!checkin?.id) return;
      
      // Buscar análise específica deste check-in por checkin_id (mais preciso)
      try {
        const { data, error } = await supabase
          .from('checkin_feedback_analysis' as any)
          .select('*')
          .eq('checkin_id', checkin.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erro ao buscar análise:', error);
          }
          return;
        }
        
        if (data) {
          setObservedImprovements(data.observed_improvements || '');
          setDietAdjustments(data.diet_adjustments || '');
          setGeneratedFeedback(data.generated_feedback || '');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao buscar análise do check-in:', error);
        }
      }
    };
    
    loadAnalysisForCheckin();
  }, [checkin.id]);

  const handleGenerateFeedback = async () => {
    if (!activeTemplate) {
      toast.error('Nenhum template ativo encontrado');
      return;
    }

    const feedback = await generateFeedback(
      checkin.patient?.nome || 'Paciente',
      observedImprovements,
      dietAdjustments,
      activeTemplate
    );

    if (feedback) {
      setGeneratedFeedback(feedback);
    }
  };

  const handleSaveAnnotations = async () => {
    if (!checkin || !patientId) {
      toast.error('Dados do check-in não disponíveis');
      return;
    }

    try {
      const result = await saveFeedbackAnalysis({
        // Se já existe uma análise salva, incluir o ID para fazer UPDATE ao invés de INSERT
        ...(feedbackAnalysis?.id && { id: feedbackAnalysis.id }),
        patient_id: patientId!,
        checkin_id: checkin.id,
        checkin_date: checkin.data_checkin?.split('T')[0] || new Date().toISOString().split('T')[0],
        checkin_data: checkin,
        evolution_data: evolutionData,
        observed_improvements: observedImprovements,
        diet_adjustments: dietAdjustments,
        generated_feedback: generatedFeedback,
        feedback_status: feedbackAnalysis?.feedback_status || 'draft', // Manter status se já existir
        prompt_template_id: activeTemplate?.id || ''
      });
      
      if (result) {
        toast.success('Anotações e feedback salvos com sucesso!');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar anotações e feedback');
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao salvar anotações:', error);
      }
    }
  };

  const handleCopyFeedback = async () => {
    if (!generatedFeedback) return;
    
    try {
      await navigator.clipboard.writeText(generatedFeedback);
      toast.success('Feedback copiado para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar feedback');
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!generatedFeedback) return;
    
    const encodedMessage = encodeURIComponent(generatedFeedback);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // Atualizar status do check-in para enviado
    await updateCheckinStatus(checkin.id, 'enviado');
    onUpdate?.();
    
    // Marcar feedback como enviado também
    markFeedbackAsSent('whatsapp');
  };

  const handleMarkAsSent = async () => {
    try {
      // Atualizar status do check-in para enviado
      const success = await updateCheckinStatus(checkin.id, 'enviado');
      
      if (success) {
        toast.success('Check-in marcado como enviado!');
        onUpdate?.(); // Notificar componente pai para atualizar lista
      } else {
        toast.error('Erro ao atualizar status do check-in');
      }
      
      // Marcar feedback como enviado também (se existir)
      if (feedbackAnalysis) {
        markFeedbackAsSent('manual');
      }
    } catch (error) {
      toast.error('Erro ao marcar como enviado');
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao marcar como enviado:', error);
      }
    }
  };

  if (!checkin) return null;

  return (
    <div className="mt-3 border-t border-slate-700/50 pt-3">
      {/* Botão de Expandir/Colapsar */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700/50"
        >
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">Feedback</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
        
        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPromptEditor(!showPromptEditor)}
            className="text-slate-400 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Conteúdo Expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="space-y-4">
              {/* Editor de Prompt (colapsável) */}
              {showPromptEditor && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <PromptEditor />
                </motion.div>
              )}

              {/* Evolução Comparativa - Tabela */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <h4 className="text-sm font-medium text-slate-200">Evolução Comparativa</h4>
                    </div>
                    {!evolutionData?.tem_checkin_anterior && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Primeiro Check-in
                      </Badge>
                    )}
                  </div>
                  
                  {evolutionData?.tem_checkin_anterior ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="text-left py-2 px-2 text-slate-400 font-medium text-xs">Métrica</th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">
                              {evolutionData.checkin_anterior_data 
                                ? new Date(evolutionData.checkin_anterior_data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                : 'Anterior'}
                            </th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">
                              {new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">Evolução</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Peso */}
                          {evolutionData.peso_anterior !== undefined && evolutionData.peso_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Peso</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.peso_anterior || 0}kg</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.peso_atual || 0}kg</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.peso_diferenca < 0 ? 'text-green-400' : evolutionData.peso_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.peso_diferenca > 0 ? '+' : ''}{evolutionData.peso_diferenca}kg
                              </td>
                            </tr>
                          )}
                          
                          {/* Cintura */}
                          {(evolutionData.cintura_anterior !== null && evolutionData.cintura_anterior !== undefined) || 
                           (evolutionData.cintura_atual !== null && evolutionData.cintura_atual !== undefined) ? (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Cintura</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.cintura_anterior || '-'}cm</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.cintura_atual || '-'}cm</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.cintura_diferenca < 0 ? 'text-green-400' : evolutionData.cintura_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.cintura_diferenca !== undefined && evolutionData.cintura_diferenca !== 0
                                  ? `${evolutionData.cintura_diferenca > 0 ? '+' : ''}${evolutionData.cintura_diferenca}cm`
                                  : '0cm'}
                              </td>
                            </tr>
                          ) : null}
                          
                          {/* Quadril */}
                          {(evolutionData.quadril_anterior !== null && evolutionData.quadril_anterior !== undefined) || 
                           (evolutionData.quadril_atual !== null && evolutionData.quadril_atual !== undefined) ? (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Quadril</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.quadril_anterior || '-'}cm</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.quadril_atual || '-'}cm</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.quadril_diferenca < 0 ? 'text-green-400' : evolutionData.quadril_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.quadril_diferenca !== undefined && evolutionData.quadril_diferenca !== 0
                                  ? `${evolutionData.quadril_diferenca > 0 ? '+' : ''}${evolutionData.quadril_diferenca}cm`
                                  : '0cm'}
                              </td>
                            </tr>
                          ) : null}
                          
                          {/* Aproveitamento */}
                          {evolutionData.aderencia_anterior !== undefined && evolutionData.aderencia_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Aproveitamento</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.aderencia_anterior || 0}%</td>
                              <td className="py-2 px-2 text-center text-blue-400">{evolutionData.aderencia_atual || 0}%</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.aderencia_diferenca > 0 ? 'text-green-400' : evolutionData.aderencia_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.aderencia_diferenca !== 0
                                  ? `${evolutionData.aderencia_diferenca > 0 ? '+' : ''}${evolutionData.aderencia_diferenca}%`
                                  : '0%'}
                              </td>
                            </tr>
                          )}
                          
                          {/* Treinos */}
                          {evolutionData.treino_anterior !== undefined && evolutionData.treino_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🏃 Treinos</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.treino_anterior || 0}</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.treino_atual || 0}</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.treino_diferenca > 0 ? 'text-green-400' : evolutionData.treino_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.treino_diferenca !== 0
                                  ? `${evolutionData.treino_diferenca > 0 ? '+' : ''}${evolutionData.treino_diferenca}`
                                  : '0'}
                              </td>
                            </tr>
                          )}
                          
                          {/* Cardio */}
                          {evolutionData.cardio_anterior !== undefined && evolutionData.cardio_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🏃‍♂️ Cardio</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.cardio_anterior || 0}</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.cardio_atual || 0}</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.cardio_diferenca > 0 ? 'text-green-400' : evolutionData.cardio_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.cardio_diferenca !== 0
                                  ? `${evolutionData.cardio_diferenca > 0 ? '+' : ''}${evolutionData.cardio_diferenca}`
                                  : '0'}
                              </td>
                            </tr>
                          )}
                          
                          {/* Água */}
                          {evolutionData.agua_anterior !== undefined && evolutionData.agua_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">💧 Água</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.agua_anterior || 0}</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.agua_atual || 0}</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.agua_diferenca > 0 ? 'text-green-400' : evolutionData.agua_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.agua_diferenca !== 0
                                  ? `${evolutionData.agua_diferenca > 0 ? '+' : ''}${evolutionData.agua_diferenca}`
                                  : '0'}
                              </td>
                            </tr>
                          )}
                          
                          {/* Sono */}
                          {evolutionData.sono_anterior !== undefined && evolutionData.sono_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">😴 Sono</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.sono_anterior || 0}</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.sono_atual || 0}</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.sono_diferenca > 0 ? 'text-green-400' : evolutionData.sono_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.sono_diferenca !== 0
                                  ? `${evolutionData.sono_diferenca > 0 ? '+' : ''}${evolutionData.sono_diferenca}`
                                  : '0'}
                              </td>
                            </tr>
                          )}
                          
                          {/* Refeições Livres */}
                          {evolutionData.ref_livre_anterior !== undefined && evolutionData.ref_livre_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🍽️ Refeições Livres</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.ref_livre_anterior || 0}</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.ref_livre_atual || 0}</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.ref_livre_diferenca > 0 ? 'text-green-400' : evolutionData.ref_livre_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.ref_livre_diferenca !== 0
                                  ? `${evolutionData.ref_livre_diferenca > 0 ? '+' : ''}${evolutionData.ref_livre_diferenca}`
                                  : '0'}
                              </td>
                            </tr>
                          )}
                          
                          {/* Beliscos */}
                          {evolutionData.beliscos_anterior !== undefined && evolutionData.beliscos_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🍪 Beliscos</td>
                              <td className="py-2 px-2 text-center text-slate-400">{evolutionData.beliscos_anterior || 0}</td>
                              <td className="py-2 px-2 text-center text-slate-200">{evolutionData.beliscos_atual || 0}</td>
                              <td className={`py-2 px-2 text-center font-medium ${evolutionData.beliscos_diferenca < 0 ? 'text-green-400' : evolutionData.beliscos_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {evolutionData.beliscos_diferenca !== 0
                                  ? `${evolutionData.beliscos_diferenca > 0 ? '+' : ''}${evolutionData.beliscos_diferenca}`
                                  : '0'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            <th className="text-left py-2 px-2 text-slate-400 font-medium text-xs">Métrica</th>
                            <th className="text-center py-2 px-2 text-slate-400 font-medium text-xs">
                              {new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Peso */}
                          {evolutionData?.peso_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Peso</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.peso_atual || 0}kg</td>
                            </tr>
                          )}
                          
                          {/* Cintura */}
                          {evolutionData?.cintura_atual !== null && evolutionData?.cintura_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Cintura</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.cintura_atual}cm</td>
                            </tr>
                          )}
                          
                          {/* Quadril */}
                          {evolutionData?.quadril_atual !== null && evolutionData?.quadril_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Quadril</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.quadril_atual}cm</td>
                            </tr>
                          )}
                          
                          {/* Aproveitamento */}
                          {evolutionData?.aderencia_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">Aproveitamento</td>
                              <td className="py-2 px-2 text-center text-blue-400 font-medium">{evolutionData.aderencia_atual || 0}%</td>
                            </tr>
                          )}
                          
                          {/* Treinos */}
                          {evolutionData?.treino_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🏃 Treinos</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.treino_atual || 0}</td>
                            </tr>
                          )}
                          
                          {/* Cardio */}
                          {evolutionData?.cardio_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🏃‍♂️ Cardio</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.cardio_atual || 0}</td>
                            </tr>
                          )}
                          
                          {/* Água */}
                          {evolutionData?.agua_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">💧 Água</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.agua_atual || 0}</td>
                            </tr>
                          )}
                          
                          {/* Sono */}
                          {evolutionData?.sono_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">😴 Sono</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.sono_atual || 0}</td>
                            </tr>
                          )}
                          
                          {/* Refeições Livres */}
                          {evolutionData?.ref_livre_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🍽️ Refeições Livres</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.ref_livre_atual || 0}</td>
                            </tr>
                          )}
                          
                          {/* Beliscos */}
                          {evolutionData?.beliscos_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-2 px-2 text-slate-300">🍪 Beliscos</td>
                              <td className="py-2 px-2 text-center text-slate-200 font-medium">{evolutionData.beliscos_atual || 0}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações Adicionais para Elaboração do Feedback */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4 space-y-4">
                  <h4 className="text-sm font-medium text-slate-200">📋 Informações para Elaboração do Feedback</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Objetivo & Dificuldades */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-slate-300">🎯 Objetivo & Dificuldades</h5>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-slate-400">Objetivo:</span>
                          <p className="text-slate-200 mt-1">{checkin.objetivo || 'Não informado'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Dificuldades:</span>
                          <p className="text-slate-200 mt-1">{checkin.dificuldades || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Percepções Visuais */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-slate-300">👁️ Percepções Visuais</h5>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-slate-400">Melhora Visual:</span>
                          <p className="text-slate-200 mt-1">{checkin.melhora_visual || 'Não informado'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Quais Pontos:</span>
                          <p className="text-slate-200 mt-1">{checkin.quais_pontos || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Refeições Livres & Beliscos */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-slate-300">🍽️ Refeições Livres & Beliscos</h5>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-slate-400">O que comeu na refeição livre:</span>
                          <p className="text-slate-200 mt-1">{checkin.oq_comeu_ref_livre || 'Não informado'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">O que beliscou:</span>
                          <p className="text-slate-200 mt-1">{checkin.oq_beliscou || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Fome & Ajustes */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-slate-300">🍴 Fome & Ajustes</h5>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-slate-400">Comeu menos que o planejado:</span>
                          <p className="text-slate-200 mt-1">{checkin.comeu_menos || 'Não informado'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Alimento para incluir:</span>
                          <p className="text-slate-200 mt-1">{checkin.alimento_para_incluir || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suas Observações */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-4 space-y-4">
                  <h4 className="text-sm font-medium text-slate-200">📝 Suas Observações</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      🔍 Melhoras Observadas:
                    </label>
                    <Textarea
                      value={observedImprovements}
                      onChange={(e) => setObservedImprovements(e.target.value)}
                      placeholder="Descreva as melhoras que você observou no paciente..."
                      rows={2}
                      className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      ⚙️ Ajustes Realizados na Dieta:
                    </label>
                    <Textarea
                      value={dietAdjustments}
                      onChange={(e) => setDietAdjustments(e.target.value)}
                      placeholder="Descreva os ajustes que você fez na dieta..."
                      rows={2}
                      className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    {/* Botão Salvar (mostra antes de gerar feedback) */}
                    {!generatedFeedback && (
                      <Button
                        onClick={handleSaveAnnotations}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Salvar
                      </Button>
                    )}
                    <Button
                      onClick={handleGenerateFeedback}
                      disabled={isGenerating || !activeTemplate}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <MessageSquare className="h-3 w-3 mr-1" />
                      )}
                      {isGenerating ? 'Gerando...' : 'Gerar Feedback'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Gerado */}
              {generatedFeedback && (
                <Card className="bg-slate-800/30 border-slate-700/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-200">🤖 Feedback Gerado</h4>
                      <span className="text-xs text-slate-400 italic">Você pode editar o feedback antes de enviar</span>
                    </div>
                    
                    <Textarea
                      value={generatedFeedback}
                      onChange={(e) => setGeneratedFeedback(e.target.value)}
                      placeholder="O feedback gerado aparecerá aqui..."
                      rows={12}
                      className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 text-sm font-mono whitespace-pre-wrap"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleSaveAnnotations}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Salvar
                      </Button>
                      
                      <Button
                        onClick={handleCopyFeedback}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                      
                      <Button
                        onClick={handleOpenWhatsApp}
                        variant="outline"
                        size="sm"
                        className="text-green-400 border-green-600 hover:bg-green-900/20"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                      
                      <Button
                        onClick={handleMarkAsSent}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Marcar Enviado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};