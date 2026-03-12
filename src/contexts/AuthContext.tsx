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

      let profileData = null;
      let profileError = null;

      try {
        const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
        profileData = data;
        profileError = error;
      } catch (err) {
        profileError = err;
      }

      // Se o perfil não existe, criar um básico usando metadata do auth
      if (!profileData && (!profileError || profileError.code === 'PGRST116')) {
        console.log('Perfil não encontrado, criando automático...');
        const { data: newProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (!upsertError) {
          profileData = newProfile;
        }
      } else if (profileError) {
        throw profileError;
      }

      // Verificar se é membro de alguma equipe (primeiro por ID, depois por e-mail como fallback)
      let { data: memberDataArray, error: memberError } = await (supabase as any)
        .from('team_members')
        .select('*, role:team_roles(*)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Se não achou por ID, tenta por e-mail (para vincular usuários novos) - agora insensitivo a maiúsculas
      if ((!memberDataArray || memberDataArray.length === 0) && user.email) {
        console.log('Buscando membro por e-mail para vinculação (insensitivo)...');
        const { data: byEmail, error: emailError } = await (supabase as any)
          .from('team_members')
          .select('*, role:team_roles(*)')
          .ilike('email', user.email)
          .eq('is_active', true);
        
        if (byEmail && byEmail.length > 0) {
          memberDataArray = byEmail;
          // Vincular o user_id automaticamente para futuros logins
          console.log('Vinculando user_id ao membro da equipe...');
          await (supabase as any)
            .from('team_members')
            .update({ user_id: user.id } as any)
            .eq('id', byEmail[0].id);
        }
      }

      const memberData = memberDataArray?.[0] as any;

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
        // É owner APENAS se não for explicitamente um 'member' no perfil
        const isActuallyOwner = profileData?.role !== 'member';
        
        setProfile({
          id: user.id,
          email: user.email || '',
          name: profileData?.full_name,
          role: profileData?.role,
          permissions: undefined,
          is_owner: isActuallyOwner,
        });
      }
    } catch (error) {
      console.error('Erro crítico ao carregar perfil:', error);
      if (retries > 0) {
        console.log(`Tentando recarregar perfil... (${retries} tentativas restantes)`);
        setTimeout(() => loadProfile(user, retries - 1), 1000);
        return;
      }

      // Se falhar tudo, NÃO assumir is_owner: true por padrão se for um erro de rede
      // Mantém profile como null para que o AppSidebar não mostre nada indevido
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateLastAccess = async (memberId: string) => {
    try {
      await (supabase as any)
        .from('team_members')
        .update({ last_access: new Date().toISOString() } as any)
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
