import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingDown, TrendingUp, Activity, Heart, Droplets, Moon, Target, AlertCircle, Edit, Weight, Flame, BedDouble, ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";
import { EditCheckinModal } from "./EditCheckinModal";
import { AddPhotosToCheckin } from "./AddPhotosToCheckin";
import { getMediaType } from "@/lib/media-utils";
import { convertGoogleDriveUrl } from "@/lib/google-drive-utils";
import { motion, AnimatePresence } from "framer-motion";
import { extractMeasurements } from "@/lib/measurement-utils";
import { checkinService } from "@/lib/checkin-service";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type Checkin = Database['public']['Tables']['checkin']['Row'];

interface TimelineProps {
  checkins: Checkin[];
  onCheckinUpdated?: () => void;
  showEditButton?: boolean; // Controla se mostra o botão de editar
}

export function Timeline({ checkins, onCheckinUpdated, showEditButton = true }: TimelineProps) {
  const [editingCheckin, setEditingCheckin] = useState<Checkin | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(true);
  const [checkinToDelete, setCheckinToDelete] = useState<Checkin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // IMPORTANTE: checkins vem DESC (mais recente primeiro), mantemos essa ordem
  const checkinsOrdenados = [...checkins];

  const toggleCard = (checkinId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(checkinId)) {
        newSet.delete(checkinId);
      } else {
        newSet.add(checkinId);
      }
      return newSet;
    });
  };

  const handleEditClick = (checkin: Checkin) => {
    setEditingCheckin(checkin);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    if (onCheckinUpdated) {
      onCheckinUpdated();
    }
  };

  const handleDeleteClick = (checkin: Checkin) => {
    setCheckinToDelete(checkin);
  };

  const handleDeleteConfirm = async () => {
    console.log('🗑️ handleDeleteConfirm CHAMADO');
    
    if (!checkinToDelete) {
      console.log('❌ checkinToDelete é null, abortando');
      return;
    }

    console.log('🗑️ Tentando deletar checkin:', {
      id: checkinToDelete.id,
      data: checkinToDelete.data_checkin,
      telefone: checkinToDelete.telefone
    });

    setIsDeleting(true);
    try {
      console.log('🗑️ Chamando checkinService.delete...');
      await checkinService.delete(checkinToDelete.id);
      console.log('✅ Check-in deletado com sucesso no banco');
      
      toast.success('Check-in deletado com sucesso');
      setCheckinToDelete(null);
      
      if (onCheckinUpdated) {
        console.log('🔄 Chamando onCheckinUpdated para recarregar dados...');
        onCheckinUpdated();
      } else {
        console.log('⚠️ onCheckinUpdated não está definido');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar check-in:', error);
      toast.error('Erro ao deletar check-in. Tente novamente.');
    } finally {
      setIsDeleting(false);
      console.log('🗑️ handleDeleteConfirm FINALIZADO');
    }
  };

  const getScoreColor = (score: string | null) => {
    if (!score) return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    const numScore = parseFloat(score);
    if (numScore >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (numScore >= 6) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getWeightTrend = (currentWeight: string | null, previousWeight: string | null) => {
    if (!currentWeight || !previousWeight) return null;
    const diff = parseFloat(currentWeight) - parseFloat(previousWeight);
    if (Math.abs(diff) < 0.1) return null;
    return diff;
  };

  if (checkins.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-blue-400" />
            Timeline de Evolução
          </CardTitle>
          <CardDescription className="text-slate-400">
            Histórico detalhado dos check-ins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Nenhum check-in registrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-blue-400" />
              Timeline de Evolução
            </CardTitle>
            <CardDescription className="text-slate-400">
              Histórico detalhado dos {checkins.length} check-ins realizados
            </CardDescription>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center justify-center"
            aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? (
              <ChevronDown className="w-5 h-5 text-slate-300" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent>
        <div className="space-y-6">
          {checkinsOrdenados.map((checkin, index) => {
            const previousCheckin = index > 0 ? checkinsOrdenados[index - 1] : null;
            const weightTrend = getWeightTrend(checkin.peso, previousCheckin?.peso || null);
            // Corrigir problema de timezone - usar data local sem conversão
            const checkinDate = new Date(checkin.data_checkin + 'T00:00:00');
            const isFirst = index === 0;
            const isLast = index === checkinsOrdenados.length - 1;
            const isExpanded = expandedCards.has(checkin.id);

            return (
              <div key={checkin.id} className="relative pl-8 pb-6 border-l-2 border-blue-500/30 last:border-l-0 last:pb-0">
                {/* Marcador na timeline */}
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${
                  isFirst ? 'bg-blue-600 ring-4 ring-blue-600/20' : 
                  isLast ? 'bg-emerald-600 ring-4 ring-emerald-600/20' : 
                  'bg-slate-600'
                }`} />

                {/* Card do Check-in */}
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-slate-600/50 hover:border-slate-500/50 transition-all">
                  {/* Cabeçalho */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <h4 className="text-white font-semibold text-base flex items-center gap-2 flex-wrap">
                          {checkinDate.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                          {index === 0 && <Badge className="bg-emerald-600/90 text-white text-xs">Mais Recente</Badge>}
                          {index === checkinsOrdenados.length - 1 && <Badge className="bg-blue-600/90 text-white text-xs">Inicial</Badge>}
                          {checkin.tipo_checkin === 'inicial' && <Badge className="bg-purple-600/90 text-white text-xs">Dados Iniciais</Badge>}
                          {checkin.tipo_checkin === 'evolucao' && <Badge className="bg-cyan-600/90 text-white text-xs">Evolução</Badge>}
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Check-in #{checkins.length - index}
                        </p>
                      </div>
                    </div>
                    
                    {/* Pontuação Total e Botões */}
                    <div className="flex items-start gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleCard(checkin.id)}
                        className="bg-slate-700/30 hover:bg-slate-600/50 text-slate-300 hover:text-white flex-shrink-0 px-2 h-7"
                        title={isExpanded ? "Minimizar" : "Expandir"}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                      {showEditButton && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(checkin)}
                            className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white flex-shrink-0 h-7 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <AddPhotosToCheckin
                            checkinId={checkin.id}
                            checkinDate={checkin.data_checkin}
                            onSuccess={handleEditSuccess}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(checkin)}
                            className="bg-red-900/30 border-red-700/50 hover:bg-red-900/50 text-red-300 hover:text-red-200 flex-shrink-0 h-7"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      <div className="flex flex-col items-end flex-1 sm:flex-initial">
                        <div className="text-xl font-bold text-white">
                          {checkin.total_pontuacao || 'N/A'}
                        </div>
                        <p className="text-[10px] text-slate-400 whitespace-nowrap">pontos totais</p>
                        {checkin.percentual_aproveitamento && (
                          <Badge className="mt-0.5 bg-purple-600/20 text-purple-300 border-purple-500/30 whitespace-nowrap text-xs py-0">
                            {checkin.percentual_aproveitamento}% aproveitamento
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dados Físicos e Métricas - Grid fixo de 10 colunas para alinhamento perfeito */}
                  <div className="grid grid-cols-10 gap-2">
                    {/* Peso */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <Weight className="w-4 h-4 text-slate-400" />
                        <p className="text-xs text-slate-400 leading-none">Peso</p>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-lg font-bold text-white leading-none">{checkin.peso || 'N/A'}</p>
                        {checkin.peso && <span className="text-[10px] text-slate-500 mt-0.5">kg</span>}
                        {weightTrend !== null && (
                          <div className={`flex items-center gap-0.5 text-[10px] mt-1 ${
                            weightTrend < 0 ? 'text-emerald-400' : 'text-orange-400'
                          }`}>
                            {weightTrend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                            {Math.abs(weightTrend).toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cintura */}
                    {(() => {
                      const measurements = checkin.medida ? extractMeasurements(checkin.medida) : { cintura: null, quadril: null };
                      return (
                        <div className="bg-slate-800/50 p-2.5 rounded">
                          <div className="flex items-center gap-0.5 mb-1">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <p className="text-xs text-slate-400 leading-none">Cintura</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-lg font-bold text-white leading-none">{measurements.cintura || 'N/A'}</p>
                            {measurements.cintura && <span className="text-[10px] text-slate-500 mt-0.5">cm</span>}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quadril */}
                    {(() => {
                      const measurements = checkin.medida ? extractMeasurements(checkin.medida) : { cintura: null, quadril: null };
                      return (
                        <div className="bg-slate-800/50 p-2.5 rounded">
                          <div className="flex items-center gap-0.5 mb-1">
                            <Target className="w-4 h-4 text-teal-400" />
                            <p className="text-xs text-slate-400 leading-none">Quadril</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-lg font-bold text-white leading-none">{measurements.quadril || 'N/A'}</p>
                            {measurements.quadril && <span className="text-[10px] text-slate-500 mt-0.5">cm</span>}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Treino */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <Activity className="w-4 h-4 text-orange-400" />
                        <p className="text-xs text-slate-400 leading-none">Treino</p>
                      </div>
                      <Badge className={`${getScoreColor(checkin.pontos_treinos)} text-sm py-1 px-2 h-7`}>
                        {checkin.pontos_treinos || 'N/A'}
                      </Badge>
                    </div>

                    {/* Cardio */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <Heart className="w-4 h-4 text-red-400" />
                        <p className="text-xs text-slate-400 leading-none">Cardio</p>
                      </div>
                      <Badge className={`${getScoreColor(checkin.pontos_cardios)} text-sm py-1 px-2 h-7`}>
                        {checkin.pontos_cardios || 'N/A'}
                      </Badge>
                    </div>

                    {/* Sono */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <Moon className="w-4 h-4 text-purple-400" />
                        <p className="text-xs text-slate-400 leading-none">Sono</p>
                      </div>
                      <Badge className={`${getScoreColor(checkin.pontos_sono)} text-sm py-1 px-2 h-7`}>
                        {checkin.pontos_sono || 'N/A'}
                      </Badge>
                    </div>

                    {/* Hidratação */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-slate-400 leading-none">Água</p>
                      </div>
                      <Badge variant="outline" className={`${getScoreColor(checkin.pontos_agua)} text-sm py-1 px-2 h-7`}>
                        {checkin.pontos_agua || 'N/A'}
                      </Badge>
                    </div>

                    {/* Stress */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <Target className="w-4 h-4 text-amber-400" />
                        <p className="text-xs text-slate-400 leading-none">Stress</p>
                      </div>
                      <Badge variant="outline" className={`${getScoreColor(checkin.pontos_stress)} text-sm py-1 px-2 h-7`}>
                        {checkin.pontos_stress || 'N/A'}
                      </Badge>
                    </div>

                    {/* Libido */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <Flame className="w-4 h-4 text-pink-400" />
                        <p className="text-xs text-slate-400 leading-none">Libido</p>
                      </div>
                      <Badge variant="outline" className={`${getScoreColor(checkin.pontos_libido)} text-sm py-1 px-2 h-7`}>
                        {checkin.pontos_libido || 'N/A'}
                      </Badge>
                    </div>

                    {/* Qualidade Sono */}
                    <div className="bg-slate-800/50 p-2.5 rounded">
                      <div className="flex items-center gap-0.5 mb-1">
                        <BedDouble className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs text-slate-400 leading-none">Qual.Sono</p>
                      </div>
                      <Badge variant="outline" className={`${getScoreColor(checkin.pontos_qualidade_sono)} text-sm py-1 px-2 h-7`}>
                        {checkin.pontos_qualidade_sono || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  {/* Observações e Dificuldades - Apenas quando expandido */}
                  {isExpanded && (checkin.objetivo || checkin.dificuldades || checkin.melhora_visual) && (
                    <div className="space-y-2 pt-3 border-t border-slate-600/50">
                      {checkin.objetivo && (
                        <div className="bg-slate-800/30 p-2 rounded">
                          <p className="text-xs text-slate-400 mb-1 font-semibold flex items-center gap-1">
                            <Target className="w-3 h-3" /> Objetivo:
                          </p>
                          <p className="text-sm text-slate-300">{checkin.objetivo}</p>
                        </div>
                      )}
                      
                      {checkin.dificuldades && (
                        <div className="bg-orange-900/20 p-2 rounded border border-orange-700/30">
                          <p className="text-xs text-orange-400 mb-1 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Dificuldades:
                          </p>
                          <p className="text-sm text-slate-300">{checkin.dificuldades}</p>
                        </div>
                      )}

                      {checkin.melhora_visual && (
                        <div className="bg-emerald-900/20 p-2 rounded border border-emerald-700/30">
                          <p className="text-xs text-emerald-400 mb-1 font-semibold">Melhora Visual:</p>
                          <p className="text-sm text-slate-300">{checkin.melhora_visual}</p>
                          {checkin.quais_pontos && (
                            <p className="text-xs text-emerald-300 mt-1">• {checkin.quais_pontos}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fotos/Vídeos do Check-in - Apenas quando expandido */}
                  {isExpanded && (checkin.foto_1 || checkin.foto_2 || checkin.foto_3 || checkin.foto_4) && (
                    <div className="pt-3 mt-3 border-t border-slate-600/50">
                      <p className="text-xs text-slate-400 mb-2 font-semibold">Mídia do Check-in:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {checkin.foto_1 && (() => {
                          const isVideo = getMediaType(checkin.foto_1) === 'video';
                          const mediaUrl = checkin.foto_1.includes('drive.google.com') 
                            ? convertGoogleDriveUrl(checkin.foto_1, isVideo) 
                            : checkin.foto_1;
                          
                          return (
                            <div key={`media-1-${checkin.id}`}>
                              {isVideo ? (
                                <video 
                                  src={mediaUrl || checkin.foto_1} 
                                  controls 
                                  className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors"
                                />
                              ) : (
                                <img src={mediaUrl || checkin.foto_1} alt="Foto 1" loading="lazy" className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors cursor-pointer" />
                              )}
                            </div>
                          );
                        })()}
                        {checkin.foto_2 && (() => {
                          const isVideo = getMediaType(checkin.foto_2) === 'video';
                          const mediaUrl = checkin.foto_2.includes('drive.google.com') 
                            ? convertGoogleDriveUrl(checkin.foto_2, isVideo) 
                            : checkin.foto_2;
                          return (
                            <div key={`media-2-${checkin.id}`}>
                              {isVideo ? (
                                <video 
                                  src={mediaUrl || checkin.foto_2} 
                                  controls 
                                  className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors"
                                />
                              ) : (
                                <img src={mediaUrl || checkin.foto_2} alt="Foto 2" loading="lazy" className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors cursor-pointer" />
                              )}
                            </div>
                          );
                        })()}
                        {checkin.foto_3 && (() => {
                          const isVideo = getMediaType(checkin.foto_3) === 'video';
                          const mediaUrl = checkin.foto_3.includes('drive.google.com') 
                            ? convertGoogleDriveUrl(checkin.foto_3, isVideo) 
                            : checkin.foto_3;
                          return (
                            <div key={`media-3-${checkin.id}`}>
                              {isVideo ? (
                                <video 
                                  src={mediaUrl || checkin.foto_3} 
                                  controls 
                                  className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors"
                                />
                              ) : (
                                <img src={mediaUrl || checkin.foto_3} alt="Foto 3" loading="lazy" className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors cursor-pointer" />
                              )}
                            </div>
                          );
                        })()}
                        {checkin.foto_4 && (() => {
                          const isVideo = getMediaType(checkin.foto_4) === 'video';
                          const mediaUrl = checkin.foto_4.includes('drive.google.com') 
                            ? convertGoogleDriveUrl(checkin.foto_4, isVideo) 
                            : checkin.foto_4;
                          return (
                            <div key={`media-4-${checkin.id}`}>
                              {isVideo ? (
                                <video 
                                  src={mediaUrl || checkin.foto_4} 
                                  controls 
                                  className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors"
                                />
                              ) : (
                                <img src={mediaUrl || checkin.foto_4} alt="Foto 4" loading="lazy" className="w-full h-80 object-contain bg-slate-900/50 rounded border border-slate-600 hover:border-blue-500 transition-colors cursor-pointer" />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edição */}
      <EditCheckinModal
        checkin={editingCheckin}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!checkinToDelete} onOpenChange={(open) => !open && setCheckinToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Tem certeza que deseja deletar o check-in de{' '}
              <strong className="text-white">
                {checkinToDelete 
                  ? new Date(checkinToDelete.data_checkin + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  : ''
                }
              </strong>?
              <br />
              <span className="text-red-400 mt-2 block">
                ⚠️ Esta ação não pode ser desfeita e o check-in será removido de todos os locais onde aparece.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

