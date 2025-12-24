import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

export type CheckinStatus = 'pendente' | 'em_analise' | 'enviado';

export interface TeamMember {
  user_id: string;
  name: string;
  email: string;
  is_owner: boolean;
}

export interface CheckinNote {
  id: string;
  checkin_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface CheckinLockInfo {
  is_locked: boolean;
  locked_by?: string;
  locked_by_name?: string;
  locked_at?: string;
}

// Cache compartilhado para locks (evita múltiplas chamadas)
const lockStatusCache = new Map<string, { data: CheckinLockInfo; timestamp: number }>();
const LOCK_CACHE_TTL = 5000; // 5 segundos

// Flag global para evitar múltiplas chamadas de loadTeamMembers
let isLoadingTeamMembers = false;
let teamMembersPromise: Promise<void> | null = null;

export function useCheckinManagement() {
  const { user } = useAuthContext();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingMembersRef = useRef(false);

  // Carregar membros da equipe usando o mesmo padrão do sistema de reuniões
  const loadTeamMembers = useCallback(async () => {
    if (!user || loadingMembersRef.current) {
      // Se já existe uma promise em andamento, retornar ela
      if (teamMembersPromise) {
        return teamMembersPromise;
      }
      return;
    }
    
    loadingMembersRef.current = true;
    isLoadingTeamMembers = true;
    
    teamMembersPromise = (async () => {
      try {
        // Buscar membros da equipe com nome
        const { data: members, error } = await supabase
          .from("team_members")
          .select("user_id, name, email")
          .eq("owner_id", user.id);

        if (error) throw error;

        // Buscar informações do perfil do usuário atual (tentar user_profiles primeiro, depois profiles)
        let ownerName = user.email || "Você";
        
        // Tentar buscar de user_profiles primeiro
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();
        
        if (userProfile?.name) {
          ownerName = userProfile.name;
        } else {
          // Tentar buscar de profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, name")
            .eq("id", user.id)
            .maybeSingle();
          
          if (profile?.full_name || profile?.name) {
            ownerName = profile.full_name || profile.name || ownerName;
          }
        }

        // Buscar nomes dos perfis em batch para membros que não têm nome em team_members
        const membersWithoutNames = (members || []).filter(m => !m.name);
        const userIdsToFetch = membersWithoutNames.map(m => m.user_id);
        
        // Buscar todos os perfis de uma vez (mais eficiente)
        let userProfilesMap = new Map<string, string>();
        if (userIdsToFetch.length > 0) {
          const { data: userProfiles } = await supabase
            .from("user_profiles")
            .select("id, name")
            .in("id", userIdsToFetch);
          
          userProfiles?.forEach(p => {
            if (p.name) userProfilesMap.set(p.id, p.name);
          });
          
          // Se ainda faltar, buscar de profiles
          const missingIds = userIdsToFetch.filter(id => !userProfilesMap.has(id));
          if (missingIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name, name")
              .in("id", missingIds);
            
            profiles?.forEach(p => {
              const name = p.full_name || p.name;
              if (name) userProfilesMap.set(p.id, name);
            });
          }
        }

        // Mapear membros com nome
        const membersWithNames = (members || []).map((member: any) => ({
          user_id: member.user_id,
          name: member.name || userProfilesMap.get(member.user_id) || member.email || "Sem nome",
          email: member.email || "",
          is_owner: false
        }));

        // Adicionar o próprio usuário à lista (com nome do perfil se disponível)
        const allMembers = [
          { 
            user_id: user.id, 
            name: ownerName,
            email: user.email || "",
            is_owner: true 
          },
          ...membersWithNames
        ];

        setTeamMembers(allMembers);
      } catch (error: any) {
        // Log mais detalhado apenas em desenvolvimento e apenas se não for erro esperado
        if (process.env.NODE_ENV === 'development' && error?.code !== 'PGRST116') {
          console.error('Erro ao carregar membros da equipe:', error);
        }
        // Fallback: apenas o usuário atual
        setTeamMembers([{
          user_id: user.id,
          name: user.email || 'Você',
          email: user.email || '',
          is_owner: true
        }]);
      } finally {
        loadingMembersRef.current = false;
        isLoadingTeamMembers = false;
        teamMembersPromise = null;
      }
    })();
    
    return teamMembersPromise;
  }, [user]);

  // Atualizar status do check-in (sem toast para ser mais rápido)
  const updateCheckinStatus = useCallback(async (checkinId: string, status: CheckinStatus) => {
    try {
      const { error } = await supabase
        .from('checkin')
        .update({ status })
        .eq('id', checkinId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  }, []);

  // Atribuir responsável ao check-in (sem toast para ser mais rápido)
  const assignCheckin = useCallback(async (checkinId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('checkin')
        .update({ assigned_to: userId })
        .eq('id', checkinId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      return false;
    }
  }, []);

  // Verificar status do lock (com cache)
  const checkLockStatus = useCallback(async (checkinId: string): Promise<CheckinLockInfo> => {
    // Verificar cache primeiro
    const cached = lockStatusCache.get(checkinId);
    if (cached && Date.now() - cached.timestamp < LOCK_CACHE_TTL) {
      return cached.data;
    }
    
    try {
      const { data, error } = await supabase
        .from('checkin')
        .select(`
          locked_by,
          locked_at
        `)
        .eq('id', checkinId)
        .single();
      
      if (error) throw error;
      
      if (!data?.locked_by || !data?.locked_at) {
        const lockInfo: CheckinLockInfo = { is_locked: false };
        lockStatusCache.set(checkinId, { data: lockInfo, timestamp: Date.now() });
        return lockInfo;
      }
      
      // Verificar se o lock expirou (30 minutos)
      const lockTime = new Date(data.locked_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lockTime.getTime()) / (1000 * 60);
      
      if (diffMinutes > 30) {
        // Lock expirado, limpar automaticamente
        await supabase
          .from('checkin')
          .update({ locked_by: null, locked_at: null })
          .eq('id', checkinId);
        
        const lockInfo: CheckinLockInfo = { is_locked: false };
        lockStatusCache.set(checkinId, { data: lockInfo, timestamp: Date.now() });
        return lockInfo;
      }
      
      // Verificar se é o próprio usuário atual
      let lockedByName = 'Usuário desconhecido';
      
      if (user && data.locked_by === user.id) {
        lockedByName = 'Você';
      } else {
        // Buscar nome do usuário que fez o lock (tentar user_profiles primeiro, depois profiles)
        // Tentar buscar de user_profiles primeiro
        const { data: lockedUserProfile } = await supabase
          .from("user_profiles")
          .select("name")
          .eq("id", data.locked_by)
          .maybeSingle();
        
        if (lockedUserProfile?.name) {
          lockedByName = lockedUserProfile.name;
        } else {
          // Tentar buscar de profiles
          const { data: lockedProfile } = await supabase
            .from("profiles")
            .select("full_name, name")
            .eq("id", data.locked_by)
            .maybeSingle();
          
          if (lockedProfile?.full_name || lockedProfile?.name) {
            lockedByName = lockedProfile.full_name || lockedProfile.name || lockedByName;
          } else {
            // Último recurso: usar teamMembers se disponível
            const lockedUser = teamMembers.find(m => m.user_id === data.locked_by);
            if (lockedUser?.name) {
              lockedByName = lockedUser.name;
            }
          }
        }
      }
      
      const lockInfo: CheckinLockInfo = {
        is_locked: true,
        locked_by: data.locked_by,
        locked_by_name: lockedByName,
        locked_at: data.locked_at
      };
      
      lockStatusCache.set(checkinId, { data: lockInfo, timestamp: Date.now() });
      return lockInfo;
    } catch (error: any) {
      // Log mais detalhado apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao verificar lock:', error);
      }
      const lockInfo: CheckinLockInfo = { is_locked: false };
      lockStatusCache.set(checkinId, { data: lockInfo, timestamp: Date.now() });
      return lockInfo;
    }
  }, [teamMembers]);

  // Adquirir lock para edição
  const acquireLock = useCallback(async (checkinId: string): Promise<boolean> => {
    try {
      if (!user) return false;

      // Primeiro verificar se já está locked
      const lockStatus = await checkLockStatus(checkinId);
      if (lockStatus.is_locked && lockStatus.locked_by !== user.id) {
        toast.error(`Check-in está sendo editado por ${lockStatus.locked_by_name}`);
        return false;
      }
      
      // Adquirir o lock
      const { error } = await supabase
        .from('checkin')
        .update({ 
          locked_by: user.id, 
          locked_at: new Date().toISOString() 
        })
        .eq('id', checkinId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erro ao adquirir lock:', error);
      toast.error('Erro ao adquirir lock de edição');
      return false;
    }
  }, [user, checkLockStatus]);

  // Liberar lock de edição (permite liberar se for o próprio usuário ou se o lock expirou)
  const releaseLock = useCallback(async (checkinId: string): Promise<boolean> => {
    try {
      if (!user) return false;

      // Primeiro verificar o status atual do lock
      const lockStatus = await checkLockStatus(checkinId);
      
      // Se não está locked, já está ok
      if (!lockStatus.is_locked) {
        return true;
      }
      
      // Se está locked por outro usuário, verificar se expirou
      if (lockStatus.locked_by && lockStatus.locked_by !== user.id) {
        // Verificar novamente se expirou (pode ter mudado desde o cache)
        if (lockStatus.locked_at) {
          const lockTime = new Date(lockStatus.locked_at);
          const now = new Date();
          const diffMinutes = (now.getTime() - lockTime.getTime()) / (1000 * 60);
          
          if (diffMinutes > 30) {
            // Lock expirado, pode liberar
          } else {
            // Ainda está locked por outro usuário
            return false;
          }
        }
      }
      
      // Liberar o lock (permite mesmo se for outro usuário mas expirou)
      const { error } = await supabase
        .from('checkin')
        .update({ locked_by: null, locked_at: null })
        .eq('id', checkinId);
      
      if (error) throw error;
      
      // Invalidar cache
      lockStatusCache.delete(checkinId);
      
      return true;
    } catch (error) {
      console.error('Erro ao liberar lock:', error);
      return false;
    }
  }, [user, checkLockStatus]);

  // Carregar anotações do check-in
  const loadCheckinNotes = useCallback(async (checkinId: string): Promise<CheckinNote[]> => {
    try {
      const { data, error } = await supabase
        .from('checkin_notes')
        .select('*')
        .eq('checkin_id', checkinId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar nomes dos usuários
      const notesWithNames = await Promise.all((data || []).map(async (note) => {
        let userName = 'Usuário';
        
        // Primeiro tentar buscar nos membros da equipe
        const teamMember = teamMembers.find(member => member.user_id === note.user_id);
        if (teamMember?.name) {
          userName = teamMember.name;
        } else {
          // Tentar buscar de user_profiles
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("name")
            .eq("id", note.user_id)
            .maybeSingle();
          
          if (userProfile?.name) {
            userName = userProfile.name;
          } else {
            // Tentar buscar de profiles
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, name")
              .eq("id", note.user_id)
              .maybeSingle();
            
            if (profile?.full_name || profile?.name) {
              userName = profile.full_name || profile.name || userName;
            }
          }
        }
        
        return {
          ...note,
          user_name: userName
        };
      }));
      
      return notesWithNames;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao carregar anotações:', error);
      }
      return [];
    }
  }, [teamMembers]);

  // Adicionar anotação ao check-in
  const addCheckinNote = useCallback(async (checkinId: string, note: string): Promise<boolean> => {
    try {
      if (!user) return false;

      const { error } = await supabase
        .from('checkin_notes')
        .insert({
          checkin_id: checkinId,
          user_id: user.id,
          note: note.trim()
        });
      
      if (error) throw error;
      
      toast.success('Anotação adicionada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      toast.error('Erro ao adicionar anotação');
      return false;
    }
  }, [user]);

  // Atualizar anotação
  const updateCheckinNote = useCallback(async (noteId: string, note: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('checkin_notes')
        .update({ note: note.trim() })
        .eq('id', noteId);
      
      if (error) throw error;
      
      toast.success('Anotação atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar anotação:', error);
      toast.error('Erro ao atualizar anotação');
      return false;
    }
  }, []);

  // Deletar anotação
  const deleteCheckinNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('checkin_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
      
      toast.success('Anotação removida com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao remover anotação:', error);
      toast.error('Erro ao remover anotação');
      return false;
    }
  }, []);

  // Limpar locks expirados (função utilitária)
  const cleanupExpiredLocks = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_locks');
      
      if (error) throw error;
      
      console.log(`${data || 0} locks expirados foram limpos`);
      return data || 0;
    } catch (error) {
      console.error('Erro ao limpar locks expirados:', error);
      return 0;
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  return {
    // Estado
    teamMembers,
    loading,
    
    // Funções
    loadTeamMembers,
    updateCheckinStatus,
    assignCheckin,
    acquireLock,
    releaseLock,
    checkLockStatus,
    loadCheckinNotes,
    addCheckinNote,
    updateCheckinNote,
    deleteCheckinNote,
    cleanupExpiredLocks
  };
}