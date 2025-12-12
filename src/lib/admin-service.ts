/**
 * Serviço para operações administrativas
 * Apenas o admin pode usar estas funções
 */

import { supabase } from '@/integrations/supabase/client';
import { subscriptionService } from './subscription-service';

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

    // Buscar assinatura mais recente para cada usuário
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const stats = await this.getUserStats(profile.id);
        
        // Buscar a assinatura mais recente deste usuário
        const { data: subscriptionData } = await (supabase as any)
          .from('user_subscriptions')
          .select(`
            user_id,
            status,
            subscription_plans (name, display_name),
            current_period_end,
            trial_end,
            created_at
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const subscription = subscriptionData ? {
          id: subscriptionData.user_id,
          status: subscriptionData.status,
          plan_name: (subscriptionData.subscription_plans as any)?.name || 'N/A',
          plan_display_name: (subscriptionData.subscription_plans as any)?.display_name || 'N/A',
          // Para trials, usar trial_end; para outros, usar current_period_end
          current_period_end: subscriptionData.status === 'trial' 
            ? subscriptionData.trial_end 
            : subscriptionData.current_period_end
        } : null;
        
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
    const { data } = await (supabase as any)
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

    // Buscar assinaturas mais recentes de cada usuário
    // Primeiro, buscar todos os user_ids únicos
    const { data: allSubscriptions, error: subscriptionsError } = await (supabase as any)
      .from('user_subscriptions')
      .select('user_id, status, created_at')
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      console.error('Erro ao buscar assinaturas:', subscriptionsError);
    }

    // Debug: log das assinaturas encontradas
    console.log('Total de assinaturas encontradas:', allSubscriptions?.length || 0);
    console.log('Assinaturas por status:', {
      trial: allSubscriptions?.filter(s => s.status === 'trial').length || 0,
      active: allSubscriptions?.filter(s => s.status === 'active').length || 0,
      canceled: allSubscriptions?.filter(s => s.status === 'canceled').length || 0,
      outras: allSubscriptions?.filter(s => !['trial', 'active', 'canceled'].includes(s.status)).length || 0
    });

    // Criar mapa com a assinatura mais recente de cada usuário
    const latestSubscriptionsMap = new Map<string, string>();
    allSubscriptions?.forEach(sub => {
      if (!latestSubscriptionsMap.has(sub.user_id)) {
        latestSubscriptionsMap.set(sub.user_id, sub.status);
      }
    });

    // Contar por status apenas das assinaturas mais recentes
    let activeSubscriptions = 0;
    let trialSubscriptions = 0;
    let canceledSubscriptions = 0;

    latestSubscriptionsMap.forEach((status) => {
      if (status === 'active') {
        activeSubscriptions++;
      } else if (status === 'trial') {
        trialSubscriptions++;
      } else if (status === 'canceled') {
        canceledSubscriptions++;
      }
    });

    // Debug: log do resultado final
    console.log('Contagem final (apenas assinaturas mais recentes):', {
      trial: trialSubscriptions,
      active: activeSubscriptions,
      canceled: canceledSubscriptions,
      totalUsuariosComAssinatura: latestSubscriptionsMap.size
    });

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
    const { data: activeSubsWithPlans } = await (supabase as any)
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
    
    const { count: cancellationsLast30Days } = await (supabase as any)
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
    const { data: subscriptions } = await (supabase as any)
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
    const { error } = await (supabase as any)
      .from('user_subscriptions')
      .update({ 
        status: active ? 'active' : 'canceled',
        canceled_at: active ? null : new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Atribuir trial para usuários que não têm assinatura
   */
  async assignTrialToUsersWithoutSubscription(): Promise<{ assigned: number; errors: number; details: string[] }> {
    try {
      console.log('=== INICIANDO ATRIBUIÇÃO DE TRIALS ===');
      
      // Buscar plano gratuito
      const plans = await subscriptionService.getPlans();
      console.log('Planos encontrados:', plans.map(p => ({ id: p.id, name: p.name })));
      
      const freePlan = plans.find(p => p.name === 'free');

      if (!freePlan) {
        console.error('Plano gratuito não encontrado! Planos disponíveis:', plans.map(p => p.name));
        throw new Error('Plano gratuito não encontrado. Verifique se existe um plano com name="free" na tabela subscription_plans.');
      }

      console.log('Plano gratuito encontrado:', { id: freePlan.id, name: freePlan.name });

      // Buscar todos os usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email');

      if (profilesError) {
        throw new Error(`Erro ao buscar usuários: ${profilesError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        console.log('Nenhum usuário encontrado');
        return { assigned: 0, errors: 0, details: [] };
      }

      console.log(`Total de usuários encontrados: ${profiles.length}`);

    // Buscar todas as assinaturas
    const { data: subscriptions, error: subsError } = await (supabase as any)
      .from('user_subscriptions')
      .select('user_id');

      if (subsError) {
        console.warn('Erro ao buscar assinaturas:', subsError);
      }

      const userIdsWithSubs = new Set(subscriptions?.map(s => s.user_id) || []);
      console.log(`Usuários com assinatura: ${userIdsWithSubs.size}`);
      
      // Filtrar usuários sem assinatura (exceto admin)
      const ADMIN_EMAIL = 'fabriciomouratreinador@gmail.com';
      const usersWithoutSubs = profiles.filter(
        p => !userIdsWithSubs.has(p.id) && p.email !== ADMIN_EMAIL
      );

      console.log(`Usuários sem assinatura (exceto admin): ${usersWithoutSubs.length}`);
      console.log('Lista:', usersWithoutSubs.map(u => u.email));

      let assigned = 0;
      let errors = 0;
      const details: string[] = [];

      // Criar trial para cada usuário sem assinatura usando função RPC
      for (const user of usersWithoutSubs) {
        try {
          console.log(`Atribuindo trial para ${user.email}...`);

          // Chamar função RPC que contorna RLS
          const { data, error } = await supabase.rpc('admin_assign_trial', {
            p_user_id: user.id,
            p_plan_id: freePlan.id
          });

          if (error) {
            console.error(`Erro ao atribuir trial para ${user.email}:`, error);
            details.push(`❌ ${user.email}: ${error.message}`);
            errors++;
          } else if (data && data.success) {
            console.log(`✅ Trial atribuído com sucesso para ${user.email}`);
            details.push(`✅ ${user.email}: Trial de 30 dias atribuído`);
            assigned++;
          } else {
            const errorMsg = data?.error || 'Erro desconhecido';
            console.error(`Erro ao atribuir trial para ${user.email}:`, errorMsg);
            details.push(`❌ ${user.email}: ${errorMsg}`);
            errors++;
          }
        } catch (error: any) {
          console.error(`Erro ao atribuir trial para ${user.email}:`, error);
          details.push(`❌ ${user.email}: ${error.message || 'Erro desconhecido'}`);
          errors++;
        }
      }

      console.log(`=== RESULTADO: ${assigned} atribuídos, ${errors} erros ===`);
      return { assigned, errors, details };
    } catch (error: any) {
      console.error('Erro ao atribuir trials:', error);
      throw error;
    }
  }
};

