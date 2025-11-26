import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from './auth-helpers';

export interface WebhookConfig {
  id: string;
  user_id: string;
  webhook_type: string;
  webhook_url: string | null;
  enabled: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

/**
 * Busca a URL do webhook configurada para o usuário atual
 * @param webhookType Tipo do webhook ('autosync', 'metrics', 'metrics_sync', 'commercial_metrics')
 * @returns URL do webhook ou null se não encontrado
 */
export async function getUserWebhookUrl(webhookType: 'autosync' | 'metrics' | 'metrics_sync' | 'commercial_metrics'): Promise<string | null> {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.error('❌ getUserWebhookUrl: Usuário não autenticado');
      return null;
    }

    const { data, error } = await supabase
      .from('user_webhook_configs')
      .select('webhook_url, enabled')
      .eq('user_id', userId)
      .eq('webhook_type', webhookType)
      .eq('enabled', true)
      .maybeSingle();

    if (error) {
      console.error(`❌ Erro ao buscar webhook ${webhookType}:`, error);
      return null;
    }

    if (!data || !data.webhook_url) {
      console.warn(`⚠️ Webhook ${webhookType} não configurado para o usuário ${userId}`);
      return null;
    }

    console.log(`✅ Webhook ${webhookType} encontrado:`, data.webhook_url);
    return data.webhook_url;
  } catch (error) {
    console.error('❌ Erro ao buscar webhook:', error);
    return null;
  }
}

/**
 * Busca todas as configurações de webhook do usuário atual
 */
export async function getUserWebhookConfigs(): Promise<WebhookConfig[]> {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_webhook_configs')
      .select('*')
      .eq('user_id', userId)
      .order('webhook_type');

    if (error) {
      console.error('❌ Erro ao buscar webhooks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar webhooks:', error);
    return [];
  }
}

/**
 * Salva ou atualiza uma configuração de webhook para o usuário atual
 */
export async function saveUserWebhookConfig(
  webhookType: 'autosync' | 'metrics' | 'metrics_sync' | 'commercial_metrics',
  webhookUrl: string,
  enabled: boolean = true,
  config: any = {}
): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.error('❌ saveUserWebhookConfig: Usuário não autenticado');
      return false;
    }

    const { error } = await supabase
      .from('user_webhook_configs')
      .upsert({
        user_id: userId,
        webhook_type: webhookType,
        webhook_url: webhookUrl,
        enabled: enabled,
        config: config
      }, {
        onConflict: 'user_id,webhook_type'
      });

    if (error) {
      console.error('❌ Erro ao salvar webhook:', error);
      return false;
    }

    console.log(`✅ Webhook ${webhookType} salvo com sucesso`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar webhook:', error);
    return false;
  }
}

