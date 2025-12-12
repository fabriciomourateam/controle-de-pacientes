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
      const { data: existing } = await (supabase as any)
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        console.log('Usuário já possui assinatura. Trial não será atribuído.');
        return;
      }

      // Buscar data de cadastro do usuário
      const { data: userProfile } = await (supabase as any)
        .from('user_profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      // Usar data de cadastro do usuário ou data atual como fallback
      const userCreatedAt = userProfile?.created_at 
        ? new Date(userProfile.created_at) 
        : new Date();
      
      // Calcular data de término do trial (30 dias a partir do cadastro)
      const trialEnd = new Date(userCreatedAt);
      trialEnd.setDate(trialEnd.getDate() + 30); // 30 dias

      // Criar trial de 30 dias
      // Primeiro tenta INSERT direto (agora que RLS permite)
      const { error: insertError } = await (supabase as any)
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_plan_id: freePlan.id,
          status: 'trial',
          current_period_start: userCreatedAt.toISOString(),
          current_period_end: trialEnd.toISOString(),
          trial_end: trialEnd.toISOString()
        });

      if (insertError) {
        console.warn('Erro ao criar trial via INSERT direto:', insertError);
        
        // Se for erro de RLS ou outro erro, tentar usar função RPC como fallback
        if (insertError.code === '42501' || insertError.code === 'PGRST301') {
          console.log('Tentando usar função RPC create_self_trial como fallback...');
          
          try {
            const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)('create_self_trial', {
              p_plan_id: freePlan.id
            });
            
            if (rpcError) {
              console.error('Erro ao criar trial via RPC create_self_trial:', rpcError);
              // Tentar função admin como último recurso (se o usuário for admin)
              if (userEmail === ADMIN_EMAIL) {
                console.log('Tentando usar função admin_assign_trial como último recurso...');
                const { data: adminResult, error: adminError } = await (supabase.rpc as any)('admin_assign_trial', {
                  p_user_id: userId,
                  p_plan_id: freePlan.id
                });
                
                if (adminError || (adminResult && typeof adminResult === 'object' && !adminResult.success)) {
                  console.error('Erro ao criar trial via RPC admin_assign_trial:', adminError || adminResult);
                  throw insertError; // Lançar erro original
                }
                console.log('✅ Trial criado via admin_assign_trial');
                return;
              }
              throw insertError; // Lançar erro original
            }
            
            if (rpcResult && typeof rpcResult === 'object' && !rpcResult.success) {
              console.error('RPC create_self_trial retornou erro:', rpcResult);
              throw new Error((rpcResult as any).error || 'Erro ao criar trial');
            }
            
            console.log('✅ Trial criado via RPC create_self_trial');
            return; // Sucesso via RPC
          } catch (rpcError: any) {
            console.error('Erro ao tentar RPC:', rpcError);
            // Não lançar erro aqui para não quebrar o fluxo de signup
            // O erro será silenciosamente ignorado
            return;
          }
        }
        
        // Para outros erros, apenas logar mas não quebrar o signup
        console.error('Erro ao criar trial (não é RLS):', insertError);
        return;
      }

      console.log('✅ Trial de 30 dias atribuído com sucesso para o usuário:', userId);
    } catch (error) {
      console.error('Erro ao atribuir trial automaticamente:', error);
      // Não lançar erro para não quebrar o fluxo de signup
    }
  }
};



