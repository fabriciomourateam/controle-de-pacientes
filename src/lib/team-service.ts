import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from './supabase-admin';
import { any } from 'zod';
import { any } from 'zod';
import { number } from 'framer-motion';
import { string } from 'zod';
import { any } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { boolean } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { boolean } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { string } from 'zod';
import { boolean } from 'zod';

// Função auxiliar para verificar permissões
export function hasPermission(
  permissions: Record<string, any> | null | undefined,
  resource: string,
  action?: string
): boolean {
  if (!permissions) return false; // Sem permissões = sem acesso

  // Navegar pela estrutura de permissões
  const parts = resource.split('.');
  let current: any = permissions;

  for (const part of parts) {
    if (current[part] === undefined) return false;
    current = current[part];
  }

  // Se tem action específica, verificar
  if (action) {
    return current[action] === true;
  }

  // Se não tem action, verificar se o recurso está habilitado
  return current === true || (typeof current === 'object' && Object.values(current).some(v => v === true));
}

export interface TeamRole {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, any>;
  is_system_role: boolean;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  owner_id: string;
  user_id: string | null;
  email: string;
  name: string;
  role_id: string | null;
  role?: TeamRole;
  permissions?: Record<string, any> | null;
  is_active: boolean;
  invited_at: string;
  accepted_at: string | null;
  last_access: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamMemberInput {
  email: string;
  name: string;
  role_id: string;
  permissions?: Record<string, any>;
  send_invite?: boolean;
  password?: string; // Para cadastro direto
}

export interface UpdateTeamMemberInput {
  name?: string;
  email?: string;
  role_id?: string;
  permissions?: Record<string, any> | null;
  is_active?: boolean;
}

export const teamService = {
  // ============================================
  // ROLES (Perfis de Acesso)
  // ============================================

  async getRoles(): Promise<TeamRole[]> {
    const { data, error } = await (supabase as any)
      .from('team_roles')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getRoleById(roleId: string): Promise<TeamRole | null> {
    const { data, error } = await (supabase as any)
      .from('team_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) throw error;
    return data;
  },

  async createRole(role: Omit<TeamRole, 'id' | 'created_at' | 'updated_at'>): Promise<TeamRole> {
    const { data, error } = await (supabase as any)
      .from('team_roles')
      .insert(role)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRole(roleId: string, updates: Partial<TeamRole>): Promise<TeamRole> {
    const { data, error } = await (supabase as any)
      .from('team_roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRole(roleId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('team_roles')
      .delete()
      .eq('id', roleId)
      .eq('is_system_role', false); // Só permite deletar roles customizados

    if (error) throw error;
  },

  // ============================================
  // TEAM MEMBERS (Membros da Equipe)
  // ============================================

  async getTeamMembers(): Promise<TeamMember[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await (supabase as any).from('team_members')
      .select(`
        *,
        role:team_roles(*)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTeamMemberById(memberId: string): Promise<TeamMember | null> {
    const { data, error } = await (supabase as any).from('team_members')
      .select(`
        *,
        role:team_roles(*)
      `)
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return data;
  },

  async createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Se for cadastro direto (com senha)
    if (input.password && !input.send_invite) {
      // Validar senha
      if (input.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      // Criar usuário no Supabase Auth usando admin client
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      });

      if (authError) {
        console.error('Erro ao criar usuário:', authError);
        if (authError.message.includes('already registered')) {
          throw new Error('Este email já está cadastrado no sistema');
        }
        throw new Error(authError.message || 'Erro ao criar usuário');
      }

      // Criar perfil do usuário
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUser.user.id,
        full_name: input.name,
        role: 'member',
      });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Continua mesmo se falhar, pois o perfil pode já existir
      }

      // Criar membro da equipe vinculado ao usuário (usando admin para ignorar RLS)
      console.log('Criando membro:', {
        owner_id: user.id,
        user_id: newUser.user.id,
        email: input.email,
        name: input.name,
        role_id: input.role_id,
      });

      const { data, error } = await supabaseAdmin.from('team_members')
        .insert({
          owner_id: user.id,
          user_id: newUser.user.id,
          email: input.email,
          name: input.name,
          role_id: input.role_id,
          permissions: input.permissions || null,
          is_active: true,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        })
        .select(`
          *,
          role:team_roles(*)
        `);

      if (error) {
        console.error('Erro ao criar membro:', error);
        throw new Error(`Erro ao criar membro: ${error.message}`);
      }

      console.log('Membro criado com sucesso:', data);
      return data[0]; // Retorna o primeiro item do array
    }

    // Se for enviar convite por email
    const { data, error } = await (supabase as any).from('team_members')
      .insert({
        owner_id: user.id,
        email: input.email,
        name: input.name,
        role_id: input.role_id,
        is_active: true,
      })
      .select(`
        *,
        role:team_roles(*)
      `)
      .single();

    if (error) throw error;

    // TODO: Enviar email de convite
    if (input.send_invite) {
      // Implementar envio de email
      console.log('Enviar convite para:', input.email);
    }

    return data;
  },

  async updateTeamMember(memberId: string, updates: UpdateTeamMemberInput): Promise<TeamMember> {
    const { data, error } = await (supabase as any).from('team_members')
      .update(updates)
      .eq('id', memberId)
      .select(`
        *,
        role:team_roles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTeamMember(memberId: string): Promise<void> {
    const { error } = await (supabase as any).from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

  async toggleMemberStatus(memberId: string, isActive: boolean): Promise<TeamMember> {
    return this.updateTeamMember(memberId, { is_active: isActive });
  },

  // ============================================
  // PERMISSIONS (Verificação de Permissões)
  // ============================================

  async getCurrentUserPermissions(): Promise<Record<string, any> | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Verificar se é membro de alguma equipe
    const { data: member } = await (supabase as any).from('team_members')
      .select(`
        *,
        role:team_roles(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!member || !member.role) return null;

    return member.role.permissions;
  },

  hasPermission(permissions: Record<string, any> | null, resource: string, action?: string): boolean {
    if (!permissions) return true; // Owner tem todas as permissões

    const parts = resource.split('.');
    let current: any = permissions;

    for (const part of parts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }

    if (action) {
      return current[action] === true;
    }

    return current === true;
  },

  // ============================================
  // ACCESS LOGS (Logs de Acesso)
  // ============================================

  async logAccess(memberId: string, action: string, resource?: string, details?: any): Promise<void> {
    await (supabase as any).from('team_access_logs')
      .insert({
        team_member_id: memberId,
        action,
        resource,
        details,
      });
  },

  async getAccessLogs(memberId?: string, limit: number = 100): Promise<any[]> {
    let query = (supabase as any)
      .from('team_access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (memberId) {
      query = query.eq('team_member_id', memberId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};


