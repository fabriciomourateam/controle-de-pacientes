# 📋 Como Migrar Seus Webhooks para a Tabela do Supabase

## 🎯 Objetivo

Migrar todos os webhooks que você já tem configurados na plataforma para a tabela `user_webhook_configs` no Supabase.

## 📝 Passo a Passo

### 1. Criar a Tabela (se ainda não criou)

Execute primeiro o script de criação da tabela:

```sql
-- Arquivo: sql/create-user-webhook-configs.sql
```

### 2. Migrar Webhooks Existentes

Execute o script de migração:

```sql
-- Arquivo: sql/migrate-existing-webhooks.sql
```

Este script irá:
- ✅ Buscar seu `user_id` pelo email `fabriciomouratreinador@gmail.com`
- ✅ Inserir 3 webhooks principais:
  - **autosync**: `https://n8n.shapepro.shop/webhook/atualizardash`
  - **commercial_metrics**: `https://n8n.shapepro.shop/webhook/leads`
  - **metrics_sync**: `https://n8n.shapepro.shop/webhook/controle`

### 3. Verificar Webhooks Inseridos

Após executar, você verá uma tabela com todos os webhooks configurados:

| user_email | webhook_type | webhook_url | enabled | description |
|------------|--------------|-------------|---------|-------------|
| fabriciomouratreinador@gmail.com | autosync | https://n8n.shapepro.shop/webhook/atualizardash | true | Sincronização automática do dashboard |
| fabriciomouratreinador@gmail.com | commercial_metrics | https://n8n.shapepro.shop/webhook/leads | true | Atualização de métricas comerciais |
| fabriciomouratreinador@gmail.com | metrics_sync | https://n8n.shapepro.shop/webhook/controle | true | Sincronização de métricas via N8N |

## 🔧 Adicionar Mais Webhooks

Se você tiver outros webhooks, edite o script `sql/migrate-existing-webhooks.sql` e adicione:

```sql
-- Exemplo: Adicionar novo webhook
INSERT INTO user_webhook_configs (
    user_id,
    webhook_type,
    webhook_url,
    enabled,
    config
) VALUES (
    v_user_id,
    'meu_webhook', -- Tipo do webhook
    'https://n8n.shapepro.shop/webhook/meu-webhook', -- URL
    true,
    jsonb_build_object(
        'description', 'Descrição do webhook',
        'source', 'dashboard',
        'created_at', NOW()
    )
)
ON CONFLICT (user_id, webhook_type) 
DO UPDATE SET
    webhook_url = EXCLUDED.webhook_url,
    enabled = EXCLUDED.enabled,
    config = EXCLUDED.config,
    updated_at = NOW();
```

## 📊 Consultar Webhooks

Para ver todos os seus webhooks:

```sql
SELECT 
    webhook_type,
    webhook_url,
    enabled,
    config->>'description' as description,
    created_at,
    updated_at
FROM user_webhook_configs
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'fabriciomouratreinador@gmail.com'
)
ORDER BY webhook_type;
```

## 🔄 Atualizar URL de um Webhook

Se precisar atualizar a URL de um webhook:

```sql
UPDATE user_webhook_configs
SET 
    webhook_url = 'https://nova-url.com/webhook',
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'fabriciomouratreinador@gmail.com'
)
AND webhook_type = 'autosync'; -- Tipo do webhook
```

## ⚠️ Importante

- O script usa `ON CONFLICT` - se o webhook já existir, ele será atualizado
- Todos os webhooks são vinculados ao seu `user_id`
- Você pode desabilitar um webhook sem deletá-lo: `UPDATE ... SET enabled = false`

## ✅ Próximos Passos

Após migrar os webhooks:

1. **Atualizar código** para buscar webhook da tabela (opcional)
2. **Configurar no N8N** para receber `user_email` e filtrar por ele
3. **Testar** cada webhook para garantir que funciona

## 🧪 Testar

Após executar o script, teste:

1. Acesse a plataforma
2. Clique em "Auto-sync" ou "Atualizar Métricas"
3. Confirme o email no dialog
4. Verifique no N8N que o webhook foi acionado com seu `user_email`

