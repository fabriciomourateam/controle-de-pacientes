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
import { mockPatients, mockPlans, mockFeedbackRecords } from "@/lib/mock-data";

export function PatientsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Função para obter o status do paciente
  const getPatientStatus = (daysToExpiration: number) => {
    if (daysToExpiration < 0) return "expired";
    if (daysToExpiration <= 7) return "urgent";
    if (daysToExpiration <= 30) return "warning";
    return "active";
  };

  // Função para obter o último feedback
  const getLastFeedback = (patientId: string) => {
    const feedbacks = mockFeedbackRecords
      .filter(f => f.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return feedbacks[0] || null;
  };

  // Filtrar pacientes
  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone_number.includes(searchTerm);
    
    const matchesPlan = selectedPlan === "all" || patient.plan_id === selectedPlan;
    
    const status = getPatientStatus(patient.days_to_expiration);
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus pacientes e acompanhamentos
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-surface border-border"
              />
            </div>
            
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-full md:w-48 bg-surface border-border">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {mockPlans.filter(p => p.active).map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48 bg-surface border-border">
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
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pacientes */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Pacientes ({filteredPatients.length})</span>
            <Button variant="outline" size="sm">
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
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Feedback</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const plan = mockPlans.find(p => p.id === patient.plan_id);
                  const lastFeedback = getLastFeedback(patient.id);
                  
                  return (
                    <TableRow key={patient.id} className="hover:bg-surface/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {patient.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{patient.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Desde {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{patient.phone_number}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="bg-surface">
                          {plan?.name || 'Plano não encontrado'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(patient.days_to_expiration)}
                      </TableCell>
                      
                      <TableCell>
                        {lastFeedback ? (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={
                                lastFeedback.overall_score >= 8 ? 'status-active' :
                                lastFeedback.overall_score >= 6 ? 'status-warning' :
                                'status-danger'
                              }
                            >
                              {lastFeedback.overall_score}/10
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(lastFeedback.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem feedback</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Histórico de Feedbacks
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              Renovar Plano
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-danger">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum paciente encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou adicione um novo paciente.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Paciente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}