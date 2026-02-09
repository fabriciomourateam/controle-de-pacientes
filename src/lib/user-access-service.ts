import { supabase } from '@/integrations/supabase/client';

export interface UserAccessControl {
  id: string;
  user_id: string;
  route_metrics: boolean;
  route_commercial_metrics: boolean;
  route_reports: boolean;
  route_plans: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessRoutes {
  route_metrics: boolean;
  route_commercial_metrics: boolean;
  route_reports: boolean;
  route_plans: boolean;
}

const DEFAULT_ACCESS: AccessRoutes = {
  route_metrics: false,
  route_commercial_metrics: false,
  route_reports: false,
  route_plans: false,
};

export const userAccessService = {
  /**
   * Buscar controle de acesso do usuario logado
   */
  async getMyAccess(): Promise<AccessRoutes> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_ACCESS;

    const { data, error } = await supabase
      .from('user_access_control' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return DEFAULT_ACCESS;

    const row = data as unknown as UserAccessControl;
    return {
      route_metrics: row.route_metrics,
      route_commercial_metrics: row.route_commercial_metrics,
      route_reports: row.route_reports,
      route_plans: row.route_plans,
    };
  },

  /**
   * Buscar controle de acesso de um usuario especifico (admin)
   */
  async getAccessForUser(userId: string): Promise<AccessRoutes> {
    const { data, error } = await supabase
      .from('user_access_control' as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return DEFAULT_ACCESS;

    const row = data as unknown as UserAccessControl;
    return {
      route_metrics: row.route_metrics,
      route_commercial_metrics: row.route_commercial_metrics,
      route_reports: row.route_reports,
      route_plans: row.route_plans,
    };
  },

  /**
   * Buscar controle de acesso de TODOS os usuarios (admin)
   */
  async getAllAccess(): Promise<Record<string, AccessRoutes>> {
    const { data, error } = await supabase
      .from('user_access_control' as any)
      .select('*');

    if (error || !data) return {};

    const result: Record<string, AccessRoutes> = {};
    for (const row of data as unknown as UserAccessControl[]) {
      result[row.user_id] = {
        route_metrics: row.route_metrics,
        route_commercial_metrics: row.route_commercial_metrics,
        route_reports: row.route_reports,
        route_plans: row.route_plans,
      };
    }
    return result;
  },

  /**
   * Atualizar ou criar controle de acesso (admin only)
   */
  async updateAccess(userId: string, routes: Partial<AccessRoutes>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Nao autenticado');

    // Verificar se ja existe registro
    const { data: existing } = await supabase
      .from('user_access_control' as any)
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from('user_access_control' as any)
        .update({ ...routes, updated_by: user.id })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Criar
      const { error } = await supabase
        .from('user_access_control' as any)
        .insert({
          user_id: userId,
          route_metrics: false,
          route_commercial_metrics: false,
          route_reports: false,
          route_plans: false,
          ...routes,
          updated_by: user.id,
        });

      if (error) throw error;
    }
  },

  /**
   * Deletar controle de acesso (admin only)
   */
  async deleteAccess(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_access_control' as any)
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },
};
