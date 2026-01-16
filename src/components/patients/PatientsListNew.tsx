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
  TrendingUp,
  Utensils,
  CheckCircle,
  LineChart
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
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientSorting } from "@/components/patients/PatientSorting";
import { ColumnSelector, ColumnOption } from "@/components/patients/ColumnSelector";
import { ColumnOrderManager } from "@/components/patients/ColumnOrderManager";
import { TableRowSkeleton } from "@/components/ui/loading-skeleton";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";
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
import { AlertTriangle } from "lucide-react";
import { PatientForm } from "@/components/forms/PatientForm";
import { PatientDetailsModal } from "@/components/modals/PatientDetailsModal";
import { RenewPlanModal } from "@/components/modals/RenewPlanModal";
import { SubscriptionLimitAlert } from "@/components/subscription/SubscriptionLimitAlert";
import { SubscriptionLimitDialog } from "@/components/subscription/SubscriptionLimitDialog";
import { patientService } from "@/lib/supabase-services";
import { subscriptionService } from "@/lib/subscription-service";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { CSVImportModal } from "@/components/import/CSVImportModal";
import { SendPortalButton } from "@/components/patients/SendPortalButton";

export function PatientsListNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences, loading: preferencesLoading, updateFilters, updateSorting, updateVisibleColumns, updateColumnOrder } = usePatientPreferences();
  
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  
  // Paginação: mostrar apenas os primeiros N pacientes
  const [displayLimit, setDisplayLimit] = useState(15);
  const INITIAL_DISPLAY_LIMIT = 15;
  const LOAD_MORE_INCREMENT = 15;

  // Estado para planos únicos (otimizado)
  const [uniquePlans, setUniquePlans] = useState<string[]>([]);
  
  // Obter planos únicos de TODOS os pacientes (não filtrados) - fallback
  const uniquePlansFromAll = useMemo(() => {
    if (allPatients.length > 0) {
      const plans = [...new Set(allPatients.map(p => p.plano).filter(Boolean))];
      return plans.sort();
    }
    return uniquePlans;
  }, [allPatients, uniquePlans]);
  
  // Pacientes visíveis (limitados pela paginação)
  const visiblePatients = useMemo(() => {
    return patients.slice(0, displayLimit);
  }, [patients, displayLimit]);
  
  // Verificar se há mais pacientes para mostrar
  const hasMorePatients = patients.length > displayLimit;

  // Verificar status de assinatura e limites
  useEffect(() => {
    async function checkSubscription() {
      try {
        const status = await subscriptionService.checkSubscription();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      }
    }
    checkSubscription();
  }, [patients.length]); // Recarregar quando número de pacientes mudar

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
    { key: 'ultimo_contato', label: 'Último Contato' },
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

  // Carregar planos únicos (otimizado - não precisa carregar todos os pacientes)
  const loadUniquePlans = async () => {
    try {
      const plans = await patientService.getUniquePlans();
      setUniquePlans(plans);
      // Não precisamos mais carregar todos os pacientes só para os planos
    } catch (error) {
      console.error('Erro ao carregar planos únicos:', error);
      // Fallback: carregar todos os pacientes se o método otimizado falhar
      try {
        const data = await patientService.getAll();
        setAllPatients(data);
      } catch (fallbackError) {
        console.error('Erro ao carregar pacientes (fallback):', fallbackError);
      }
    }
  };
  
  // Carregar todos os pacientes (para lista de planos) - mantido para compatibilidade
  const loadAllPatients = async () => {
    try {
      // Usar método otimizado primeiro
      await loadUniquePlans();
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };
  
  // Função para carregar mais pacientes
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + LOAD_MORE_INCREMENT);
  };
  
  // Resetar limite quando filtros mudarem
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT);
  }, [preferences?.filters, preferences?.sorting]);

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
      telefone_filtro: patient.telefone_filtro || "",
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
    console.log('🗑️ Tentando excluir paciente:', patient.nome);
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
    console.log('Modal de exclusão aberto:', true);
  };

  const confirmDelete = async () => {
    console.log('✅ Confirmando exclusão do paciente:', patientToDelete?.nome);
    if (!patientToDelete) {
      console.log('❌ Nenhum paciente selecionado para exclusão');
      return;
    }
    
    try {
      console.log('🔄 Excluindo paciente do Supabase...', patientToDelete.id);
      // Excluir paciente do Supabase
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientToDelete.id);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Paciente excluído com sucesso!');
      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso"
      });
      
      // Recarregar ambas as listas
      console.log('🔄 Recarregando listas de pacientes...');
      await loadPatients();
      await loadAllPatients();
      console.log('✅ Listas recarregadas!');
    } catch (error: any) {
      console.error('❌ Erro ao excluir paciente:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o paciente",
        variant: "destructive"
      });
    } finally {
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  // Função para exportar pacientes para CSV
  const handleExportCSV = () => {
    try {
      // Cabeçalhos do CSV baseados nas colunas visíveis
      const headers = filteredColumnOptions.map(col => col.label);
      
      // Adicionar colunas extras que não estão na tabela mas são úteis
      const allHeaders = [...headers, 'CPF', 'Email', 'Data de Nascimento', 'Objetivo', 'Observação'];
      
      // Criar linhas do CSV
      const rows = patients.map(patient => {
        const row: string[] = [];
        
        // Adicionar dados das colunas visíveis
        filteredColumnOptions.forEach(col => {
          let value = '';
          
          switch (col.key) {
            case 'nome':
              value = patient.nome || '';
              break;
            case 'apelido':
              value = patient.apelido || '';
              break;
            case 'telefone':
              value = patient.telefone || '';
              break;
            case 'email':
              value = patient.email || '';
              break;
            case 'plano':
              value = patient.plano || '';
              break;
            case 'vencimento':
              value = patient.vencimento ? new Date(patient.vencimento).toLocaleDateString('pt-BR') : '';
              break;
            case 'dias_para_vencer':
              value = patient.dias_para_vencer !== null ? String(patient.dias_para_vencer) : '';
              break;
            case 'ultimo_contato':
              const ultimoContatoRaw = (patient as any).ultimo_contato;
              if (ultimoContatoRaw) {
                try {
                  const parsed = typeof ultimoContatoRaw === 'string' ? JSON.parse(ultimoContatoRaw) : ultimoContatoRaw;
                  value = parsed.start ? new Date(parsed.start).toLocaleDateString('pt-BR') : '';
                } catch {
                  value = '';
                }
              }
              break;
            case 'status':
              const status = getPatientStatus(patient);
              value = status === 'active' ? 'Ativo' : status === 'expiring_soon' ? 'Vencendo' : status === 'expired' ? 'Expirado' : 'Desconhecido';
              break;
            case 'created_at':
              value = patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') : '';
              break;
            default:
              value = (patient as any)[col.key] || '';
          }
          
          row.push(value);
        });
        
        // Adicionar colunas extras
        row.push(patient.cpf || '');
        row.push(patient.email || '');
        row.push(patient.data_nascimento ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR') : '');
        row.push(patient.objetivo || '');
        row.push(patient.observacao || '');
        
        return row;
      });
      
      // Criar conteúdo CSV
      const csvContent = [
        allHeaders.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      // Criar blob e fazer download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `pacientes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Sucesso",
        description: `${patients.length} paciente${patients.length !== 1 ? 's' : ''} exportado${patients.length !== 1 ? 's' : ''} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar os pacientes",
        variant: "destructive"
      });
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

  // Filtrar e ordenar colunas visíveis (memoizado para evitar re-renders)
  const visibleColumns = useMemo(() => 
    preferences?.visible_columns || columnOptions.map(col => col.key),
    [preferences?.visible_columns]
  );
  
  const columnOrder = useMemo(() => 
    preferences?.column_order || columnOptions.map(col => col.key),
    [preferences?.column_order]
  );
  
  // Filtrar colunas visíveis (memoizado)
  const visibleColumnOptions = useMemo(() => 
    columnOptions.filter(col => visibleColumns.includes(col.key)),
    [visibleColumns]
  );
  
  // Ordenar colunas conforme a ordem salva (memoizado)
  const filteredColumnOptions = useMemo(() => 
    columnOrder
      .map(key => visibleColumnOptions.find(col => col.key === key))
      .filter(Boolean) as typeof columnOptions,
    [columnOrder, visibleColumnOptions]
  );

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
    <div className="space-y-8 animate-fadeIn">
      {/* Header com destaque visual melhorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Pacientes
          </h1>
          <p className="text-slate-400 text-sm">
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
          <CSVImportModal onImportComplete={loadPatients} />
          <Button onClick={() => setIsPatientFormOpen(true)} className="btn-premium">
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Alerta de Limite de Assinatura */}
      {subscriptionStatus?.plan && subscriptionStatus.plan.max_patients !== null && (
        <SubscriptionLimitAlert
          currentCount={patients.length}
          maxAllowed={subscriptionStatus.plan.max_patients}
          planName={subscriptionStatus.plan.display_name}
        />
      )}

      {/* Filtros com busca, ordenação e controles */}
      <PatientFilters
        filters={preferences?.filters || {}}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        plans={uniquePlansFromAll}
        sortingComponent={
          <div className="w-full">
            <PatientSorting
              sorting={preferences?.sorting || { field: 'created_at', direction: 'desc' }}
              onSortingChange={handleSortingChange}
              options={sortingOptions}
            />
          </div>
        }
        controlsComponent={
          <div className="flex items-center gap-2">
            <ColumnOrderManager
              columns={columnOptions}
              columnOrder={columnOrder}
              onOrderChange={async (newOrder) => {
                await updateColumnOrder(newOrder);
              }}
            />
            <ColumnSelector
              columns={columnOptions}
              visibleColumns={visibleColumns}
              onColumnsChange={handleColumnsChange}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        }
      />

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
                <TableHead className="w-24 text-slate-300 text-center">Plano Alimentar</TableHead>
                <TableHead className="w-24 text-slate-300 text-center">Evolução</TableHead>
                <TableHead className="w-20 text-slate-300 text-center">App</TableHead>
                <TableHead className="w-12 text-slate-300 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={filteredColumnOptions.length + 4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Carregando pacientes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={filteredColumnOptions.length + 4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-slate-400" />
                      <p className="text-slate-400">Nenhum paciente encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visiblePatients.map((patient) => {
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
                          case 'ultimo_contato':
                            content = (() => {
                              const ultimoContatoRaw = (patient as any).ultimo_contato;
                              
                              console.log('🔍 Debug ultimo_contato:', {
                                paciente: patient.nome,
                                raw: ultimoContatoRaw,
                                tipo: typeof ultimoContatoRaw,
                                isNull: ultimoContatoRaw === null,
                                isUndefined: ultimoContatoRaw === undefined
                              });
                              
                              if (!ultimoContatoRaw) {
                                return <span className='text-slate-400'>Nunca</span>;
                              }
                              
                              // Extrair a data do objeto JSON
                              let dataContatoStr: string | null = null;
                              
                              // Se for string JSON, fazer parse
                              if (typeof ultimoContatoRaw === 'string') {
                                try {
                                  const parsed = JSON.parse(ultimoContatoRaw);
                                  dataContatoStr = parsed.start;
                                  console.log('📝 Parsed string JSON:', { parsed, dataContatoStr });
                                } catch (e) {
                                  dataContatoStr = ultimoContatoRaw;
                                  console.log('⚠️ Não é JSON, usando como string:', dataContatoStr);
                                }
                              } 
                              // Se já for objeto
                              else if (typeof ultimoContatoRaw === 'object' && ultimoContatoRaw.start) {
                                dataContatoStr = ultimoContatoRaw.start;
                                console.log('📦 Objeto direto:', { ultimoContatoRaw, dataContatoStr });
                              }
                              
                              if (!dataContatoStr) {
                                console.log('❌ Nenhuma data encontrada');
                                return <span className='text-slate-400'>Nunca</span>;
                              }
                              
                              const dataContato = new Date(dataContatoStr);
                              const hoje = new Date();
                              const diffTime = Math.abs(hoje.getTime() - dataContato.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              const dataFormatada = dataContato.toLocaleDateString('pt-BR');
                              
                              console.log('✅ Data processada:', { dataContatoStr, dataContato, diffDays, dataFormatada });
                              
                              // Definir cor baseado nos dias sem contato
                              let badgeClass = 'bg-green-500/20 text-green-400 border-green-500/30'; // < 20 dias
                              if (diffDays >= 30) {
                                badgeClass = 'bg-red-500/20 text-red-400 border-red-500/30'; // >= 30 dias
                              } else if (diffDays >= 20) {
                                badgeClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; // >= 20 dias
                              }
                              
                              return (
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className={badgeClass}>
                                    {dataFormatada}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    há {diffDays} {diffDays === 1 ? 'dia' : 'dias'}
                                  </span>
                                </div>
                              );
                            })();
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
                      
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/patients/${patient.id}?tab=diets`)}
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Abrir Planos Alimentares</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/checkins/evolution/${patient.telefone}`)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <LineChart className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver Evolução</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        <SendPortalButton
                          telefone={patient.telefone}
                          patientName={patient.nome}
                          variant="ghost"
                          size="sm"
                          showLabel={false}
                        />
                      </TableCell>
                      <TableCell className="text-center">
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
        
        {/* Botão Mostrar Mais */}
        {!loading && hasMorePatients && (
          <div className="p-4 border-t border-slate-700/50 flex justify-center">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Mostrar mais ({patients.length - displayLimit} restantes)
            </Button>
          </div>
        )}
        
        {/* Indicador de pacientes visíveis */}
        {!loading && patients.length > 0 && (
          <div className="px-4 pb-4 text-center">
            <p className="text-sm text-slate-400">
              Mostrando {visiblePatients.length} de {patients.length} pacientes
            </p>
          </div>
        )}
      </Card>

      {/* Modais */}
      <PatientForm
        patient={mapPatientToFormData(selectedPatient)}
        trigger={<div />}
        open={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        onSave={async (data) => {
          console.log('💾 Salvando paciente:', { selectedPatient: selectedPatient?.id, data });
          try {
            // Converter todos os campos para string, já que o Supabase espera strings
            // Apenas incluir campos que existem na tabela patients
            const dataToSave: any = {
              nome: data.nome,
              telefone: data.telefone,
            };
            
            // Campos opcionais que existem na tabela
            if (data.apelido) dataToSave.apelido = data.apelido;
            if (data.cpf) dataToSave.cpf = data.cpf;
            if (data.email) dataToSave.email = data.email;
            if (data.telefone_filtro) dataToSave.telefone_filtro = data.telefone_filtro;
            if (data.genero) dataToSave.genero = data.genero;
            if (data.plano) dataToSave.plano = data.plano;
            if (data.observacao) dataToSave.observacao = data.observacao;
            
            // Converter data_nascimento para string
            if (data.data_nascimento) {
              dataToSave.data_nascimento = data.data_nascimento instanceof Date 
                ? data.data_nascimento.toISOString().split('T')[0] 
                : data.data_nascimento;
            }
            
            // Converter vencimento para string
            if (data.vencimento) {
              dataToSave.vencimento = data.vencimento instanceof Date 
                ? data.vencimento.toISOString().split('T')[0] 
                : data.vencimento;
            }
            
            // Converter números para string (apenas se existirem na tabela)
            if (data.tempo_acompanhamento !== undefined) {
              dataToSave.tempo_acompanhamento = Number(data.tempo_acompanhamento);
            }
            if (data.valor !== undefined) {
              dataToSave.valor = Number(data.valor);
            }
            
            if (selectedPatient) {
              // Atualizar paciente existente
              console.log('🔄 Atualizando paciente no Supabase...', selectedPatient.id, dataToSave);
              const result = await patientService.update(selectedPatient.id, dataToSave);
              console.log('✅ Paciente atualizado com sucesso:', result);
              toast({
                title: "Sucesso",
                description: "Paciente atualizado com sucesso"
              });
            } else {
              // Criar novo paciente
              console.log('➕ Criando novo paciente no Supabase...', dataToSave);
              try {
                const result = await patientService.create(dataToSave);
                console.log('✅ Paciente criado com sucesso:', result);
                toast({
                  title: "Sucesso", 
                  description: "Paciente criado com sucesso"
                });
              } catch (error: any) {
                // Se erro for de limite, mostrar dialog
                if (error.message?.includes('Limite') || error.message?.includes('limite')) {
                  const limitCheck = await subscriptionService.canAddPatient();
                  if (limitCheck.maxAllowed !== undefined) {
                    setLimitDialogOpen(true);
                    return; // Não mostrar toast genérico
                  }
                }
                throw error; // Re-lançar para tratamento genérico
              }
            }
            console.log('🔄 Recarregando listas de pacientes...');
            await loadPatients();
            await loadAllPatients(); // Recarregar todos os pacientes para atualizar lista de planos
            console.log('✅ Listas recarregadas!');
            setIsPatientFormOpen(false);
            setSelectedPatient(null);
          } catch (error: any) {
            console.error('❌ Erro ao salvar paciente:', error);
            toast({
              title: "Erro",
              description: error.message || "Não foi possível salvar o paciente",
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

      {/* Dialog de Limite de Pacientes */}
      {subscriptionStatus?.plan && subscriptionStatus.plan.max_patients !== null && (
        <SubscriptionLimitDialog
          open={limitDialogOpen}
          onOpenChange={setLimitDialogOpen}
          currentCount={patients.length}
          maxAllowed={subscriptionStatus.plan.max_patients}
          planName={subscriptionStatus.plan.display_name}
        />
      )}

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

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Excluir Paciente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir o paciente <span className="font-semibold text-white">{patientToDelete?.nome}</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setPatientToDelete(null);
              }}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
