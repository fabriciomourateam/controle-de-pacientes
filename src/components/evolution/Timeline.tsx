import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingDown, TrendingUp, Activity, Heart, Droplets, Moon, Target, AlertCircle, Edit } from "lucide-react";
import { EditCheckinModal } from "./EditCheckinModal";
import type { Database } from "@/integrations/supabase/types";

type Checkin = Database['public']['Tables']['checkin']['Row'];

interface TimelineProps {
  checkins: Checkin[];
  onCheckinUpdated?: () => void;
}

export function Timeline({ checkins, onCheckinUpdated }: TimelineProps) {
  const [editingCheckin, setEditingCheckin] = useState<Checkin | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // IMPORTANTE: checkins vem DESC (mais recente primeiro), vamos reverter
  const checkinsOrdenados = [...checkins].reverse();

  const handleEditClick = (checkin: Checkin) => {
    setEditingCheckin(checkin);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    if (onCheckinUpdated) {
      onCheckinUpdated();
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
      <Card className="bg-slate-800/40 border-slate-700/50">
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
    <Card className="bg-slate-800/40 border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5 text-blue-400" />
          Timeline de Evolução
        </CardTitle>
        <CardDescription className="text-slate-400">
          Histórico detalhado dos {checkins.length} check-ins realizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {checkinsOrdenados.map((checkin, index) => {
            const previousCheckin = index > 0 ? checkinsOrdenados[index - 1] : null;
            const weightTrend = getWeightTrend(checkin.peso, previousCheckin?.peso || null);
            const checkinDate = new Date(checkin.data_checkin);
            const isFirst = index === 0;
            const isLast = index === checkinsOrdenados.length - 1;

            return (
              <div key={checkin.id} className="relative pl-8 pb-6 border-l-2 border-blue-500/30 last:border-l-0 last:pb-0">
                {/* Marcador na timeline */}
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${
                  isFirst ? 'bg-blue-600 ring-4 ring-blue-600/20' : 
                  isLast ? 'bg-emerald-600 ring-4 ring-emerald-600/20' : 
                  'bg-slate-600'
                }`} />

                {/* Card do Check-in */}
                <div className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-lg p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all">
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                          {checkinDate.toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                          {isFirst && <Badge className="bg-blue-600/90 text-white">Inicial</Badge>}
                          {isLast && <Badge className="bg-emerald-600/90 text-white">Mais Recente</Badge>}
                        </h4>
                        <p className="text-slate-400 text-sm mt-1">
                          Check-in #{checkins.length - index}
                        </p>
                      </div>
                    </div>
                    
                    {/* Pontuação Total e Botão Editar */}
                    <div className="flex items-start gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(checkin)}
                        className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {checkin.total_pontuacao || 'N/A'}
                        </div>
                        <p className="text-xs text-slate-400">pontos totais</p>
                        {checkin.percentual_aproveitamento && (
                          <Badge className="mt-1 bg-purple-600/20 text-purple-300 border-purple-500/30">
                            {checkin.percentual_aproveitamento}% aproveitamento
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dados Físicos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Peso</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-white">{checkin.peso || 'N/A'}</p>
                        {checkin.peso && <span className="text-xs text-slate-400">kg</span>}
                        {weightTrend !== null && (
                          <div className={`flex items-center gap-1 text-xs ${
                            weightTrend < 0 ? 'text-emerald-400' : 'text-orange-400'
                          }`}>
                            {weightTrend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {Math.abs(weightTrend).toFixed(1)}kg
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Activity className="w-3 h-3 text-orange-400" />
                        <p className="text-xs text-slate-400">Treino</p>
                      </div>
                      <Badge className={getScoreColor(checkin.pontos_treinos)}>
                        {checkin.pontos_treinos || 'N/A'}
                      </Badge>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        <p className="text-xs text-slate-400">Cardio</p>
                      </div>
                      <Badge className={getScoreColor(checkin.pontos_cardios)}>
                        {checkin.pontos_cardios || 'N/A'}
                      </Badge>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Moon className="w-3 h-3 text-purple-400" />
                        <p className="text-xs text-slate-400">Sono</p>
                      </div>
                      <Badge className={getScoreColor(checkin.pontos_sono)}>
                        {checkin.pontos_sono || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  {/* Métricas Adicionais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Droplets className="w-3 h-3 text-blue-400" />
                        <p className="text-xs text-slate-400">Hidratação</p>
                      </div>
                      <Badge variant="outline" className={getScoreColor(checkin.pontos_agua)}>
                        {checkin.pontos_agua || 'N/A'}
                      </Badge>
                    </div>

                    <div className="bg-slate-800/50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Target className="w-3 h-3 text-amber-400" />
                        <p className="text-xs text-slate-400">Stress</p>
                      </div>
                      <Badge variant="outline" className={getScoreColor(checkin.pontos_stress)}>
                        {checkin.pontos_stress || 'N/A'}
                      </Badge>
                    </div>

                    <div className="bg-slate-800/50 p-2 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Libido</p>
                      <Badge variant="outline" className={getScoreColor(checkin.pontos_libido)}>
                        {checkin.pontos_libido || 'N/A'}
                      </Badge>
                    </div>

                    <div className="bg-slate-800/50 p-2 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Qualidade Sono</p>
                      <Badge variant="outline" className={getScoreColor(checkin.pontos_qualidade_sono)}>
                        {checkin.pontos_qualidade_sono || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  {/* Observações e Dificuldades */}
                  {(checkin.objetivo || checkin.dificuldades || checkin.melhora_visual) && (
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

                  {/* Fotos do Check-in */}
                  {(checkin.foto_1 || checkin.foto_2 || checkin.foto_3 || checkin.foto_4) && (
                    <div className="pt-3 mt-3 border-t border-slate-600/50">
                      <p className="text-xs text-slate-400 mb-2 font-semibold">Fotos do Check-in:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {checkin.foto_1 && (
                          <img src={checkin.foto_1} alt="Foto 1" className="w-full h-20 object-cover rounded border border-slate-600" />
                        )}
                        {checkin.foto_2 && (
                          <img src={checkin.foto_2} alt="Foto 2" className="w-full h-20 object-cover rounded border border-slate-600" />
                        )}
                        {checkin.foto_3 && (
                          <img src={checkin.foto_3} alt="Foto 3" className="w-full h-20 object-cover rounded border border-slate-600" />
                        )}
                        {checkin.foto_4 && (
                          <img src={checkin.foto_4} alt="Foto 4" className="w-full h-20 object-cover rounded border border-slate-600" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Modal de Edição */}
      <EditCheckinModal
        checkin={editingCheckin}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
}

