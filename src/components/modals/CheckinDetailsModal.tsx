import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Calendar, 
  Weight, 
  Dumbbell, 
  Heart, 
  Droplets, 
  Moon, 
  Utensils, 
  Target,
  TrendingUp,
  X
} from "lucide-react";
import type { CheckinWithPatient } from "@/lib/checkin-service";

interface CheckinDetailsModalProps {
  checkin: CheckinWithPatient | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckinDetailsModal({ checkin, isOpen, onClose }: CheckinDetailsModalProps) {
  if (!checkin) return null;

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (score >= 6) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getScoreText = (score: number | null) => {
    if (!score) return "N/A";
    if (score >= 8) return "Excelente";
    if (score >= 6) return "Bom";
    return "Precisa melhorar";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-blue-400" />
            Detalhes do Checkin
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Informações completas do checkin do paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Paciente */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-500/20 text-blue-400">
                    {checkin.patient?.nome?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-white">{checkin.patient?.nome || 'Paciente não informado'}</h3>
                  <p className="text-sm text-slate-400">
                    {checkin.patient?.apelido && `Apelido: ${checkin.patient.apelido}`}
                    {checkin.patient?.plano && ` • Plano: ${checkin.patient.plano}`}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Telefone</p>
                  <p className="font-medium text-white">{checkin.telefone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Data do Checkin</p>
                  <p className="font-medium text-white">
                    {checkin.data_checkin ? new Date(checkin.data_checkin).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Data de Preenchimento</p>
                  <p className="font-medium text-white">
                    {checkin.data_preenchimento ? new Date(checkin.data_preenchimento).toLocaleDateString('pt-BR') : 
                     checkin.data_checkin ? new Date(checkin.data_checkin).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Físicos */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Weight className="w-5 h-5 text-blue-400" />
                Dados Físicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <Weight className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm text-slate-400">Peso</p>
                  <p className="text-lg font-semibold text-white">{checkin.peso ? `${checkin.peso}kg` : 'N/A'}</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm text-slate-400">Aproveitamento</p>
                  <p className="text-lg font-semibold text-white">
                    {checkin.percentual_aproveitamento ? `${checkin.percentual_aproveitamento}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atividades e Exercícios */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                Atividades e Exercícios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Dumbbell className="w-4 h-4 text-orange-400" />
                    Treino
                  </h4>
                  <p className="text-sm text-slate-400 mb-2">Descrição:</p>
                  <p className="mb-4 text-slate-300">{checkin.treino || 'Não informado'}</p>
                  <p className="text-sm text-slate-400 mb-2">Pontos:</p>
                  <Badge className={getScoreColor(checkin.pontos_treinos)}>
                    {checkin.pontos_treinos || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Heart className="w-4 h-4 text-red-400" />
                    Cardio
                  </h4>
                  <p className="text-sm text-slate-400 mb-2">Descrição:</p>
                  <p className="mb-4 text-slate-300">{checkin.cardio || 'Não informado'}</p>
                  <p className="text-sm text-slate-400 mb-2">Pontos:</p>
                  <Badge className={getScoreColor(checkin.pontos_cardios)}>
                    {checkin.pontos_cardios || 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alimentação e Hidratação */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Utensils className="w-5 h-5 text-green-400" />
                Alimentação e Hidratação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    Hidratação
                  </h4>
                  <p className="text-sm text-slate-400 mb-2">Consumo de água:</p>
                  <p className="mb-4 text-slate-300">{checkin.agua || 'Não informado'}</p>
                  <p className="text-sm text-slate-400 mb-2">Pontos:</p>
                  <Badge className={getScoreColor(checkin.pontos_agua)}>
                    {checkin.pontos_agua || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Utensils className="w-4 h-4 text-green-400" />
                    Refeição Livre
                  </h4>
                  <p className="text-sm text-slate-400 mb-2">Quantidade:</p>
                  <p className="mb-2 text-slate-300">{checkin.ref_livre || 'Não informado'}</p>
                  <p className="text-sm text-slate-400 mb-2">O que comeu:</p>
                  <p className="mb-4 text-slate-300">{checkin.oq_comeu_ref_livre || 'Não informado'}</p>
                  <p className="text-sm text-slate-400 mb-2">Pontos:</p>
                  <Badge className={getScoreColor(checkin.pontos_refeicao_livre)}>
                    {checkin.pontos_refeicao_livre || 'N/A'}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-white">Beliscos</h4>
                  <p className="text-sm text-slate-400 mb-2">Quantidade:</p>
                  <p className="mb-2 text-slate-300">{checkin.beliscos || 'Não informado'}</p>
                  <p className="text-sm text-slate-400 mb-2">O que beliscou:</p>
                  <p className="mb-4 text-slate-300">{checkin.oq_beliscou || 'Não informado'}</p>
                  <p className="text-sm text-slate-400 mb-2">Pontos:</p>
                  <Badge className={getScoreColor(checkin.pontos_beliscos)}>
                    {checkin.pontos_beliscos || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-white">Outras Informações</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Comeu menos que o planejado:</p>
                      <p className="text-sm text-slate-300">{checkin.comeu_menos || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Fome em algum horário:</p>
                      <p className="text-sm text-slate-300">{checkin.fome_algum_horario || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Alimento para incluir:</p>
                      <p className="text-sm text-slate-300">{checkin.alimento_para_incluir || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sono e Bem-estar */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Moon className="w-5 h-5 text-purple-400" />
                Sono e Bem-estar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <Moon className="w-4 h-4 text-purple-400" />
                    Sono
                  </h4>
                  <p className="text-sm text-slate-400 mb-2">Descrição:</p>
                  <p className="mb-4 text-slate-300">{checkin.sono || 'Não informado'}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Pontos sono:</span>
                      <Badge className={getScoreColor(checkin.pontos_sono)}>
                        {checkin.pontos_sono || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Qualidade do sono:</span>
                      <Badge className={getScoreColor(checkin.pontos_qualidade_sono)}>
                        {checkin.pontos_qualidade_sono || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-white">Stress e Libido</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Stress:</p>
                      <p className="text-sm mb-2 text-slate-300">{checkin.stress || 'Não informado'}</p>
                      <Badge className={getScoreColor(checkin.pontos_stress)}>
                        {checkin.pontos_stress || 'N/A'} pts
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Libido:</p>
                      <p className="text-sm mb-2 text-slate-300">{checkin.libido || 'Não informado'}</p>
                      <Badge className={getScoreColor(checkin.pontos_libido)}>
                        {checkin.pontos_libido || 'N/A'} pts
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objetivos e Observações */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-amber-400" />
                Objetivos e Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-white">Objetivo</h4>
                  <p className="text-sm text-slate-300">{checkin.objetivo || 'Não informado'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-white">Dificuldades</h4>
                  <p className="text-sm text-slate-300">{checkin.dificuldades || 'Não informado'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-white">Melhora Visual</h4>
                  <p className="text-sm text-slate-300">{checkin.melhora_visual || 'Não informado'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-white">Quais Pontos</h4>
                  <p className="text-sm text-slate-300">{checkin.quais_pontos || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pontuação Total */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Pontuação Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {checkin.total_pontuacao || 'N/A'}
                </div>
                <p className="text-lg text-slate-400 mb-4">Pontos Totais</p>
                <Badge 
                  variant="outline" 
                  className={`text-lg px-4 py-2 ${getScoreColor(checkin.total_pontuacao)}`}
                >
                  {getScoreText(checkin.total_pontuacao)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline" className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white">
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
