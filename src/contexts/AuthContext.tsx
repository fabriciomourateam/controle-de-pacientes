import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { teamService } from '@/lib/team-service';

interface Profile {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: Record<string, any>;
  is_owner?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hasPermission: (resource: string, action?: string) => boolean;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de segurança para não travar no loading (5 segundos)
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Função para recuperar sessão com tentativas
    const recoverSession = async (retries = 3) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user);
        } else {
          // Tentar refresh do token se não houver sessão válida
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshedSession?.user) {
            setUser(refreshedSession.user);
            loadProfile(refreshedSession.user);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Erro na verificação de sessão:', error);
        if (retries > 0) {
          // Tentar novamente em 1s
          setTimeout(() => recoverSession(retries - 1), 1000);
        } else {
          clearTimeout(timeoutId);
          setLoading(false);
          // Só limpar se for um erro fatal de autenticação
          if (error.message?.includes('invalid_grant') || error.message?.includes('Invalid Refresh Token')) {
            console.log('Sessão inválida irrecuperável. Limpando dados.');
            supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          }
        }
      }
    };

    recoverSession();

    // Escutar mudanças de autenticação com tratamento robusto
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('Auth state change:', event);

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token renovado com sucesso');
      }

      if (session?.user) {
        setUser(session.user);
        // Só recarregar perfil se mudou o usuário ou se ainda não tem perfil
        if (!profile || profile.id !== session.user.id) {
          loadProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (user: User, retries = 2) => {
    try {
      // Implementar um timeout interno para a busca do perfil para evitar travamentos em conexões ruins
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const timeoutPromise = new Promise<{ data: any, error?: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('O tempo de conexão com o servidor esgotou') }), 8000)
      );

      const { data: profileData, error: profileError } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (profileError) throw profileError;

      // Verificar se é membro de alguma equipe
      const { data: memberDataArray } = await supabase
        .from('team_members')
        .select('*, role:team_roles(*)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const memberData = memberDataArray?.[0];

      if (memberData) {
        // É membro da equipe - atualizar último acesso
        await updateLastAccess(memberData.id);

        const permissions = memberData.permissions || memberData.role?.permissions || {};

        setProfile({
          id: user.id,
          email: user.email || '',
          name: profileData?.full_name || memberData.name,
          role: memberData.role?.name,
          permissions: permissions,
          is_owner: false,
        });
      } else {
        // É owner
        setProfile({
          id: user.id,
          email: user.email || '',
          name: profileData?.full_name,
          role: profileData?.role,
          permissions: undefined,
          is_owner: true,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (retries > 0) {
        console.log(`Tentando recarregar perfil... (${retries} tentativas restantes)`);
        // Aguarda 1s e tenta novamente
        setTimeout(() => loadProfile(user, retries - 1), 1000);
        return; // Retorna para não setar o loading como false ainda
      }

      // Se der erro mesmo após as tentativas, assume que é owner (modo offline/fallback)
      setProfile({
        id: user.id,
        email: user.email || '',
        is_owner: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLastAccess = async (memberId: string) => {
    try {
      await supabase
        .from('team_members')
        .update({ last_access: new Date().toISOString() })
        .eq('id', memberId);
    } catch (error) {
      console.error('Erro ao atualizar último acesso:', error);
      // Não bloquear o login se falhar
    }
  };

  const hasPermission = (resource: string, action?: string): boolean => {
    // Owner tem todas as permissões
    if (profile?.is_owner) return true;

    // Se não tem permissões definidas, não tem acesso
    if (!profile?.permissions) return false;

    // Verificar permissão específica
    return teamService.hasPermission(profile.permissions, resource, action);
  };

  const isOwner = profile?.is_owner ?? false;

  return (
    <AuthContext.Provider value={{ user, profile, loading, hasPermission, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
