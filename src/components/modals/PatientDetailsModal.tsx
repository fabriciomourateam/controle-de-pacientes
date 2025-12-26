import { useState } from "react";
import { Users, Phone, Calendar, Clock, MessageSquare, Edit, RefreshCw, Activity } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { usePlans, useFeedbacks } from "@/hooks/use-supabase-data";
import { usePatientCheckins } from "@/hooks/use-checkin-data";

interface PatientDetailsModalProps {
  patient: any;
  open: boolean;
  onClose: () => void;
  onEdit?: (patient: any) => void;
  onRenewPlan?: (patient: any) => void;
}

export function PatientDetailsModal({ patient, open, onClose, onEdit, onRenewPlan }: PatientDetailsModalProps) {
  const { plans } = usePlans();
  const { feedbacks = [] } = useFeedbacks();
  const { data: patientCheckins = [], isLoading: checkinsLoading } = usePatientCheckins(patient?.telefone || '');
  
  if (!patient) return null;

  const plan = plans.find(p => p.id === patient.plan_id);
  const patientFeedbacks = feedbacks
    .filter(f => f.telefone === patient.telefone)
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

  const getStatusBadge = (daysToExpiration: number) => {
    if (daysToExpiration < 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (daysToExpiration <= 7) {
      return <Badge variant="destructive">Urgente</Badge>;
    }
    if (daysToExpiration <= 30) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Atenção</Badge>;
    }
    return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            {patient.nome || 'Paciente'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Informações detalhadas do paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-lg">
                    {patient.nome?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <p className="text-lg font-semibold">{patient.nome || 'Não informado'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <p className="text-sm">{patient.telefone || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{patient.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CPF</label>
                      <p className="text-sm">{patient.cpf || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Apelido</label>
                      <p className="text-sm">{patient.apelido || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gênero</label>
                      <p className="text-sm">{patient.genero || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                      <p className="text-sm">{patient.data_nascimento ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(patient.dias_para_vencer || 0)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Plano */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Plano de Acompanhamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Plano</label>
                  <p className="font-semibold">{patient.plano || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className="font-semibold">{patient.valor ? `R$ ${patient.valor}` : 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tempo de Acompanhamento</label>
                  <p className="font-semibold">{patient.tempo_acompanhamento ? `${patient.tempo_acompanhamento} dias` : 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ticket Médio</label>
                  <p className="font-semibold">{patient.ticket_medio ? `R$ ${patient.ticket_medio}` : 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pagamento</label>
                  <p className="font-semibold">{patient.pagamento || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rescisão 30%</label>
                  <p className="font-semibold">{patient.rescisao_30_percent ? `R$ ${patient.rescisao_30_percent}` : 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas Importantes */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Datas Importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Vencimento</label>
                  <p className="font-semibold">{patient.vencimento ? new Date(patient.vencimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dias para Vencer</label>
                  <p className="font-semibold">{patient.dias_para_vencer !== null ? `${patient.dias_para_vencer} dias` : 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Início do Acompanhamento</label>
                  <p className="font-semibold">{patient.inicio_acompanhamento ? new Date(patient.inicio_acompanhamento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                  <p className="font-semibold">{patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Acompanhamento */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Informações de Acompanhamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-sm">{patient.observacao || 'Nenhuma observação'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Indicações</label>
                  <p className="text-sm">{patient.indicacoes || 'Nenhuma indicação'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lembrete</label>
                  <p className="text-sm">{patient.lembrete || 'Nenhum lembrete'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone (Filtro)</label>
                  <p className="text-sm">{patient.telefone_filtro || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Físicas */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Informações Físicas
              </CardTitle>
              <CardDescription className="text-slate-400">
                Dados do cadastro e dos checkins mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dados do cadastro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Peso {patientCheckins.length > 0 ? '(Último Checkin)' : '(Cadastro)'}
                  </label>
                  <p className="font-semibold">
                    {patientCheckins.length > 0 && patientCheckins[0].peso 
                      ? `${patientCheckins[0].peso} kg` 
                      : patient.peso 
                        ? `${patient.peso} kg` 
                        : 'Não informado'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Objetivo {patientCheckins.length > 0 ? '(Último Checkin)' : '(Cadastro)'}
                  </label>
                  <p className="font-semibold">
                    {patientCheckins.length > 0 && patientCheckins[0].objetivo 
                      ? patientCheckins[0].objetivo
                      : patient.objetivo 
                        ? patient.objetivo
                        : 'Não informado'
                    }
                  </p>
                </div>
              </div>

              {/* Dados dos checkins mais recentes */}
              {patientCheckins.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Dados dos Checkins Recentes</h4>
                    <div className="space-y-3">
                      {patientCheckins.slice(0, 3).map((checkin, index) => (
                        <div key={checkin.id} className="p-3 bg-background/30 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Checkin #{patientCheckins.length - index}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {checkin.peso && (
                              <div>
                                <span className="text-muted-foreground">Peso: </span>
                                <span className="font-medium">{checkin.peso} kg</span>
                              </div>
                            )}
                            {checkin.medida && (
                              <div>
                                <span className="text-muted-foreground">Medida: </span>
                                <span className="font-medium">{checkin.medida} cm</span>
                              </div>
                            )}
                            {checkin.total_pontuacao && (
                              <div>
                                <span className="text-muted-foreground">Pontos: </span>
                                <span className="font-medium">{checkin.total_pontuacao}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Checkins */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Histórico de Checkins
              </CardTitle>
              <CardDescription className="text-slate-400">
                {patientCheckins.length} checkin{patientCheckins.length !== 1 ? 's' : ''} registrado{patientCheckins.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkinsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" />
                  <span className="text-muted-foreground">Carregando checkins...</span>
                </div>
              ) : patientCheckins.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {patientCheckins.map((checkin, index) => (
                    <div key={checkin.id} className="p-3 bg-background/50 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Checkin #{patientCheckins.length - index}
                            </Badge>
                            {checkin.total_pontuacao && (
                              <Badge variant="secondary" className="text-xs">
                                {checkin.total_pontuacao} pontos
                              </Badge>
                            )}
                            {checkin.percentual_aproveitamento && (
                              <Badge 
                                variant={checkin.percentual_aproveitamento >= 70 ? "default" : "destructive"} 
                                className="text-xs"
                              >
                                {checkin.percentual_aproveitamento}%
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                            {checkin.peso && (
                              <span>Peso: {checkin.peso}kg</span>
                            )}
                            {checkin.medida && (
                              <span>Medida: {checkin.medida}cm</span>
                            )}
                            {checkin.treino && (
                              <span>Treino: {checkin.treino}</span>
                            )}
                            {checkin.cardio && (
                              <span>Cardio: {checkin.cardio}</span>
                            )}
                            {checkin.agua && (
                              <span>Água: {checkin.agua}</span>
                            )}
                            {checkin.sono && (
                              <span>Sono: {checkin.sono}</span>
                            )}
                          </div>
                          {(checkin.objetivo || checkin.dificuldades || checkin.melhora_visual) && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              {checkin.objetivo && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Objetivo:</span> {checkin.objetivo}
                                </p>
                              )}
                              {checkin.dificuldades && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Dificuldades:</span> {checkin.dificuldades}
                                </p>
                              )}
                              {checkin.melhora_visual && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Melhora Visual:</span> {checkin.melhora_visual}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-muted-foreground">
                            {checkin.data_preenchimento 
                              ? new Date(checkin.data_preenchimento).toLocaleDateString('pt-BR')
                              : patientCheckins[0]?.data_preenchimento
                                ? new Date(patientCheckins[0].data_preenchimento).toLocaleDateString('pt-BR')
                                : patientCheckins[0]?.created_at
                                  ? new Date(patientCheckins[0].created_at).toLocaleDateString('pt-BR')
                                  : 'Data não informada'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum checkin registrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {onRenewPlan && (
            <Button 
              variant="outline" 
              onClick={() => onRenewPlan(patient)}
              className="hover-gold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Renovar Plano
            </Button>
          )}
          {onEdit && (
            <Button className="btn-premium" onClick={() => onEdit(patient)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Paciente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
