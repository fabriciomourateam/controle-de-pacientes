/**
 * Serviço para auto-atribuir trial de 30 dias quando usuário se cadastra
 */

import { supabase } from '@/integrations/supabase/client';
import { subscriptionService } from './subscription-service';

const ADMIN_EMAIL = 'fabriciomouratreinador@gmail.com';

export const autoTrialService = {
  /**
   * Atribuir trial automaticamente para novo usuário
   * Chamar após signup bem-sucedido
   */
  async assignTrialToNewUser(userId: string, userEmail?: string): Promise<void> {
    // Não atribuir trial para admin
    if (userEmail === ADMIN_EMAIL) {
      return;
    }

    try {
      // Buscar plano gratuito (free)
      const plans = await subscriptionService.getPlans();
      const freePlan = plans.find(p => p.name === 'free');

      if (!freePlan) {
        console.warn('Plano gratuito não encontrado. Trial não será atribuído.');
        return;
      }

      // Verificar se usuário já tem assinatura
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        console.log('Usuário já possui assinatura. Trial não será atribuído.');
        return;
      }

      // Criar trial de 30 dias
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 30); // 30 dias

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_plan_id: freePlan.id,
          status: 'trial',
          current_period_start: now.toISOString(),
          current_period_end: trialEnd.toISOString(),
          trial_end: trialEnd.toISOString()
        });

      if (error) {
        console.error('Erro ao atribuir trial:', error);
        throw error;
      }

      console.log('Trial de 30 dias atribuído com sucesso para o usuário:', userId);
    } catch (error) {
      console.error('Erro ao atribuir trial automaticamente:', error);
      // Não lançar erro para não quebrar o fluxo de signup
    }
  }
};



