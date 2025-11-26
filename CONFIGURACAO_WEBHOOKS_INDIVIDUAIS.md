# 🔗 Configuração de Webhooks Individuais por Usuário

## ✅ Implementação Concluída

Agora cada usuário usa sua própria URL de webhook configurada na tabela `user_webhook_configs`.

## 🎯 Como Funciona

### 1. **Busca da URL do Webhook**
- Quando um usuário clica em sincronizar, o sistema busca a URL do webhook dele na tabela `user_webhook_configs`
- Cada usuário tem suas próprias URLs configuradas
- Se não encontrar URL configurada, mostra erro pedindo para configurar

### 2. **Isolamento Total**
- **Você (fabriciomouratreinador@gmail.com)**: Usa sua URL
- **Outro usuário**: Usa a URL dele
- Cada um aciona apenas seu próprio webhook no N8N

## 📋 Tipos de Webhook

| Tipo | Descrição | Onde é usado |
|------|-----------|--------------|
| `autosync` | Sincronização automática do dashboard | AutoSyncManager, DashboardAutoSyncManager |
| `metrics_sync` | Sincronização de métricas operacionais | DashboardSyncModal |
| `commercial_metrics` | Atualização de métricas comerciais | CommercialMetrics |

## 🔧 Configuração no Supabase

### 1. Executar Script de Migração

Execute o script `sql/migrate-existing-webhooks.sql` para inserir suas URLs:

```sql
-- Este script insere suas 3 URLs de webhook:
-- - autosync: https://n8n.shapepro.shop/webhook/atualizardash
-- - commercial_metrics: https://n8n.shapepro.shop/webhook/leads
-- - metrics_sync: https://n8n.shapepro.shop/webhook/controle
```

### 2. Verificar Webhooks Configurados

```sql
SELECT 
    webhook_type,
    webhook_url,
    enabled,
    config->>'description' as description
FROM user_webhook_configs
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'fabriciomouratreinador@gmail.com'
)
ORDER BY webhook_type;
```

## 👥 Para Outros Usuários

### Quando um novo usuário se cadastrar:

1. **Ele precisa configurar suas URLs de webhook**
2. **Você pode criar um script SQL para inserir as URLs dele:**

```sql
-- Exemplo: Configurar webhooks para outro usuário
DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT := 'outro@email.com';
BEGIN
    -- Buscar user_id
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_user_email
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;

    -- Inserir webhooks do novo usuário
    INSERT INTO user_webhook_configs (user_id, webhook_type, webhook_url, enabled)
    VALUES 
        (v_user_id, 'autosync', 'https://n8n.shapepro.shop/webhook/outro-autosync', true),
        (v_user_id, 'commercial_metrics', 'https://n8n.shapepro.shop/webhook/outro-leads', true),
        (v_user_id, 'metrics_sync', 'https://n8n.shapepro.shop/webhook/outro-controle', true)
    ON CONFLICT (user_id, webhook_type) 
    DO UPDATE SET webhook_url = EXCLUDED.webhook_url;
END $$;
```

## 🔒 Segurança

- ✅ Cada usuário só vê e usa suas próprias URLs
- ✅ RLS garante que usuários não vejam URLs de outros
- ✅ Se não tiver URL configurada, mostra erro (não usa URL padrão)
- ✅ Validação de email garante que cada um confirma seu próprio email

## ⚠️ Importante

### Se um usuário não tiver URL configurada:
- Ele verá a mensagem: "Webhook não configurado"
- Precisa configurar a URL antes de usar
- Você pode criar as URLs dele no N8N e inserir na tabela

## 📝 Exemplo de Uso

### Usuário A (você):
1. Clica em "Sincronizar"
2. Confirma email: `fabriciomouratreinador@gmail.com`
3. Sistema busca: `https://n8n.shapepro.shop/webhook/atualizardash` (sua URL)
4. Aciona seu webhook no N8N

### Usuário B (outro):
1. Clica em "Sincronizar"
2. Confirma email: `outro@email.com`
3. Sistema busca: `https://n8n.shapepro.shop/webhook/outro-autosync` (URL dele)
4. Aciona o webhook dele no N8N
5. **NÃO mexe nos seus dados!**

## 🎉 Resultado

- ✅ Cada usuário tem suas próprias URLs
- ✅ Isolamento total entre usuários
- ✅ Suas URLs ficam só para você
- ✅ Outros usuários não podem acionar seus webhooks

