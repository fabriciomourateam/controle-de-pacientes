import { useState } from "react";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  Phone,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  Download,
  MessageSquare,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePatients, usePlans, useFeedbacks } from "@/hooks/use-supabase-data";
import { TableRowSkeleton } from "@/components/ui/loading-skeleton";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";
import { PatientForm } from "@/components/forms/PatientForm";
import { PatientDetailsModal } from "@/components/modals/PatientDetailsModal";
import { RenewPlanModal } from "@/components/modals/RenewPlanModal";
import { useToast } from "@/hooks/use-toast";

export function PatientsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRenewPlan, setShowRenewPlan] = useState(false);
  const { toast } = useToast();

  // Hooks para dados do Supabase
  const { patients, loading: patientsLoading, createPatient, updatePatient, deletePatient, refetch: refetchPatients } = usePatients();
  const { plans, loading: plansLoading } = usePlans();
  const { feedbacks, loading: feedbacksLoading } = useFeedbacks();

  // Função para obter o status do paciente
  const getPatientStatus = (daysToExpiration: number) => {
    if (daysToExpiration < 0) return "expired";
    if (daysToExpiration <= 7) return "urgent";
    if (daysToExpiration <= 30) return "warning";
    return "active";
  };

  // Função para obter o último feedback
  const getLastFeedback = (patientId: string) => {
    const patientFeedbacks = feedbacks
      .filter(f => f.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    
    return patientFeedbacks[0] || null;
  };

  // Funções para manipular pacientes
  const handleSavePatient = async (patientData: any) => {
    try {
      if (patientData.id) {
        await updatePatient(patientData.id, patientData);
        toast({
          title: "Sucesso",
          description: "Paciente atualizado com sucesso!",
        });
      } else {
        await createPatient(patientData);
        toast({
          title: "Sucesso",
          description: "Paciente criado com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o paciente.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      setDeletingId(patientId);
      await deletePatient(patientId);
      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o paciente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetails = (patient: any) => {
    setSelectedPatient(patient);
    setShowDetails(true);
  };

  const handleRenewPlan = (patient: any) => {
    setSelectedPatient(patient);
    setShowRenewPlan(true);
  };

  const handleRenewPlanSuccess = (patientId: string, data: any) => {
    toast({
      title: "Sucesso",
      description: "Plano renovado com sucesso!",
    });
    refetchPatients();
  };

  // Filtrar pacientes
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = (patient.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.telefone || '').includes(searchTerm) ||
                         (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = selectedPlan === "all" || patient.plano === selectedPlan;
    
    const status = getPatientStatus(patient.dias_para_vencer || 0);
    const matchesStatus = selectedStatus === "all" || status === selectedStatus;
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getStatusBadge = (daysToExpiration: number) => {
    const status = getPatientStatus(daysToExpiration);
    
    switch (status) {
      case "expired":
        return <Badge className="status-danger">Expirado</Badge>;
      case "urgent":
        return <Badge className="status-danger">{daysToExpiration}d restantes</Badge>;
      case "warning":
        return <Badge className="status-warning">{daysToExpiration}d restantes</Badge>;
      default:
        return <Badge className="status-active">{daysToExpiration}d restantes</Badge>;
    }
  };



  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
            <p className="text-muted-foreground">
              Gerencie todos os seus pacientes e acompanhamentos
            </p>
          </div>
          <PatientForm
            trigger={
              <Button className="btn-premium">
                <Plus className="w-4 h-4 mr-2" />
                Novo Paciente
              </Button>
            }
            onSave={handleSavePatient}
          />
        </div>

        {/* Filtros e Busca */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-premium"
                />
              </div>
              
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-full md:w-48 input-premium">
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  {Array.from(new Set(patients.map(p => p.plano).filter(Boolean))).map(plano => (
                    <SelectItem key={plano} value={plano}>
                      {plano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-48 input-premium">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="warning">Expirando</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filtros avançados</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exportar lista</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Pacientes */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Pacientes ({filteredPatients.length})</span>
              <Button variant="outline" size="sm" onClick={refetchPatients}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todos os pacientes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface/50">
                    <TableHead>Paciente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  ) : (
                    filteredPatients.map((patient) => {
                      const lastFeedback = getLastFeedback(patient.id);
                      
                      return (
                        <TableRow key={patient.id} className="hover:bg-surface/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {(patient.nome || 'P').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{patient.nome || 'Nome não informado'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {patient.apelido && `"${patient.apelido}"`}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{patient.telefone || 'Não informado'}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <span className="text-sm">{patient.email || 'Não informado'}</span>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline" className="bg-surface">
                              {patient.plano || 'Plano não definido'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            {getStatusBadge(patient.dias_para_vencer || 0)}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {patient.vencimento ? (
                                <div>
                                  <div className="font-medium">
                                    {new Date(patient.vencimento).toLocaleDateString('pt-BR')}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {patient.dias_para_vencer !== null ? (
                                      patient.dias_para_vencer > 0 ? 
                                        `${patient.dias_para_vencer} dias restantes` :
                                        `${Math.abs(patient.dias_para_vencer)} dias atrasado`
                                    ) : (
                                      'Data não calculada'
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Não definida</span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {patient.tempo_acompanhamento ? (
                                <span>{patient.tempo_acompanhamento} meses</span>
                              ) : (
                                <span className="text-muted-foreground">Não definida</span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {patient.peso ? (
                                <span>{patient.peso} kg</span>
                              ) : (
                                <span className="text-muted-foreground">Não informado</span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm max-w-32 truncate">
                              {patient.objetivo || 'Não definido'}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuItem onClick={() => handleViewDetails(patient)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(patient)}>
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Histórico de Feedbacks
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRenewPlan(patient)}>
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Renovar Plano
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <PatientForm
                                  patient={patient}
                                  trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                  }
                                  onSave={handleSavePatient}
                                />
                                <DeleteConfirmation
                                  itemName={patient.full_name || 'Paciente'}
                                  itemType="paciente"
                                  onConfirm={() => handleDeletePatient(patient.id)}
                                  loading={deletingId === patient.id}
                                >
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-danger focus:text-danger"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DeleteConfirmation>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredPatients.length === 0 && !patientsLoading && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum paciente encontrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou adicione um novo paciente.
                </p>
                <PatientForm
                  trigger={
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Paciente
                    </Button>
                  }
                  onSave={handleSavePatient}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <PatientDetailsModal
        patient={selectedPatient}
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedPatient(null);
        }}
        onEdit={(patient) => {
          setShowDetails(false);
          // Aqui você pode abrir o formulário de edição
        }}
        onRenewPlan={handleRenewPlan}
      />

      <RenewPlanModal
        patient={selectedPatient}
        open={showRenewPlan}
        onClose={() => {
          setShowRenewPlan(false);
          setSelectedPatient(null);
        }}
        onRenew={handleRenewPlanSuccess}
      />
    </TooltipProvider>
  );
}