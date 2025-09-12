import { Users, DollarSign, Calendar } from "lucide-react";
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
import { usePatients } from "@/hooks/use-supabase-data";

interface PlanDetailsModalProps {
  plan: any;
  open: boolean;
  onClose: () => void;
  onEdit?: (plan: any) => void;
}

export function PlanDetailsModal({ plan, open, onClose, onEdit }: PlanDetailsModalProps) {
  const { patients } = usePatients();
  
  if (!plan) return null;

  // Função para formatar valores monetários com 2 casas decimais
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtrar pacientes que têm este plano
  const patientsWithPlan = patients.filter(p => p.plano === plan.name);
  const patientsCount = patientsWithPlan.length;
  
  // Calcular estatísticas reais
  const totalValue = patientsWithPlan.reduce((sum, p) => sum + (p.valor || 0), 0);
  const avgValue = patientsCount > 0 ? totalValue / patientsCount : 0;
  
  // Calcular ticket médio
  const patientsWithTicketMedio = patientsWithPlan.filter(p => p.ticket_medio && p.ticket_medio > 0);
  const ticketMedio = patientsWithTicketMedio.length > 0 
    ? patientsWithTicketMedio.reduce((sum, p) => sum + p.ticket_medio, 0) / patientsWithTicketMedio.length 
    : 0;


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            {plan.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Detalhes completos do plano de acompanhamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg">Informações do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome do Plano</label>
                  <p className="mt-1 text-sm font-medium text-foreground">{plan.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="mt-1 text-sm text-foreground">{plan.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{patientsCount}</p>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-success" />
                  <p className="text-xl font-bold text-foreground">
                    R$ {formatCurrency(avgValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Valor Médio</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg border border-gold/20">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-gold" />
                  <p className="text-xl font-bold text-gold">
                    R$ {formatCurrency(totalValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xl font-bold text-blue-500">
                    {ticketMedio > 0 ? `R$ ${formatCurrency(ticketMedio)}` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ticket Médio {patientsWithTicketMedio.length > 0 ? `(${patientsWithTicketMedio.length})` : '(sem dados)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pacientes */}
          {patientsCount > 0 && (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg">Pacientes Associados</CardTitle>
                <CardDescription>
                  {patientsCount} paciente{patientsCount !== 1 ? 's' : ''} usando este plano
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {patientsWithPlan.map(patient => (
                    <div key={patient.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{patient.nome || 'Nome não informado'}</p>
                        <p className="text-sm text-muted-foreground">{patient.telefone || 'Telefone não informado'}</p>
                        {patient.email && (
                          <p className="text-xs text-muted-foreground">{patient.email}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          R$ {formatCurrency(patient.valor || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {patient.ticket_medio ? `Ticket: R$ ${formatCurrency(patient.ticket_medio)}` : 'Sem ticket médio'}
                        </div>
                        {patient.dias_para_vencer !== null && (
                          <Badge variant={patient.dias_para_vencer > 0 ? "default" : "destructive"} className="mt-1">
                            {patient.dias_para_vencer > 0
                              ? `${patient.dias_para_vencer} dias restantes`
                              : `${Math.abs(patient.dias_para_vencer)} dias atrasado`
                            }
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {onEdit && (
            <Button className="btn-premium" onClick={() => onEdit(plan)}>
              Editar Plano
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
