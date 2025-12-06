// Endpoint para receber webhooks da Kiwify
// Configurado para funcionar com Vercel

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Endpoint de teste (GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Webhook Kiwify funcionando',
      timestamp: new Date().toISOString(),
      instructions: 'Use POST para receber eventos da Kiwify',
      endpoint: '/api/kiwify-webhook'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const event = req.body;

    console.log('=== WEBHOOK KIWIFY RECEBIDO ===');
    console.log('Event:', event.event || 'unknown');
    console.log('Data:', JSON.stringify(event.data, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    console.log('================================');

    // Configurar Supabase client (server-side)
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis do Supabase não configuradas');
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Salvar webhook para auditoria
    const { error: webhookError } = await supabase
      .from('payment_webhooks')
      .insert({
        provider: 'kiwify',
        event_type: event.event || 'unknown',
        payload: event,
        processed: false
      });

    if (webhookError) {
      console.error('Erro ao salvar webhook:', webhookError);
    }

    // Processar evento
    try {
      const eventType = event.event || 'unknown';
      const data = event.data || {};

      switch (eventType) {
        case 'order.paid':
          await handleOrderPaid(supabase, data);
          break;
        case 'order.refunded':
          await handleOrderRefunded(supabase, data);
          break;
        case 'subscription.canceled':
          await handleSubscriptionCanceled(supabase, data);
          break;
        case 'subscription.renewed':
          await handleSubscriptionRenewed(supabase, data);
          break;
        default:
          console.log('Evento não processado:', eventType);
      }

      // Marcar como processado
      const { data: webhooks } = await supabase
        .from('payment_webhooks')
        .select('id')
        .eq('provider', 'kiwify')
        .eq('event_type', eventType)
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

      return res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
        event: eventType,
        timestamp: new Date().toISOString()
      });
    } catch (processError) {
      console.error('Erro ao processar webhook:', processError);

      // Salvar erro
      const { data: webhooks } = await supabase
        .from('payment_webhooks')
        .select('id')
        .eq('provider', 'kiwify')
        .eq('event_type', event.event || 'unknown')
        .eq('processed', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (webhooks && webhooks.length > 0) {
        await supabase
          .from('payment_webhooks')
          .update({
            error_message: processError.message || 'Erro desconhecido'
          })
          .eq('id', webhooks[0].id);
      }

      // Retornar 200 mesmo com erro para não fazer Kiwify reenviar
      return res.status(200).json({
        success: false,
        message: 'Webhook recebido mas erro ao processar',
        error: processError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro geral no webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handler para pagamento aprovado
async function handleOrderPaid(supabase, data) {
  const metadata = data.metadata || {};
  const userId = metadata.userId;
  const planName = metadata.planName;

  if (!userId || !planName) {
    // Tentar obter do email do cliente
    const customerEmail = data.customer?.email;
    if (customerEmail) {
      // Buscar usuário pelo email
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', customerEmail)
        .limit(1);

      if (profiles && profiles.length > 0) {
        const foundUserId = profiles[0].id;
        // Buscar plano pelo nome do produto
        const planMap = {
          'basic': 'basic',
          'silver': 'intermediate',
          'black': 'advanced'
        };
        const mappedPlanName = planMap[planName?.toLowerCase()] || planName;

        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', mappedPlanName)
          .single();

        if (plan) {
          await createSubscription(supabase, plan.id, foundUserId, data);
          return;
        }
      }
    }
    throw new Error('Metadata inválida no webhook e não foi possível identificar usuário');
  }

  // Buscar plano pelo name
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('name', planName)
    .single();

  if (!plan) {
    throw new Error(`Plano ${planName} não encontrado`);
  }

  await createSubscription(supabase, plan.id, userId, data);
}

// Criar/atualizar assinatura
async function createSubscription(supabase, planId, userId, data) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1); // Assinatura mensal

  // Verificar se já existe assinatura
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Atualizar assinatura existente
    await supabase
      .from('user_subscriptions')
      .update({
        subscription_plan_id: planId,
        status: 'active',
        payment_provider: 'kiwify',
        payment_provider_subscription_id: data.subscription?.id || data.id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        canceled_at: null
      })
      .eq('id', existing.id);
  } else {
    // Criar nova assinatura
    await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_plan_id: planId,
        status: 'active',
        payment_provider: 'kiwify',
        payment_provider_subscription_id: data.subscription?.id || data.id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      });
  }

  // Criar registro de pagamento
  await supabase
    .from('payments')
    .insert({
      user_id: userId,
      payment_provider: 'kiwify',
      payment_provider_transaction_id: data.id,
      amount: data.payment?.amount || data.amount || 0,
      currency: 'BRL',
      payment_method: data.payment?.method || 'unknown',
      status: 'paid',
      paid_at: now.toISOString(),
      metadata: data
    });
}

// Handler para reembolso
async function handleOrderRefunded(supabase, data) {
  const transactionId = data.id;

  // Atualizar status do pagamento
  await supabase
    .from('payments')
    .update({ status: 'refunded' })
    .eq('payment_provider_transaction_id', transactionId);

  // Cancelar assinatura se houver
  const subscriptionId = data.subscription?.id;
  if (subscriptionId) {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('payment_provider_subscription_id', subscriptionId);
  }
}

// Handler para cancelamento de assinatura
async function handleSubscriptionCanceled(supabase, data) {
  const subscriptionId = data.subscription?.id;
  if (!subscriptionId) return;

  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('payment_provider_subscription_id', subscriptionId);
}

// Handler para renovação de assinatura
async function handleSubscriptionRenewed(supabase, data) {
  const subscriptionId = data.subscription?.id;
  if (!subscriptionId) return;

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('id, user_id')
    .eq('payment_provider_subscription_id', subscriptionId)
    .single();

  if (subscription && data.subscription) {
    await supabase
      .from('user_subscriptions')
      .update({
        current_period_start: data.subscription.current_period_start,
        current_period_end: data.subscription.current_period_end,
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
        amount: data.payment?.amount || data.amount || 0,
        currency: 'BRL',
        payment_method: data.payment?.method || 'unknown',
        status: 'paid',
        paid_at: new Date().toISOString(),
        metadata: data
      });
  }
}
