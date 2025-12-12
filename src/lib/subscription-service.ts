import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from './auth-helpers';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  max_patients: number | null;
  max_checkins_per_month: number | null;
  max_storage_gb: number | null;
  active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  status: 'active' | 'canceled' | 'expired' | 'trial' | 'pending';
  payment_provider: string | null;
  payment_provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  subscription_plans?: SubscriptionPlan;
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: SubscriptionPlan | null;
  subscription: UserSubscription | null;
  expiresAt: Date | null;
  canAccess: boolean;
  reason?: string;
  isTrial: boolean;
  daysRemaining: number | null;
}

const ADMIN_EMAIL = 'fabriciomouratreinador@gmail.com';

export const subscriptionService = {
  /**
   * Buscar todos os planos ativos
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('price_monthly', { ascending: true });

    if (error) throw error;

    return data.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' 
        ? JSON.parse(plan.features) 
        : plan.features || []
    }));
  },

  /**
   * Buscar assinatura do usuário atual
   */
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await (supabase as any)
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Não encontrado
      throw error;
    }

    return data;
  },

  /**
   * Verificar status da assinatura do usuário atual
   */
  async checkSubscription(): Promise<SubscriptionStatus> {
    const user = await getCurrentUser();
    
    // Admin sempre tem acesso
    if (user?.email === ADMIN_EMAIL) {
      return {
        isActive: true,
        plan: null,
        subscription: null,
        expiresAt: null,
        canAccess: true,
        isTrial: false,
        daysRemaining: null
      };
    }

    if (!user) {
      return {
        isActive: false,
        plan: null,
        subscription: null,
        expiresAt: null,
        canAccess: false,
        reason: 'Usuário não autenticado',
        isTrial: false,
        daysRemaining: null
      };
    }

    const subscription = await this.getCurrentSubscription();

    if (!subscription) {
      return {
        isActive: false,
        plan: null,
        subscription: null,
        expiresAt: null,
        canAccess: false,
        reason: 'Nenhuma assinatura encontrada',
        isTrial: false,
        daysRemaining: null
      };
    }

    const plan = subscription.subscription_plans as SubscriptionPlan | undefined;

    // Verificar se está ativa
    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return {
        isActive: false,
        plan: plan || null,
        subscription,
        expiresAt: subscription.current_period_end 
          ? new Date(subscription.current_period_end) 
          : null,
        canAccess: false,
        reason: `Assinatura ${subscription.status}`,
        isTrial: false,
        daysRemaining: null
      };
    }

    // Verificar se trial não expirou
    if (subscription.status === 'trial' && subscription.trial_end) {
      const now = new Date();
      const trialEnd = new Date(subscription.trial_end);
      
      if (trialEnd < now) {
        return {
          isActive: false,
          plan: plan || null,
          subscription,
          expiresAt: trialEnd,
          canAccess: false,
          reason: 'Período de trial expirado',
          isTrial: true,
          daysRemaining: 0
        };
      }

      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        isActive: true,
        plan: plan || null,
        subscription,
        expiresAt: trialEnd,
        canAccess: true,
        isTrial: true,
        daysRemaining
      };
    }

    // Verificar se assinatura ativa não expirou
    const now = new Date();
    const expiresAt = subscription.current_period_end 
      ? new Date(subscription.current_period_end) 
      : null;

    if (expiresAt && expiresAt < now) {
      return {
        isActive: false,
        plan: plan || null,
        subscription,
        expiresAt,
        canAccess: false,
        reason: 'Assinatura expirada',
        isTrial: false,
        daysRemaining: 0
      };
    }

    // Calcular dias restantes
    const daysRemaining = expiresAt
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      isActive: true,
      plan: plan || null,
      subscription,
      expiresAt,
      canAccess: true,
      isTrial: false,
      daysRemaining
    };
  },

  /**
   * Verificar se usuário pode adicionar mais pacientes
   */
  async canAddPatient(): Promise<{ canAdd: boolean; reason?: string; currentCount?: number; maxAllowed?: number }> {
    const status = await this.checkSubscription();
    
    if (!status.canAccess) {
      return {
        canAdd: false,
        reason: status.reason || 'Assinatura não ativa'
      };
    }

    if (!status.plan) {
      return { canAdd: true }; // Admin ou sem limite
    }

    // Se não tem limite, pode adicionar
    if (status.plan.max_patients === null) {
      return { canAdd: true };
    }

    // Contar pacientes atuais
    const user = await getCurrentUser();
    if (!user) {
      return { canAdd: false, reason: 'Usuário não autenticado' };
    }

    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao contar pacientes:', error);
      return { canAdd: true }; // Em caso de erro, permite (fail-safe)
    }

    const currentCount = count || 0;
    const maxAllowed = status.plan.max_patients;

    return {
      canAdd: currentCount < maxAllowed,
      currentCount,
      maxAllowed,
      reason: currentCount >= maxAllowed 
        ? `Limite de ${maxAllowed} pacientes atingido. Faça upgrade para adicionar mais.`
        : undefined
    };
  },

  /**
   * Criar assinatura trial (30 dias grátis)
   */
  async createTrialSubscription(planId: string): Promise<UserSubscription> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se já existe assinatura
    const existing = await this.getCurrentSubscription();
    if (existing) {
      throw new Error('Usuário já possui assinatura');
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30); // 30 dias

    const { data, error } = await (supabase as any)
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        subscription_plan_id: planId,
        status: 'trial',
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        trial_end: trialEnd.toISOString()
      })
      .select(`
        *,
        subscription_plans (*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Criar assinatura (após pagamento aprovado)
   */
  async createSubscription(
    planId: string,
    paymentProvider: string,
    paymentProviderSubscriptionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UserSubscription> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Se já existe trial, atualizar para ativa
    const existing = await this.getCurrentSubscription();
    if (existing && existing.status === 'trial') {
      const { data, error } = await (supabase as any)
        .from('user_subscriptions')
        .update({
          subscription_plan_id: planId,
          status: 'active',
          payment_provider: paymentProvider,
          payment_provider_subscription_id: paymentProviderSubscriptionId,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_end: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select(`
          *,
          subscription_plans (*)
        `)
        .single();

      if (error) throw error;
      return data;
    }

    // Criar nova assinatura
    const { data, error } = await (supabase as any)
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        subscription_plan_id: planId,
        status: 'active',
        payment_provider: paymentProvider,
        payment_provider_subscription_id: paymentProviderSubscriptionId,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString()
      })
      .select(`
        *,
        subscription_plans (*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualizar status da assinatura
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: UserSubscription['status'],
    data?: Partial<UserSubscription>
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from('user_subscriptions')
      .update({
        status,
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  }
};



