import { useState, useEffect } from 'react';
import { teamService, TeamMember, TeamRole, CreateTeamMemberInput, UpdateTeamMemberInput } from '@/lib/team-service';

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamService.getTeamMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await teamService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Erro ao carregar roles:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchRoles();
  }, []);

  const addMember = async (input: CreateTeamMemberInput) => {
    try {
      const newMember = await teamService.createTeamMember(input);
      setMembers(prev => [newMember, ...prev]);
      return newMember;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro');
      throw err;
    }
  };

  const updateMember = async (memberId: string, updates: UpdateTeamMemberInput) => {
    try {
      const updatedMember = await teamService.updateTeamMember(memberId, updates);
      setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
      return updatedMember;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar membro');
      throw err;
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      await teamService.deleteTeamMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover membro');
      throw err;
    }
  };

  const toggleMemberStatus = async (memberId: string, isActive: boolean) => {
    try {
      const updatedMember = await teamService.toggleMemberStatus(memberId, isActive);
      setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
      return updatedMember;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
      throw err;
    }
  };

  return {
    members,
    roles,
    loading,
    error,
    refetch: fetchMembers,
    addMember,
    updateMember,
    deleteMember,
    toggleMemberStatus,
  };
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await teamService.getCurrentUserPermissions();
        setPermissions(perms);
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const hasPermission = (resource: string, action?: string) => {
    return teamService.hasPermission(permissions, resource, action);
  };

  return {
    permissions,
    loading,
    hasPermission,
    isOwner: permissions === null, // Se não tem permissões, é owner
  };
}
