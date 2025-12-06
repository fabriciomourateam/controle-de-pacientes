/**
 * Serviço para integração com Kiwify
 * Documentação: https://developers.kiwify.com.br
 */

import { kiwifyConfig } from './kiwify-config';

export interface KiwifyWebhookEvent {
  event: string;
  data: {
    id: string;
    status: string;
    customer?: {
      email: string;
      name: string;
    };
    product?: {
      id: string;
      name: string;
    };
    payment?: {
      method: string;
      amount: number;
      status: string;
    };
    subscription?: {
      id: string;
      status: string;
      current_period_start: string;
      current_period_end: string;
    };
    metadata?: {
      userId?: string;
      planName?: string;
    };
  };
}

export const kiwifyService = {
  /**
   * Criar checkout para assinatura
   * @param productId ID do produto no Kiwify
   * @param userId ID do usuário
   * @param userEmail Email do usuário
   * @param planName Nome do plano (para identificar)
   */
  async createCheckout(
    productId: string, // Não usado mais, mantido para compatibilidade
    userId: string,
    userEmail: string,
    planName: string
  ): Promise<{ url: string; checkoutId: string }> {
    // Verificar se a configuração está completa
    if (!kiwifyConfig.isConfigured()) {
      throw new Error('Configuração da Kiwify incompleta. Verifique as variáveis de ambiente.');
    }

    // Obter URL de checkout do config
    const checkoutUrl = kiwifyConfig.getCheckoutUrl(planName);
    
    if (!checkoutUrl) {
      throw new Error(`URL de checkout não encontrada para o plano: ${planName}`);
    }

    // Adicionar metadata na URL para identificar o usuário após o pagamento
    // A Kiwify pode passar esses parâmetros de volta via webhook
    const url = new URL(checkoutUrl);
    url.searchParams.set('email', userEmail);
    url.searchParams.set('metadata', JSON.stringify({ userId, planName }));

    return {
      url: url.toString(),
      checkoutId: `checkout_${Date.now()}_${planName}`
    };
  },

  /**
   * Processar webhook do Kiwify
   * Chamado quando Kiwify envia evento (pagamento aprovado, cancelado, etc.)
   */
  async processWebhook(event: KiwifyWebhookEvent): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // 1. Salvar webhook para auditoria
    await supabase
      .from('payment_webhooks')
      .insert({
        provider: 'kiwify',
        event_type: event.event,
        payload: event as any,
        processed: false
      });

    // 2. Processar evento
    try {
      switch (event.event) {
        case 'order.paid':
          await this.handleOrderPaid(event);
          break;
        case 'order.refunded':
          await this.handleOrderRefunded(event);
          break;
        case 'subscription.canceled':
          await this.handleSubscriptionCanceled(event);
          break;
        case 'subscription.renewed':
          await this.handleSubscriptionRenewed(event);
          break;
        default:
          console.log('Evento não processado:', event.event);
      }

      // Marcar como processado
      const { data: webhooks } = await supabase
        .from('payment_webhooks')
        .select('id')
        .eq('provider', 'kiwify')
        .eq('event_type', event.event)
        .eq('processed', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (webhooks && webhooks.length > 0) {
        await supabase
          .from('payment_webhooks')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', webhooks[0].id);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      // Salvar erro
      const { data: webhooks } = await supabase
        .from('payment_webhooks')
        .select('id')
        .eq('provider', 'kiwify')
        .eq('event_type', event.event)
        .eq('processed', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (webhooks && webhooks.length > 0) {
        await supabase
          .from('payment_webhooks')
          .update({ 
            error_message: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          .eq('id', webhooks[0].id);
      }
      throw error;
    }
  },

  /**
   * Handler para pagamento aprovado
   */
  async handleOrderPaid(event: KiwifyWebhookEvent): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { subscriptionService } = await import('./subscription-service');

    const data = event.data;
    const metadata = data.metadata || {};
    const userId = metadata.userId;
    const planName = metadata.planName;

    if (!userId || !planName) {
      throw new Error('Metadata inválida no webhook');
    }

    // Buscar plano pelo name (não display_name)
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', planName)
      .single();

    if (!plan) {
      throw new Error(`Plano ${planName} não encontrado`);
    }

    // Calcular datas
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Assinatura mensal

    // Criar/atualizar assinatura
    await subscriptionService.createSubscription(
      plan.id,
      'kiwify',
      data.subscription?.id || data.id,
      now,
      periodEnd
    );

    // Criar registro de pagamento
    await supabase
      .from('payments')
      .insert({
        user_id: userId,
        payment_provider: 'kiwify',
        payment_provider_transaction_id: data.id,
        amount: data.payment?.amount || 0,
        currency: 'BRL',
        payment_method: data.payment?.method || 'unknown',
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: data as any
      });
  },

  async handleOrderRefunded(event: KiwifyWebhookEvent): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const transactionId = event.data.id;
    
    // Atualizar status do pagamento
    await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('payment_provider_transaction_id', transactionId);

    // Cancelar assinatura se houver
    const subscriptionId = event.data.subscription?.id;
    if (subscriptionId) {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('payment_provider_subscription_id', subscriptionId)
        .single();

      if (subscription) {
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
      }
    }
  },

  async handleSubscriptionCanceled(event: KiwifyWebhookEvent): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const subscriptionId = event.data.subscription?.id;
    if (!subscriptionId) return;

    // Buscar assinatura pelo ID do provider
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('payment_provider_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
    }
  },

  async handleSubscriptionRenewed(event: KiwifyWebhookEvent): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const subscriptionId = event.data.subscription?.id;
    if (!subscriptionId) return;

    // Atualizar período da assinatura
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id, user_id')
      .eq('payment_provider_subscription_id', subscriptionId)
      .single();

    if (subscription && event.data.subscription) {
      await supabase
        .from('user_subscriptions')
        .update({
          current_period_start: event.data.subscription.current_period_start,
          current_period_end: event.data.subscription.current_period_end,
          status: 'active'
        })
        .eq('id', subscription.id);

      // Criar registro de pagamento da renovação
      await supabase
        .from('payments')
        .insert({
          user_id: subscription.user_id,
          payment_provider: 'kiwify',
          payment_provider_transaction_id: `renewal_${Date.now()}`,
          amount: event.data.payment?.amount || 0,
          currency: 'BRL',
          payment_method: event.data.payment?.method || 'unknown',
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: event.data as any
        });
    }
  }
};



