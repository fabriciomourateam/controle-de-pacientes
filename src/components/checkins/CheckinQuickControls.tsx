import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Lock, 
  Unlock, 
  User, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  useCheckinManagement, 
  CheckinStatus, 
  TeamMember,
  CheckinLockInfo 
} from '@/hooks/use-checkin-management';
import { CheckinNotesModal } from './CheckinNotesModal';
import type { CheckinWithPatient } from '@/lib/checkin-service';

interface CheckinQuickControlsProps {
  checkin: CheckinWithPatient;
  teamMembers: TeamMember[];
  onUpdate?: () => void;
  notesCount?: number;
  showOnlyStatus?: boolean;
  showOnlyResponsible?: boolean;
  showOnlyActions?: boolean;
}

const statusOptions: Array<{ value: CheckinStatus; label: string; color: string }> = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'em_analise', label: 'Aguardando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'enviado', label: 'Enviado', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
];

function CheckinQuickControlsComponent({
  checkin,
  teamMembers,
  onUpdate,
  notesCount = 0,
  showOnlyStatus = false,
  showOnlyResponsible = false,
  showOnlyActions = false
}: CheckinQuickControlsProps) {
  const [currentStatus, setCurrentStatus] = useState<CheckinStatus>(
    (checkin.status as CheckinStatus) || 'pendente'
  );
  const [currentAssignee, setCurrentAssignee] = useState<string>(
    checkin.assigned_to || ''
  );
  const [lockInfo, setLockInfo] = useState<CheckinLockInfo>({ is_locked: false });
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localNotesCount, setLocalNotesCount] = useState(notesCount || 0);

  const {
    updateCheckinStatus,
    assignCheckin,
    acquireLock,
    releaseLock,
    checkLockStatus,
    loadCheckinNotes
  } = useCheckinManagement();

  // Atualizar contador local quando a prop mudar
  useEffect(() => {
    setLocalNotesCount(notesCount || 0);
  }, [notesCount]);

  // Buscar contador de anotações quando o componente monta
  useEffect(() => {
    const fetchNotesCount = async () => {
      try {
        const notes = await loadCheckinNotes(checkin.id);
        setLocalNotesCount(notes.length);
      } catch (error) {
        // Silenciar erro
      }
    };
    fetchNotesCount();
  }, [checkin.id, loadCheckinNotes]);

  // Verificar status do lock apenas uma vez quando o componente monta
  useEffect(() => {
    const checkLock = async () => {
      const lockStatus = await checkLockStatus(checkin.id);
      setLockInfo(lockStatus);
    };

    checkLock();
  }, [checkin.id, checkLockStatus]);

  const handleStatusChange = async (newStatus: CheckinStatus) => {
    if (isUpdating) return;
    
    // Optimistic update - atualizar UI imediatamente
    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);
    setIsUpdating(true);
    
    try {
      const success = await updateCheckinStatus(checkin.id, newStatus);
      if (!success) {
        // Reverter se falhar
        setCurrentStatus(previousStatus);
      } else {
        onUpdate?.();
      }
    } catch (error) {
      // Reverter em caso de erro
      setCurrentStatus(previousStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssigneeChange = async (newAssignee: string) => {
    if (isUpdating) return;
    
    // Optimistic update - atualizar UI imediatamente
    const previousAssignee = currentAssignee;
    setCurrentAssignee(newAssignee);
    setIsUpdating(true);
    
    try {
      const assigneeId = newAssignee === 'unassigned' ? null : newAssignee;
      const success = await assignCheckin(checkin.id, assigneeId);
      if (!success) {
        // Reverter se falhar
        setCurrentAssignee(previousAssignee);
      } else {
        onUpdate?.();
      }
    } catch (error) {
      // Reverter em caso de erro
      setCurrentAssignee(previousAssignee);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLockToggle = async () => {
    if (lockInfo.is_locked) {
      // Se está locked, tentar liberar
      const success = await releaseLock(checkin.id);
      if (success) {
        // Aguardar um pouco para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        // Atualizar status do lock para garantir sincronização (cache já foi invalidado em releaseLock)
        const updatedLockStatus = await checkLockStatus(checkin.id);
        setLockInfo(updatedLockStatus);
      }
    } else {
      // Se não está locked, adquirir lock
      const success = await acquireLock(checkin.id);
      if (success) {
        // Aguardar um pouco para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        // Atualizar status do lock para obter informações completas (cache já foi invalidado em acquireLock)
        const updatedLockStatus = await checkLockStatus(checkin.id);
        setLockInfo(updatedLockStatus);
      }
    }
  };

  const getStatusBadge = (status: CheckinStatus) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption || statusOptions[0];
  };

  const getAssigneeName = (userId: string) => {
    if (!userId || userId === 'unassigned') return 'Não atribuído';
    const member = teamMembers.find(m => m.user_id === userId);
    return member ? member.name : 'Usuário desconhecido';
  };

  const statusBadge = getStatusBadge(currentStatus);

  // Função para obter classes de cor do trigger baseado no status selecionado
  const getTriggerClassName = (status: CheckinStatus) => {
    const baseClasses = 'h-8 border text-white';
    if (status === 'pendente') {
      return `${baseClasses} bg-yellow-500/20 text-yellow-400 border-yellow-500/30`;
    } else if (status === 'em_analise') {
      return `${baseClasses} bg-blue-500/20 text-blue-400 border-blue-500/30`;
    } else if (status === 'enviado') {
      return `${baseClasses} bg-green-500/20 text-green-400 border-green-500/30`;
    }
    return `${baseClasses} bg-slate-800/50 border-slate-600/50`;
  };

  // Função para obter classes de cor dos itens do select
  const getItemClassName = (value: CheckinStatus) => {
    if (value === 'pendente') {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30 focus:bg-yellow-500/30';
    } else if (value === 'em_analise') {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 focus:bg-blue-500/30';
    } else if (value === 'enviado') {
      return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 focus:bg-green-500/30';
    }
    return '';
  };

  // Renderizar apenas Status
  if (showOnlyStatus) {
    return (
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating || lockInfo.is_locked}
      >
        <SelectTrigger className={getTriggerClassName(currentStatus)}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusBadge.color.split(' ')[0]}`} />
              <span className="text-sm">{statusBadge.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem key={status.value} value={status.value} className={getItemClassName(status.value)}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                <span>{status.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Renderizar apenas Responsável
  if (showOnlyResponsible) {
    return (
      <Select
        value={currentAssignee || 'unassigned'}
        onValueChange={handleAssigneeChange}
        disabled={isUpdating || lockInfo.is_locked}
      >
        <SelectTrigger className="h-8 bg-slate-800/50 border-slate-600/50 text-white w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-slate-400" />
              <span className="text-sm truncate">
                {getAssigneeName(currentAssignee)}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-slate-400" />
              <span>Não atribuído</span>
            </div>
          </SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.user_id} value={member.user_id}>
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-slate-400" />
                <span>
                  {member.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Renderizar apenas Ações
  if (showOnlyActions) {
    return (
      <>
        <div className="flex items-center gap-1">
          {/* Botão de Anotações */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    // Atualizar contador antes de abrir o modal
                    try {
                      const notes = await loadCheckinNotes(checkin.id);
                      setLocalNotesCount(notes.length);
                    } catch (error) {
                      // Silenciar erro
                    }
                    setNotesModalOpen(true);
                  }}
                  className={`h-8 px-2 ${
                    localNotesCount > 0 
                      ? 'bg-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {localNotesCount > 0 && (
                    <Badge 
                      variant="outline" 
                      className="ml-1 h-4 px-1 text-xs bg-blue-600/20 text-blue-300 border-blue-500/30"
                    >
                      {localNotesCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {localNotesCount > 0 
                    ? `${localNotesCount} anotaç${localNotesCount !== 1 ? 'ões' : 'ão'}` 
                    : 'Adicionar anotação'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Botão de Lock */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLockToggle}
                  disabled={lockInfo.is_locked && lockInfo.locked_by_name !== 'Você'}
                  className={`h-8 px-2 ${
                    lockInfo.is_locked 
                      ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-900/20' 
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {lockInfo.is_locked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {lockInfo.is_locked 
                    ? 'Liberar edição' 
                    : 'Bloquear para edição'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Indicador de Atualização */}
          {isUpdating && (
            <div className="flex items-center justify-center h-8 w-8">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Modal de Anotações */}
        <CheckinNotesModal
          checkinId={checkin.id}
          patientName={checkin.patient?.nome || 'Paciente'}
          isOpen={notesModalOpen}
          onClose={async () => {
            setNotesModalOpen(false);
            // Atualizar contador ao fechar o modal
            try {
              const notes = await loadCheckinNotes(checkin.id);
              setLocalNotesCount(notes.length);
            } catch (error) {
              // Silenciar erro
            }
          }}
        />
      </>
    );
  }

  // Renderização completa (modo padrão)
  return (
    <div className="space-y-3">
      {/* Indicador de Lock */}
      {lockInfo.is_locked && (
        <div className="flex items-center gap-2 p-2 bg-orange-900/20 border border-orange-700/30 rounded-lg">
          <Lock className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-orange-300">
            {lockInfo.locked_by_name ? 
              `Sendo editado por ${lockInfo.locked_by_name}` : 
              'Check-in em edição'
            }
          </span>
        </div>
      )}

      {/* Controles Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Status</label>
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating || lockInfo.is_locked}
          >
            <SelectTrigger className={getTriggerClassName(currentStatus)}>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusBadge.color.split(' ')[0]}`} />
                  <span className="text-sm">{statusBadge.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value} className={getItemClassName(status.value)}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                    <span>{status.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Responsável */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Responsável</label>
          <Select
            value={currentAssignee || 'unassigned'}
            onValueChange={handleAssigneeChange}
            disabled={isUpdating || lockInfo.is_locked}
          >
            <SelectTrigger className="h-8 bg-slate-800/50 border-slate-600/50 text-white">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className="text-sm truncate">
                    {getAssigneeName(currentAssignee)}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Não atribuído</span>
                </div>
              </SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>
                      {member.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ações */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Ações</label>
          <div className="flex items-center gap-1">
            {/* Botão de Anotações */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      // Atualizar contador antes de abrir o modal
                      try {
                        const notes = await loadCheckinNotes(checkin.id);
                        setLocalNotesCount(notes.length);
                      } catch (error) {
                        // Silenciar erro
                      }
                      setNotesModalOpen(true);
                    }}
                    className={`h-8 px-2 ${
                      localNotesCount > 0 
                        ? 'bg-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {localNotesCount > 0 && (
                      <Badge 
                        variant="outline" 
                        className="ml-1 h-4 px-1 text-xs bg-blue-600/20 text-blue-300 border-blue-500/30"
                      >
                        {localNotesCount}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {localNotesCount > 0 
                      ? `${localNotesCount} anotaç${localNotesCount !== 1 ? 'ões' : 'ão'}` 
                      : 'Adicionar anotação'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Botão de Lock */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLockToggle}
                    disabled={lockInfo.is_locked && lockInfo.locked_by_name !== 'Você'}
                    className={`h-8 px-2 ${
                      lockInfo.is_locked 
                        ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-900/20' 
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    {lockInfo.is_locked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {lockInfo.is_locked 
                      ? 'Liberar edição' 
                      : 'Bloquear para edição'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Indicador de Atualização */}
            {isUpdating && (
              <div className="flex items-center justify-center h-8 w-8">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Anotações */}
      <CheckinNotesModal
        checkinId={checkin.id}
        patientName={checkin.patient?.nome || 'Paciente'}
        isOpen={notesModalOpen}
        onClose={async () => {
          setNotesModalOpen(false);
          // Atualizar contador ao fechar o modal
          try {
            const notes = await loadCheckinNotes(checkin.id);
            setLocalNotesCount(notes.length);
          } catch (error) {
            // Silenciar erro
          }
        }}
      />
    </div>
  );
}

// Memoizar o componente para evitar re-renders desnecessários
export const CheckinQuickControls = memo(CheckinQuickControlsComponent, (prevProps, nextProps) => {
  // Só re-renderiza se checkin.id, notesCount, ou teamMembers mudarem
  const teamMembersChanged = prevProps.teamMembers.length !== nextProps.teamMembers.length ||
    prevProps.teamMembers.some((member, index) => 
      member.user_id !== nextProps.teamMembers[index]?.user_id
    );
  
  return prevProps.checkin.id === nextProps.checkin.id && 
         prevProps.notesCount === nextProps.notesCount &&
         !teamMembersChanged;
});