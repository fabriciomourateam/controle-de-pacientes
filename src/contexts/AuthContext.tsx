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
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (user: User) => {
    try {
      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

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
      // Se der erro, assume que é owner
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
