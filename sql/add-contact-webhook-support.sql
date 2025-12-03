-- Script para adicionar suporte ao webhook de contato
-- Este script não cria novas tabelas, apenas documenta que o tipo 'contact' pode ser usado
-- na tabela existente user_webhook_configs

-- A tabela user_webhook_configs já suporta qualquer tipo de webhook através do campo webhook_type
-- Basta usar o tipo 'contact' ao inserir/atualizar configurações

-- Exemplo de como configurar o webhook de contato para um usuário:
-- INSERT INTO user_webhook_configs (user_id, webhook_type, webhook_url, enabled, config)
-- VALUES (
--   auth.uid(),
--   'contact',
--   'https://n8n.shapepro.shop/webhook/enviarmsg',
--   true,
--   '{}'::jsonb
-- )
-- ON CONFLICT (user_id, webhook_type) 
-- DO UPDATE SET 
--   webhook_url = EXCLUDED.webhook_url,
--   enabled = EXCLUDED.enabled,
--   updated_at = NOW();

-- Nota: Se a tabela user_webhook_configs não existir, execute primeiro:
-- sql/create-user-webhook-configs.sql

DO $$
BEGIN
  RAISE NOTICE 'Suporte ao webhook de contato está pronto!';
  RAISE NOTICE 'Use o tipo "contact" ao configurar webhooks na tabela user_webhook_configs.';
  RAISE NOTICE 'O webhook padrão de produção é: https://n8n.shapepro.shop/webhook/enviarmsg';
END $$;

