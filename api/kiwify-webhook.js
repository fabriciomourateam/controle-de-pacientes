// Endpoint para receber webhooks da Kiwify
// Configurado para funcionar com Vercel

import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase com service role key (para poder criar assinaturas)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

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
      endpoint: '/api/kiwify-webhook',
      supabaseConfigured: !!supabase
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!supabase) {
    console.error('Supabase não configurado');
    return res.status(500).json({
      success: false,
      error: 'Configuração do servidor incompleta',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const event = req.body;

    console.log('=== WEBHOOK KIWIFY RECEBIDO ===');
    console.log('Event:', event.event || 'unknown');
    console.log('Data:', JSON.stringify(event.data, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    console.log('================================');

    // Processar evento baseado no tipo
    const eventType = event.event || event.type;
    const eventData = event.data || event;

    switch (eventType) {
      case 'order.paid':
      case 'order.completed':
      case 'payment.approved':
        await handleOrderPaid(eventData, supabase);
        break;
      
      case 'order.refunded':
      case 'payment.refunded':
        await handleOrderRefunded(eventData, supabase);
        break;
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(eventData, supabase);
        break;
      
      default:
        console.log('Evento não processado:', eventType);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      event: eventType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Processar pagamento aprovado
 */
async function handleOrderPaid(data, supabase) {
  console.log('Processando pagamento aprovado...');

  // Tentar obter userId e planName de diferentes lugares
  let userId = null;
  let planName = null;
  let userEmail = null;

  // 1. Tentar obter de metadata (se passado na URL)
  if (data.metadata) {
    const metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
    userId = metadata.userId;
    planName = metadata.planName;
  }

  // 2. Tentar obter de custom_fields
  if (!userId && data.custom_fields) {
    const customFields = Array.isArray(data.custom_fields) 
      ? data.custom_fields.reduce((acc, field) => {
          acc[field.name] = field.value;
          return acc;
        }, {})
      : data.custom_fields;
    
    userId = customFields.userId || customFields.user_id;
    planName = customFields.planName || customFields.plan_name;
  }

  // 3. Tentar obter email do cliente
  userEmail = data.customer?.email || data.email || data.customer_email;

  // 4. Se tiver email mas não userId, buscar userId pelo email
  if (!userId && userEmail) {
    console.log('Buscando usuário por email:', userEmail);
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (profile) {
      userId = profile.id;
    }
  }

  // 5. Tentar identificar plano pelo produto
  if (!planName && data.product) {
    const productName = data.product.name || data.product.title || '';
    
    // Mapear nomes de produtos para nomes de planos
    if (productName.toLowerCase().includes('basic')) {
      planName = 'basic';
    } else if (productName.toLowerCase().includes('silver')) {
      planName = 'silver';
    } else if (productName.toLowerCase().includes('black')) {
      planName = 'black';
    }
  }

  if (!userId) {
    throw new Error('Não foi possível identificar o usuário. Email ou userId necessário.');
  }

  if (!planName) {
    throw new Error('Não foi possível identificar o plano. PlanName necessário.');
  }

  console.log('Dados identificados:', { userId, planName, userEmail });

  // Buscar plano pelo name
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('id, name, display_name')
    .eq('name', planName)
    .single();

  if (planError || !plan) {
    throw new Error(`Plano ${planName} não encontrado: ${planError?.message || 'Plano não existe'}`);
  }

  console.log('Plano encontrado:', plan);

  // Calcular datas
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1); // Assinatura mensal

  // Verificar se já existe assinatura para este usuário
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('id, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingSubscription) {
    // Atualizar assinatura existente
    console.log('Atualizando assinatura existente:', existingSubscription.id);
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_plan_id: plan.id,
        status: 'active',
        payment_provider: 'kiwify',
        payment_provider_subscription_id: data.subscription?.id || data.id || null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: null,
        canceled_at: null,
        updated_at: now.toISOString()
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`);
    }
  } else {
    // Criar nova assinatura
    console.log('Criando nova assinatura...');
    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_plan_id: plan.id,
        status: 'active',
        payment_provider: 'kiwify',
        payment_provider_subscription_id: data.subscription?.id || data.id || null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      });

    if (insertError) {
      throw new Error(`Erro ao criar assinatura: ${insertError.message}`);
    }
  }

  // Criar registro de pagamento
  const amount = data.payment?.amount || data.amount || data.price || 0;
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      payment_provider: 'kiwify',
      payment_provider_transaction_id: data.id || data.transaction_id || `kiwify_${Date.now()}`,
      amount: amount,
      currency: 'BRL',
      payment_method: data.payment?.method || data.payment_method || 'unknown',
      status: 'paid',
      paid_at: now.toISOString(),
      metadata: data
    });

  if (paymentError) {
    console.error('Erro ao criar registro de pagamento:', paymentError);
    // Não falhar o webhook se o pagamento não for salvo
  }

  console.log('✅ Assinatura criada/atualizada com sucesso!');
}

/**
 * Processar reembolso
 */
async function handleOrderRefunded(data, supabase) {
  console.log('Processando reembolso...');
  
  const transactionId = data.id || data.transaction_id;
  
  if (!transactionId) {
    throw new Error('ID da transação não encontrado');
  }

  // Atualizar status do pagamento
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString()
    })
    .eq('payment_provider_transaction_id', transactionId);

  if (error) {
    console.error('Erro ao atualizar pagamento:', error);
  }

  // Cancelar assinatura relacionada
  const { data: payment } = await supabase
    .from('payments')
    .select('user_id')
    .eq('payment_provider_transaction_id', transactionId)
    .single();

  if (payment) {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('user_id', payment.user_id)
      .eq('status', 'active');
  }
}

/**
 * Processar cancelamento de assinatura
 */
async function handleSubscriptionCanceled(data, supabase) {
  console.log('Processando cancelamento de assinatura...');
  
  const subscriptionId = data.subscription?.id || data.id;
  
  if (!subscriptionId) {
    throw new Error('ID da assinatura não encontrado');
  }

  // Buscar assinatura pelo payment_provider_subscription_id
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('payment_provider_subscription_id', subscriptionId)
    .eq('status', 'active')
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
