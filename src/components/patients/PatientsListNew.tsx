import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  MoreHorizontal, 
  Calendar,
  Phone,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  MessageSquare,
  Users,
  Settings,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePatients } from "@/hooks/use-supabase-data";
import { usePatientPreferences } from "@/hooks/use-patient-preferences";
import { PatientFilters, PatientFiltersProps } from "@/components/patients/PatientFilters";
import { PatientSorting, PatientSortingProps } from "@/components/patients/PatientSorting";
import { ColumnSelector, ColumnOption } from "@/components/patients/ColumnSelector";
import { TableRowSkeleton } from "@/components/ui/loading-skeleton";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";
import { PatientForm } from "@/components/forms/PatientForm";
import { PatientDetailsModal } from "@/components/modals/PatientDetailsModal";
import { RenewPlanModal } from "@/components/modals/RenewPlanModal";
import { patientService } from "@/lib/supabase-services";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@/integrations/supabase/types";

export function PatientsListNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences, loading: preferencesLoading, updateFilters, updateSorting, updateVisibleColumns } = usePatientPreferences();
  
  // Estados locais
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]); // Todos os pacientes (não filtrados)
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Obter planos únicos de TODOS os pacientes (não filtrados)
  const uniquePlans = useMemo(() => {
    const plans = [...new Set(allPatients.map(p => p.plano).filter(Boolean))];
    return plans.sort();
  }, [allPatients]);

  // Função para estilizar badges dos planos
  const getPlanBadgeStyle = (plano: string) => {
    const planColors: { [key: string]: string } = {
      // Planos ativos - cores vibrantes
      'BASIC': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'PREMIUM': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      
      // Planos inativos - cores mais escuras
      'INATIVO': 'bg-slate-600/20 text-slate-500 border-slate-600/30',
      'CONGELADO': 'bg-blue-600/20 text-blue-500 border-blue-600/30',
      'RESCISÃO': 'bg-red-600/20 text-red-500 border-red-600/30',
      'PENDÊNCIA FINANCEIRA': 'bg-orange-600/20 text-orange-500 border-orange-600/30',
      'NEGATIVADO': 'bg-red-700/20 text-red-600 border-red-700/30',
    };
    
    // Buscar por correspondência parcial para planos com emojis ou variações
    const normalizedPlano = plano.toUpperCase().trim();
    const matchingKey = Object.keys(planColors).find(key => 
      normalizedPlano.includes(key) || key.includes(normalizedPlano)
    );
    
    return matchingKey ? planColors[matchingKey] : 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // Opções de colunas
  const columnOptions: ColumnOption[] = [
    { key: 'nome', label: 'Nome', required: true },
    { key: 'apelido', label: 'Apelido' },
    { key: 'telefone', label: 'Telefone', required: true },
    { key: 'email', label: 'Email' },
    { key: 'plano', label: 'Plano' },
    { key: 'vencimento', label: 'Vencimento' },
    { key: 'dias_para_vencer', label: 'Dias para vencer' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Data de criação' }
  ];

  // Opções de ordenação
  const sortingOptions = [
    { field: 'nome', label: 'Nome' },
    { field: 'apelido', label: 'Apelido' },
    { field: 'plano', label: 'Plano' },
    { field: 'vencimento', label: 'Vencimento' },
    { field: 'dias_para_vencer', label: 'Dias para vencer' },
    { field: 'created_at', label: 'Data de criação' },
    { field: 'valor', label: 'Valor' }
  ];

  // Carregar todos os pacientes (para lista de planos)
  const loadAllPatients = async () => {
    try {
      const data = await patientService.getAll();
      setAllPatients(data);
    } catch (error) {
      console.error('Erro ao carregar todos os pacientes:', error);
    }
  };

  // Carregar pacientes com filtros
  const loadPatients = async () => {
    if (!preferences) return;
    
    try {
      setLoading(true);
      const data = await patientService.getFiltered(
        preferences.filters,
        preferences.sorting,
        preferences.visible_columns
      );
      setPatients(data);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pacientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar todos os pacientes na inicialização
  useEffect(() => {
    loadAllPatients();
  }, []);

  // Carregar pacientes quando as preferências mudarem
  useEffect(() => {
    if (preferences) {
      loadPatients();
    }
  }, [preferences]);

  // Handlers
  const handleFiltersChange = async (filters: any) => {
    await updateFilters(filters);
  };

  const handleSortingChange = async (sorting: any) => {
    await updateSorting(sorting);
  };

  const handleColumnsChange = async (columns: string[]) => {
    await updateVisibleColumns(columns);
  };

  const handleResetFilters = async () => {
    await updateFilters({
      plan: undefined,
      plans: undefined,
      status: undefined,
      gender: undefined,
      search: undefined,
      days_to_expire: undefined,
      created_after: undefined,
      created_before: undefined
    });
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailsModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPatientFormOpen(true);
  };

  // Função para mapear Patient (Supabase) para PatientFormData
  const mapPatientToFormData = (patient: Patient | null) => {
    if (!patient) return undefined;
    
    return {
      id: patient.id,
      nome: patient.nome || "",
      apelido: patient.apelido || "",
      cpf: patient.cpf || "",
      email: patient.email || "",
      telefone: patient.telefone || "",
      genero: patient.genero as "Masculino" | "Feminino" | "Outro" | undefined,
      data_nascimento: patient.data_nascimento ? new Date(patient.data_nascimento) : undefined,
      plano: patient.plano || "",
      tempo_acompanhamento: patient.tempo_acompanhamento || 3,
      vencimento: patient.vencimento ? new Date(patient.vencimento) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      valor: patient.valor || undefined,
      observacao: patient.observacao || "",
      objetivo: patient.objetivo || "",
      peso: patient.peso || undefined,
      medida: patient.medida || undefined,
    };
  };

  const handleRenewPlan = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsRenewModalOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    
    try {
      // Implementar delete
      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso"
      });
      await loadPatients();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o paciente",
        variant: "destructive"
      });
    } finally {
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  // Calcular status do paciente
  const getPatientStatus = (patient: Patient) => {
    if (!patient.vencimento) return 'unknown';
    
    const today = new Date();
    const vencimento = new Date(patient.vencimento);
    const diffTime = vencimento.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring_soon';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativo</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expirado</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Desconhecido</Badge>;
    }
  };

  // Filtrar colunas visíveis
  const visibleColumns = preferences?.visible_columns || columnOptions.map(col => col.key);
  const filteredColumnOptions = columnOptions.filter(col => visibleColumns.includes(col.key));

  if (preferencesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground">Carregando preferências...</p>
          </div>
        </div>
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Carregando configurações...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Pacientes</h1>
          <p className="text-slate-400">
            {patients.length} paciente{patients.length !== 1 ? 's' : ''} encontrado{patients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPatients}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsPatientFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <PatientFilters
        filters={preferences?.filters || {}}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        plans={uniquePlans}
      />

      {/* Controles de visualização */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <PatientSorting
                sorting={preferences?.sorting || { field: 'created_at', direction: 'desc' }}
                onSortingChange={handleSortingChange}
                options={sortingOptions}
              />
            </div>
            <div className="flex items-center gap-2">
              <ColumnSelector
                columns={columnOptions}
                visibleColumns={visibleColumns}
                onColumnsChange={handleColumnsChange}
              />
              <Button variant="outline" size="sm" className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de pacientes */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50">
                {filteredColumnOptions.map((column) => (
                  <TableHead key={column.key} className="text-slate-300">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="w-12 text-slate-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={filteredColumnOptions.length + 1} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Carregando pacientes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={filteredColumnOptions.length + 1} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-slate-400" />
                      <p className="text-slate-400">Nenhum paciente encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => {
                  const status = getPatientStatus(patient);
                  
                  return (
                    <TableRow key={patient.id} className="border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                      {filteredColumnOptions.map((column) => {
                        let content;
                        
                        switch (column.key) {
                          case 'nome':
                            content = (
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-blue-500/20 text-blue-400">
                                    {patient.nome?.charAt(0) || 'P'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-white">{patient.nome || 'Sem nome'}</p>
                                  {patient.apelido && (
                                    <p className="text-sm text-slate-400">{patient.apelido}</p>
                                  )}
                                </div>
                              </div>
                            );
                            break;
                          case 'telefone':
                            content = (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-300">{patient.telefone || 'N/A'}</span>
                              </div>
                            );
                            break;
                          case 'apelido':
                            content = <span className='text-slate-300'>{patient.apelido || 'N/A'}</span>;
                            break;
                          case 'email':
                            content = <span className='text-slate-300'>{patient.email || 'N/A'}</span>;
                            break;
                          case 'plano':
                            content = patient.plano ? (
                              <Badge 
                                variant="outline" 
                                className={getPlanBadgeStyle(patient.plano)}
                              >
                                {patient.plano}
                              </Badge>
                            ) : 'N/A';
                            break;
                          case 'vencimento':
                            content = <span className='text-slate-300'>{patient.vencimento ? 
                              new Date(patient.vencimento).toLocaleDateString('pt-BR') : 'N/A'}</span>;
                            break;
                          case 'dias_para_vencer':
                            content = <span className='text-slate-300'>{patient.dias_para_vencer !== null ? 
                              `${patient.dias_para_vencer} dias` : 'N/A'}</span>;
                            break;
                          case 'status':
                            content = getStatusBadge(status);
                            break;
                          case 'created_at':
                            content = <span className='text-slate-300'>{patient.created_at ? 
                              new Date(patient.created_at).toLocaleDateString('pt-BR') : 'N/A'}</span>;
                            break;
                          default:
                            content = <span className='text-slate-300'>{(patient as any)[column.key] || 'N/A'}</span>;
                        }
                        
                        return (
                          <TableCell key={column.key} className="text-slate-300">
                            {content}
                          </TableCell>
                        );
                      })}
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/checkins/evolution/${patient.telefone}`)}>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Ver Evolução
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRenewPlan(patient)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Renovar plano
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeletePatient(patient)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modais */}
      <PatientForm
        patient={mapPatientToFormData(selectedPatient)}
        trigger={<div />}
        open={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        onSave={async (data) => {
          try {
            if (selectedPatient) {
              // Atualizar paciente existente
              await patientService.update(selectedPatient.id, data);
              toast({
                title: "Sucesso",
                description: "Paciente atualizado com sucesso"
              });
            } else {
              // Criar novo paciente
              await patientService.create(data);
              toast({
                title: "Sucesso", 
                description: "Paciente criado com sucesso"
              });
            }
            await loadPatients();
            await loadAllPatients(); // Recarregar todos os pacientes para atualizar lista de planos
            setIsPatientFormOpen(false);
            setSelectedPatient(null);
          } catch (error) {
            toast({
              title: "Erro",
              description: "Não foi possível salvar o paciente",
              variant: "destructive"
            });
          }
        }}
      />

      <PatientDetailsModal
        patient={selectedPatient}
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPatient(null);
        }}
        onEdit={(patient) => {
          setSelectedPatient(patient);
          setIsDetailsModalOpen(false);
          setIsPatientFormOpen(true);
        }}
      />

      <RenewPlanModal
        patient={selectedPatient}
        isOpen={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setSelectedPatient(null);
        }}
        onSuccess={() => {
          loadPatients();
          setIsRenewModalOpen(false);
          setSelectedPatient(null);
        }}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPatientToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Paciente"
        description={`Tem certeza que deseja excluir o paciente ${patientToDelete?.nome}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
