/**
 * Serviço para operações administrativas
 * Apenas o admin pode usar estas funções
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  subscription?: {
    id: string;
    status: string;
    plan_name: string;
    plan_display_name: string;
    current_period_end: string | null;
  };
  stats: {
    total_patients: number;
    total_checkins: number;
    total_payments: number;
    total_revenue: number;
  };
}

export interface AdminMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
  totalPatients: number;
  totalCheckins: number;
  monthlyRecurringRevenue: number; // MRR
  totalRevenue: number;
  averageRevenuePerUser: number; // ARPU
  churnRate: number;
  growthRate: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  newSubscriptions: number;
  cancellations: number;
}

export const adminService = {
  /**
   * Buscar todos os usuários com suas estatísticas
   */
  async getAllUsers(): Promise<AdminUser[]> {
    // Buscar usuários através de user_profiles (não podemos acessar auth.users diretamente)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Buscar todas as assinaturas
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        status,
        subscription_plans (name, display_name),
        current_period_end
      `);

    // Criar mapa de assinaturas por user_id
    const subscriptionsMap = new Map();
    subscriptions?.forEach(sub => {
      subscriptionsMap.set(sub.user_id, {
        id: sub.user_id,
        status: sub.status,
        plan_name: (sub.subscription_plans as any)?.name || 'N/A',
        plan_display_name: (sub.subscription_plans as any)?.display_name || 'N/A',
        current_period_end: sub.current_period_end
      });
    });

    // Buscar estatísticas para cada usuário
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const stats = await this.getUserStats(profile.id);
        const subscription = subscriptionsMap.get(profile.id) || null;
        
        return {
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
          last_sign_in_at: null, // Não temos acesso direto a este campo
          subscription,
          stats
        };
      })
    );

    return usersWithStats;
  },

  /**
   * Buscar assinatura de um usuário
   */
  async getUserSubscription(userId: string) {
    const { data } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        status,
        subscription_plans (name, display_name),
        current_period_end
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      status: data.status,
      plan_name: (data.subscription_plans as any)?.name || 'N/A',
      plan_display_name: (data.subscription_plans as any)?.display_name || 'N/A',
      current_period_end: data.current_period_end
    };
  },

  /**
   * Buscar estatísticas de um usuário
   */
  async getUserStats(userId: string) {
    // Contar pacientes
    const { count: patientsCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Contar checkins
    const { count: checkinsCount } = await supabase
      .from('checkin')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Buscar pagamentos
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('user_id', userId)
      .eq('status', 'paid');

    const totalPayments = payments?.length || 0;
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    return {
      total_patients: patientsCount || 0,
      total_checkins: checkinsCount || 0,
      total_payments: totalPayments,
      total_revenue: totalRevenue
    };
  },

  /**
   * Buscar métricas agregadas do sistema
   */
  async getAdminMetrics(): Promise<AdminMetrics> {
    // Contar usuários (através de user_profiles)
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Buscar assinaturas
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('status');

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
    const trialSubscriptions = subscriptions?.filter(s => s.status === 'trial').length || 0;
    const canceledSubscriptions = subscriptions?.filter(s => s.status === 'canceled').length || 0;

    // Contar pacientes totais
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    // Contar checkins totais
    const { count: totalCheckins } = await supabase
      .from('checkin')
      .select('*', { count: 'exact', head: true });

    // Calcular receita
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('status', 'paid');

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    // Calcular MRR (Monthly Recurring Revenue)
    // Buscar assinaturas ativas e seus planos
    const { data: activeSubsWithPlans } = await supabase
      .from('user_subscriptions')
      .select(`
        subscription_plans (price_monthly)
      `)
      .eq('status', 'active');

    const monthlyRecurringRevenue = activeSubsWithPlans?.reduce((sum, sub) => {
      const price = (sub.subscription_plans as any)?.price_monthly || 0;
      return sum + Number(price);
    }, 0) || 0;

    // Calcular ARPU (Average Revenue Per User)
    const averageRevenuePerUser = activeSubscriptions > 0 
      ? monthlyRecurringRevenue / activeSubscriptions 
      : 0;

    // Calcular churn rate (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: cancellationsLast30Days } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('canceled_at', thirtyDaysAgo.toISOString());

    const churnRate = activeSubscriptions > 0
      ? (cancellationsLast30Days || 0) / activeSubscriptions * 100
      : 0;

    // Calcular growth rate (novos usuários últimos 30 dias vs mês anterior)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { count: newUsersLast30Days } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: newUsersPrevious30Days } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const growthRate = (newUsersPrevious30Days || 0) > 0
      ? ((newUsersLast30Days || 0) - (newUsersPrevious30Days || 0)) / (newUsersPrevious30Days || 0) * 100
      : 0;

    return {
      totalUsers: totalUsers || 0,
      activeSubscriptions,
      trialSubscriptions,
      canceledSubscriptions,
      totalPatients: totalPatients || 0,
      totalCheckins: totalCheckins || 0,
      monthlyRecurringRevenue,
      totalRevenue,
      averageRevenuePerUser,
      churnRate,
      growthRate
    };
  },

  /**
   * Buscar dados de receita por mês
   */
  async getRevenueData(): Promise<RevenueData[]> {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, created_at, status')
      .eq('status', 'paid')
      .order('created_at', { ascending: true });

    if (!payments) return [];

    // Agrupar por mês
    const monthlyData = new Map<string, { revenue: number; newSubscriptions: number; cancellations: number }>();

    payments.forEach(payment => {
      const date = new Date(payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { revenue: 0, newSubscriptions: 0, cancellations: 0 });
      }

      const data = monthlyData.get(monthKey)!;
      data.revenue += Number(payment.amount || 0);
    });

    // Buscar novas assinaturas por mês
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('status, created_at, canceled_at')
      .order('created_at', { ascending: true });

    subscriptions?.forEach(sub => {
      const date = new Date(sub.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData.has(monthKey)) {
        monthlyData.get(monthKey)!.newSubscriptions++;
      }

      if (sub.status === 'canceled' && sub.canceled_at) {
        const cancelDate = new Date(sub.canceled_at);
        const cancelMonthKey = `${cancelDate.getFullYear()}-${String(cancelDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData.has(cancelMonthKey)) {
          monthlyData.get(cancelMonthKey)!.cancellations++;
        }
      }
    });

    // Converter para array e formatar
    return Array.from(monthlyData.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        return {
          month: monthName,
          revenue: data.revenue,
          newSubscriptions: data.newSubscriptions,
          cancellations: data.cancellations
        };
      })
      .sort((a, b) => {
        // Ordenar por data
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  },

  /**
   * Desativar/ativar usuário (através de assinatura)
   */
  async toggleUserStatus(userId: string, active: boolean): Promise<void> {
    // Atualizar status da assinatura
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: active ? 'active' : 'canceled',
        canceled_at: active ? null : new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  }
};

