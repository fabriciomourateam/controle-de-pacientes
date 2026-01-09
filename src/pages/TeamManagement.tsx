import { useState } from 'react';
import { useTeam } from '@/hooks/use-team';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Plus, Search, MoreVertical, Edit, Trash2, Power, PowerOff, Shield, Clock } from 'lucide-react';
import { AddMemberModal } from '@/components/team/AddMemberModal';
import { EditMemberModal } from '@/components/team/EditMemberModal';
import { RolesModal } from '@/components/team/RolesModal';
import { AssigneeColorPicker } from '@/components/team/AssigneeColorPicker';
import { useToast } from '@/hooks/use-toast';
import { TeamMember } from '@/lib/team-service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TeamManagement() {
  const { members, roles, loading, refetch, deleteMember, toggleMemberStatus } = useTeam();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterAccess, setFilterAccess] = useState<'all' | 'today' | 'recent' | 'old' | 'very-old' | 'never'>('all');

  // Funções auxiliares (movidas para o topo)
  const getLastAccessStatus = (lastAccess: string | null) => {
    if (!lastAccess) return 'never';
    
    const lastAccessDate = new Date(lastAccess);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays <= 7) return 'recent';
    if (diffInDays <= 30) return 'old';
    return 'very-old';
  };

  const getLastAccessBadge = (status: string) => {
    switch (status) {
      case 'today':
        return { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '🟢' };
      case 'recent':
        return { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🔵' };
      case 'old':
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '🟡' };
      case 'very-old':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🔴' };
      default:
        return { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: '⚫' };
    }
  };

  const getLastAccessText = (lastAccess: string | null) => {
    if (!lastAccess) return 'Nunca acessou';
    try {
      const lastAccessDate = new Date(lastAccess);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return 'Hoje';
      } else if (diffInDays === 1) {
        return 'Ontem';
      } else if (diffInDays <= 7) {
        return `há ${diffInDays} dias`;
      } else if (diffInDays <= 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
      } else {
        return `há ${formatDistanceToNow(lastAccessDate, { locale: ptBR })}`;
      }
    } catch {
      return 'Data inválida';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.is_active) ||
                         (filterStatus === 'inactive' && !member.is_active);
    const matchesAccess = filterAccess === 'all' || 
                         getLastAccessStatus(member.last_access) === filterAccess;
    return matchesSearch && matchesStatus && matchesAccess;
  });

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setEditModalOpen(true);
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Tem certeza que deseja remover ${member.name} da equipe?`)) {
      return;
    }

    try {
      await deleteMember(member.id);
      toast({
        title: 'Membro removido',
        description: `${member.name} foi removido da equipe.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao remover membro',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    try {
      await toggleMemberStatus(member.id, !member.is_active);
      toast({
        title: member.is_active ? 'Membro desativado' : 'Membro ativado',
        description: `${member.name} foi ${member.is_active ? 'desativado' : 'ativado'}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao alterar status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando equipe...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              Gestão de Equipe
            </h1>
            <p className="text-slate-400 mt-1">
              Gerencie os membros da sua equipe e suas permissões
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setRolesModalOpen(true)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              Perfis de Acesso
            </Button>
            <Button 
              onClick={() => setAddModalOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>
        </div>

        {/* Estatísticas de Acesso */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Acessaram Hoje</p>
                  <p className="text-2xl font-bold text-green-400">
                    {members.filter(m => getLastAccessStatus(m.last_access) === 'today').length}
                  </p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <span className="text-lg">🟢</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Esta Semana</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {members.filter(m => ['today', 'recent'].includes(getLastAccessStatus(m.last_access))).length}
                  </p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <span className="text-lg">🔵</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Inativos (30+ dias)</p>
                  <p className="text-2xl font-bold text-red-400">
                    {members.filter(m => getLastAccessStatus(m.last_access) === 'very-old').length}
                  </p>
                </div>
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <span className="text-lg">🔴</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Nunca Acessaram</p>
                  <p className="text-2xl font-bold text-slate-400">
                    {members.filter(m => getLastAccessStatus(m.last_access) === 'never').length}
                  </p>
                </div>
                <div className="p-2 bg-slate-500/20 rounded-lg">
                  <span className="text-lg">⚫</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
              >
                Todos ({members.length})
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
                className={filterStatus === 'active' ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
              >
                Ativos ({members.filter(m => m.is_active).length})
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('inactive')}
                className={filterStatus === 'inactive' ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
              >
                Inativos ({members.filter(m => !m.is_active).length})
              </Button>
            </div>
          </div>
          
          {/* Filtros de Último Acesso */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-slate-400 self-center mr-2">Último acesso:</span>
            <Button
              variant={filterAccess === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAccess('all')}
              className={filterAccess === 'all' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
            >
              Todos
            </Button>
            <Button
              variant={filterAccess === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAccess('today')}
              className={filterAccess === 'today' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
            >
              🟢 Hoje
            </Button>
            <Button
              variant={filterAccess === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAccess('recent')}
              className={filterAccess === 'recent' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
            >
              🔵 Esta semana
            </Button>
            <Button
              variant={filterAccess === 'old' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAccess('old')}
              className={filterAccess === 'old' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
            >
              🟡 Este mês
            </Button>
            <Button
              variant={filterAccess === 'very-old' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAccess('very-old')}
              className={filterAccess === 'very-old' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
            >
              🔴 Mais de 30 dias
            </Button>
            <Button
              variant={filterAccess === 'never' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAccess('never')}
              className={filterAccess === 'never' ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
            >
              ⚫ Nunca acessaram
            </Button>
          </div>
        </CardContent>
      </Card>

        {/* Lista de Membros */}
        {filteredMembers.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-white">
                {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro na equipe'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm 
                  ? 'Tente buscar com outros termos' 
                  : 'Adicione membros para começar a gerenciar sua equipe'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setAddModalOpen(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Membro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className={`bg-slate-800/50 border-slate-700 ${!member.is_active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl text-white">{member.name}</CardTitle>
                      {member.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Power className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-500 text-slate-400">
                          <PowerOff className="w-3 h-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                      {member.role && (
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                          <Shield className="w-3 h-3 mr-1" />
                          {member.role.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                      <span>{member.email}</span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = getLastAccessStatus(member.last_access);
                          const badge = getLastAccessBadge(status);
                          return (
                            <Badge variant="outline" className={`${badge.color} text-xs`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {badge.icon} {getLastAccessText(member.last_access)}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.user_id && (
                      <AssigneeColorPicker
                        userId={member.user_id}
                        memberName={member.name}
                        onColorChange={refetch}
                      />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-slate-700">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(member)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                        {member.is_active ? (
                          <>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(member)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

        {/* Modals */}
        <AddMemberModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onSuccess={() => {
            setAddModalOpen(false);
            refetch();
          }}
          roles={roles}
        />

        {selectedMember && (
          <EditMemberModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            member={selectedMember}
            roles={roles}
            onSuccess={() => {
              setEditModalOpen(false);
              refetch();
            }}
          />
        )}

        <RolesModal
          open={rolesModalOpen}
          onOpenChange={setRolesModalOpen}
          roles={roles}
          onRoleUpdated={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
